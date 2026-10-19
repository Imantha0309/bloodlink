"use strict";
/**
 * Donor self-service, and the hospital intake workflow that follows a
 * commitment.
 *
 * These two live together because they are two ends of the same row: the donor
 * moves `donor_request_responses.stage` from their own device, and staff move it
 * from the intake desk. Keeping them in one module makes the stage machine
 * readable in a single pass — `accepted → en_route → arrived → completed` — and
 * each transition states who is allowed to make it.
 *
 * The check-in ticket is the one piece of security here: the donor's device
 * generates a secret, sends only its SHA-256 hash, and the hash is cleared the
 * moment it is used or the decision changes. A stolen ticket is useless after
 * fifteen minutes and cannot be replayed at all.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.donorsRouter = void 0;
const node_crypto_1 = require("node:crypto");
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const access_1 = require("../domain/access");
const compatibility_1 = require("../domain/compatibility");
const lifecycle_1 = require("../domain/lifecycle");
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const donor_availability_1 = require("../models/donor-availability");
const donor_request_response_1 = require("../models/donor-request-response");
const donor_screening_1 = require("../models/donor-screening");
const emergency_request_1 = require("../models/emergency-request");
const extraction_session_1 = require("../models/extraction-session");
const user_1 = require("../models/user");
exports.donorsRouter = (0, express_1.Router)();
/** How long an intake ticket stays valid. Mirrors the SQL's 15-minute window. */
const TICKET_TTL_MS = 15 * 60 * 1000;
/** Commitments list order: whoever is furthest along is at the top. */
const STAGE_RANK = {
    en_route: 0,
    accepted: 1,
    arrived: 2,
    completed: 3,
};
function hashToken(token) {
    return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
/* ------------------------------------------------------------ public stats */
/**
 * Live donor coverage for the sign-in reassurance card.
 *
 * Public, and deliberately so: the card is shown before anyone has an account.
 * Only names and districts come back, which is why this can be public at all.
 */
exports.donorsRouter.get("/stats", (0, http_1.asyncHandler)(async (_req, res) => {
    const available = await donor_availability_1.DonorAvailability.find({ isAvailable: true }).select("userId");
    const donors = await user_1.User.find({
        _id: { $in: available.map((row) => row.userId) },
        // A recipient who has set a blood group can donate too — the same rule the
        // donor feed uses.
        $or: [{ role: "donor" }, { role: "recipient", bloodGroup: { $ne: null } }],
    })
        .select("fullName district")
        .sort({ fullName: 1 });
    res.json({
        donors: donors.map((donor) => ({ fullName: donor.fullName, district: donor.district ?? null })),
    });
}));
/* ------------------------------------------------------------- directory */
const directoryQuerySchema = zod_1.z.object({
    bloodGroup: zod_1.z.string().trim().nullable().optional(),
    district: zod_1.z.string().trim().nullable().optional(),
});
/**
 * Privacy-safe donor search.
 *
 * Only donors — not donor-eligible recipients — and only available ones. The
 * app turns the names into initials before rendering, so the screen never shows
 * a real name; this route returns names only because the client already
 * receives them from the equivalent SQL and derives the initials itself.
 */
exports.donorsRouter.get("/directory", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const { bloodGroup, district } = directoryQuerySchema.parse({
        bloodGroup: req.query.bloodGroup ?? null,
        district: req.query.district ?? null,
    });
    const available = await donor_availability_1.DonorAvailability.find({ isAvailable: true }).select("userId");
    const filter = {
        _id: { $in: available.map((row) => row.userId) },
        role: "donor",
        bloodGroup: { $ne: null },
    };
    if (bloodGroup !== null && bloodGroup !== undefined && bloodGroup.length > 0) {
        filter.bloodGroup = bloodGroup;
    }
    if (district !== null && district !== undefined && district.length > 0) {
        filter.district = district;
    }
    const donors = await user_1.User.find(filter).select("fullName bloodGroup district").sort({ fullName: 1 }).limit(50);
    res.json({
        donors: donors.map((donor) => ({
            fullName: donor.fullName,
            bloodGroup: donor.bloodGroup,
            district: donor.district ?? null,
        })),
    });
}));
/* ---------------------------------------------------------- availability */
/** The donor's switch. A missing row reads as paused, never as available. */
exports.donorsRouter.get("/me/availability", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const row = await donor_availability_1.DonorAvailability.findOne({ userId: user._id });
    res.json({
        availability: {
            isAvailable: row?.isAvailable === true,
            lastDonationAt: row?.lastDonationAt ?? null,
            recordExists: row !== null,
        },
    });
}));
const availabilitySchema = zod_1.z.object({
    isAvailable: zod_1.z.boolean(),
    lastDonationAt: zod_1.z.string().trim().nullable().optional(),
    hasLastDonation: zod_1.z.boolean().optional(),
});
/**
 * Turns the donor's alerts on or off.
 *
 * A paused donor disappears from dispatch and from the reassurance card, which
 * is the whole point of the switch. Only donors — and recipients who have set a
 * blood group — have an availability window at all.
 */
exports.donorsRouter.put("/me/availability", auth_1.requireAuth, (0, validate_1.validateBody)(availabilitySchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const input = req.body;
    if (!(0, compatibility_1.isDonorEligible)(user.role, user.bloodGroup)) {
        throw http_1.fail.conflict("Only donors and donor-eligible recipients have an availability window.");
    }
    const existing = await donor_availability_1.DonorAvailability.findOne({ userId: user._id });
    // The donation date is only overwritten when the caller says it is supplying
    // one — otherwise a simple pause would erase the history behind it.
    const lastDonationAt = input.hasLastDonation === true && input.lastDonationAt
        ? new Date(input.lastDonationAt)
        : (existing?.lastDonationAt ?? null);
    const row = await donor_availability_1.DonorAvailability.findOneAndUpdate({ userId: user._id }, { $set: { isAvailable: input.isAvailable, lastDonationAt } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({
        availability: {
            userId: String(user._id),
            isAvailable: row.isAvailable,
            lastDonationAt: row.lastDonationAt,
            recordExists: true,
        },
    });
}));
/** Drops the row entirely; a missing record reads as paused. */
exports.donorsRouter.delete("/me/availability", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    await donor_availability_1.DonorAvailability.deleteOne({ userId: user._id });
    res.json({ deleted: true });
}));
/* ----------------------------------------------------------- commitments */
/** The donor's accepted cases, active ones first. */
exports.donorsRouter.get("/me/commitments", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const responses = await donor_request_response_1.DonorRequestResponse.find({ donor: user._id, response: "accepted" });
    const { byRequest } = await joinRequests(responses);
    const rows = responses
        .map((response) => {
        const request = byRequest.get(String(response.request));
        if (request === undefined) {
            return null;
        }
        return {
            stage: response.stage,
            row: (0, serialize_1.requestRow)(request, {
                donorResponse: "accepted",
                donorStage: response.stage,
                acceptedByOtherDonor: false,
            }),
        };
    })
        .filter((entry) => entry !== null)
        .sort((a, b) => STAGE_RANK[a.stage] - STAGE_RANK[b.stage]);
    res.json({ commitments: rows.map((entry) => entry.row) });
}));
/** Every response the donor has ever made, including declines. */
exports.donorsRouter.get("/me/responses", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const responses = await donor_request_response_1.DonorRequestResponse.find({ donor: user._id }).sort({ updatedAt: -1 });
    const { byRequest } = await joinRequests(responses);
    const records = [];
    for (const response of responses) {
        const request = byRequest.get(String(response.request));
        if (request === undefined) {
            continue;
        }
        records.push({
            ...(0, serialize_1.requestRow)(request, {
                donorResponse: response.response,
                donorStage: response.stage,
                acceptedByOtherDonor: false,
            }),
            responseCreatedAt: response.createdAt,
            responseUpdatedAt: response.updatedAt,
        });
    }
    res.json({ responses: records });
}));
/** The donor's own accepted commitment for one request. */
exports.donorsRouter.get("/requests/:requestId/commitment", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);
    res.json({
        commitment: {
            ...(0, serialize_1.requestRow)(request, {
                donorResponse: response.response,
                donorStage: response.stage,
                acceptedByOtherDonor: false,
            }),
            responseId: String(response._id),
        },
    });
}));
/* ---------------------------------------------------------------- transit */
/** The donor sets off. Only legal from `accepted`, and it burns any ticket. */
exports.donorsRouter.post("/me/commitments/:requestId/en-route", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);
    if (!(0, lifecycle_1.isResponseMutable)(response.stage)) {
        throw http_1.fail.conflict("You are already on your way to this donation.");
    }
    response.stage = "en_route";
    response.checkinTokenHash = null;
    response.checkinTokenExpiresAt = null;
    await response.save();
    res.json({ updated: { requestId: String(request._id), stage: response.stage } });
}));
/**
 * Issues a single-use intake ticket.
 *
 * The client sends only the hash. The raw secret never crosses the wire, so a
 * database reader cannot forge a ticket — and it is cleared on first use.
 */
exports.donorsRouter.post("/me/commitments/:requestId/check-in-ticket", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ tokenHash: zod_1.z.string().trim().min(16, "A ticket hash is required.") })), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { tokenHash } = req.body;
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);
    if (response.stage !== "en_route") {
        throw http_1.fail.conflict("Start transit before opening your intake QR.");
    }
    response.checkinTokenHash = tokenHash;
    response.checkinTokenExpiresAt = new Date(Date.now() + TICKET_TTL_MS);
    await response.save();
    res.json({ ticket: { expiresAt: response.checkinTokenExpiresAt } });
}));
/* ------------------------------------------------------- hospital intake */
/**
 * The scan at the intake desk.
 *
 * Bound to one request, expiring, and single-use: the hash must match, must not
 * have lapsed, and is cleared as the donor is marked arrived.
 */
exports.donorsRouter.post("/requests/:requestId/check-in", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ tokenHash: zod_1.z.string().trim().min(16, "A ticket hash is required.") })), (0, http_1.asyncHandler)(async (req, res) => {
    (0, access_1.assertStaff)((0, auth_1.currentUser)(req));
    const { tokenHash } = req.body;
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);
    if (response.stage !== "en_route" ||
        response.checkinTokenHash !== tokenHash ||
        response.checkinTokenExpiresAt === null ||
        response.checkinTokenExpiresAt.getTime() <= Date.now()) {
        throw http_1.fail.conflict("This intake QR is invalid or has expired.");
    }
    response.stage = "arrived";
    response.checkinTokenHash = null;
    response.checkinTokenExpiresAt = null;
    await response.save();
    res.json({ verified: { checkedInAt: response.updatedAt } });
}));
const screeningSchema = zod_1.z.object({
    temperature: zod_1.z.string().trim().nullable().optional(),
    bloodPressure: zod_1.z.string().trim().nullable().optional(),
    pulse: zod_1.z.string().trim().nullable().optional(),
    hemoglobin: zod_1.z.string().trim().nullable().optional(),
    eligible: zod_1.z.boolean(),
    bedLabel: zod_1.z.string().trim().nullable().optional(),
});
/** Records intake vitals. Append-only: re-screening adds a row, never edits. */
exports.donorsRouter.post("/requests/:requestId/screening", auth_1.requireAuth, (0, validate_1.validateBody)(screeningSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const input = req.body;
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);
    if (response.stage !== "arrived") {
        throw http_1.fail.conflict("Check the donor in before recording vitals.");
    }
    const screening = await donor_screening_1.DonorScreening.create({
        response: response._id,
        temperature: input.temperature ?? null,
        bloodPressure: input.bloodPressure ?? null,
        pulse: input.pulse ?? null,
        hemoglobin: input.hemoglobin ?? null,
        eligible: input.eligible,
        bedLabel: input.bedLabel ?? null,
        screenedBy: user._id,
    });
    res.status(201).json({ screening: { createdAt: screening.createdAt } });
}));
/**
 * Opens a collection session.
 *
 * Requires the latest screening to have cleared the donor and no session already
 * running — the partial unique index backs up the second check, because a
 * double-tap must not open two collections.
 */
exports.donorsRouter.post("/requests/:requestId/extraction", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    (0, access_1.assertStaff)((0, auth_1.currentUser)(req));
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);
    if (response.stage !== "arrived") {
        throw http_1.fail.conflict("The donor must be checked in before collection can start.");
    }
    const latest = await donor_screening_1.DonorScreening.findOne({ response: response._id }).sort({ createdAt: -1 });
    if (latest?.eligible !== true) {
        throw http_1.fail.conflict("The donor must be screened and cleared before collection can start.");
    }
    const open = await extraction_session_1.ExtractionSession.findOne({ response: response._id, status: "in_progress" });
    if (open !== null) {
        throw http_1.fail.conflict("A collection is already running for this donation.");
    }
    const extraction = await extraction_session_1.ExtractionSession.create({ response: response._id, status: "in_progress" });
    res.status(201).json({ extraction: { startedAt: extraction.startedAt } });
}));
/** Closes the running session with the volume actually collected. */
exports.donorsRouter.patch("/requests/:requestId/extraction", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({
    volumeMl: zod_1.z.number().int().min(0, "Volume cannot be negative."),
    phlebotomistName: zod_1.z.string().trim().nullable().optional(),
})), (0, http_1.asyncHandler)(async (req, res) => {
    (0, access_1.assertStaff)((0, auth_1.currentUser)(req));
    const { volumeMl, phlebotomistName } = req.body;
    const request = await findRequest((0, validate_1.param)(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);
    const extraction = await extraction_session_1.ExtractionSession.findOne({ response: response._id, status: "in_progress" });
    if (extraction === null) {
        throw http_1.fail.conflict("There is no collection session to complete.");
    }
    extraction.status = "completed";
    extraction.volumeMl = volumeMl;
    extraction.phlebotomistName = phlebotomistName ?? null;
    extraction.completedAt = new Date();
    await extraction.save();
    res.json({ extraction: extractionRow(extraction) });
}));
/**
 * Closes the case.
 *
 * Two writes that must not half-apply, so they share a transaction: the donor is
 * marked complete and the request becomes fulfilled. A donor who has travelled
 * to the hospital and given blood must never be left on a request that is still
 * open to other donors.
 */
exports.donorsRouter.post("/requests/:requestId/complete", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    (0, access_1.assertStaff)((0, auth_1.currentUser)(req));
    const session = await mongoose_1.default.startSession();
    try {
        const result = await session.withTransaction(async () => {
            const request = await findRequest((0, validate_1.param)(req, "requestId"), session);
            const response = await findAcceptedResponse(request._id, null, session);
            if (response.stage !== "arrived") {
                throw http_1.fail.conflict("The donor must be checked in before completing this request.");
            }
            response.stage = "completed";
            await response.save({ session });
            if ((0, lifecycle_1.isOpen)(request.status)) {
                request.status = "fulfilled";
                await request.save({ session });
            }
            return { request, stage: response.stage };
        });
        res.json({ updated: { requestId: String(result.request._id), stage: result.stage } });
    }
    finally {
        await session.endSession();
    }
}));
/* ------------------------------------------------------------------ helpers */
async function findRequest(id, session = null) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw http_1.fail.notFound("That request could not be found.");
    }
    const query = emergency_request_1.EmergencyRequest.findById(id);
    const request = await (session === null ? query : query.session(session));
    if (request === null) {
        throw http_1.fail.notFound("That request could not be found.");
    }
    return request;
}
/**
 * The accepted commitment for a request.
 *
 * Passing `donor` restricts it to that donor's own commitment; passing `null`
 * takes whichever donor accepted, which is what hospital staff need.
 */
async function findAcceptedResponse(requestId, donor, session = null) {
    const query = donor_request_response_1.DonorRequestResponse.findOne({
        request: requestId,
        response: "accepted",
        ...(donor === null ? {} : { donor }),
    });
    const response = await (session === null ? query : query.session(session));
    if (response === null) {
        throw http_1.fail.conflict("No donor has committed to this request yet.");
    }
    return response;
}
/** Fetches the requests behind a set of responses, keyed for lookup. */
async function joinRequests(responses) {
    const requests = await emergency_request_1.EmergencyRequest.find({ _id: { $in: responses.map((row) => row.request) } });
    return { requests, byRequest: new Map(requests.map((row) => [String(row._id), row])) };
}
function extractionRow(extraction) {
    return {
        status: extraction.status,
        volumeMl: extraction.volumeMl ?? null,
        phlebotomistName: extraction.phlebotomistName ?? null,
        startedAt: extraction.startedAt,
        completedAt: extraction.completedAt ?? null,
    };
}
