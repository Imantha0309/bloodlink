/**
 * A person on the platform.
 *
 * `passwordHash` is bcrypt output and is marked `select: false`, so it is absent
 * from every query unless a route asks for it explicitly with
 * `.select("+passwordHash")` — which only the sign-in path does. `passTokenHash`
 * is hidden the same way, so a pass secret can only be reached by the resolve
 * route. Routes still hand users to the client through `authUserRow`, never
 * `toJSON`, so a future field cannot leak by accident either.
 */

import { Schema, model, type HydratedDocument, type Types } from "mongoose";

import { USER_ROLES, applyJsonTransform, type UserRole } from "./shared";

export type UserDocument = {
  _id: Types.ObjectId;
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district: string | null;
  registrationNumber: string | null;
  bloodGroup: string | null;
  /** Hospitals must be admin-verified before they may touch stock or patients. */
  isVerified: boolean;
  pushToken: string | null;
  /** The desk this staff member covers. A free string here, not the enum: the
   *  route validates it, so an unknown value cannot reach the row either way,
   *  and an old value stays readable if the catalogue ever changes. */
  station: string | null;
  /** Free-text ward or unit, only meaningful when `station` is `ward`. */
  wardLabel: string | null;
  /**
   * SHA-256 of the identity pass currently shown on this user's profile.
   *
   * The raw secret is generated on the device and never reaches the server, so a
   * database reader cannot mint a pass. Issuing a new one overwrites both fields,
   * which retires the previous pass immediately.
   */
  passTokenHash: string | null;
  passTokenExpiresAt: Date | null;
  /** Last account to resolve this pass, for the staff-side audit trail. */
  passLastScanBy: Types.ObjectId | null;
  passLastScanAt: Date | null;
  /**
   * Profile picture path, relative to the API origin.
   *
   * A path rather than a full URL so the origin is a deployment decision: the
   * client builds it from the same base it already uses for API calls. Every
   * upload renames its target, so this changes on every save and never serves a
   * stale cached file.
   */
  avatarUrl: string | null;
  /** bcrypt digest. Never leaves the server. */
  passwordHash: string;
  /** Consecutive failed sign-ins, reset on success. Drives the lockout. */
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserDoc = HydratedDocument<UserDocument>;

const userSchema = new Schema<UserDocument>(
  {
    role: { type: String, enum: USER_ROLES, required: true },
    fullName: { type: String, required: true, trim: true },

    email: { type: String, default: null, trim: true, lowercase: true },
    mobile: { type: String, default: null, trim: true },

    district: { type: String, default: null },
    registrationNumber: { type: String, default: null },
    bloodGroup: { type: String, default: null },

    isVerified: { type: Boolean, default: false },
    pushToken: { type: String, default: null },

    station: { type: String, default: null },
    wardLabel: { type: String, default: null, trim: true },

    passTokenHash: { type: String, default: null, select: false },
    passTokenExpiresAt: { type: Date, default: null },
    passLastScanBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    passLastScanAt: { type: Date, default: null },

    avatarUrl: { type: String, default: null },

    passwordHash: { type: String, required: true, select: false },

    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
);

// Partial unique indexes, not plain ones: a hospital may have no email and a
// donor may sign up by mobile alone, so several documents legitimately hold null.
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } }, name: "email_unique" },
);

userSchema.index(
  { mobile: 1 },
  { unique: true, partialFilterExpression: { mobile: { $type: "string" } }, name: "mobile_unique" },
);

userSchema.index({ role: 1, isVerified: 1 }, { name: "role_verified" });

// Resolving a scanned pass is a lookup by hash, and most accounts have never
// issued one — sparse keeps those documents out of the index entirely.
userSchema.index({ passTokenHash: 1 }, { sparse: true, name: "pass_token_hash" });

applyJsonTransform(userSchema);

export const User = model<UserDocument>("User", userSchema);
