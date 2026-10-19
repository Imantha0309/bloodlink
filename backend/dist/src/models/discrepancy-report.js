"use strict";
/**
 * A transfusion incident report.
 *
 * Append-only by design: nothing here is ever edited or deleted, and resolving
 * one only stamps who dealt with it. A record that can be quietly tidied away
 * is not an audit trail, which is the entire reason this collection exists.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscrepancyReport = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const discrepancyReportSchema = new mongoose_1.Schema({
    district: { type: String, default: null },
    type: { type: String, enum: shared_1.DISCREPANCY_TYPES, required: true },
    severity: { type: String, enum: shared_1.DISCREPANCY_SEVERITIES, required: true },
    detail: { type: String, required: true, trim: true },
    reporter: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    reporterName: { type: String, required: true },
    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });
// The screen's default view is "open reports, newest first", filtered by
// district — which is exactly this key.
discrepancyReportSchema.index({ district: 1, resolvedAt: 1, createdAt: -1 }, { name: "district_open_recent" });
(0, shared_1.applyJsonTransform)(discrepancyReportSchema);
exports.DiscrepancyReport = (0, mongoose_1.model)("DiscrepancyReport", discrepancyReportSchema);
