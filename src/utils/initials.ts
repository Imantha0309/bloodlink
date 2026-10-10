/**
 * Avatar monogram derivation.
 *
 * BloodLink never shows real donor photos, so avatars render initials instead.
 * One helper serves the login card and the Find Donors page so every monogram
 * reads the same way.
 */

/** One-to-two letter monogram for a full name, e.g. `Nimal Perera` → `NP`. */
export function personInitials(fullName: string): string | null {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 0 || parts[0] === undefined) {
    return null;
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Monogram for an optional name, falling back to a placeholder. */
export function initialsOf(name: string | null | undefined, fallback = "HS"): string {
  if (name === null || name === undefined) {
    return fallback;
  }

  const letters = personInitials(name);

  return letters === null || letters.length === 0 ? fallback : letters;
}