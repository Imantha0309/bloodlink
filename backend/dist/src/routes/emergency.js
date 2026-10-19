"use strict";
/**
 * Emergency requests — the heart of the app.
 *
 * Every rule here came out of a SQL `WHERE` clause in the retired Data Connect
 * connector. The clauses were safe but silent: an illegal move produced an empty
 * result set, so the app could only say "that didn't work". Each rule is now an
 * explicit check with its own message, which is what the screens display.
 *
 * Three writes fan out alerts and therefore run in a transaction, matching the
 * `@transaction` they used to sit inside: a rolled-back response must never
 * leave a requester holding an alert about something that did not happen.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emergencyRouter = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const access_1 = require("../domain/access");
const alerts_1 = require("../domain/alerts");
const compatibility_1 = require("../domain/compatibility");
const lifecycle_1 = require("../domain/lifecycle");
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const donor_availability_1 = require("../models/donor-availability");
const donor_request_response_1 = require("../models/donor-request-response");
const emergency_request_1 = require("../models/emergency-request");
const shared_1 = require("../models/shared");
exports.emergencyRouter = (0, express_1.Router)();
/** Sort weight for the feed and triage queue; `critical` floats to the top. */
const URGENCY_RANK = { critical: 0, urgent: 1, standard: 2 };
/** Newest first, but only after the more urgent requests have been served. */
function byUrgencyThenNewest(a, b) {
    const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
    return rank !== 0 ? rank : b.createdAt.getTime() - a.createdAt.getTime();
}
/* ------------------------------------------------------------------- schemas */
const createSchema = zod_1.z.object({
    patientName: zod_1.z.string().trim().min(2, "Enter the patient's name."),
    bloodGroup: zod_1.z.string().trim(),
    units: zod_1.z.number().int().min(1, "At least one unit is needed.").max(20, "That is more than one request can carry."),
    hospital: zod_1.z.string().trim().min(2, "Enter the hospital."),
    district: zod_1.z.string().trim().nullable().optional(),
    registrationNumber: zod_1.z.string().trim().nullable().optional(),
    contactName: zod_1.z.string().trim().min(2, "Enter a contact name."),
    contactMobile: zod_1.z.string().trim().min(6, "Enter a contact number."),
    urgency: zod_1.z.enum(shared_1.URGENCY_LEVELS),
    notes: zod_1.z.string().trim().nullable().optional(),
});
const statusSchema = zod_1.z.object({
    status: zod_1.z.enum(["pending", "verified", "fulfilled", "cancelled"]),
});
/**
 * Clinical fields a request owner may change, restricted to the subset of
 * `createSchema` that describes the situation rather than the paperwork.
 *
 * `district` and `registrationNumber` are deliberately absent: they come from the
 * account, so letting a requester rewrite them would let them re-scope a request
 * into another hospital's district. Reusing `createSchema`'s shapes keeps the
 * create and edit messages identical, because they should be.
 */
const editDetailsSchema = createSchema
    .pick({
    patientName: true,
    bloodGroup: true,
    units: true,
    hospital: true,
    contactName: true,
    contactMobile: true,
    urgency: true,
    notes: true,
})
    .partial()
    .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Change at least one field before saving.",
});
const responseSchema = zod_1.z.object({
    response: zod_1.z.enum(["accepted", "declined"]),
});
/* --------------------------------------------------------------- list routes */
/**
 * The role-branched list.
 *
 * A donor sees the open requests their blood can serve, staff see the queue they
 * are standing at, and a recipient sees the requests they raised. The old SQL
 * expressed this as three separate queries with the caller's identity baked into
 * the `WHERE`; here it is one route that picks a branch, because the app has
 * always called it as one function.
 *
 * `?mine=true` pins the third branch for any role. That matters because a
 * recipient who has set a blood group is also donor-eligible, and the recipient
 * screens — "every emergency request you have raised" — would otherwise be
 * handed the donor feed and present strangers' requests as their own.
 */
exports.emergencyRouter.get("/", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    /** The requests this user raised, which is its own list for a recipient. */
    const ownRequests = async () => (await emergency_request_1.EmergencyRequest.find({ requester: user._id }).sort({ createdAt: -1 })).map((row) => (0, serialize_1.requestRow)(row));
    if (req.query.mine === "true") {
        res.json({ requests: await ownRequests() });
        return;
    }
    if (user.role === "donor" || user.role === "recipient") {
        const eligible = (0, compatibility_1.isDonorEligible)(user.role, user.bloodGroup);
        if (user.role === "donor" || eligible) {
            res.json({ requests: await donorFeed(user._id, user.bloodGroup, eligible) });
            return;
        }
    }
    if (user.role === "hospital" || user.role === "admin") {
        (0, access_1.assertStaff)(user);
        // A hospital triages its own district: the board is headed "Active board at
        // <district> District", and stock, discrepancies and handovers are all
        // confined the same way. An admin still reads the whole country.
        const rows = await emergency_request_1.EmergencyRequest.find({
            ...(0, access_1.districtFilter)(user),
            status: { $in: ["pending", "verified"] },
        });
        res.json({ requests: rows.sort(byUrgencyThenNewest).map((row) => (0, serialize_1.requestRow)(row)) });
        return;
    }
    // A recipient with no blood group is not a donor, so they only ever see
    // their own requests.
    res.json({ requests: await ownRequests() });
}));
/** Open requests this user's blood can serve, with their own response state. */
async function donorFeed(userId, bloodGroup, eligible) {
    if (!eligible) {
        return [];
    }
    const groups = (0, compatibility_1.requestsForDonor)(bloodGroup);
    if (groups.length === 0) {
        return [];
    }
    const requests = await emergency_request_1.EmergencyRequest.find({
        status: { $in: ["pending", "verified"] },
        bloodGroup: { $in: groups },
    });
    const ids = requests.map((row) => row._id);
    const [mine, accepted] = await Promise.all([
        donor_request_response_1.DonorRequestResponse.find({ request: { $in: ids }, donor: userId }),
        donor_request_response_1.DonorRequestResponse.find({ request: { $in: ids }, response: "accepted" }),
    ]);
    const mineByRequest = new Map(mine.map((row) => [String(row.request), row]));
    const acceptedByRequest = new Set(accepted.map((row) => String(row.request)));
    return requests.sort(byUrgencyThenNewest).map((row) => {
        const response = mineByRequest.get(String(row._id));
        const takenByAnother = acceptedByRequest.has(String(row._id)) && String(response?.donor ?? "") !== String(userId);
        return (0, serialize_1.requestRow)(row, {
            donorResponse: response?.response ?? null,
            donorStage: response?.stage ?? null,
            acceptedByOtherDonor: takenByAnother,
        });
    });
}
/* ------------------------------------------------------------- create + read */
/**
 * Creates a request.
 *
 * Deliberately reachable while signed out — that is the zero-login urgent path.
 * A request with no `requester` is rendered as anonymous, which is also how the
 * app decides whether to hide the "my requests" affordances.
 */
exports.emergencyRouter.post("/", auth_1.optionalAuth, (0, validate_1.validateBody)(createSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const input = req.body;
    if (!(0, compatibility_1.isBloodGroup)(input.bloodGroup)) {
        throw http_1.fail.validation("Choose a valid blood group.", {
            bloodGroup: "Choose a valid blood group.",
        });
    }
    const request = await emergency_request_1.EmergencyRequest.create({
        requester: req.user?._id ?? null,
        patientName: input.patientName,
        bloodGroup: input.bloodGroup,
        units: input.units,
        hospital: input.hospital,
        district: input.district ?? null,
        registrationNumber: input.registrationNumber ?? null,
        contactName: input.contactName,
        contactMobile: input.contactMobile,
        urgency: input.urgency,
        notes: input.notes ?? null,
        status: "pending",
    });
    res.status(201).json({ request: (0, serialize_1.requestRow)(request) });
}));
/**
 * One request, plus the donor groups that can serve it.
 *
 * Public on purpose: the urgent path lets a signed-out visitor open a shared
 * link and see whether they can help.
 */
exports.emergencyRouter.get("/:id", auth_1.optionalAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const request = await findRequest((0, validate_1.param)(req, "id"));
    res.json({
        request: {
            ...(0, serialize_1.requestRow)(request),
            compatibleDonorGroups: (0, compatibility_1.donorsForRecipient)(request.bloodGroup),
        },
    });
}));
/* ------------------------------------------------------------------- status */
/**
 * Moves a request to a new status.
 *
 * Two callers reach this: the owner, who may only cancel their own request, and
 * verified staff, who may review the queue. Everything else — a terminal state,
 * a no-op, a donor trying to verify — is refused with wording that says which.
 */
/**
 * Clinical edits by the request's owner.
 *
 * Split from the status transition on purpose: a status change moves a request
 * through its lifecycle and may notify donors, while this changes the request
 * underneath them. Two rules define the boundary.
 *
 * Only the owner, and only while pending. Once `verified` the request has been
 * broadcast, so changing the units or the hospital would contradict what donors
 * were notified about — the honest fix is cancel and re-raise. Anonymous requests
 * carry no owner at all, so there is nobody to authorise.
 */
exports.emergencyRouter.patch("/:id/details", auth_1.requireAuth, (0, validate_1.validateBody)(editDetailsSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const input = req.body;
    const request = await findRequest((0, validate_1.param)(req, "id"));
    if (request.requester === null || !(0, access_1.ownsRequest)(user, request.requester)) {
        throw http_1.fail.unauthorized("Only the recipient who raised this request can edit it.");
    }
    if (request.status !== "pending") {
        throw http_1.fail.conflict(request.status === "verified"
            ? "This request is live. Cancel it and raise a new one if the details changed."
            : "A closed request cannot be edited.");
    }
    if (input.bloodGroup !== undefined && !(0, compatibility_1.isBloodGroup)(input.bloodGroup)) {
        throw http_1.fail.validation("Choose a valid blood group.", {
            bloodGroup: "Choose a valid blood group.",
        });
    }
    if (input.patientName !== undefined)
        request.patientName = input.patientName;
    if (input.bloodGroup !== undefined)
        request.bloodGroup = input.bloodGroup;
    if (input.units !== undefined)
        request.units = input.units;
    if (input.hospital !== undefined)
        request.hospital = input.hospital;
    if (input.contactName !== undefined)
        request.contactName = input.contactName;
    if (input.contactMobile !== undefined)
        request.contactMobile = input.contactMobile;
    if (input.urgency !== undefined)
        request.urgency = input.urgency;
    if (input.notes !== undefined)
        request.notes = input.notes ?? null;
    await request.save();
    res.json({ request: (0, serialize_1.requestRow)(request) });
}));
const patchEmergencySchema = zod_1.z
    .object({
    status: zod_1.z.enum(["pending", "verified", "fulfilled", "cancelled"]).optional(),
    patientName: zod_1.z.string().trim().min(2, "Enter the patient's name.").optional(),
    bloodGroup: zod_1.z.string().trim().optional(),
    units: zod_1.z.number().int().min(1, "At least one unit is needed.").max(20, "That is more than one request can carry.").optional(),
    hospital: zod_1.z.string().trim().min(2, "Enter the hospital.").optional(),
    contactName: zod_1.z.string().trim().min(2, "Enter a contact name.").optional(),
    contactMobile: zod_1.z.string().trim().min(6, "Enter a contact number.").optional(),
    urgency: zod_1.z.enum(shared_1.URGENCY_LEVELS).optional(),
    notes: zod_1.z.string().trim().nullable().optional(),
})
    .refine((value) => value.status !== undefined || Object.entries(value).some(([k, v]) => k !== "status" && v !== undefined), { message: "Provide a status or at least one clinical field to update." });
exports.emergencyRouter.patch("/:id", auth_1.requireAuth, (0, validate_1.validateBody)(patchEmergencySchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const input = req.body;
    const hasClinicalFields = input.patientName !== undefined ||
        input.bloodGroup !== undefined ||
        input.units !== undefined ||
        input.hospital !== undefined ||
        input.contactName !== undefined ||
        input.contactMobile !== undefined ||
        input.urgency !== undefined ||
        input.notes !== undefined;
    if (hasClinicalFields) {
        const request = await findRequest((0, validate_1.param)(req, "id"));
        if (request.requester === null || !(0, access_1.ownsRequest)(user, request.requester)) {
            throw http_1.fail.unauthorized("Only the recipient who raised this request can edit it.");
        }
        if (request.status !== "pending") {
            throw http_1.fail.conflict(request.status === "verified"
                ? "This request is live. Cancel it and raise a new one if the details changed."
                : "A closed request cannot be edited.");
        }
        if (input.bloodGroup !== undefined && !(0, compatibility_1.isBloodGroup)(input.bloodGroup)) {
            throw http_1.fail.validation("Choose a valid blood group.", {
                bloodGroup: "Choose a valid blood group.",
            });
        }
        if (input.patientName !== undefined)
            request.patientName = input.patientName;
        if (input.bloodGroup !== undefined)
            request.bloodGroup = input.bloodGroup;
        if (input.units !== undefined)
            request.units = input.units;
        if (input.hospital !== undefined)
            request.hospital = input.hospital;
        if (input.contactName !== undefined)
            request.contactName = input.contactName;
        if (input.contactMobile !== undefined)
            request.contactMobile = input.contactMobile;
        if (input.urgency !== undefined)
            request.urgency = input.urgency;
        if (input.notes !== undefined)
            request.notes = input.notes ?? null;
        if (input.status === undefined) {
            await request.save();
            return res.json({ request: (0, serialize_1.requestRow)(request) });
        }
        await request.save();
    }
    if (input.status !== undefined) {
        const next = input.status;
        const session = await mongoose_1.default.startSession();
        try {
            const updated = await session.withTransaction(async () => {
                const request = await findRequest((0, validate_1.param)(req, "id"), session);
                const ownerMayCancel = next === "cancelled" && (0, access_1.ownsRequest)(user, request.requester);
                if (!ownerMayCancel) {
                    (0, access_1.assertStaff)(user);
                }
                (0, lifecycle_1.assertTransition)(request.status, next);
                request.status = next;
                await request.save({ session });
                if (next === "verified") {
                    await (0, alerts_1.notifyCompatibleDonors)(request, session);
                }
                await (0, alerts_1.notifyRequesterOfStatus)(request, next, session);
                await (0, alerts_1.notifyAcceptedDonorOfStatus)(request, next, session);
                return request;
            });
            res.json({ request: (0, serialize_1.requestRow)(updated) });
        }
        finally {
            await session.endSession();
        }
    }
}));
/* ---------------------------------------------------------------- responses */
/**
 * Records a donor's decision.
 *
 * The guards are all in one place because they all have to pass together: the
 * request must still be open, the caller must be donor-eligible with a blood
 * group, they must not have answered already, and an acceptance additionally
 * requires being available, being compatible, and no other donor having got
 * there first.
 */
exports.emergencyRouter.post("/:id/response", auth_1.requireAuth, (0, validate_1.validateBody)(responseSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { response: decision } = req.body;
    const session = await mongoose_1.default.startSession();
    try {
        const created = await session.withTransaction(async () => {
            const request = await findRequest((0, validate_1.param)(req, "id"), session);
            await assertCanRespond(user, request, decision, session);
            const existing = await donor_request_response_1.DonorRequestResponse.findOne({
                request: request._id,
                donor: user._id,
            }).session(session);
            if (existing !== null) {
                throw http_1.fail.conflict("You have already responded to this request.");
            }
            const [row] = await donor_request_response_1.DonorRequestResponse.create([{ request: request._id, donor: user._id, response: decision, stage: "accepted" }], { session });
            if (decision === "accepted") {
                await (0, alerts_1.notifyRequesterOfAcceptance)(request, user, session);
            }
            return { response: row.response };
        });
        res.status(201).json({ created });
    }
    finally {
        await session.endSession();
    }
}));
/** Changes an existing response, while the donor has not started travelling. */
exports.emergencyRouter.put("/:id/response", auth_1.requireAuth, (0, validate_1.validateBody)(responseSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { response: decision } = req.body;
    const session = await mongoose_1.default.startSession();
    try {
        const updated = await session.withTransaction(async () => {
            const request = await findRequest((0, validate_1.param)(req, "id"), session);
            const existing = await donor_request_response_1.DonorRequestResponse.findOne({
                request: request._id,
                donor: user._id,
            }).session(session);
            if (existing === null) {
                throw http_1.fail.conflict("You have not responded to this request yet.");
            }
            if (!(0, lifecycle_1.isResponseMutable)(existing.stage)) {
                throw http_1.fail.conflict("You have already started travelling for this request.");
            }
            await assertCanRespond(user, request, decision, session, existing._id);
            existing.response = decision;
            // A changed decision invalidates any ticket already issued.
            existing.checkinTokenHash = null;
            existing.checkinTokenExpiresAt = null;
            await existing.save({ session });
            return { response: existing.response };
        });
        res.json({ updated });
    }
    finally {
        await session.endSession();
    }
}));
/** Withdraws a response. A commitment can only be pulled before transit. */
exports.emergencyRouter.delete("/:id/response", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const request = await findRequest((0, validate_1.param)(req, "id"));
    const existing = await donor_request_response_1.DonorRequestResponse.findOne({
        request: request._id,
        donor: user._id,
    });
    if (existing === null) {
        throw http_1.fail.conflict("You have not responded to this request.");
    }
    if (!(0, lifecycle_1.isResponseMutable)(existing.stage)) {
        throw http_1.fail.conflict("A response cannot be removed once you have started travelling.");
    }
    await existing.deleteOne();
    res.json({ deleted: true });
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
 * Everything that has to hold before a donor's decision can be stored.
 *
 * `ignoreResponseId` is how an update excludes the row being changed from the
 * "another donor already accepted" test — without it, re-saving an existing
 * acceptance would find itself and refuse.
 */
async function assertCanRespond(user, request, decision, session, ignoreResponseId) {
    if (request.status !== "pending" && request.status !== "verified") {
        throw http_1.fail.conflict("This request is no longer accepting responses.");
    }
    if (!(0, compatibility_1.isDonorEligible)(user.role, user.bloodGroup)) {
        throw http_1.fail.conflict("Only donors can respond to a request.");
    }
    // Declining is always allowed once eligible — the rules below exist to stop an
    // *acceptance* being recorded that could not be honoured.
    if (decision === "declined") {
        return;
    }
    const availability = await donor_availability_1.DonorAvailability.findOne({ userId: user._id }).session(session);
    if (availability?.isAvailable !== true) {
        throw http_1.fail.conflict("Turn your availability back on to accept a request.");
    }
    if (!(0, compatibility_1.isBloodGroup)(user.bloodGroup) || !(0, compatibility_1.donorsForRecipient)(request.bloodGroup).includes(user.bloodGroup)) {
        throw http_1.fail.conflict("This request is not compatible with your blood group.");
    }
    const accepted = await donor_request_response_1.DonorRequestResponse.findOne({
        request: request._id,
        response: "accepted",
        ...(ignoreResponseId === undefined ? {} : { _id: { $ne: ignoreResponseId } }),
    })
        .select("_id")
        .session(session);
    if (accepted !== null) {
        throw http_1.fail.conflict("Another donor has already accepted this request.");
    }
}
