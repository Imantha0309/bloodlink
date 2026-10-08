/**
 * The notification feed.
 *
 * Reads are always scoped to the signed-in user — there is deliberately no
 * admin-wide read, because an alert body can name a patient.
 */

import { Router } from "express";

import { db, now } from "../db";
import { z } from "zod";

import { ALERT_TYPES, toAlert, type AlertRow } from "../lib/alerts";
import { parseBody } from "../lib/validate";
import { requireAuth } from "../middleware/auth";

export const alertsRouter = Router();

const markReadSchema = z.object({
  /** Omitted or empty means "mark everything read". */
  ids: z.array(z.string().trim().min(1)).max(200).optional(),
});

alertsRouter.get("/", requireAuth, (request, response) => {
  const user = request.user!;

  const rows = db
    .prepare(
      `SELECT * FROM alerts
        WHERE user_id = ? AND type IN (${ALERT_TYPES.map(() => "?").join(", ")})
        ORDER BY created_at DESC
        LIMIT 100`,
    )
    .all(user.id, ...ALERT_TYPES) as AlertRow[];

  const unread = db
    .prepare("SELECT COUNT(*) AS n FROM alerts WHERE user_id = ? AND read_at IS NULL")
    .get(user.id) as { n: number };

  response.json({ alerts: rows.map(toAlert), unreadCount: unread.n });
});

alertsRouter.post("/read", requireAuth, (request, response) => {
  const user = request.user!;
  const input = parseBody(markReadSchema, request.body);
  const timestamp = now();

  const result = input.ids?.length
    ? db
        .prepare(
          `UPDATE alerts SET read_at = ?
            WHERE user_id = ? AND read_at IS NULL
              AND id IN (${input.ids.map(() => "?").join(", ")})`,
        )
        .run(timestamp, user.id, ...input.ids)
    : db
        .prepare("UPDATE alerts SET read_at = ? WHERE user_id = ? AND read_at IS NULL")
        .run(timestamp, user.id);

  response.json({ updated: result.changes, updatedAt: timestamp });
});
