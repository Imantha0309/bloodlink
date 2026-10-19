"use strict";
/**
 * One-to-one donor availability switch.
 *
 * The presence of a row is not what makes a donor available — `isAvailable` is.
 * The SQL behaved the same way, and the app reads `recordExists` separately so
 * "never set" and "explicitly paused" render differently.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorAvailability = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const donorAvailabilitySchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    isAvailable: { type: Boolean, default: true },
    lastDonationAt: { type: Date, default: null },
}, { timestamps: true });
// One row per user: the upsert in the availability route relies on this.
donorAvailabilitySchema.index({ userId: 1 }, { unique: true, name: "one_row_per_user" });
// The donor-feed and coverage counts both filter on availability, so it leads.
donorAvailabilitySchema.index({ isAvailable: 1 }, { name: "available" });
(0, shared_1.applyJsonTransform)(donorAvailabilitySchema);
exports.DonorAvailability = (0, mongoose_1.model)("DonorAvailability", donorAvailabilitySchema);
