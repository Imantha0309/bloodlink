/**
 * Alert writers.
 *
 * Alerts are inserted inside the same transaction as the event that caused
 * them, so a notification can never exist for a change that was rolled back
 * (or be missed for one that committed). Reads happen through
 * `GET /alerts`; nothing here pushes.
 */

import { db } from "../db";
import { CAN_RECEIVE_FROM } from "./blood-compatibility";
import type { BloodGroup, EmergencyRequestRow } from "../types";

export const ALERT_TYPES = [
  "new_match",
  "status_change",
  "donor_accepted",
  "request_fulfilled",
] as const;

export type AlertType = (typeof ALERT_TYPES)[number];

export type AlertRow = {
  id: string;
  user_id: string;
  type: AlertType;
  request_id: string | null;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type AlertPayload = {
  id: string;
  type: AlertType;
  requestId: string | null;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function toAlert(row: AlertRow): AlertPayload {
  return {
    id: row.id,
    type: row.type,
    requestId: row.request_id,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function insertAlert(
  userId: string,
  type: AlertType,
  requestId: string | null,
  title: string,
  body: string,
  createdAt: string,
): void {
  db.prepare(
    `INSERT INTO alerts (id, user_id, type, request_id, title, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(`alrt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, userId, type, requestId, title, body, createdAt);
}

/** Tell the requester someone accepted — skipped for anonymous requests. */
export function notifyRequesterAccepted(request: EmergencyRequestRow, donorName: string, at: string): void {
  if (!request.requester_user_id) return;

  insertAlert(
    request.requester_user_id,
    "donor_accepted",
    request.id,
    "A donor accepted your request",
    `${donorName} is ready to donate ${request.blood_group} for ${request.patient_name}.`,
    at,
  );
}

/** Status changes on the requester's own request (verified / cancelled). */
export function notifyRequesterStatus(request: EmergencyRequestRow, at: string): void {
  if (!request.requester_user_id) return;

  const fulfilled = request.status === "fulfilled";
  insertAlert(
    request.requester_user_id,
    fulfilled ? "request_fulfilled" : "status_change",
    request.id,
    fulfilled ? "Request fulfilled" : "Request updated",
    fulfilled
      ? `${request.patient_name}'s request was marked fulfilled. Thank you.`
      : `${request.patient_name}'s request is now ${request.status}.`,
    at,
  );
}

/** The accepted donor hears about terminal moves (fulfilled / cancelled). */
export function notifyAcceptedDonor(request: EmergencyRequestRow, at: string): void {
  const donor = db
    .prepare(
      `SELECT u.id, u.full_name FROM donor_request_responses dr
         JOIN users u ON u.id = dr.donor_id
        WHERE dr.request_id = ? AND dr.response = 'accepted'`,
    )
    .get(request.id) as { id: string; full_name: string } | undefined;

  if (!donor) return;

  const fulfilled = request.status === "fulfilled";
  insertAlert(
    donor.id,
    fulfilled ? "request_fulfilled" : "status_change",
    request.id,
    fulfilled ? "Donation completed" : "Request cancelled",
    fulfilled
      ? `Your donation for ${request.patient_name} has been recorded.`
      : `The request for ${request.patient_name} was cancelled — no travel needed.`,
    at,
  );
}

/**
 * `verified` is the moment a request becomes visible to donors, so that is
 * when every available compatible donor gets their new-match alert. One
 * set-based INSERT: the database decides who qualifies, not the caller.
 */
export function notifyCompatibleDonors(request: EmergencyRequestRow, at: string): void {
  const compatible = CAN_RECEIVE_FROM[request.blood_group] as readonly BloodGroup[];
  if (compatible.length === 0) return;

  const placeholders = compatible.map(() => "?").join(", ");

  db.prepare(
    `INSERT INTO alerts (id, user_id, type, request_id, title, body, created_at)
     SELECT 'alrt_' || lower(hex(randomblob(9))), u.id, 'new_match', ?, ?, ?, ?
       FROM users u
       JOIN donor_availability d ON d.user_id = u.id
      WHERE u.role = 'donor'
        AND u.is_locked = 0
        AND d.is_available = 1
        AND u.blood_group IN (${placeholders})`,
  ).run(
    request.id,
    `New ${request.urgency} request in ${request.district ?? "your area"}`,
    `${request.blood_group} needed for ${request.patient_name} at ${request.hospital}.`,
    at,
    ...compatible,
  );
}

/** Single entry point the status-transition code calls after a move commits. */
export function notifyStatusChange(request: EmergencyRequestRow, at: string): void {
  if (request.status === "verified") {
    notifyCompatibleDonors(request, at);
  }

  notifyRequesterStatus(request, at);

  if (request.status === "fulfilled" || request.status === "cancelled") {
    notifyAcceptedDonor(request, at);
  }
}
