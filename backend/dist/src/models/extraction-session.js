"use strict";
/**
 * A donation extraction session started by hospital staff.
 *
 * At most one session may be `in_progress` per response — the partial unique
 * index enforces that, because "start collection" being pressed twice must not
 * open two sessions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtractionSession = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const extractionSessionSchema = new mongoose_1.Schema({
    response: { type: mongoose_1.Schema.Types.ObjectId, ref: "DonorRequestResponse", required: true },
    volumeMl: { type: Number, default: null, min: 0 },
    status: { type: String, enum: shared_1.EXTRACTION_STATUSES, default: "in_progress" },
    phlebotomistName: { type: String, default: null },
    startedAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
}, { timestamps: true });
extractionSessionSchema.index({ response: 1, startedAt: -1 }, { name: "response_recent" });
// One open collection per response.
extractionSessionSchema.index({ response: 1 }, {
    unique: true,
    partialFilterExpression: { status: "in_progress" },
    name: "one_open_session_per_response",
});
(0, shared_1.applyJsonTransform)(extractionSessionSchema);
exports.ExtractionSession = (0, mongoose_1.model)("ExtractionSession", extractionSessionSchema);
