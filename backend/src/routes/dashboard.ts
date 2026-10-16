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

import { Router } from "express";

import { districtFilter } from "../domain/access";
import { requestsForDonor } from "../domain/compatibility";
import { asyncHandler } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { DonorAvailability } from "../models/donor-availability";
import { EmergencyRequest } from "../models/emergency-request";
import { User, type UserDoc } from "../models/user";
import { cache, cacheKey } from "../cache";

export const dashboardRouter = Router();

type Stat = { key: string; label: string; value: string; hint: string | null };

/** Statuses that still count as "in flight" everywhere on this screen. */
const OPEN = ["pending", "verified"];

dashboardRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const stats = await statsFor(user);
    const availability = await availabilityFor(user);

    res.json({ summary: { role: user.role, stats, availability } });
  }),
);

function stat(key: string, label: string, value: number, hint: string | null): Stat {
  return { key, label, value: String(value), hint };
}

async function statsFor(user: UserDoc): Promise<Stat[]> {
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
async function donorStats(user: UserDoc): Promise<Stat[]> {
  const availability = await DonorAvailability.findOne({ userId: user._id });
  const isAvailable = availability?.isAvailable === true;

  const matching =
    user.bloodGroup === null || user.bloodGroup === undefined
      ? 0
      : await EmergencyRequest.countDocuments({
          status: { $in: OPEN },
          bloodGroup: { $in: requestsForDonor(user.bloodGroup) },
        });

  const open = await EmergencyRequest.countDocuments({ status: { $in: OPEN } });

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
async function recipientStats(user: UserDoc): Promise<Stat[]> {
  const [open, fulfilled, donors] = await Promise.all([
    EmergencyRequest.countDocuments({ requester: user._id, status: { $in: OPEN } }),
    EmergencyRequest.countDocuments({ requester: user._id, status: "fulfilled" }),
    availableDonorCount(),
  ]);

  return [
    stat("open", "Your open requests", open, "Being matched with donors"),
    stat("fulfilled", "Fulfilled", fulfilled, "Completed successfully"),
    stat("donors", "Donors online", donors, "Available to respond"),
  ];
}

/** Staff triage: what is waiting, what is critical, who is in the pool. */
async function hospitalStats(user: UserDoc): Promise<Stat[]> {
  // The two queue figures answer for the board this desk is standing at, the way
  // the triage screen does — a hospital does not triage another district's
  // patients. The donor pool below stays national on purpose: a compatible donor
  // can be called in from anywhere, and the hint says so.
  const scope = districtFilter(user);

  const key = cacheKey(`hospital:${user.district ?? "null"}`);
  const cached = cache.get<Stat[]>(key);
  if (cached !== null) return cached;

  const [pending, critical, donors] = await Promise.all([
    EmergencyRequest.countDocuments({ ...scope, status: { $in: OPEN } }),
    EmergencyRequest.countDocuments({ ...scope, status: { $in: OPEN }, urgency: "critical" }),
    User.countDocuments({ role: "donor" }),
  ]);

  const result = [
    stat("pending", "Pending verification", pending, "Awaiting your review"),
    stat("critical", "Critical", critical, "Highest priority"),
    stat("donors", "Registered donors", donors, "In the national pool"),
  ];

  const HOSPITAL_TTL = 30_000; // 30 seconds
  cache.set(key, result, HOSPITAL_TTL);
  return result;
}

const ADMIN_TTL = 15_000; // 15 seconds

/** Admin sees the whole system, including the approval queue. */
async function adminStats(): Promise<Stat[]> {
  const key = cacheKey("admin");

  const cached = cache.get<Stat[]>(key);
  if (cached !== null) return cached;

  const [users, donorCount, queue, unverified] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "donor" }),
    EmergencyRequest.countDocuments({ status: { $in: OPEN } }),
    User.countDocuments({ role: "hospital", isVerified: false }),
  ]);

  const result = [
    stat("users", "Total accounts", users, `${donorCount} donors`),
    stat("queue", "Triage queue", queue, "Open requests"),
    stat("unverified", "Unverified hospitals", unverified, "Need review"),
  ];

  cache.set(key, result, ADMIN_TTL);
  return result;
}

/** Donors who are switched on. Deliberately only `donor`, not donor-eligible. */
async function availableDonorCount(): Promise<number> {
  const key = cacheKey("donor", "available");

  const cached = cache.get<number>(key);
  if (cached !== null) return cached;

  const available = await DonorAvailability.find({ isAvailable: true }).select("userId");
  const count = User.countDocuments({
    _id: { $in: available.map((row) => row.userId) },
    role: "donor",
  });

  const AVAILABLE_DONOR_TTL = 60_000; // 1 minute
  cache.set(key, count, AVAILABLE_DONOR_TTL);
  return count;
}

/**
 * The availability panel, for everyone who has one.
 *
 * A recipient who has set a blood group is donor-eligible and therefore has an
 * availability window; a hospital or a plain recipient does not, and gets
 * `null` so the screen knows to leave the card out entirely.
 */
async function availabilityFor(user: UserDoc) {
  const eligible = user.role === "donor" || (user.role === "recipient" && user.bloodGroup !== null);

  if (!eligible) {
    return null;
  }

  const row = await DonorAvailability.findOne({ userId: user._id });

  return {
    isAvailable: row?.isAvailable === true,
    lastDonationAt: row?.lastDonationAt ?? null,
    recordExists: row !== null,
  };
}
