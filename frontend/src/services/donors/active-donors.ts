/**
 * Active-donor statistics shown on the login screen.
 *
 * Feeds off the PUBLIC `GET /donors/stats` route: available donors come back as
 * `fullName` + `district`, and this module derives the headline count, the
 * provinces they cover and the monogram avatars from those rows. A failed fetch
 * degrades to an empty summary — the card is reassurance, not a UX blocker.
 */

import { provinceOf } from "@/constants/districts";
import { apiRequest } from "@/services/api/client";
import { personInitials } from "@/utils/initials";

export type ActiveDonorsSummary = {
  /** Headline count, e.g. 12480. */
  total: number;
  /** Provinces donors are currently covering. */
  provinces: string[];
  /** Initials of the overlapping avatars; no real donor photos are used. */
  avatarInitials: string[];
  updatedAt: string;
};

export async function getActiveDonors(): Promise<ActiveDonorsSummary> {
  const empty: ActiveDonorsSummary = {
    total: 0,
    provinces: [],
    avatarInitials: [],
    updatedAt: new Date(0).toISOString(),
  };

  try {
    const { donors } = await apiRequest<{ donors: unknown }>("/donors/stats", { auth: false });
    const list = Array.isArray(donors) ? donors : [];

    const provinces = new Set<string>();
    const avatarInitials: string[] = [];

    for (const row of list) {
      if (typeof row !== "object" || row === null) {
        continue;
      }

      const donor = row as { fullName?: unknown; district?: unknown };

      if (typeof donor.fullName === "string") {
        const initials = personInitials(donor.fullName);

        if (initials !== null) {
          avatarInitials.push(initials);
        }
      }

      const province = provinceOf(typeof donor.district === "string" ? donor.district : null);

      if (province !== null) {
        provinces.add(province);
      }
    }

    return {
      total: list.length,
      provinces: Array.from(provinces),
      avatarInitials,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return empty;
  }
}

/** Formats a count the way the card headline reads: `12,480+`. */
export function formatDonorCount(total: number): string {
  return `${total.toLocaleString("en-US")}+`;
}

/**
 * How many provinces are named before the line is summarised.
 *
 * Full coverage is nine provinces — far more than fits on one line of the card.
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
