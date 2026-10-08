/**
 * Two-letter monogram for avatars.
 *
 * The app deliberately ships no profile photos, so a person is represented by
 * their initials the way the donor cards already do.
 */
export function initialsOf(name: string | null | undefined, fallback = "HS"): string {
  if (name === null || name === undefined) {
    return fallback;
  }

  const letters = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return letters.length > 0 ? letters : fallback;
}
