import { queryKeys } from "@/data/keys";
import { useQuery } from "@/data/use-query";
import { listAlerts } from "@/services/alerts";

/**
 * Unread-alert count for the signed-in account.
 *
 * Reads the *same* cache entry as the alerts screen, rather than keeping a
 * second copy of the feed that can drift. That is the point: this used to
 * fetch once on mount and never again, so the badge sat on whatever number was
 * true when the screen first rendered. Now marking an alert read on the alerts
 * screen, pulling to refresh it, or a new alert arriving over the realtime
 * channel all move this number in the same tick.
 *
 * Stays at zero when the feed cannot be read — a transient offline moment
 * should show "nothing to report", not invent a count.
 */
export function useUnreadAlerts(): number {
  const { data } = useQuery({ key: queryKeys.alerts(), queryFn: listAlerts });

  return data?.unreadCount ?? 0;
}
