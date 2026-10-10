/**
 * Blood-group compatibility.
 *
 * There are **two** maps here and they are inverses of each other. Getting them
 * backwards is the single easiest mistake in this codebase, so each is named for
 * the question it answers rather than for the blood group it is keyed by.
 *
 * The pair was duplicated in four SQL statements in the old schema; every copy
 * said the same thing, and these two functions are now the only definition.
 */

export const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export function isBloodGroup(value: unknown): value is BloodGroup {
  return typeof value === "string" && (BLOOD_GROUPS as readonly string[]).includes(value);
}

/**
 * Donor groups that can give to a patient who needs `group`.
 *
 * Read it as "the patient needs `group`, so call these donors".
 * A patient who can receive everything (AB+) accepts all eight.
 */
const DONORS_FOR_RECIPIENT: Record<BloodGroup, readonly BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * Request groups a donor with `group` is able to serve.
 *
 * Read it as "this donor has `group`, so show them these requests".
 * An O- donor can give to anybody, so they see all eight.
 */
const REQUESTS_FOR_DONOR: Record<BloodGroup, readonly BloodGroup[]> = {
  "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
  "O+": ["O+", "A+", "B+", "AB+"],
  "A-": ["A-", "A+", "AB-", "AB+"],
  "A+": ["A+", "AB+"],
  "B-": ["B-", "B+", "AB-", "AB+"],
  "B+": ["B+", "AB+"],
  "AB-": ["AB-", "AB+"],
  "AB+": ["AB+"],
};

/** Who may donate to a patient needing `group`. Unknown groups match nobody. */
export function donorsForRecipient(group: string): BloodGroup[] {
  return isBloodGroup(group) ? [...DONORS_FOR_RECIPIENT[group]] : [];
}

/** Which requests a donor with `group` may serve. Unknown groups match none. */
export function requestsForDonor(group: string | null | undefined): BloodGroup[] {
  return isBloodGroup(group) ? [...REQUESTS_FOR_DONOR[group]] : [];
}

/** Whether a donor with `donorGroup` may give to a patient needing `recipientGroup`. */
export function isCompatible(donorGroup: string | null | undefined, recipientGroup: string): boolean {
  return isBloodGroup(donorGroup) && donorsForRecipient(recipientGroup).includes(donorGroup);
}

/**
 * Whether a user can act as a donor at all.
 *
 * A recipient who has set a blood group is donor-eligible too — that rule is in
 * the old SQL in a dozen places and is exactly why it lives in one function now.
 */
export function isDonorEligible(role: string, bloodGroup: string | null | undefined): boolean {
  return role === "donor" || (role === "recipient" && isBloodGroup(bloodGroup));
}
