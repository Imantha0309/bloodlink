"use strict";
/**
 * A signed-in session.
 *
 * The token itself is a JWT the server can verify without a lookup; this record
 * exists so signing out can actually revoke it, and so an expiry shorter than
 * the token's own can be enforced. The TTL index lets MongoDB delete rows the
 * moment they lapse, so the collection never grows without bound.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = require("mongoose");
const sessionSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    tokenId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });
sessionSchema.index({ tokenId: 1 }, { unique: true, name: "token_id_unique" });
sessionSchema.index({ user: 1 }, { name: "by_user" });
// MongoDB removes the document once `expiresAt` passes.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "session_ttl" });
exports.Session = (0, mongoose_1.model)("Session", sessionSchema);
