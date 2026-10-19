"use strict";
/**
 * Authentication middleware.
 *
 * A token is only accepted if it verifies *and* the session row behind it still
 * exists and has not lapsed. That second check is what makes signing out take
 * effect immediately instead of whenever the token happens to expire.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAuth = void 0;
exports.bearerToken = bearerToken;
exports.resolveUser = resolveUser;
exports.currentUser = currentUser;
const http_1 = require("../http");
const session_1 = require("../models/session");
const user_1 = require("../models/user");
const tokens_1 = require("../tokens");
/** The `Authorization: Bearer <token>` value, or null. */
function bearerToken(req) {
    const header = req.header("authorization");
    if (!header) {
        return null;
    }
    const [scheme, value] = header.split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !value) {
        return null;
    }
    return value.trim();
}
/** Resolves a token to a live user, or null if it is unusable for any reason. */
async function resolveUser(token) {
    const claims = (0, tokens_1.verifySessionToken)(token);
    if (claims === null) {
        return null;
    }
    const session = await session_1.Session.findOne({
        tokenId: claims.jti,
        expiresAt: { $gt: new Date() },
    }).select("user");
    if (session === null || String(session.user) !== claims.sub) {
        return null;
    }
    return user_1.User.findById(claims.sub);
}
/** Rejects the request unless a valid session is presented. */
const requireAuth = (req, res, next) => {
    void (async () => {
        const token = bearerToken(req);
        if (token === null) {
            next(http_1.fail.unauthorized());
            return;
        }
        const user = await resolveUser(token);
        if (user === null) {
            next(http_1.fail.unauthorized());
            return;
        }
        req.user = user;
        next();
    })().catch(next);
};
exports.requireAuth = requireAuth;
/**
 * Attaches the user when a valid token is present and does nothing otherwise.
 *
 * Used by the endpoints the zero-login urgent path also reaches, where being
 * signed out is a legitimate state rather than a failure.
 */
const optionalAuth = (req, res, next) => {
    void (async () => {
        const token = bearerToken(req);
        if (token !== null) {
            const user = await resolveUser(token);
            if (user !== null) {
                req.user = user;
            }
        }
        next();
    })().catch(next);
};
exports.optionalAuth = optionalAuth;
/**
 * The signed-in user, or a failure.
 *
 * Route handlers run after `requireAuth`, so this is a cast with a real check
 * behind it rather than an assertion to be trusted blindly.
 */
function currentUser(req) {
    if (req.user === undefined) {
        throw http_1.fail.unauthorized();
    }
    return req.user;
}
