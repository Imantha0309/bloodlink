/**
 * The shift handover log.
 *
 * One entry per outgoing shift: what the incoming one needs to know. Entries are
 * never edited or deleted — a handover is a record of what the outgoing shift
 * *believed* at the time, not a status that gets corrected later.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { applyJsonTransform } from "./shared";

export type ShiftHandoverDocument = {
  _id: Types.ObjectId;
  /** The facility's district; null for an admin filing one. */
  district: string | null;
  /** The shift label as typed, e.g. "Day shift · 08:00–20:00". */
  shiftLabel: string;
  notes: string;
  /** Cross-matches the outgoing shift left open. */
  pendingCrossMatches: number;
  author: Types.ObjectId;
  /** Snapshotted so the log survives the account being removed. */
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ShiftHandoverDoc = HydratedDocument<ShiftHandoverDocument>;

const shiftHandoverSchema = new Schema<ShiftHandoverDocument>(
  {
    district: { type: String, default: null },
    shiftLabel: { type: String, required: true, trim: true },
    notes: { type: String, required: true, trim: true },
    pendingCrossMatches: { type: Number, default: 0, min: 0 },

    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
  },
  { timestamps: true },
);

// The list is always "this district, newest first".
shiftHandoverSchema.index({ district: 1, createdAt: -1 }, { name: "district_recent" });

applyJsonTransform(shiftHandoverSchema);

export const ShiftHandover = model<ShiftHandoverDocument>("ShiftHandover", shiftHandoverSchema);
