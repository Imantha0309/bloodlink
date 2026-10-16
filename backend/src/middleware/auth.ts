/**
 * Authentication middleware.
 *
 * A token is only accepted if it verifies *and* the session row behind it still
 * exists and has not lapsed. That second check is what makes signing out take
 * effect immediately instead of whenever the token happens to expire.
 */

import type { Request, RequestHandler } from "express";

import { fail } from "../http";
import { Session } from "../models/session";
import { User, type UserDoc } from "../models/user";
import { verifySessionToken } from "../tokens";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Present once `requireAuth` has run; absent for anonymous callers. */
      user?: UserDoc;
    }
  }
}

/** The `Authorization: Bearer <token>` value, or null. */
export function bearerToken(req: Request): string | null {
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
export async function resolveUser(token: string): Promise<UserDoc | null> {
  const claims = verifySessionToken(token);

  if (claims === null) {
    return null;
  }

  const session = await Session.findOne({
    tokenId: claims.jti,
    expiresAt: { $gt: new Date() },
  }).select("user");

  if (session === null || String(session.user) !== claims.sub) {
    return null;
  }

  return User.findById(claims.sub);
}

/** Rejects the request unless a valid session is presented. */
export const requireAuth: RequestHandler = (req, res, next) => {
  void (async () => {
    const token = bearerToken(req);

    if (token === null) {
      next(fail.unauthorized());
      return;
    }

    const user = await resolveUser(token);

    if (user === null) {
      next(fail.unauthorized());
      return;
    }

    req.user = user;
    next();
  })().catch(next);
};

/**
 * Attaches the user when a valid token is present and does nothing otherwise.
 *
 * Used by the endpoints the zero-login urgent path also reaches, where being
 * signed out is a legitimate state rather than a failure.
 */
export const optionalAuth: RequestHandler = (req, res, next) => {
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

/**
 * The signed-in user, or a failure.
 *
 * Route handlers run after `requireAuth`, so this is a cast with a real check
 * behind it rather than an assertion to be trusted blindly.
 */
export function currentUser(req: Request): UserDoc {
  if (req.user === undefined) {
    throw fail.unauthorized();
  }

  return req.user;
}
