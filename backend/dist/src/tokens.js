"use strict";
/**
 * Session token signing.
 *
 * The token carries only two things: which user it is for (`sub`) and which
 * session row backs it (`jti`). The `jti` is what makes sign-out real — without
 * it a JWT stays valid until it expires, no matter what the server wants.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionExpiry = sessionExpiry;
exports.newTokenId = newTokenId;
exports.signSessionToken = signSessionToken;
exports.verifySessionToken = verifySessionToken;
const node_crypto_1 = require("node:crypto");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("./env");
/** When a session created now should lapse. */
function sessionExpiry(from = new Date()) {
    return new Date(from.getTime() + env_1.env.sessionTtlDays * 24 * 60 * 60 * 1000);
}
function newTokenId() {
    return (0, node_crypto_1.randomUUID)();
}
function signSessionToken(userId, tokenId, expiresAt) {
    const secondsRemaining = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    return jsonwebtoken_1.default.sign({ sub: userId }, env_1.env.jwtSecret, {
        jwtid: tokenId,
        expiresIn: secondsRemaining,
    });
}
/**
 * Verifies a token's signature and expiry.
 *
 * Returns `null` for anything malformed rather than throwing — every caller
 * treats "not a valid token" the same way, and a thrown decode error would only
 * be caught and converted back into that.
 */
function verifySessionToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        if (typeof decoded !== "object" || decoded === null) {
            return null;
        }
        const { sub, jti } = decoded;
        if (typeof sub !== "string" || typeof jti !== "string") {
            return null;
        }
        return { sub, jti };
    }
    catch {
        return null;
    }
}
