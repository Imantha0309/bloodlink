/**
 * The in-app notification feed.
 *
 * Offline the alerts live in a module array so read-state changes still
 * behave; they are never persisted across reloads in that mode.
 */

import { request } from "@/services/api/client";
import { hasRemoteApi } from "@/services/config";

export type AlertType = "new_match" | "status_change" | "donor_accepted" | "request_fulfilled";

export type Alert = {
  id: string;
  type: AlertType;
  requestId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type AlertFeed = {
  alerts: Alert[];
  unreadCount: number;
};

const OFFLINE_ALERTS: Alert[] = [
  {
    id: "alrt_off_1",
    type: "new_match",
    requestId: null,
    title: "New critical request in Colombo",
    body: "O- needed for a patient at National Hospital of Sri Lanka.",
    readAt: null,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: "alrt_off_2",
    type: "donor_accepted",
    requestId: "req_mock_2",
    title: "A donor accepted your request",
    body: "A nearby donor is ready to donate A+ for F. A. Rizwan.",
    readAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

export async function listAlerts(): Promise<AlertFeed> {
  if (!hasRemoteApi) {
    const sorted = [...OFFLINE_ALERTS].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      alerts: sorted,
      unreadCount: sorted.filter((alert) => alert.readAt === null).length,
    };
  }

  const body = await request<{ alerts?: unknown; unreadCount?: unknown }>("/alerts");
  const list = Array.isArray(body.alerts) ? body.alerts : [];

  return {
    alerts: list.filter(
      (item): item is Alert =>
        typeof item === "object" && item !== null && typeof (item as Alert).id === "string",
    ),
    unreadCount: typeof body.unreadCount === "number" ? body.unreadCount : 0,
  };
}

/** Marks the given ids read, or everything when `ids` is omitted. */
export async function markAlertsRead(ids?: string[]): Promise<number> {
  if (!hasRemoteApi) {
    const targets = ids?.length
      ? OFFLINE_ALERTS.filter((alert) => alert.readAt === null && ids.includes(alert.id))
      : OFFLINE_ALERTS.filter((alert) => alert.readAt === null);

    targets.forEach((alert) => {
      alert.readAt = new Date().toISOString();
    });

    return targets.length;
  }

  const body = await request<{ updated?: unknown }>("/alerts/read", {
    method: "POST",
    body: ids?.length ? { ids } : {},
  });

  return typeof body.updated === "number" ? body.updated : 0;
}
