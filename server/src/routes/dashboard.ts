/**
 * Per-role dashboard aggregate.
 *
 * One endpoint rather than four: each role screen is the same shell with
 * different content, and the authorization decision (which requests a role may
 * see) belongs on the server, not in the client's filter.
 */

import { Router } from "express";

import { db } from "../db";
import { CAN_DONATE_TO } from "../lib/blood-compatibility";
import { requireAuth } from "../middleware/auth";
import {
  toEmergencyRequest,
  type BloodGroup,
  type EmergencyRequestRow,
  type UserRole,
} from "../types";

export const dashboardRouter = Router();

export type DashboardStat = {
  key: string;
  label: string;
  value: string;
  hint: string | null;
};

export type DashboardSummary = {
  role: UserRole;
  stats: DashboardStat[];
  requests: ReturnType<typeof toEmergencyRequest>[];
  availability: { isAvailable: boolean; lastDonationAt: string | null; recordExists: boolean } | null;
};

function countOpenRequests(where = "", params: unknown[] = []): number {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM emergency_requests
        WHERE status IN ('pending', 'verified') ${where}`,
    )
    .get(...params) as { n: number };

  return row.n;
}

/** Open requests most relevant to this user, already ordered for triage. */
function relevantRequests(role: UserRole, userId: string, bloodGroup: BloodGroup | null) {
  const order = `ORDER BY CASE urgency
      WHEN 'critical' THEN 0
      WHEN 'urgent'   THEN 1
      ELSE 2
    END, created_at DESC`;

  if (role === "recipient") {
    return db
      .prepare(
        `SELECT * FROM emergency_requests
          WHERE requester_user_id = ?
          ORDER BY created_at DESC`,
      )
      .all(userId) as EmergencyRequestRow[];
  }

  // A donor only sees requests their blood group can actually serve.
  if (role === "donor" && bloodGroup === null) {
    return [];
  }

  if (role === "donor" && bloodGroup !== null) {
    const targets = CAN_DONATE_TO[bloodGroup];
    const placeholders = targets.map(() => "?").join(", ");

    return db
      .prepare(
        `SELECT r.*, dr.response AS donor_response, dr.stage AS donor_stage,
          EXISTS (
            SELECT 1 FROM donor_request_responses accepted
             WHERE accepted.request_id = r.id
               AND accepted.response = 'accepted'
               AND accepted.donor_id <> ?
          ) AS accepted_by_other_donor
           FROM emergency_requests r
           LEFT JOIN donor_request_responses dr
             ON dr.request_id = r.id AND dr.donor_id = ?
          WHERE r.status IN ('pending', 'verified')
            AND r.blood_group IN (${placeholders})
          ${order}`,
      )
      .all(userId, userId, ...targets) as EmergencyRequestRow[];
  }

  return db
    .prepare(
      `SELECT * FROM emergency_requests
        WHERE status IN ('pending', 'verified')
        ${order}`,
    )
    .all() as EmergencyRequestRow[];
}

dashboardRouter.get("/me", requireAuth, (request, response) => {
  const user = request.user!;
  const stats: DashboardStat[] = [];
  let availability: DashboardSummary["availability"] = null;

  if (user.role === "donor") {
    const row = db
      .prepare("SELECT * FROM donor_availability WHERE user_id = ?")
      .get(user.id) as { is_available: number; last_donation_at: string | null } | undefined;

    const isAvailable = (row?.is_available ?? 0) === 1;
    const targetGroups = user.blood_group ? CAN_DONATE_TO[user.blood_group] : [];

    availability = {
      isAvailable,
      lastDonationAt: row?.last_donation_at ?? null,
      recordExists: row !== undefined,
    };

    const matching =
      targetGroups.length > 0
        ? countOpenRequests(
            `AND blood_group IN (${targetGroups.map(() => "?").join(", ")})`,
            [...targetGroups],
          )
        : 0;

    stats.push(
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
        hint: user.blood_group ? `Compatible with ${user.blood_group}` : "Set your blood group",
      },
      {
        key: "open",
        label: "Open nationwide",
        value: String(countOpenRequests()),
        hint: "Awaiting a donor",
      },
    );
  } else if (user.role === "recipient") {
    const own = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status IN ('pending', 'verified') THEN 1 ELSE 0 END) AS open,
           SUM(CASE WHEN status = 'fulfilled' THEN 1 ELSE 0 END) AS fulfilled
         FROM emergency_requests
        WHERE requester_user_id = ?`,
      )
      .get(user.id) as { open: number | null; fulfilled: number | null };

    stats.push(
      {
        key: "open",
        label: "Your open requests",
        value: String(own.open ?? 0),
        hint: "Being matched with donors",
      },
      {
        key: "fulfilled",
        label: "Fulfilled",
        value: String(own.fulfilled ?? 0),
        hint: "Completed successfully",
      },
      {
        key: "donors",
        label: "Donors online",
        value: String(
          (
            db
              .prepare(
                `SELECT COUNT(*) AS n FROM users u
                   JOIN donor_availability d ON d.user_id = u.id
                  WHERE u.role = 'donor' AND d.is_available = 1`,
              )
              .get() as { n: number }
          ).n,
        ),
        hint: "Available to respond",
      },
    );
  } else if (user.role === "hospital") {
    stats.push(
      {
        key: "pending",
        label: "Pending verification",
        value: String(countOpenRequests()),
        hint: "Awaiting your review",
      },
      {
        key: "critical",
        label: "Critical",
        value: String(countOpenRequests("AND urgency = 'critical'")),
        hint: "Highest priority",
      },
      {
        key: "donors",
        label: "Registered donors",
        value: String(
          (db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'donor'").get() as {
            n: number;
          }).n,
        ),
        hint: "In the national pool",
      },
    );
  } else {
    const users = db
      .prepare(
        `SELECT
           COUNT(*) AS total,
           SUM(CASE WHEN role = 'donor' THEN 1 ELSE 0 END) AS donors,
           SUM(CASE WHEN is_verified = 0 AND role = 'hospital' THEN 1 ELSE 0 END) AS unverified
         FROM users`,
      )
      .get() as { total: number; donors: number | null; unverified: number | null };

    stats.push(
      {
        key: "users",
        label: "Total accounts",
        value: String(users.total),
        hint: `${users.donors ?? 0} donors`,
      },
      {
        key: "queue",
        label: "Triage queue",
        value: String(countOpenRequests()),
        hint: "Open requests",
      },
      {
        key: "unverified",
        label: "Unverified hospitals",
        value: String(users.unverified ?? 0),
        hint: "Need review",
      },
    );
  }

  const summary: DashboardSummary = {
    role: user.role,
    stats,
    requests: relevantRequests(user.role, user.id, user.blood_group).map(toEmergencyRequest),
    availability,
  };

  response.json(summary);
});
