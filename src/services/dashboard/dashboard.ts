/**
 * Per-role dashboard data.
 *
 * One endpoint feeds all four role screens: the server decides what each role
 * may see, so the client never filters for authorization — only for layout.
 */

import { request } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";
import { loadSession } from "@/services/auth/session";
import type { UserRole } from "@/services/auth/types";
import { hasRemoteApi } from "@/services/config";
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
};

export type DashboardSummary = {
  role: UserRole;
  stats: DashboardStat[];
  requests: EmergencyRequest[];
  /** Donors only; `null` for every other role. */
  availability: DonorAvailability | null;
};

/** Availability state when running without a backend. */
let offlineAvailability: DonorAvailability = { isAvailable: true, lastDonationAt: null };

function readSummary(body: unknown): DashboardSummary | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const candidate = body as Partial<DashboardSummary>;

  if (typeof candidate.role !== "string" || !Array.isArray(candidate.stats)) {
    return null;
  }

  return {
    role: candidate.role as UserRole,
    stats: candidate.stats as DashboardStat[],
    requests: Array.isArray(candidate.requests)
      ? (candidate.requests as EmergencyRequest[])
      : [],
    availability: candidate.availability ?? null,
  };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  if (hasRemoteApi) {
    const summary = readSummary(await request<unknown>("/dashboard/me"));

    if (summary === null) {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return summary;
  }

  // Offline: build a summary from whatever the mock services know about.
  const session = await loadSession();
  const role: UserRole = session?.user.role ?? "recipient";
  const requests = await listEmergencyRequests();

  const open = requests.filter(
    (item) => item.status === "pending" || item.status === "verified",
  ).length;
  const critical = requests.filter((item) => item.urgency === "critical").length;

  const stats: DashboardStat[] =
    role === "donor"
      ? [
          {
            key: "availability",
            label: "Your availability",
            value: offlineAvailability.isAvailable ? "Active" : "Paused",
            hint: offlineAvailability.isAvailable
              ? "You are receiving alerts"
              : "You are hidden from dispatch",
          },
          {
            key: "matching",
            label: "Matching requests",
            value: String(open),
            hint: session?.user.bloodGroup ? `Compatible with ${session.user.bloodGroup}` : null,
          },
          { key: "open", label: "Open nationwide", value: String(open), hint: "Awaiting a donor" },
        ]
      : [
          { key: "open", label: "Open requests", value: String(open), hint: "Being matched" },
          { key: "critical", label: "Critical", value: String(critical), hint: "Highest priority" },
          { key: "total", label: "Total logged", value: String(requests.length), hint: "All time" },
        ];

  return {
    role,
    stats,
    requests,
    availability: role === "donor" ? offlineAvailability : null,
  };
}

export async function setDonorAvailability(isAvailable: boolean): Promise<DonorAvailability> {
  if (!hasRemoteApi) {
    offlineAvailability = { ...offlineAvailability, isAvailable };

    return offlineAvailability;
  }

  const body = await request<{ availability?: DonorAvailability }>("/donors/me/availability", {
    method: "PUT",
    body: { isAvailable },
  });

  if (!body.availability) {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return body.availability;
}
