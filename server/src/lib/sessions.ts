/**
 * Session lifecycle.
 *
 * Only the token's hash is stored; the plaintext token is returned to the
 * caller exactly once, at issue time.
 */

import { SESSION_TTL_MS } from "../config";
import { db, now } from "../db";
import { generateId, generateToken, hashToken } from "./tokens";
import { toAuthUser, type AuthSessionPayload, type UserRow } from "../types";

export function issueSession(user: UserRow): AuthSessionPayload {
  const token = generateToken();
  const issuedAt = now();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(generateId("ses"), user.id, hashToken(token), issuedAt, expiresAt);

  return { token, expiresAt, user: toAuthUser(user) };
}

export function revokeSession(sessionId: string): void {
  db.prepare("UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL").run(
    now(),
    sessionId,
  );
}

/** Used by the reset flow to force every device to sign in again. */
export function revokeAllSessionsForUser(userId: string): void {
  db.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL").run(
    now(),
    userId,
  );
}
