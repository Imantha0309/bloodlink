/**
 * The in-app notification feed.
 *
 * Read-state changes go back through `POST /alerts/read`, which accepts a
 * comma-joined id list or `null` for "everything" — the same contract the
 * Data Connect mutation had, so the screens calling it are unchanged.
 */

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";

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

const ALERT_TYPES: readonly AlertType[] = [
  "new_match",
  "status_change",
  "donor_accepted",
  "request_fulfilled",
];

function isAlertType(value: unknown): value is AlertType {
  return typeof value === "string" && (ALERT_TYPES as readonly string[]).includes(value);
}

/** Narrows one alert row; malformed rows are dropped rather than trusted. */
export function readAlert(row: unknown): Alert | null {
  if (typeof row !== "object" || row === null) {
    return null;
  }

  const candidate = row as Partial<Alert>;

  if (
    typeof candidate.id !== "string" ||
    !isAlertType(candidate.type) ||
    typeof candidate.title !== "string" ||
    typeof candidate.body !== "string" ||
    typeof candidate.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    type: candidate.type,
    requestId: typeof candidate.requestId === "string" ? candidate.requestId : null,
    title: candidate.title,
    body: candidate.body,
    readAt: typeof candidate.readAt === "string" ? candidate.readAt : null,
    createdAt: candidate.createdAt,
  };
}

function readFeed(value: unknown): AlertFeed {
  if (typeof value !== "object" || value === null) {
    return { alerts: [], unreadCount: 0 };
  }

  const candidate = value as { alerts?: unknown; unreadCount?: unknown };

  const alerts: Alert[] = [];

  if (Array.isArray(candidate.alerts)) {
    for (const row of candidate.alerts) {
      const alert = readAlert(row);

      if (alert !== null) {
        alerts.push(alert);
      }
    }
  }

  return {
    alerts,
    unreadCount: typeof candidate.unreadCount === "number" ? candidate.unreadCount : 0,
  };
}

export async function listAlerts(): Promise<AlertFeed> {
  try {
    const { feed } = await apiRequest<{ feed: unknown }>("/alerts");

    return readFeed(feed);
  } catch (error) {
    throw toApiError(error);
  }
}

/** Marks the given ids read, or everything when `ids` is omitted. */
export async function markAlertsRead(ids?: string[]): Promise<number> {
  try {
    const { updated } = await apiRequest<{ updated: unknown }>("/alerts/read", {
      method: "POST",
      body: { ids: ids?.length ? ids.join(",") : null },
    });

    return typeof updated === "number" ? updated : 0;
  } catch (error) {
    throw toApiError(error);
  }
}
