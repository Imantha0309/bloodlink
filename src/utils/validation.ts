/**
 * Form validation.
 *
 * Each rule returns the exact message shown under the field, or `null` when
 * the value is acceptable. Pure functions so they can be unit tested and reused
 * by screens without any React dependency.
 *
 * The server enforces the same rules independently — this exists to give fast
 * feedback, not to be the security boundary.
 */

import { isBloodGroup, type BloodGroup } from "@/constants/blood-groups";
import type { UrgencyLevel } from "@/constants/emergency";
import type { SelfRegisterRole } from "@/services/auth/types";
import {
  looksLikeMobile,
  normalizeEmail,
  normalizeMobile,
} from "@/utils/contact";

export const ValidationMessages = {
  contactEmpty: "Please enter your email or mobile number.",
  emailInvalid: "Please enter a valid email address.",
  mobileInvalid: "Please enter a valid mobile number.",
  passwordEmpty: "Please enter your password.",
  fullNameEmpty: "Please enter your full name.",
  fullNameShort: "Please enter your full name.",
  passwordWeak:
    "Password needs at least 8 characters, an uppercase letter, a lowercase letter and a number.",
  confirmPasswordEmpty: "Please re-enter your password.",
  confirmPasswordMismatch: "Passwords do not match.",
  termsRequired: "Please accept the terms to continue.",
  bloodGroupRequired: "Select a blood group.",
  otpInvalid: "Enter the 6-digit code.",
  districtRequired: "Select your district.",
  unitsInvalid: "Enter a number of units between 1 and 20.",
  hospitalRequired: "Please enter the hospital.",
  patientNameRequired: "Please enter the patient's name.",
  contactNameRequired: "Please enter a contact person.",
  wardRequired: "Please enter the ward and room.",
  notesTooLong: "Please keep notes under 500 characters.",
  broadcastDisabled: "Turn on broadcast radius to send this request.",
} as const;

/** Mirrors `PASSWORD_MIN_LENGTH` in the server's password module. */
export const PASSWORD_MIN_LENGTH = 8;

/** Matches the server's policy: length plus mixed case and a digit. */
export function isStrongPassword(value: string): boolean {
  return (
    value.length >= PASSWORD_MIN_LENGTH &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value)
  );
}

/**
 * Accepts either an email address or a Sri Lankan mobile number and reports
 * the most specific failure for what the user actually typed.
 */
export function validateContact(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return ValidationMessages.contactEmpty;
  }

  if (looksLikeMobile(trimmed)) {
    return normalizeMobile(trimmed) === null ? ValidationMessages.mobileInvalid : null;
  }

  return normalizeEmail(trimmed) === null ? ValidationMessages.emailInvalid : null;
}

export function validatePassword(value: string): string | null {
  return value.length === 0 ? ValidationMessages.passwordEmpty : null;
}

/** Stricter than `validatePassword` — used when setting a new password. */
export function validateNewPassword(value: string): string | null {
  if (value.length === 0) {
    return ValidationMessages.passwordEmpty;
  }

  return isStrongPassword(value) ? null : ValidationMessages.passwordWeak;
}

export function validateFullName(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return ValidationMessages.fullNameEmpty;
  }

  return trimmed.length < 2 ? ValidationMessages.fullNameShort : null;
}

export function validateOtpCode(value: string): string | null {
  return /^\d{6}$/.test(value.trim()) ? null : ValidationMessages.otpInvalid;
}

export function validateUnits(value: string): string | null {
  const parsed = Number.parseInt(value.trim(), 10);

  if (Number.isNaN(parsed) || parsed < 1 || parsed > 20) {
    return ValidationMessages.unitsInvalid;
  }

  return null;
}

/**
 * One unit of whole blood, in millilitres.
 *
 * Shown as a live total next to the quantity stepper so the donor understands
 * what they are being asked for. The 1–20 bounds above are the server's, not
 * this value's.
 */
export const ML_PER_UNIT = 450;

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export type LoginFormValues = {
  identifier: string;
  password: string;
};

export type LoginFormErrors = {
  identifier: string | null;
  password: string | null;
};

/** Runs every field rule. All errors are reported, not just the first. */
export function validateLoginForm(values: LoginFormValues): LoginFormErrors {
  return {
    identifier: validateContact(values.identifier),
    password: validatePassword(values.password),
  };
}

/** True when any field of an error record carries a message. */
export function hasFieldErrors(errors: Record<string, string | null>): boolean {
  return Object.values(errors).some((message) => message !== null);
}

export function hasErrors(errors: LoginFormErrors): boolean {
  return errors.identifier !== null || errors.password !== null;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export type RegisterFormValues = {
  fullName: string;
  identifier: string;
  district: string;
  bloodGroup: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  /** Hospitals only — optional, so never an error when blank. */
  hospitalRegistrationNumber?: string;
};

export type RegisterFormErrors = {
  fullName: string | null;
  identifier: string | null;
  district: string | null;
  bloodGroup: string | null;
  password: string | null;
  confirmPassword: string | null;
  acceptedTerms: string | null;
};

/**
 * A donor or recipient without a blood group can never be matched to a
 * request, so that field is required for them and skipped for hospitals, whose
 * stock is managed per-request rather than per-account.
 */
export function validateRegisterForm(
  values: RegisterFormValues,
  role: SelfRegisterRole,
): RegisterFormErrors {
  const needsBloodGroup = role === "donor" || role === "recipient";

  const bloodGroupError = needsBloodGroup
    ? isBloodGroup(values.bloodGroup)
      ? null
      : ValidationMessages.bloodGroupRequired
    : null;

  const confirmError =
    values.confirmPassword.length === 0
      ? ValidationMessages.confirmPasswordEmpty
      : values.confirmPassword === values.password
        ? null
        : ValidationMessages.confirmPasswordMismatch;

  return {
    fullName: validateFullName(values.fullName),
    identifier: validateContact(values.identifier),
    district:
      values.district.trim().length === 0 ? ValidationMessages.districtRequired : null,
    bloodGroup: bloodGroupError,
    password: validateNewPassword(values.password),
    confirmPassword: confirmError,
    acceptedTerms: values.acceptedTerms ? null : ValidationMessages.termsRequired,
  };
}

export function hasRegisterErrors(errors: RegisterFormErrors): boolean {
  return hasFieldErrors(errors);
}

/** Narrows a validated string to a `BloodGroup` for the sign-up payload. */
export function asBloodGroup(value: string): BloodGroup | null {
  return isBloodGroup(value) ? value : null;
}

// ---------------------------------------------------------------------------
// Emergency request
// ---------------------------------------------------------------------------

export type EmergencyFormValues = {
  patientName: string;
  bloodGroup: string;
  units: string;
  hospital: string;
  /** Ward and room. Folded into `notes` at submit until the schema has a column. */
  ward: string;
  district: string;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string;
};

export type EmergencyFormErrors = {
  patientName: string | null;
  bloodGroup: string | null;
  units: string | null;
  hospital: string | null;
  ward: string | null;
  district: string | null;
  contactName: string | null;
  contactMobile: string | null;
  notes: string | null;
};

export function validateEmergencyForm(values: EmergencyFormValues): EmergencyFormErrors {
  return {
    patientName:
      validateFullName(values.patientName) === null
        ? null
        : ValidationMessages.patientNameRequired,
    bloodGroup: isBloodGroup(values.bloodGroup) ? null : ValidationMessages.bloodGroupRequired,
    units: validateUnits(values.units),
    hospital:
      values.hospital.trim().length < 2 ? ValidationMessages.hospitalRequired : null,
    // Donors need this to know which ward to report to, so it is required rather
    // than optional the way `notes` is.
    ward: values.ward.trim().length === 0 ? ValidationMessages.wardRequired : null,
    // Optional on the server, but asking for it is what makes a request
    // locatable, and the form has the field anyway.
    district: values.district.trim().length === 0 ? ValidationMessages.districtRequired : null,
    contactName:
      validateFullName(values.contactName) === null
        ? null
        : ValidationMessages.contactNameRequired,
    contactMobile: validateContact(values.contactMobile),
    notes: values.notes.length > 500 ? ValidationMessages.notesTooLong : null,
  };
}

export function hasEmergencyErrors(errors: EmergencyFormErrors): boolean {
  return hasFieldErrors(errors);
}
