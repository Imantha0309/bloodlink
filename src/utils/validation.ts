/**
 * Login form validation.
 *
 * Each rule returns the exact message shown under the field, or `null` when
 * the value is acceptable. Pure functions so they can be unit tested and reused
 * by the screen without any React dependency.
 */

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
} as const;

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

export function hasErrors(errors: LoginFormErrors): boolean {
  return errors.identifier !== null || errors.password !== null;
}