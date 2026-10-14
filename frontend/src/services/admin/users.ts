/**
 * Account administration.
 *
 * Admin-only, and the server enforces it: a non-admin calling any of these gets
 * a conflict rather than an empty list, so "not allowed" never looks like
 * "nothing here". Verification is the action that matters — `isVerified` is the
 * flag every staff-only operation gates on.
 */

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import { USER_ROLES, type UserRole } from "@/services/auth/types";

/**
 * A row in the admin account table.
 *
 * The id is `uid` rather than `id`, which is what the screen reads. Note this is
 * the only place the app sees `registrationNumber` — approving a hospital means
 * checking the number it registered with.
 */
export type AdminUser = {
  uid: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district: string | null;
  bloodGroup: string | null;
  registrationNumber: string | null;
  isVerified: boolean;
  createdAt: string;
};

export type AdminUserQuery = {
  /** `null` for every role. */
  role: UserRole | null;
  search: string;
};

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Narrows one account row; malformed rows are dropped rather than trusted. */
export function readAdminUser(row: unknown): AdminUser | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<AdminUser>;

  if (
    typeof candidate.uid !== "string" ||
    !isRole(candidate.role) ||
    typeof candidate.fullName !== "string" ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    uid: candidate.uid,
    role: candidate.role,
    fullName: candidate.fullName,
    email: readText(candidate.email),
    mobile: readText(candidate.mobile),
    district: readText(candidate.district),
    bloodGroup: readText(candidate.bloodGroup),
    registrationNumber: readText(candidate.registrationNumber),
    isVerified: candidate.isVerified === true,
    createdAt: candidate.createdAt,
  };
}

/** The account table, filtered by role and by a name/email/mobile search. */
export async function listUsers(query: AdminUserQuery): Promise<AdminUser[]> {
  try {
    const { users } = await apiRequest<{ users: unknown }>("/admin/users", {
      query: {
        role: query.role,
        search: query.search.trim().length > 0 ? query.search.trim() : null,
      },
    });

    if (!Array.isArray(users)) {
      return [];
    }

    const parsed: AdminUser[] = [];

    for (const row of users) {
      const user = readAdminUser(row);

      if (user !== null) {
        parsed.push(user);
      }
    }

    return parsed;
  } catch (error) {
    throw toApiError(error);
  }
}

/** Approves or revokes a hospital account. */
export async function setUserVerification(
  uid: string,
  isVerified: boolean,
): Promise<{ isVerified: boolean }> {
  try {
    const { user } = await apiRequest<{ user: unknown }>(`/admin/users/${uid}/verification`, {
      method: "PATCH",
      body: { isVerified },
    });

    const saved = readAdminUser(user);

    return { isVerified: saved?.isVerified ?? isVerified };
  } catch (error) {
    throw toApiError(error, "Could not update that account.");
  }
}

export async function setUserRole(uid: string, role: UserRole): Promise<{ role: UserRole }> {
  try {
    const { user } = await apiRequest<{ user: unknown }>(`/admin/users/${uid}/role`, {
      method: "PATCH",
      body: { role },
    });

    const saved = readAdminUser(user);

    return { role: saved?.role ?? role };
  } catch (error) {
    throw toApiError(error, "Could not update that account.");
  }
}
