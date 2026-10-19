"use strict";
/**
 * Hospital-scoped operations: district stock, transmission candidates, the
 * accepted donor's case file, and the two append-only logs a desk keeps — shift
 * handovers and transfusion discrepancies.
 *
 * Everything here is staff-only, and a verified hospital is confined to its own
 * district — the same gate the SQL used, checked once at the top of each handler
 * rather than repeated inside every query. An admin is scoped to nothing.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hospitalRouter = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const access_1 = require("../domain/access");
const compatibility_1 = require("../domain/compatibility");
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const blood_bank_1 = require("../models/blood-bank");
const blood_inventory_1 = require("../models/blood-inventory");
const discrepancy_report_1 = require("../models/discrepancy-report");
const donor_availability_1 = require("../models/donor-availability");
const donor_request_response_1 = require("../models/donor-request-response");
const donor_screening_1 = require("../models/donor-screening");
const emergency_request_1 = require("../models/emergency-request");
const extraction_session_1 = require("../models/extraction-session");
const shift_handover_1 = require("../models/shift-handover");
const shared_1 = require("../models/shared");
const user_1 = require("../models/user");
exports.hospitalRouter = (0, express_1.Router)();
/** How many rows a list route returns in one page. */
const PAGE_LIMIT = 100;
/** Every bank this staff member may manage, each wrapped for the app's reader. */
exports.hospitalRouter.get("/inventory", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    // An admin manages the whole country; a hospital only its own district.
    const filter = (0, access_1.districtFilter)(user);
    const banks = await blood_bank_1.BloodBank.find(filter).sort({ name: 1 });
    const inventory = await blood_inventory_1.BloodInventory.find({ bank: { $in: banks.map((bank) => bank._id) } }).sort({
        bloodGroup: 1,
        component: 1,
    });
    const byBank = new Map();
    for (const row of inventory) {
        const key = String(row.bank);
        const list = byBank.get(key) ?? [];
        list.push((0, serialize_1.inventoryRow)(row));
        byBank.set(key, list);
    }
    res.json({
        banks: banks.map((bank) => ({
            bank: {
                id: String(bank._id),
                name: bank.name,
                district: bank.district,
                inventory: byBank.get(String(bank._id)) ?? [],
            },
        })),
    });
}));
/** Restocks, reserves or corrects one stock line. */
exports.hospitalRouter.put("/inventory/:bankId/:bloodGroup/:component", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const bankId = (0, validate_1.param)(req, "bankId");
    const bloodGroup = (0, validate_1.param)(req, "bloodGroup");
    const component = (0, validate_1.param)(req, "component");
    if (!mongoose_1.default.isValidObjectId(bankId)) {
        throw http_1.fail.notFound("That blood bank could not be found.");
    }
    if (!(0, compatibility_1.isBloodGroup)(bloodGroup) || !shared_1.BLOOD_COMPONENTS.includes(component)) {
        throw http_1.fail.validation("That is not a stock line this hospital can hold.");
    }
    const bank = await blood_bank_1.BloodBank.findById(bankId);
    if (bank === null) {
        throw http_1.fail.notFound("That blood bank could not be found.");
    }
    (0, access_1.assertCanManageBank)(user, bank.district);
    const units = readUnits(req.body);
    const updated = await blood_inventory_1.BloodInventory.findOneAndUpdate({ bank: bank._id, bloodGroup, component }, { $set: { units } }, { upsert: true, new: true, setDefaultsOnInsert: true });
    res.json({ inventory: (0, serialize_1.inventoryRow)(updated) });
}));
/**
 * Live numbers for the transmission screen.
 *
 * `compatibleAvailable` counts only outright donors — a recipient who set a
 * blood group is donor-eligible for alerts, but the hospital is asking "how many
 * donors can I actually call", so the narrower rule is the right one here.
 */
exports.hospitalRouter.get("/requests/:id/candidates", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const request = await findRequest((0, validate_1.param)(req, "id"));
    const groups = (0, compatibility_1.donorsForRecipient)(request.bloodGroup);
    const donors = await user_1.User.find({ role: "donor", bloodGroup: { $in: groups } }).select("_id");
    const [compatibleAvailable, responses] = await Promise.all([
        donor_availability_1.DonorAvailability.countDocuments({
            userId: { $in: donors.map((donor) => donor._id) },
            isAvailable: true,
        }),
        donor_request_response_1.DonorRequestResponse.find({ request: request._id }),
    ]);
    const accepted = responses.filter((row) => row.response === "accepted");
    const enRoute = accepted.filter((row) => row.stage !== "accepted");
    res.json({
        candidates: {
            requestId: String(request._id),
            status: request.status,
            bloodGroup: request.bloodGroup,
            compatibleAvailable,
            accepted: accepted.length,
            enRoute: enRoute.length,
        },
    });
}));
/**
 * The accepted donor's case file, flattened.
 *
 * The app reads this as one flat row and reassembles it — that is the shape the
 * SQL `LIST` query returned, and reproducing it keeps the screen untouched.
 */
exports.hospitalRouter.get("/requests/:id/responses", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const request = await findRequest((0, validate_1.param)(req, "id"));
    const response = await donor_request_response_1.DonorRequestResponse.findOne({
        request: request._id,
        response: "accepted",
    }).sort({ updatedAt: -1 });
    const donor = response === null ? null : await user_1.User.findById(response.donor);
    const screening = response === null ? null : await donor_screening_1.DonorScreening.findOne({ response: response._id }).sort({ createdAt: -1 });
    const extraction = response === null ? null : await extraction_session_1.ExtractionSession.findOne({ response: response._id }).sort({ startedAt: -1 });
    res.json({
        workflow: {
            ...(0, serialize_1.requestRow)(request, {
                donorResponse: response?.response ?? null,
                donorStage: response?.stage ?? null,
                acceptedByOtherDonor: false,
            }),
            responseId: response === null ? null : String(response._id),
            stage: response?.stage ?? null,
            acceptedAt: response?.createdAt ?? null,
            donorId: donor === null ? null : String(donor._id),
            donorFullName: donor?.fullName ?? null,
            donorBloodGroup: donor?.bloodGroup ?? null,
            donorDistrict: donor?.district ?? null,
            temperature: screening?.temperature ?? null,
            bloodPressure: screening?.bloodPressure ?? null,
            pulse: screening?.pulse ?? null,
            hemoglobin: screening?.hemoglobin ?? null,
            eligible: screening?.eligible ?? null,
            bedLabel: screening?.bedLabel ?? null,
            screeningCreatedAt: screening?.createdAt ?? null,
            extractionStatus: extraction?.status ?? null,
            volumeMl: extraction?.volumeMl ?? null,
            phlebotomistName: extraction?.phlebotomistName ?? null,
            startedAt: extraction?.startedAt ?? null,
            completedAt: extraction?.completedAt ?? null,
        },
    });
}));
/* ------------------------------------------------------------------ station */
/**
 * The desk this staff member is covering.
 *
 * Self-declared, not assigned: a shift swap is a fact about right now rather
 * than a permission, so there is no approval step. It is stored on the user row
 * and comes back out through `authUserRow`, which is how the app reads it back
 * without a second request.
 */
exports.hospitalRouter.put("/me/station", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({
    station: zod_1.z.enum(shared_1.STAFF_STATIONS),
    wardLabel: zod_1.z.string().trim().nullable().optional(),
})), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const { station, wardLabel } = req.body;
    user.station = station;
    // Only the ward station carries a label, and a blank one is stored as null
    // rather than "" so "no label" has exactly one representation.
    const label = wardLabel?.trim() ?? "";
    user.wardLabel = station === "ward" && label.length > 0 ? label : null;
    await user.save();
    res.json({ station: user.station, wardLabel: user.wardLabel });
}));
/* ------------------------------------------------------------ discrepancies */
/** Open reports by default; `includeResolved=true` brings the history back. */
exports.hospitalRouter.get("/discrepancies", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const includeResolved = req.query.includeResolved === "true";
    const filter = (0, access_1.districtFilter)(user);
    if (!includeResolved) {
        filter.resolvedAt = null;
    }
    const reports = await discrepancy_report_1.DiscrepancyReport.find(filter).sort({ createdAt: -1 }).limit(PAGE_LIMIT);
    res.json({ reports: reports.map(serialize_1.discrepancyRow) });
}));
/**
 * Files a report.
 *
 * Append-only: there is no edit or delete route anywhere in this file, and there
 * will not be one. Near misses are worth reporting too, which is why nothing
 * here requires an actual harm to have occurred.
 */
exports.hospitalRouter.post("/discrepancies", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({
    type: zod_1.z.enum(shared_1.DISCREPANCY_TYPES),
    severity: zod_1.z.enum(shared_1.DISCREPANCY_SEVERITIES),
    detail: zod_1.z.string().trim().min(1, "Describe what happened."),
})), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const input = req.body;
    const report = await discrepancy_report_1.DiscrepancyReport.create({
        district: user.district ?? null,
        type: input.type,
        severity: input.severity,
        detail: input.detail,
        reporter: user._id,
        reporterName: user.fullName,
    });
    res.status(201).json({ report: (0, serialize_1.discrepancyRow)(report) });
}));
/**
 * Marks a report dealt with.
 *
 * The report is not deleted and its text is not changed — only who closed it and
 * when. Resolving one twice is rejected rather than silently re-stamped, so the
 * log keeps the time the incident was actually closed.
 */
exports.hospitalRouter.patch("/discrepancies/:id/resolve", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        throw http_1.fail.notFound("That report could not be found.");
    }
    const report = await discrepancy_report_1.DiscrepancyReport.findOne({
        _id: req.params.id,
        ...(0, access_1.districtFilter)(user),
    });
    if (report === null) {
        throw http_1.fail.notFound("That report could not be found.");
    }
    if (report.resolvedAt !== null) {
        throw http_1.fail.conflict("That report has already been resolved.");
    }
    report.resolvedAt = new Date();
    report.resolvedBy = user._id;
    await report.save();
    res.json({ report: (0, serialize_1.discrepancyRow)(report) });
}));
/* --------------------------------------------------------------- handovers */
/** The district's handover log, newest first. */
exports.hospitalRouter.get("/handovers", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const handovers = await shift_handover_1.ShiftHandover.find((0, access_1.districtFilter)(user))
        .sort({ createdAt: -1 })
        .limit(PAGE_LIMIT);
    res.json({ handovers: handovers.map(serialize_1.handoverRow) });
}));
/** Files one. Never edited afterwards — a handover records what was believed. */
exports.hospitalRouter.post("/handovers", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({
    shiftLabel: zod_1.z.string().trim().min(1, "Choose a shift."),
    notes: zod_1.z.string().trim().min(1, "Add a note for the incoming shift."),
    pendingCrossMatches: zod_1.z.number().int().min(0, "Cannot be negative."),
})), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    (0, access_1.assertStaff)(user);
    const input = req.body;
    const handover = await shift_handover_1.ShiftHandover.create({
        district: user.district ?? null,
        shiftLabel: input.shiftLabel,
        notes: input.notes,
        pendingCrossMatches: input.pendingCrossMatches,
        author: user._id,
        authorName: user.fullName,
    });
    res.status(201).json({ handover: (0, serialize_1.handoverRow)(handover) });
}));
/* ------------------------------------------------------------------ helpers */
async function findRequest(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw http_1.fail.notFound("That request could not be found.");
    }
    const request = await emergency_request_1.EmergencyRequest.findById(id);
    if (request === null) {
        throw http_1.fail.notFound("That request could not be found.");
    }
    return request;
}
/** Reads `units` off the body, insisting on a whole non-negative number. */
function readUnits(body) {
    const value = body?.units;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        throw http_1.fail.validation("Enter the number of units in stock.", {
            units: "Enter a whole number of units.",
        });
    }
    return value;
}
