/**
 * An emergency blood request.
 *
 * `requester` is optional on purpose: the zero-login urgent path creates a
 * request with no owner at all, and the app renders those as anonymous.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import {
  REQUEST_STATUSES,
  URGENCY_LEVELS,
  applyJsonTransform,
  type RequestStatus,
  type UrgencyLevel,
} from "./shared";

export type EmergencyRequestDocument = {
  _id: Types.ObjectId;
  requester: Types.ObjectId | null;
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district: string | null;
  registrationNumber: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type EmergencyRequestDoc = HydratedDocument<EmergencyRequestDocument>;

const emergencyRequestSchema = new Schema<EmergencyRequestDocument>(
  {
    requester: { type: Schema.Types.ObjectId, ref: "User", default: null },

    patientName: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true },
    units: { type: Number, required: true, min: 1 },
    hospital: { type: String, required: true, trim: true },
    district: { type: String, default: null },
    registrationNumber: { type: String, default: null },

    contactName: { type: String, required: true, trim: true },
    contactMobile: { type: String, required: true, trim: true },

    urgency: { type: String, enum: URGENCY_LEVELS, required: true },
    notes: { type: String, default: null },
    status: { type: String, enum: REQUEST_STATUSES, default: "pending" },
  },
  { timestamps: true },
);

// The triage queue and every open-request count filter on status.
emergencyRequestSchema.index({ status: 1, createdAt: -1 }, { name: "status_created" });
emergencyRequestSchema.index({ requester: 1, createdAt: -1 }, { name: "requester_created" });

applyJsonTransform(emergencyRequestSchema);

export const EmergencyRequest = model<EmergencyRequestDocument>(
  "EmergencyRequest",
  emergencyRequestSchema,
);
