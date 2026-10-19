"use strict";
/**
 * A password-reset token.
 *
 * Only the SHA-256 digest is stored; the raw token lives in the link that is
 * emailed (or, in development, printed to the server console). A reset token
 * that leaks from the database is therefore useless.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordReset = void 0;
const mongoose_1 = require("mongoose");
const passwordResetSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
}, { timestamps: true });
passwordResetSchema.index({ tokenHash: 1 }, { unique: true, name: "token_hash_unique" });
passwordResetSchema.index({ user: 1 }, { name: "by_user" });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "reset_ttl" });
exports.PasswordReset = (0, mongoose_1.model)("PasswordReset", passwordResetSchema);
