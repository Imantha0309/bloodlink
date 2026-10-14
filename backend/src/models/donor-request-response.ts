/**
 * A donor's decision on one request — and their progress through the hospital
 * intake pipeline once they have accepted.
 *
 * The `one_accepted_response_per_request` index is load-bearing: it is the only
 * thing stopping two donors from claiming the same request at the same instant.
 * The route checks first and gives a readable message, but under a genuine race
 * the index is what actually holds, and the duplicate-key error is what the
 * loser sees.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { DONATION_STAGES, DONOR_RESPONSES, applyJsonTransform, type DonationStage, type DonorResponse } from "./shared";

export type DonorRequestResponseDocument = {
  _id: Types.ObjectId;
  request: Types.ObjectId;
  donor: Types.ObjectId;
  response: DonorResponse;
  /** Progress through intake; only mutable while still `accepted`. */
  stage: DonationStage;
  /** SHA-256 of the intake ticket. The raw token never leaves the device. */
  checkinTokenHash: string | null;
  checkinTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DonorRequestResponseDoc = HydratedDocument<DonorRequestResponseDocument>;

const donorRequestResponseSchema = new Schema<DonorRequestResponseDocument>(
  {
    request: { type: Schema.Types.ObjectId, ref: "EmergencyRequest", required: true },
    donor: { type: Schema.Types.ObjectId, ref: "User", required: true },

    response: { type: String, enum: DONOR_RESPONSES, required: true },
    stage: { type: String, enum: DONATION_STAGES, default: "accepted" },

    checkinTokenHash: { type: String, default: null },
    checkinTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// One response per donor per request.
donorRequestResponseSchema.index(
  { request: 1, donor: 1 },
  { unique: true, name: "one_response_per_donor" },
);

// Exactly one accepted response may exist per request, enforced by the database
// rather than by a read-then-write in application code.
donorRequestResponseSchema.index(
  { request: 1 },
  {
    unique: true,
    partialFilterExpression: { response: "accepted" },
    name: "one_accepted_response_per_request",
  },
);

// The donor's own commitments and response history.
donorRequestResponseSchema.index({ donor: 1, updatedAt: -1 }, { name: "donor_recent" });

// The hospital workflow looks up the accepted response for a request.
donorRequestResponseSchema.index({ request: 1, response: 1 }, { name: "by_response" });

applyJsonTransform(donorRequestResponseSchema);

export const DonorRequestResponse = model<DonorRequestResponseDocument>(
  "DonorRequestResponse",
  donorRequestResponseSchema,
);
