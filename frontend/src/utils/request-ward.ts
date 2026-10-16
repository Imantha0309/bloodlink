/**
 * The ward a request is for.
 *
 * A request has no `ward` field — the ward is one line of the free-text `notes`
 * the requester typed, e.g. "Ward 7B" or "ward: ICU-2". Two screens already
 * looked for it with the same regex, and a third copy is how they would drift
 * apart, so this is the only place that pattern lives.
 *
 * The parse is deliberately forgiving about the *shape* of the line (case, and
 * whatever follows the word) and strict about the *prefix* — a line has to start
 * with "ward", so a note that merely mentions a ward mid-sentence is not mistaken
 * for one.
 *
 * A structured `ward` field on the request would be the real fix. Until then this
 * is what both the requester and the scanner read, and it cannot be queried.
 */
export function wardOf(notes: string | null | undefined): string | null {
  if (typeof notes !== "string" || notes.length === 0) {
    return null;
  }

  const line = notes
    .split("\n")
    .map((entry) => entry.trim())
    .find((entry) => /^ward\b/i.test(entry));

  return line ?? null;
}
