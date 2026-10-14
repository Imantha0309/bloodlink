/**
 * In-app notification feed, always scoped to its owner.
 *
 * `user` leads the index because every read is "my alerts, newest first" — the
 * unread count is a second query on the same key.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { ALERT_TYPES, applyJsonTransform, type AlertType } from "./shared";

export type AlertDocument = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  type: AlertType;
  request: Types.ObjectId | null;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AlertDoc = HydratedDocument<AlertDocument>;

const alertSchema = new Schema<AlertDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ALERT_TYPES, required: true },
    request: { type: Schema.Types.ObjectId, ref: "EmergencyRequest", default: null },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

alertSchema.index({ user: 1, createdAt: -1 }, { name: "user_recent" });
alertSchema.index({ user: 1, readAt: 1 }, { name: "user_unread" });

applyJsonTransform(alertSchema);

export const Alert = model<AlertDocument>("Alert", alertSchema);
