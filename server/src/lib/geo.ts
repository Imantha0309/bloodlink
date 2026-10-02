/**
 * Sri Lankan districts and their provinces.
 *
 * Mirrors `src/constants/districts.ts` in the app. Kept as a flat list plus a
 * lookup so the donors endpoint can report coverage by province rather than by
 * district.
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

export function provinceOf(district: string | null): string | null {
  if (district === null) {
    return null;
  }

  return district in PROVINCE_BY_DISTRICT
    ? PROVINCE_BY_DISTRICT[district as District]
    : null;
}

/** `"Nimal Perera"` → `"NP"`. Used for the donor-card monograms. */
export function initialsOf(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
