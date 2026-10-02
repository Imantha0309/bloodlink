/**
 * Contact-identity helpers shared by the login form, validation rules and the
 * mock auth adapter.
 *
 * Sri Lanka only: a valid mobile is `07XXXXXXXX` locally or `+947XXXXXXXX`
 * internationally. Everything is normalised to the local `07XXXXXXXX` form so
 * the same account matches however the user typed it.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Characters a typed mobile number can contain. */
const PHONE_CHARS = /^[\d\s\-()+.]+$/;

/** Strips formatting characters, keeping digits, `+` and a leading `@`. */
export function stripFormatting(value: string): string {
  return value.replace(/[\s\-().]/g, "");
}

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/**
 * True when the input cannot possibly be a mobile number, i.e. it should be
 * treated as an email. Drives whether the country-code prefix is shown in the
 * unified contact field: `077 123 4567` keeps `+94`, typing `n` drops it.
 */
export function looksLikeEmail(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return !PHONE_CHARS.test(trimmed);
}

/**
 * Whether a non-email value should be validated as a mobile number. Anything
 * containing letters is an email attempt, so the email message is clearer.
 */
export function looksLikeMobile(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && PHONE_CHARS.test(trimmed);
}

/** Normalised local mobile (`07XXXXXXXX`), or `null` if the value is not one. */
export function normalizeMobile(value: string): string | null {
  const stripped = stripFormatting(value).replace(/^\+/, "");

  // `947XXXXXXXX` / `94 7XXXXXXXX` -> drop the country code.
  const local = stripped.startsWith("94") ? `0${stripped.slice(2)}` : stripped;

  return /^07\d{8}$/.test(local) ? local : null;
}

export function isMobile(value: string): boolean {
  return normalizeMobile(value) !== null;
}

/** Lowercased and trimmed email, or `null` if the value is not one. */
export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();

  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

/**
 * Canonical form of either identifier type — used for credential comparison so
 * `+94 77 123 4567` and `0771234567` resolve to the same account.
 */
export function normalizeContact(value: string): string | null {
  return normalizeEmail(value) ?? normalizeMobile(value);
}

/** Groups a local mobile for display: `0771234567` -> `077 123 4567`. */
export function formatMobile(value: string): string | null {
  const local = normalizeMobile(value);

  if (local === null) {
    return null;
  }

  return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}