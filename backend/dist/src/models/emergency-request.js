"use strict";
/**
 * An emergency blood request.
 *
 * `requester` is optional on purpose: the zero-login urgent path creates a
 * request with no owner at all, and the app renders those as anonymous.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyRequest = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const emergencyRequestSchema = new mongoose_1.Schema({
    requester: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    patientName: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true, min: 1 },
    hospital: { type: String, required: true, trim: true },
    district: { type: String, default: null },
    registrationNumber: { type: String, default: null },
    contactName: { type: String, required: true, trim: true },
    contactMobile: { type: String, required: true, trim: true },
    urgency: { type: String, enum: shared_1.URGENCY_LEVELS, required: true },
    notes: { type: String, default: null },
    status: { type: String, enum: shared_1.REQUEST_STATUSES, default: "pending" },
}, { timestamps: true });
// The triage queue and every open-request count filter on status.
emergencyRequestSchema.index({ status: 1, createdAt: -1 }, { name: "status_created" });
emergencyRequestSchema.index({ requester: 1, createdAt: -1 }, { name: "requester_created" });
(0, shared_1.applyJsonTransform)(emergencyRequestSchema);
exports.EmergencyRequest = (0, mongoose_1.model)("EmergencyRequest", emergencyRequestSchema);
