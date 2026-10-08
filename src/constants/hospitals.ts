/**
 * Facilities an urgent request can be raised against.
 *
 * There is no facilities endpoint yet, so this list is a curated constant rather
 * than server data. `verified` reflects a real-world designation (a national or
 * teaching hospital with round-the-clock blood banking) — it is a claim about the
 * facility, not about the individual request, and drives the check mark and
 * caption on the request form.
 *
 * Replace with a fetched list once the facilities API lands; nothing else in the
 * app needs to change, since every consumer reads these fields.
 */

import type { District } from "@/constants/districts";

export type Hospital = {
  /** Stable id, used as the form value so renames do not corrupt saved drafts. */
  id: string;
  name: string;
  district: District;
  /** Shown with a check mark and a caption under the selected facility. */
  verified: boolean;
  /** Short supporting line under the field, e.g. its blood banking capability. */
  note: string;
};

export const HOSPITALS: readonly Hospital[] = [
  {
    id: "nhs_l",
    name: "National Hospital of Sri Lanka",
    district: "Colombo",
    verified: true,
    note: "Verified national medical facility with 24/7 cold storage",
  },
  {
    id: "lady_ridgeway",
    name: "Lady Ridgeway Hospital for Children",
    district: "Colombo",
    verified: true,
    note: "Verified teaching hospital with a paediatric blood bank",
  },
  {
    id: "sir_james_peiris",
    name: "Sir James Peiris Hospital",
    district: "Colombo",
    verified: false,
    note: "Municipal hospital — confirm stock before travelling",
  },
  {
    id: "kandy_teaching",
    name: "Kandy Teaching Hospital",
    district: "Kandy",
    verified: true,
    note: "Verified teaching hospital with 24/7 cold storage",
  },
  {
    id: "galle_general",
    name: "Galle General Hospital",
    district: "Galle",
    verified: true,
    note: "Verified regional blood bank",
  },
  {
    id: "anuradhapura_general",
    name: "Anuradhapura General Hospital",
    district: "Anuradhapura",
    verified: false,
    note: "Regional hospital — confirm stock before travelling",
  },
] as const;

/** Facility names, for `SelectField`, which selects over plain strings. */
export const HOSPITAL_NAMES: readonly string[] = HOSPITALS.map((hospital) => hospital.name);

/** Looks up a facility by name; `null` for free text that is not on the list. */
export function findHospitalByName(name: string | null): Hospital | null {
  if (name === null) {
    return null;
  }

  return HOSPITALS.find((hospital) => hospital.name === name) ?? null;
}