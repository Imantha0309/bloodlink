/**
 * Every cache key in the app, in one place.
 *
 * Keys are arrays rather than strings so that a prefix invalidates a whole
 * family: `invalidate(queryKeys.alerts())` matches `["alerts"]` today, and
 * would still match a filtered variant added later as `["alerts", {…}]`.
 *
 * That property is the reason a screen never invents a key inline — two
 * screens that mean the same thing must produce the *same* array, or they get
 * two cache entries and stop sharing data without anyone noticing.
 */

import type { QueryKey } from "@/data/query-cache";

export const queryKeys = {
  /**
   * The alert feed. Deliberately one key, not two: the unread badge and the
   * alerts screen read the same entry, which is what keeps the badge honest.
   */
  alerts: (): QueryKey => ["alerts"],

  /** Everything a role dashboard shows, including donor availability. */
  dashboard: (): QueryKey => ["dashboard"],

  /** Donor directory search, keyed by the filter that produced it. */
  donorDirectory: (filter: { bloodGroup: string | null; district: string | null }): QueryKey => [
    "donors",
    "directory",
    filter.bloodGroup,
    filter.district,
  ],
};
