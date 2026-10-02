/**
 * Contact-identity normalisation.
 *
 * This intentionally mirrors `src/utils/contact.ts` in the app. The server is a
 * standalone package with its own tsconfig, so it cannot import across into the
 * React Native source tree; keeping one small, well-tested rule set on each side
 * is preferable to coupling them.
 *
 * Sri Lanka only: a valid mobile is `07XXXXXXXX` locally or `+947XXXXXXXX`
 * internationally. Everything normalises to the local `07XXXXXXXX` form so the
 * same account matches however the user typed it.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Characters a typed mobile number can contain. */
const PHONE_CHARS = /^[\d\s\-()+.]+$/;

export function looksLikeMobile(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.length > 0 && PHONE_CHARS.test(trimmed);
}

/** Normalised local mobile (`07XXXXXXXX`), or `null` if the value is not one. */
export function normalizeMobile(value: string): string | null {
  const stripped = value.replace(/[\s\-().]/g, "").replace(/^\+/, "");
  const local = stripped.startsWith("94") ? `0${stripped.slice(2)}` : stripped;

  return /^07\d{8}$/.test(local) ? local : null;
}

/** Lowercased and trimmed email, or `null` if the value is not one. */
export function normalizeEmail(value: string): string | null {
  const trimmed = value.trim().toLowerCase();

  return EMAIL_PATTERN.test(trimmed) ? trimmed : null;
}

/** Canonical form of either identifier, or `null` when it is neither. */
export function normalizeContact(value: string): string | null {
  return normalizeEmail(value) ?? normalizeMobile(value);
}
