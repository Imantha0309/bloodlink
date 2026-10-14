/**
 * A password-reset token.
 *
 * Only the SHA-256 digest is stored; the raw token lives in the link that is
 * emailed (or, in development, printed to the server console). A reset token
 * that leaks from the database is therefore useless.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export type PasswordResetDocument = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PasswordResetDoc = HydratedDocument<PasswordResetDocument>;

const passwordResetSchema = new Schema<PasswordResetDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

passwordResetSchema.index({ tokenHash: 1 }, { unique: true, name: "token_hash_unique" });
passwordResetSchema.index({ user: 1 }, { name: "by_user" });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "reset_ttl" });

export const PasswordReset = model<PasswordResetDocument>("PasswordReset", passwordResetSchema);
