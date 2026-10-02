/**
 * Blood groups.
 *
 * Ordered by the convention used on Sri Lankan donor forms (ABO major type,
 * Rh positive before negative) rather than alphabetically, so the picker reads
 * the way a donor expects.
 */

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export function isBloodGroup(value: unknown): value is BloodGroup {
  return typeof value === "string" && (BLOOD_GROUPS as readonly string[]).includes(value);
}

/**
 * Recipient blood groups that a donor of the given group can give to.
 *
 * Mirrors `CAN_DONATE_TO` in the server's dashboard route. Duplicated because
 * the client needs it to explain *why* a request was matched, while the server
 * remains the authority on what is actually returned.
 */
export const CAN_DONATE_TO: Record<BloodGroup, readonly BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/** `"O-"` → `"Universal donor"`, shown as a hint under the picker. */
export const BLOOD_GROUP_NOTES: Partial<Record<BloodGroup, string>> = {
  "O-": "Universal donor — can be given to any patient",
  "AB+": "Universal recipient — can receive from any donor",
};
