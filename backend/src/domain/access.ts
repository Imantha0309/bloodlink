/**
 * Who may do what.
 *
 * Every one of these was an `EXISTS (SELECT 1 FROM users WHERE ...)` clause in
 * the old SQL. They are collected here so the same rule cannot drift between the
 * six places that ask a version of it.
 */

import { fail } from "../http";
import type { UserDoc } from "../models/user";

/**
 * Hospital staff and admins.
 *
 * An unverified hospital is nobody: it cannot touch stock, patients or triage
 * until an admin approves it. `admin` bypasses the check entirely.
 */
export function isStaff(user: Pick<UserDoc, "role" | "isVerified">): boolean {
  return user.role === "admin" || (user.role === "hospital" && user.isVerified);
}

/** Throws unless the caller is verified staff. */
export function assertStaff(user: Pick<UserDoc, "role" | "isVerified">): void {
  if (!isStaff(user)) {
    throw fail.conflict("Your account is not cleared for hospital operations yet.");
  }
}

/**
 * Whether staff may manage a given bank.
 *
 * Admins manage every bank; a hospital is confined to its own district, so a
 * staff member at one facility cannot restock another's shelves.
 */
export function canManageBank(
  user: Pick<UserDoc, "role" | "isVerified" | "district">,
  bankDistrict: string,
): boolean {
  if (user.role === "admin") {
    return true;
  }

  return user.role === "hospital" && user.isVerified && user.district === bankDistrict;
}

export function assertCanManageBank(
  user: Pick<UserDoc, "role" | "isVerified" | "district">,
  bankDistrict: string,
): void {
  if (!canManageBank(user, bankDistrict)) {
    throw fail.conflict("That blood bank could not be found or is outside your district.");
  }
}

/** The caller owns this request outright. */
export function ownsRequest(
  user: Pick<UserDoc, "_id">,
  requesterId: unknown,
): boolean {
  return requesterId !== null && requesterId !== undefined && String(requesterId) === String(user._id);
}

/**
 * The district scope for everything a hospital reads or writes.
 *
 * An admin works the whole country; a verified hospital is confined to its own
 * district — its stock, its discrepancy log, its handover book and the triage
 * board it is actually standing at.
 *
 * A hospital with no district on file matches `district: null`, which is what
 * its own rows were stamped with, so it keeps seeing its own work rather than an
 * empty list.
 *
 * Returns a filter *fragment* rather than running the query, which is why the
 * call site composes it: `{ ...districtFilter(user), status: { $in: OPEN } }`.
 */
export function districtFilter(user: Pick<UserDoc, "role" | "district">): Record<string, unknown> {
  return user.role === "admin" ? {} : { district: user.district ?? null };
}
