"use strict";
/**
 * The per-role dashboard summary.
 *
 * Every number here was a correlated subquery inside one enormous `CASE` block
 * in the SQL. It is split into a small function per role instead — same figures,
 * but each one is now readable on its own, which matters because these are the
 * numbers a user decides whether to act on.
 *
 * The request list that sits under the stats is fetched separately by the app
 * through the role-appropriate list endpoint, exactly as before.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRouter = void 0;
const express_1 = require("express");
const access_1 = require("../domain/access");
const compatibility_1 = require("../domain/compatibility");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const donor_availability_1 = require("../models/donor-availability");
const emergency_request_1 = require("../models/emergency-request");
const user_1 = require("../models/user");
exports.dashboardRouter = (0, express_1.Router)();
/** Statuses that still count as "in flight" everywhere on this screen. */
const OPEN = ["pending", "verified"];
exports.dashboardRouter.get("/me", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const stats = await statsFor(user);
    const availability = await availabilityFor(user);
    res.json({ summary: { role: user.role, stats, availability } });
}));
function stat(key, label, value, hint) {
    return { key, label, value: String(value), hint };
}
async function statsFor(user) {
    switch (user.role) {
        case "donor":
            return donorStats(user);
        case "recipient":
            return recipientStats(user);
        case "hospital":
            return hospitalStats(user);
        default:
            return adminStats();
    }
}
/** A donor cares about their own switch, what matches them, and what is open. */
async function donorStats(user) {
    const availability = await donor_availability_1.DonorAvailability.findOne({ userId: user._id });
    const isAvailable = availability?.isAvailable === true;
    const matching = user.bloodGroup === null || user.bloodGroup === undefined
        ? 0
        : await emergency_request_1.EmergencyRequest.countDocuments({
            status: { $in: OPEN },
            bloodGroup: { $in: (0, compatibility_1.requestsForDonor)(user.bloodGroup) },
        });
    const open = await emergency_request_1.EmergencyRequest.countDocuments({ status: { $in: OPEN } });
    return [
        {
            key: "availability",
            label: "Your availability",
            value: isAvailable ? "Active" : "Paused",
            hint: isAvailable ? "You are receiving alerts" : "You are hidden from dispatch",
        },
        {
            key: "matching",
            label: "Matching requests",
            value: String(matching),
            hint: user.bloodGroup ? `Compatible with ${user.bloodGroup}` : "Set your blood group",
        },
        stat("open", "Open nationwide", open, "Awaiting a donor"),
    ];
}
/** A recipient watches their own requests and how many donors are reachable. */
async function recipientStats(user) {
    const [open, fulfilled, donors] = await Promise.all([
        emergency_request_1.EmergencyRequest.countDocuments({ requester: user._id, status: { $in: OPEN } }),
        emergency_request_1.EmergencyRequest.countDocuments({ requester: user._id, status: "fulfilled" }),
        availableDonorCount(),
    ]);
    return [
        stat("open", "Your open requests", open, "Being matched with donors"),
        stat("fulfilled", "Fulfilled", fulfilled, "Completed successfully"),
        stat("donors", "Donors online", donors, "Available to respond"),
    ];
}
/** Staff triage: what is waiting, what is critical, who is in the pool. */
async function hospitalStats(user) {
    // The two queue figures answer for the board this desk is standing at, the way
    // the triage screen does — a hospital does not triage another district's
    // patients. The donor pool below stays national on purpose: a compatible donor
    // can be called in from anywhere, and the hint says so.
    const scope = (0, access_1.districtFilter)(user);
    const [pending, critical, donors] = await Promise.all([
        emergency_request_1.EmergencyRequest.countDocuments({ ...scope, status: { $in: OPEN } }),
        emergency_request_1.EmergencyRequest.countDocuments({ ...scope, status: { $in: OPEN }, urgency: "critical" }),
        user_1.User.countDocuments({ role: "donor" }),
    ]);
    return [
        stat("pending", "Pending verification", pending, "Awaiting your review"),
        stat("critical", "Critical", critical, "Highest priority"),
        stat("donors", "Registered donors", donors, "In the national pool"),
    ];
}
/** Admin sees the whole system, including the approval queue. */
async function adminStats() {
    const [users, donorCount, queue, unverified] = await Promise.all([
        user_1.User.countDocuments(),
        user_1.User.countDocuments({ role: "donor" }),
        emergency_request_1.EmergencyRequest.countDocuments({ status: { $in: OPEN } }),
        user_1.User.countDocuments({ role: "hospital", isVerified: false }),
    ]);
    return [
        stat("users", "Total accounts", users, `${donorCount} donors`),
        stat("queue", "Triage queue", queue, "Open requests"),
        stat("unverified", "Unverified hospitals", unverified, "Need review"),
    ];
}
/** Donors who are switched on. Deliberately only `donor`, not donor-eligible. */
async function availableDonorCount() {
    const available = await donor_availability_1.DonorAvailability.find({ isAvailable: true }).select("userId");
    return user_1.User.countDocuments({
        _id: { $in: available.map((row) => row.userId) },
        role: "donor",
    });
}
/**
 * The availability panel, for everyone who has one.
 *
 * A recipient who has set a blood group is donor-eligible and therefore has an
 * availability window; a hospital or a plain recipient does not, and gets
 * `null` so the screen knows to leave the card out entirely.
 */
async function availabilityFor(user) {
    const eligible = user.role === "donor" || (user.role === "recipient" && user.bloodGroup !== null);
    if (!eligible) {
        return null;
    }
    const row = await donor_availability_1.DonorAvailability.findOne({ userId: user._id });
    return {
        isAvailable: row?.isAvailable === true,
        lastDonationAt: row?.lastDonationAt ?? null,
        recordExists: row !== null,
    };
}
