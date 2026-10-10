/**
 * A signed-in session.
 *
 * The token itself is a JWT the server can verify without a lookup; this record
 * exists so signing out can actually revoke it, and so an expiry shorter than
 * the token's own can be enforced. The TTL index lets MongoDB delete rows the
 * moment they lapse, so the collection never grows without bound.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export type SessionDocument = {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  /** The JWT's `jti` claim — what makes revocation possible. */
  tokenId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionDoc = HydratedDocument<SessionDocument>;

const sessionSchema = new Schema<SessionDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

sessionSchema.index({ tokenId: 1 }, { unique: true, name: "token_id_unique" });
sessionSchema.index({ user: 1 }, { name: "by_user" });

// MongoDB removes the document once `expiresAt` passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "session_ttl" });

export const Session = model<SessionDocument>("Session", sessionSchema);
