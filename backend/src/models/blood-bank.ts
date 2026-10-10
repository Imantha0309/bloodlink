/**
 * A blood facility and its contact details. Publicly readable.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { applyJsonTransform } from "./shared";

export type BloodBankDocument = {
  _id: Types.ObjectId;
  name: string;
  district: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  isVerified: boolean;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type BloodBankDoc = HydratedDocument<BloodBankDocument>;

const bloodBankSchema = new Schema<BloodBankDocument>(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    hours: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    note: { type: String, default: null },
  },
  { timestamps: true },
);

bloodBankSchema.index({ district: 1, name: 1 }, { name: "district_name" });

applyJsonTransform(bloodBankSchema);

export const BloodBank = model<BloodBankDocument>("BloodBank", bloodBankSchema);
