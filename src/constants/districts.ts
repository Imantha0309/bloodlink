/**
 * Sri Lankan districts and their provinces.
 *
 * Mirrors `server/src/lib/geo.ts`. Kept as a flat list for pickers plus a
 * province lookup so coverage can be summarised ("Western & Central Provinces")
 * rather than listing districts.
 */

export const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
] as const;

export type District = (typeof DISTRICTS)[number];

export function isDistrict(value: unknown): value is District {
  return typeof value === "string" && (DISTRICTS as readonly string[]).includes(value);
}

const PROVINCE_BY_DISTRICT: Record<District, string> = {
  Colombo: "Western",
  Gampaha: "Western",
  Kalutara: "Western",
  Kandy: "Central",
  Matale: "Central",
  "Nuwara Eliya": "Central",
  Galle: "Southern",
  Matara: "Southern",
  Hambantota: "Southern",
  Jaffna: "Northern",
  Kilinochchi: "Northern",
  Mannar: "Northern",
  Vavuniya: "Northern",
  Mullaitivu: "Northern",
  Batticaloa: "Eastern",
  Ampara: "Eastern",
  Trincomalee: "Eastern",
  Kurunegala: "North Western",
  Puttalam: "North Western",
  Anuradhapura: "North Central",
  Polonnaruwa: "North Central",
  Badulla: "Uva",
  Monaragala: "Uva",
  Ratnapura: "Sabaragamuwa",
  Kegalle: "Sabaragamuwa",
};

export function provinceOf(district: string | null | undefined): string | null {
  if (district === null || district === undefined) {
    return null;
  }

  return district in PROVINCE_BY_DISTRICT
    ? PROVINCE_BY_DISTRICT[district as District]
    : null;
}
