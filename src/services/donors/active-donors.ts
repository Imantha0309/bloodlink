/**
 * Active-donor statistics shown on the login screen.
 *
 * With a backend configured these come from `GET /donors/stats` and are real
 * aggregate numbers. Without one, a static summary is used so the card still
 * renders in offline/mock mode. Either way the login UI has no knowledge of
 * where the numbers come from.
 */

import { request } from "@/services/api/client";
import { hasRemoteApi } from "@/services/config";

export type ActiveDonorsSummary = {
  /** Headline count, e.g. 12480. */
  total: number;
  /** Provinces donors are currently covering. */
  provinces: string[];
  /** Initials of the overlapping avatars; no real donor photos are used. */
  avatarInitials: string[];
  updatedAt: string;
};

const RESOLVE_LATENCY_MS = 350;

/** Used only when no backend is configured. Clearly a placeholder figure. */
const OFFLINE_SUMMARY: ActiveDonorsSummary = {
  total: 0,
  provinces: [],
  avatarInitials: [],
  updatedAt: new Date(0).toISOString(),
};

/** Formats a count the way the card headline reads: `12,480+`. */
export function formatDonorCount(total: number): string {
  return `${total.toLocaleString("en-US")}+`;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function readSummary(body: unknown): ActiveDonorsSummary | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }

  const candidate = body as Partial<ActiveDonorsSummary>;

  if (typeof candidate.total !== "number") {
    return null;
  }

  return {
    total: candidate.total,
    provinces: readStringArray(candidate.provinces),
    avatarInitials: readStringArray(candidate.avatarInitials),
    updatedAt:
      typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
  };
}

export async function getActiveDonors(): Promise<ActiveDonorsSummary> {
  if (!hasRemoteApi) {
    await new Promise((resolve) => {
      setTimeout(resolve, RESOLVE_LATENCY_MS);
    });

    return { ...OFFLINE_SUMMARY, updatedAt: new Date().toISOString() };
  }

  try {
    const summary = readSummary(await request<unknown>("/donors/stats", { anonymous: true }));

    if (summary !== null) {
      return summary;
    }
  } catch {
    // The card is reassurance, not information the user acts on. A failed
    // fetch must not turn the sign-in screen into an error state, so it falls
    // through to the placeholder rather than surfacing.
  }

  return { ...OFFLINE_SUMMARY, updatedAt: new Date().toISOString() };
}

/**
 * How many provinces are named before the line is summarised.
 *
 * The server reports every province with a donor online, which is nine of the
 * nine at full coverage — far more than fits on one line of the card.
 */
const PROVINCE_LIMIT = 3;

/** Short subtitle line, e.g. `Ready across Western & Central Provinces`. */
export function formatProvinces(provinces: string[]): string {
  if (provinces.length === 0) {
    return "Ready across Sri Lanka";
  }

  const named = provinces.slice(0, PROVINCE_LIMIT);
  const last = named[named.length - 1];

  const list = named.length === 1 ? last : `${named.slice(0, -1).join(", ")} & ${last}`;
  const remainder = provinces.length - named.length;
  const suffix = remainder > 0 ? ` +${remainder} more` : "";

  return `Ready across ${list} ${named.length === 1 ? "Province" : "Provinces"}${suffix}`;
}
