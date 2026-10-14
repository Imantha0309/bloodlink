/**
 * One-to-one donor availability switch.
 *
 * The presence of a row is not what makes a donor available — `isAvailable` is.
 * The SQL behaved the same way, and the app reads `recordExists` separately so
 * "never set" and "explicitly paused" render differently.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { applyJsonTransform } from "./shared";

export type DonorAvailabilityDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  isAvailable: boolean;
  lastDonationAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DonorAvailabilityDoc = HydratedDocument<DonorAvailabilityDocument>;

const donorAvailabilitySchema = new Schema<DonorAvailabilityDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isAvailable: { type: Boolean, default: true },
    lastDonationAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One row per user: the upsert in the availability route relies on this.
donorAvailabilitySchema.index({ userId: 1 }, { unique: true, name: "one_row_per_user" });

// The donor-feed and coverage counts both filter on availability, so it leads.
donorAvailabilitySchema.index({ isAvailable: 1 }, { name: "available" });

applyJsonTransform(donorAvailabilitySchema);

export const DonorAvailability = model<DonorAvailabilityDocument>(
  "DonorAvailability",
  donorAvailabilitySchema,
);
