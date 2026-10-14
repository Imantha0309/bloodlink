/**
 * Avatar monogram derivation.
 *
 * BloodLink never shows real donor photos, so avatars render initials instead.
 *
 * Note: the donor-listing queries (`GetActiveDonorStats`, `SearchDonorDirectory`)
 * build the monogram in SQL so a full name never leaves the database. If this
 * rule changes, change the SQL with it — the two must agree.
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