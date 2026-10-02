/**
 * Bearer-token authentication.
 *
 * `requireAuth` rejects unauthenticated requests; `optionalAuth` attaches the
 * user when a valid token is present but lets the request through either way —
 * the emergency-request endpoint needs to serve both signed-in and anonymous
 * callers.
 */

import type { NextFunction, Request, Response } from "express";

import { db, now } from "../db";
import { ApiError } from "../lib/errors";
import { hashToken } from "../lib/tokens";
import type { SessionRow, UserRow } from "../types";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserRow;
      session?: SessionRow;
    }
  }
}

type Resolved = { user: UserRow; session: SessionRow };

/** Reads the bearer token, or `null` when the header is absent/malformed. */
function readBearerToken(request: Request): string | null {
  const header = request.header("authorization");

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

/**
 * Looks up the session behind a token. Expired and revoked sessions are
 * rejected, and the user must still be unlocked.
 */
function resolveSession(token: string): Resolved | null {
  const session = db
    .prepare(
      `SELECT * FROM sessions
        WHERE token_hash = ?
          AND revoked_at IS NULL
          AND expires_at > ?`,
    )
    .get(hashToken(token), now()) as SessionRow | undefined;

  if (!session) {
    return null;
  }

  const user = db
    .prepare("SELECT * FROM users WHERE id = ?")
    .get(session.user_id) as UserRow | undefined;

  if (!user || user.is_locked === 1) {
    return null;
  }

  return { user, session };
}

export function requireAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = readBearerToken(request);
  const resolved = token === null ? null : resolveSession(token);

  if (resolved === null) {
    next(new ApiError("unauthorized", "Your session has expired. Please sign in again."));
    return;
  }

  request.user = resolved.user;
  request.session = resolved.session;
  next();
}

export function optionalAuth(request: Request, _response: Response, next: NextFunction): void {
  const token = readBearerToken(request);
  const resolved = token === null ? null : resolveSession(token);

  if (resolved !== null) {
    request.user = resolved.user;
    request.session = resolved.session;
  }

  next();
}
