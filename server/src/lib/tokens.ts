/**
 * Session and reset tokens.
 *
 * Tokens are opaque random strings. Only their SHA-256 hash is persisted, so
 * reading the database does not yield anything a client could authenticate
 * with. Opaque tokens were chosen over a JWT because they need no dependency
 * and can be revoked on sign-out — which matters for medical data.
 */

import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

const TOKEN_BYTES = 32;

/** A token to hand to the client. Never stored in this form. */
export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/** What actually goes in the database. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * A 6-digit numeric reset code. `randomInt` is CSPRNG-backed and avoids the
 * modulo bias of `Math.random`.
 */
export function generateResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}
