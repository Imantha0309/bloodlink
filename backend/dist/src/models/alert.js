"use strict";
/**
 * In-app notification feed, always scoped to its owner.
 *
 * `user` leads the index because every read is "my alerts, newest first" — the
 * unread count is a second query on the same key.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const alertSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: shared_1.ALERT_TYPES, required: true },
    request: { type: mongoose_1.Schema.Types.ObjectId, ref: "EmergencyRequest", default: null },
    title: { type: String, required: true },
    body: { type: String, required: true },
    readAt: { type: Date, default: null },
}, { timestamps: true });
alertSchema.index({ user: 1, createdAt: -1 }, { name: "user_recent" });
alertSchema.index({ user: 1, readAt: 1 }, { name: "user_unread" });
(0, shared_1.applyJsonTransform)(alertSchema);
exports.Alert = (0, mongoose_1.model)("Alert", alertSchema);
