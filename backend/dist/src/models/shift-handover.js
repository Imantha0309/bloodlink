"use strict";
/**
 * The shift handover log.
 *
 * One entry per outgoing shift: what the incoming one needs to know. Entries are
 * never edited or deleted — a handover is a record of what the outgoing shift
 * *believed* at the time, not a status that gets corrected later.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShiftHandover = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const shiftHandoverSchema = new mongoose_1.Schema({
    district: { type: String, default: null },
    shiftLabel: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true },
    pendingCrossMatches: { type: Number, default: 0, min: 0 },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
}, { timestamps: true });
// The list is always "this district, newest first".
shiftHandoverSchema.index({ district: 1, createdAt: -1 }, { name: "district_recent" });
(0, shared_1.applyJsonTransform)(shiftHandoverSchema);
exports.ShiftHandover = (0, mongoose_1.model)("ShiftHandover", shiftHandoverSchema);
