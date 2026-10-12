import { useEffect, useState } from "react";

import { listAlerts } from "@/services/alerts";

/**
 * Live unread-alert count for the signed-in account.
 *
 * Fetched once on mount from the real alerts feed and left at zero (no badge)
 * if the fetch fails — a transient offline moment should not fabricate a
 * notification count, it should just show nothing to report.
 */
export function useUnreadAlerts(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    listAlerts()
      .then((feed) => {
        if (!cancelled) {
          setCount(feed.unreadCount);
        }
      })
      .catch(() => {
        // Keep zero; the badge simply stays hidden.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}