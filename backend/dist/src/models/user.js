"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const userSchema = new mongoose_1.Schema({
    role: { type: String, enum: shared_1.USER_ROLES, required: true },
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
    passLastScanBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
    passLastScanAt: { type: Date, default: null },
    avatarUrl: { type: String, default: null },
    passwordHash: { type: String, required: true, select: false },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
}, { timestamps: true });
// Partial unique indexes, not plain ones: a hospital may have no email and a
// donor may sign up by mobile alone, so several documents legitimately hold null.
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: "string" } }, name: "email_unique" });
userSchema.index({ mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: "string" } }, name: "mobile_unique" });
userSchema.index({ role: 1, isVerified: 1 }, { name: "role_verified" });
// Resolving a scanned pass is a lookup by hash, and most accounts have never
// issued one — sparse keeps those documents out of the index entirely.
userSchema.index({ passTokenHash: 1 }, { sparse: true, name: "pass_token_hash" });
(0, shared_1.applyJsonTransform)(userSchema);
exports.User = (0, mongoose_1.model)("User", userSchema);
