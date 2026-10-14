/**
 * Coarse relative time.
 *
 * Enough for a triage list — "18m ago", "2h ago" — without pulling in a date
 * library. A value the platform cannot parse renders as an empty string, so
 * callers can skip the whole line rather than print "Invalid Date".
 */

/** `"2026-10-10T09:00:00.000Z"` → `"18m ago"`, or `""` when unparseable. */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}
