/**
 * Intake vitals recorded by hospital staff for the accepted donor.
 *
 * Append-only by design: re-screening writes a new row rather than editing the
 * previous one, so the latest by `createdAt` is the one that counts.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { applyJsonTransform } from "./shared";

export type DonorScreeningDocument = {
  _id: Types.ObjectId;
  response: Types.ObjectId;
  temperature: string | null;
  bloodPressure: string | null;
  pulse: string | null;
  hemoglobin: string | null;
  eligible: boolean;
  bedLabel: string | null;
  screenedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DonorScreeningDoc = HydratedDocument<DonorScreeningDocument>;

const donorScreeningSchema = new Schema<DonorScreeningDocument>(
  {
    response: { type: Schema.Types.ObjectId, ref: "DonorRequestResponse", required: true },

    temperature: { type: String, default: null },
    bloodPressure: { type: String, default: null },
    pulse: { type: String, default: null },
    hemoglobin: { type: String, default: null },

    eligible: { type: Boolean, default: true },
    bedLabel: { type: String, default: null },

    screenedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

// "Latest screening for this response" is the only read pattern.
donorScreeningSchema.index({ response: 1, createdAt: -1 }, { name: "response_recent" });

applyJsonTransform(donorScreeningSchema);

export const DonorScreening = model<DonorScreeningDocument>(
  "DonorScreening",
  donorScreeningSchema,
);
