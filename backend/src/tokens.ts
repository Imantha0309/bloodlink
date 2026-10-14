/**
 * Session token signing.
 *
 * The token carries only two things: which user it is for (`sub`) and which
 * session row backs it (`jti`). The `jti` is what makes sign-out real — without
 * it a JWT stays valid until it expires, no matter what the server wants.
 */

import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "./env";

export type SessionTokenClaims = {
  /** The user's id. */
  sub: string;
  /** The session row's `tokenId`. */
  jti: string;
};

/** When a session created now should lapse. */
export function sessionExpiry(from: Date = new Date()): Date {
  return new Date(from.getTime() + env.sessionTtlDays * 24 * 60 * 60 * 1000);
}

export function newTokenId(): string {
  return randomUUID();
}

export function signSessionToken(userId: string, tokenId: string, expiresAt: Date): string {
  const secondsRemaining = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

  return jwt.sign({ sub: userId }, env.jwtSecret, {
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
export function verifySessionToken(token: string): SessionTokenClaims | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }

    const { sub, jti } = decoded as { sub?: unknown; jti?: unknown };

    if (typeof sub !== "string" || typeof jti !== "string") {
      return null;
    }

    return { sub, jti };
  } catch {
    return null;
  }
}
