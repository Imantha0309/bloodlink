"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BLOOD_GROUPS = void 0;
exports.isBloodGroup = isBloodGroup;
exports.donorsForRecipient = donorsForRecipient;
exports.requestsForDonor = requestsForDonor;
exports.isDonorEligible = isDonorEligible;
exports.BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];
function isBloodGroup(value) {
    return typeof value === "string" && exports.BLOOD_GROUPS.includes(value);
}
/**
 * Donor groups that can give to a patient who needs `group`.
 *
 * Read it as "the patient needs `group`, so call these donors".
 * A patient who can receive everything (AB+) accepts all eight.
 */
const DONORS_FOR_RECIPIENT = {
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
const REQUESTS_FOR_DONOR = {
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
function donorsForRecipient(group) {
    return isBloodGroup(group) ? [...DONORS_FOR_RECIPIENT[group]] : [];
}
/** Which requests a donor with `group` may serve. Unknown groups match none. */
function requestsForDonor(group) {
    return isBloodGroup(group) ? [...REQUESTS_FOR_DONOR[group]] : [];
}
/**
 * Whether a user can act as a donor at all.
 *
 * A recipient who has set a blood group is donor-eligible too — that rule is in
 * the old SQL in a dozen places and is exactly why it lives in one function now.
 */
function isDonorEligible(role, bloodGroup) {
    return role === "donor" || (role === "recipient" && isBloodGroup(bloodGroup));
}
