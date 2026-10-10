/**
 * A donation extraction session started by hospital staff.
 *
 * At most one session may be `in_progress` per response — the partial unique
 * index enforces that, because "start collection" being pressed twice must not
 * open two sessions.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { EXTRACTION_STATUSES, applyJsonTransform, type ExtractionStatus } from "./shared";

export type ExtractionSessionDocument = {
  _id: Types.ObjectId;
  response: Types.ObjectId;
  volumeMl: number | null;
  status: ExtractionStatus;
  phlebotomistName: string | null;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ExtractionSessionDoc = HydratedDocument<ExtractionSessionDocument>;

const extractionSessionSchema = new Schema<ExtractionSessionDocument>(
  {
    response: { type: Schema.Types.ObjectId, ref: "DonorRequestResponse", required: true },

    volumeMl: { type: Number, default: null, min: 0 },
    status: { type: String, enum: EXTRACTION_STATUSES, default: "in_progress" },
    phlebotomistName: { type: String, default: null },

    startedAt: { type: Date, default: () => new Date() },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

extractionSessionSchema.index({ response: 1, startedAt: -1 }, { name: "response_recent" });

// One open collection per response.
extractionSessionSchema.index(
  { response: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "in_progress" },
    name: "one_open_session_per_response",
  },
);

applyJsonTransform(extractionSessionSchema);

export const ExtractionSession = model<ExtractionSessionDocument>(
  "ExtractionSession",
  extractionSessionSchema,
);
