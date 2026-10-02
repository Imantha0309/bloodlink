/**
 * Password hashing.
 *
 * Uses `scrypt` from `node:crypto` rather than bcrypt/argon2: it is memory-hard,
 * ships with Node, and needs no native build step — which matters on Windows,
 * where a node-gyp fallback would otherwise be required.
 *
 * Stored format: `scrypt$N$r$p$<salt-b64>$<hash-b64>`
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
) => Promise<Buffer>;

/** Cost parameters. N=16384 needs ~16MB, comfortably inside Node's 32MB cap. */
const PARAMS = { N: 16384, r: 8, p: 1 } as const;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/** Minimum password policy, mirrored by the app's validation. */
export const PASSWORD_MIN_LENGTH = 8;

export function isPasswordAcceptable(password: string): boolean {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password, salt, KEY_LENGTH, PARAMS);

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

/**
 * Constant-time verification. Returns `false` for a malformed stored value
 * rather than throwing, so one bad row cannot 500 the sign-in endpoint.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");

  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, rawN, rawR, rawP, rawSalt, rawHash] = parts;

  const N = Number.parseInt(rawN ?? "", 10);
  const r = Number.parseInt(rawR ?? "", 10);
  const p = Number.parseInt(rawP ?? "", 10);

  if (Number.isNaN(N) || Number.isNaN(r) || Number.isNaN(p)) {
    return false;
  }

  const salt = Buffer.from(rawSalt ?? "", "base64");
  const expected = Buffer.from(rawHash ?? "", "base64");

  if (salt.length === 0 || expected.length === 0) {
    return false;
  }

  const derived = await scrypt(password, salt, expected.length, { N, r, p });

  // Lengths match by construction, but `timingSafeEqual` throws if they differ.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
