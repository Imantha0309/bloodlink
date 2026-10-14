/**
 * Per-role dashboard data.
 *
 * `GET /dashboard/me` provides the role, the stat cards and (for donors)
 * availability state; the request lists are appended here so every dashboard
 * screen keeps receiving `requests`. A donor-eligible recipient — a patient who
 * has set a blood group — also receives `availableRequests`, the compatible open
 * feed their Donate tab shows, which is a different list from their own.
 */

import { ApiError } from "@/services/api/errors";
import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import { loadSession } from "@/services/auth/session";
import type { UserRole } from "@/services/auth/types";
import {
    listEmergencyRequests,
    type EmergencyRequest,
} from "@/services/requests/emergency-requests";

export type DashboardStat = {
  key: string;
  label: string;
  value: string;
  hint: string | null;
};

export type DonorAvailability = {
  isAvailable: boolean;
  lastDonationAt: string | null;
  recordExists: boolean;
};

export type DashboardSummary = {
  role: UserRole;
  stats: DashboardStat[];
  /**
   * The role-appropriate list: a donor's compatible open feed, a hospital's
   * district triage queue, and — for a recipient — the requests they raised.
   */
  requests: EmergencyRequest[];
  /**
   * The compatible open feed, for a recipient who has set a blood group and is
   * therefore also donor-eligible. That is a *different* list from their own
   * requests, so the Donate tab reads this one. Empty for every other role.
   */
  availableRequests: EmergencyRequest[];
  /** Donors only; `null` for every other role. */
  availability: DonorAvailability | null;
};

function readStat(row: unknown): DashboardStat | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<DashboardStat>;

  if (
    typeof candidate.key !== "string" ||
    typeof candidate.label !== "string" ||
    typeof candidate.value !== "string"
  ) {
    return null;
  }

  return {
    key: candidate.key,
    label: candidate.label,
    value: candidate.value,
    hint: typeof candidate.hint === "string" ? candidate.hint : null,
  };
}

function isRole(value: unknown): value is UserRole {
  return value === "recipient" || value === "donor" || value === "hospital" || value === "admin";
}

/** Narrows the availability object, which is absent for most roles. */
function readAvailability(value: unknown): DonorAvailability | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as { isAvailable?: unknown; lastDonationAt?: unknown; recordExists?: unknown };

  return {
    isAvailable: candidate.isAvailable === true,
    lastDonationAt: typeof candidate.lastDonationAt === "string" ? candidate.lastDonationAt : null,
    recordExists: candidate.recordExists === true,
  };
}

/** Narrows the summary row returned by `GET /dashboard/me`. */
function readSummary(value: unknown): Pick<DashboardSummary, "role" | "stats" | "availability"> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as { role?: unknown; stats?: unknown; availability?: unknown };

  if (!isRole(candidate.role) || !Array.isArray(candidate.stats)) {
    return null;
  }

  const stats: DashboardStat[] = [];

  for (const row of candidate.stats) {
    const stat = readStat(row);

    if (stat !== null) {
      stats.push(stat);
    }
  }

  return { role: candidate.role, stats, availability: readAvailability(candidate.availability) };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const session = await loadSession();

    if (session === null) {
      throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
    }

    // A recipient with a blood group is a donor too, and their dashboard has
    // both lists on it: the requests they raised, and the open requests their
    // blood can serve. Every other role has exactly one.
    const isRecipient = session.user.role === "recipient";
    const donorEligibleRecipient = isRecipient && session.user.isDonorEligible;

    const [summaryResult, requests, availableRequests] = await Promise.all([
      apiRequest<{ summary: unknown }>("/dashboard/me"),
      listEmergencyRequests({ mine: isRecipient }),
      donorEligibleRecipient ? listEmergencyRequests() : Promise.resolve<EmergencyRequest[]>([]),
    ]);

    const summary = readSummary(summaryResult.summary);

    if (summary === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return { ...summary, requests, availableRequests };
  } catch (error) {
    throw toApiError(error);
  }
}

/**
 * The donor's switch.
 *
 * Pausing also drops them from dispatch, which the server handles in the same
 * write — there is no longer a second call to keep push tokens in step.
 */
export async function setDonorAvailability(isAvailable: boolean): Promise<DonorAvailability> {
  try {
    const { availability } = await apiRequest<{ availability: unknown }>("/donors/me/availability", {
      method: "PUT",
      body: { isAvailable, lastDonationAt: null, hasLastDonation: false },
    });

    const row = readAvailability(availability);

    if (row === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return row;
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteDonorAvailability(): Promise<DonorAvailability> {
  try {
    await apiRequest<unknown>("/donors/me/availability", { method: "DELETE" });

    return { isAvailable: false, lastDonationAt: null, recordExists: false };
  } catch (error) {
    throw toApiError(error);
  }
}
