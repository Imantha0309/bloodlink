/**
 * One stock line: a single (bank, blood group, component) combination.
 *
 * The unique index makes the restock route a plain upsert, and makes a
 * concurrent double-write land on one document instead of two.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { BLOOD_COMPONENTS, applyJsonTransform, type BloodComponent } from "./shared";

export type BloodInventoryDocument = {
  _id: Types.ObjectId;
  bank: Types.ObjectId;
  bloodGroup: string;
  component: BloodComponent;
  units: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BloodInventoryDoc = HydratedDocument<BloodInventoryDocument>;

const bloodInventorySchema = new Schema<BloodInventoryDocument>(
  {
    bank: { type: Schema.Types.ObjectId, ref: "BloodBank", required: true },
    bloodGroup: { type: String, required: true },
    component: { type: String, enum: BLOOD_COMPONENTS, required: true },
    units: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

bloodInventorySchema.index(
  { bank: 1, bloodGroup: 1, component: 1 },
  { unique: true, name: "one_line_per_combination" },
);

applyJsonTransform(bloodInventorySchema);

export const BloodInventory = model<BloodInventoryDocument>(
  "BloodInventory",
  bloodInventorySchema,
);
