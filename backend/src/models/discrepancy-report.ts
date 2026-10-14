/**
 * A transfusion incident report.
 *
 * Append-only by design: nothing here is ever edited or deleted, and resolving
 * one only stamps who dealt with it. A record that can be quietly tidied away
 * is not an audit trail, which is the entire reason this collection exists.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import {
  DISCREPANCY_SEVERITIES,
  DISCREPANCY_TYPES,
  applyJsonTransform,
  type DiscrepancySeverity,
  type DiscrepancyType,
} from "./shared";

export type DiscrepancyReportDocument = {
  _id: Types.ObjectId;
  /** Scoped to the reporter's district, so a desk sees only its own log plus
   *  the whole national one when the caller is an admin. */
  district: string | null;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  detail: string;
  reporter: Types.ObjectId;
  /** Snapshotted so the log still reads correctly if the account is removed. */
  reporterName: string;
  resolvedAt: Date | null;
  resolvedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DiscrepancyReportDoc = HydratedDocument<DiscrepancyReportDocument>;

const discrepancyReportSchema = new Schema<DiscrepancyReportDocument>(
  {
    district: { type: String, default: null },
    type: { type: String, enum: DISCREPANCY_TYPES, required: true },
    severity: { type: String, enum: DISCREPANCY_SEVERITIES, required: true },
    detail: { type: String, required: true, trim: true },

    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporterName: { type: String, required: true },

    resolvedAt: { type: Date, default: null },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// The screen's default view is "open reports, newest first", filtered by
// district — which is exactly this key.
discrepancyReportSchema.index({ district: 1, resolvedAt: 1, createdAt: -1 }, { name: "district_open_recent" });

applyJsonTransform(discrepancyReportSchema);

export const DiscrepancyReport = model<DiscrepancyReportDocument>(
  "DiscrepancyReport",
  discrepancyReportSchema,
);
