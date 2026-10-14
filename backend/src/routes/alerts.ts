/**
 * The in-app notification feed.
 *
 * Always scoped to the caller — there is no way to read somebody else's alerts,
 * which is why the old SQL had no role gate on it beyond `user_uid = auth.uid`.
 * The feed is capped at 100 rows: this is a notification tray, not an archive,
 * and the unread badge is a separate count so it stays correct even when the
 * cap truncates the list.
 */

import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { alertRow } from "../domain/serialize";
import { asyncHandler } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { Alert } from "../models/alert";

export const alertsRouter = Router();

const FEED_LIMIT = 100;

alertsRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const [alerts, unreadCount] = await Promise.all([
      Alert.find({ user: user._id }).sort({ createdAt: -1 }).limit(FEED_LIMIT),
      Alert.countDocuments({ user: user._id, readAt: null }),
    ]);

    res.json({ feed: { alerts: alerts.map(alertRow), unreadCount } });
  }),
);

/**
 * Marks alerts read.
 *
 * `ids` arrives as a comma-joined string — that is what the app has always sent,
 * and it lets "mark these three" and "mark everything" share one endpoint
 * (`null` meaning everything). Ids that are not valid ObjectIds are dropped
 * rather than throwing: a stale id in the list should not fail the whole call.
 */
alertsRouter.post(
  "/read",
  requireAuth,
  validateBody(z.object({ ids: z.string().nullable().optional() })),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { ids } = req.body as { ids?: string | null };

    const filter: Record<string, unknown> = { user: user._id, readAt: null };

    if (typeof ids === "string" && ids.length > 0) {
      const wanted = ids.split(",").filter((id) => mongoose.isValidObjectId(id.trim()));
      filter._id = { $in: wanted.map((id) => id.trim()) };
    }

    const result = await Alert.updateMany(filter, { $set: { readAt: new Date() } });

    res.json({ updated: result.modifiedCount });
  }),
);
