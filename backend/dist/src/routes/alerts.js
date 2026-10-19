"use strict";
/**
 * The in-app notification feed.
 *
 * Always scoped to the caller — there is no way to read somebody else's alerts,
 * which is why the old SQL had no role gate on it beyond `user_uid = auth.uid`.
 * The feed is capped at 100 rows: this is a notification tray, not an archive,
 * and the unread badge is a separate count so it stays correct even when the
 * cap truncates the list.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRouter = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const alert_1 = require("../models/alert");
exports.alertsRouter = (0, express_1.Router)();
const FEED_LIMIT = 100;
exports.alertsRouter.get("/", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const [alerts, unreadCount] = await Promise.all([
        alert_1.Alert.find({ user: user._id }).sort({ createdAt: -1 }).limit(FEED_LIMIT),
        alert_1.Alert.countDocuments({ user: user._id, readAt: null }),
    ]);
    res.json({ feed: { alerts: alerts.map(serialize_1.alertRow), unreadCount } });
}));
/**
 * Marks alerts read.
 *
 * `ids` arrives as a comma-joined string — that is what the app has always sent,
 * and it lets "mark these three" and "mark everything" share one endpoint
 * (`null` meaning everything). Ids that are not valid ObjectIds are dropped
 * rather than throwing: a stale id in the list should not fail the whole call.
 */
exports.alertsRouter.post("/read", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ ids: zod_1.z.string().nullable().optional() })), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { ids } = req.body;
    const filter = { user: user._id, readAt: null };
    if (typeof ids === "string" && ids.length > 0) {
        const wanted = ids.split(",").filter((id) => mongoose_1.default.isValidObjectId(id.trim()));
        filter._id = { $in: wanted.map((id) => id.trim()) };
    }
    const result = await alert_1.Alert.updateMany(filter, { $set: { readAt: new Date() } });
    res.json({ updated: result.modifiedCount });
}));
