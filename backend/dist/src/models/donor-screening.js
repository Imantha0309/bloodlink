"use strict";
/**
 * Intake vitals recorded by hospital staff for the accepted donor.
 *
 * Append-only by design: re-screening writes a new row rather than editing the
 * previous one, so the latest by `createdAt` is the one that counts.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorScreening = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const donorScreeningSchema = new mongoose_1.Schema({
    response: { type: mongoose_1.Schema.Types.ObjectId, ref: "DonorRequestResponse", required: true },
    temperature: { type: String, default: null },
    bloodPressure: { type: String, default: null },
    pulse: { type: String, default: null },
    hemoglobin: { type: String, default: null },
    eligible: { type: Boolean, default: true },
    bedLabel: { type: String, default: null },
    screenedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
// "Latest screening for this response" is the only read pattern.
donorScreeningSchema.index({ response: 1, createdAt: -1 }, { name: "response_recent" });
(0, shared_1.applyJsonTransform)(donorScreeningSchema);
exports.DonorScreening = (0, mongoose_1.model)("DonorScreening", donorScreeningSchema);
