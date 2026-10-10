/**
 * Per-role dashboard data.
 *
 * `GetDashboardSummary` provides the role, the stat cards and (for donors)
 * availability state; the request list is appended by the role-appropriate
 * list query so every dashboard screen keeps receiving `requests`.
 */

import { ApiError } from "@/services/api/errors";
import { loadSession } from "@/services/auth/session";
import type { UserRole } from "@/services/auth/types";
import { toApiError } from "@/services/dataconnect/errors";
import { app, USE_EMULATORS } from "@/services/firebase";
import {
    listEmergencyRequests,
    type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import {
    getDashboardSummary as fetchDashboardSummary,
    deleteDonorAvailability as removeAvailability,
    setDonorAvailability as writeAvailability,
} from "@dataconnect/generated";
import { getFunctions, httpsCallable } from "firebase/functions";

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
  requests: EmergencyRequest[];
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

/** Narrows the summary row returned by `GetDashboardSummary`. */
function readSummary(value: unknown): Pick<DashboardSummary, "role" | "stats" | "availability"> | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as {
    role?: unknown;
    stats?: unknown;
    availability?: unknown;
  };

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

  const availabilitySource = candidate.availability;

  const availability: DonorAvailability | null =
    typeof availabilitySource === "object" && availabilitySource !== null
      ? {
          isAvailable: (availabilitySource as { isAvailable?: unknown }).isAvailable === true,
          lastDonationAt:
            typeof (availabilitySource as { lastDonationAt?: unknown }).lastDonationAt === "string"
              ? (availabilitySource as { lastDonationAt?: unknown }).lastDonationAt as string
              : null,
          recordExists:
            (availabilitySource as { recordExists?: unknown }).recordExists === true,
        }
      : null;

  return { role: candidate.role, stats, availability };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const session = await loadSession();

    if (session === null) {
      throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
    }

    const [summaryResult, requests] = await Promise.all([
      fetchDashboardSummary(),
      listEmergencyRequests(),
    ]);

    const summary = readSummary(summaryResult.data.summary);

    if (summary === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return { ...summary, requests };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function setDonorAvailability(isAvailable: boolean): Promise<DonorAvailability> {
  try {
    const { data } = await writeAvailability({
      isAvailable,
      lastDonationAt: null,
      hasLastDonation: false,
    });

    const row = data.availability as { lastDonationAt?: unknown } | null | undefined;

    if (row === null || row === undefined) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    // Sync availability to Firestore push_tokens so the notifyDonors function
    // respects paused donors — non-blocking, and skipped entirely in emulator
    // mode where that function cannot exist.
    if (!USE_EMULATORS) {
      void (async () => {
        try {
          const fns = getFunctions(app);
          const update = httpsCallable(fns, "updateTokenAvailability");
          await update({ isAvailable });
        } catch {
          // Best-effort; Data Connect is the source of truth for availability
        }
      })();
    }

    return {
      isAvailable,
      lastDonationAt: typeof row.lastDonationAt === "string" ? row.lastDonationAt : null,
      recordExists: true,
    };
  } catch (error) {
    throw toApiError(error);
  }
}

export async function deleteDonorAvailability(): Promise<DonorAvailability> {
  try {
    await removeAvailability();
    return { isAvailable: false, lastDonationAt: null, recordExists: false };
  } catch (error) {
    throw toApiError(error);
  }
}