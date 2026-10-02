/**
 * User lookups.
 *
 * Identifiers are normalised before every query, so `+94 77 123 4567`,
 * `0771234567` and `077 123 4567` all resolve to the same account.
 */

import { db } from "../db";
import { normalizeContact } from "./contact";
import type { UserRow } from "../types";

export function findUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

/**
 * Looks a user up by email address or mobile number. Returns `undefined` for a
 * value that is neither, so a malformed identifier cannot match anything.
 */
export function findUserByIdentifier(identifier: string): UserRow | undefined {
  const normalized = normalizeContact(identifier);

  if (normalized === null) {
    return undefined;
  }

  return db
    .prepare("SELECT * FROM users WHERE email = ? OR mobile = ?")
    .get(normalized, normalized) as UserRow | undefined;
}

/**
 * Splits a normalised identifier into the column it belongs in. An email
 * contains `@`; a mobile never does.
 */
export function identifierToColumns(identifier: string): {
  email: string | null;
  mobile: string | null;
} {
  const normalized = normalizeContact(identifier);

  if (normalized === null) {
    return { email: null, mobile: null };
  }

  return normalized.includes("@")
    ? { email: normalized, mobile: null }
    : { email: null, mobile: normalized };
}
