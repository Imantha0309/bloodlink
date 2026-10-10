/**
 * The desk a staff member is covering.
 *
 * Deliberately not a permission system. A shift swap is a fact about right now,
 * so the station is self-declared and stored on the user row — which is why
 * `readStationAssignment` is a pure function over the session rather than a
 * fetch. `AuthUser.station` arrives as a plain string, because the wire type
 * cannot promise it is one this build knows about.
 */

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";

export const STAFF_STATIONS = ["reception", "ward", "laboratory", "donation", "dispatch"] as const;

export type StaffStation = (typeof STAFF_STATIONS)[number];

export type StationMeta = {
  id: StaffStation;
  label: string;
  detail: string;
};

/** The desks offered on the picker, in the order they are shown. */
export const STATION_CATALOGUE: readonly StationMeta[] = [
  {
    id: "reception",
    label: "Reception",
    detail: "Register donors and take walk-in requests.",
  },
  {
    id: "ward",
    label: "Ward or unit",
    detail: "Collect on a specific ward — name it below.",
  },
  {
    id: "laboratory",
    label: "Laboratory",
    detail: "Crossmatching and component processing.",
  },
  {
    id: "donation",
    label: "Donation floor",
    detail: "Whole-blood and apheresis collection.",
  },
  {
    id: "dispatch",
    label: "Dispatch",
    detail: "Issue units and route them out to wards.",
  },
];

export type StationAssignment = {
  station: StaffStation;
  wardLabel: string | null;
};

function isStaffStation(value: unknown): value is StaffStation {
  return typeof value === "string" && (STAFF_STATIONS as readonly string[]).includes(value);
}

/**
 * Narrows the two fields off the session, or `null` when no station is set.
 *
 * A stored value this build no longer recognises reads as "not set" rather than
 * being rendered: the catalogue is a fixed list, and showing a raw id on the
 * picker would be worse than asking again.
 */
export function readStationAssignment(
  station: unknown,
  wardLabel: unknown,
): StationAssignment | null {
  if (!isStaffStation(station)) {
    return null;
  }

  const label = typeof wardLabel === "string" && wardLabel.length > 0 ? wardLabel : null;

  // Only the ward station carries a label; a stale one must not ride along.
  return { station, wardLabel: station === "ward" ? label : null };
}

/** Declares the caller's desk. The server rejects anyone who is not staff. */
export async function setMyStation(input: StationAssignment): Promise<StationAssignment> {
  try {
    const saved = await apiRequest<{ station?: unknown; wardLabel?: unknown }>(
      "/hospital/me/station",
      {
        method: "PUT",
        body: { station: input.station, wardLabel: input.wardLabel },
      },
    );

    return {
      station: isStaffStation(saved.station) ? saved.station : input.station,
      wardLabel: typeof saved.wardLabel === "string" ? saved.wardLabel : null,
    };
  } catch (error) {
    throw toApiError(error);
  }
}
