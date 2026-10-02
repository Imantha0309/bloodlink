/**
 * Active-donor statistics shown on the login screen.
 *
 * Static for now and deliberately isolated in its own module so the login UI
 * has no knowledge of where the numbers come from. Replace `getActiveDonors`
 * with a call to `GET /donors/stats` when the backend lands — the shape below
 * is the contract `ActiveDonorsCard` already consumes.
 */

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

const STATIC_SUMMARY: ActiveDonorsSummary = {
  total: 12480,
  provinces: ["Western", "Central"],
  avatarInitials: ["NK", "SA", "TM", "RD"],
  updatedAt: new Date(0).toISOString(),
};

/** Formats a count the way the card headline reads: `12,480+`. */
export function formatDonorCount(total: number): string {
  return `${total.toLocaleString("en-US")}+`;
}

export async function getActiveDonors(): Promise<ActiveDonorsSummary> {
  // TODO: replace with the real endpoint once the donors API exists.
  await new Promise((resolve) => {
    setTimeout(resolve, RESOLVE_LATENCY_MS);
  });

  return { ...STATIC_SUMMARY, updatedAt: new Date().toISOString() };
}

/** Short subtitle line, e.g. `Ready across Western & Central Provinces`. */
export function formatProvinces(provinces: string[]): string {
  if (provinces.length === 0) {
    return "Ready across Sri Lanka";
  }

  if (provinces.length === 1) {
    return `Ready across ${provinces[0]} Province`;
  }

  const last = provinces[provinces.length - 1];

  return `Ready across ${provinces.slice(0, -1).join(", ")} & ${last} Provinces`;
}