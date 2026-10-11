/**
 * Emergency blood requests.
 *
 * `POST /` is deliberately reachable without an account — this backs the
 * "Zero Login" urgent path on the sign-in screen. When a valid token is
 * present the request is linked to that user; otherwise it is anonymous.
 */

import { Router } from "express";

import { db, now } from "../db";
import { asyncHandler } from "../lib/async-handler";
import { ApiError } from "../lib/errors";
import { generateId } from "../lib/tokens";
import {
  emergencyRequestSchema,
  emergencyRequestUpdateSchema,
  parseBody,
} from "../lib/validate";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { toEmergencyRequest, type EmergencyRequestRow, type UserRow } from "../types";

/** Ordered for triage: critical first, then urgent, then standard. */
const URGENCY_RANK = `CASE urgency
    WHEN 'critical' THEN 0
    WHEN 'urgent'   THEN 1
    ELSE 2
  END`;

export const emergencyRouter = Router();

emergencyRouter.post(
  "/",
  optionalAuth,
  asyncHandler(async (request, response) => {
    const input = parseBody(emergencyRequestSchema, request.body);
    const id = generateId("req");
    const timestamp = now();

    db.prepare(
      `INSERT INTO emergency_requests
         (id, requester_user_id, patient_name, blood_group, units, hospital,
          district, contact_name, contact_mobile, urgency, notes, status,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    ).run(
      id,
      request.user?.id ?? null,
      input.patientName,
      input.bloodGroup,
      input.units,
      input.hospital,
      input.district ?? null,
      input.contactName,
      input.contactMobile,
      input.urgency,
      input.notes ?? null,
      timestamp,
      timestamp,
    );

    const row = db
      .prepare("SELECT * FROM emergency_requests WHERE id = ?")
      .get(id) as EmergencyRequestRow;

    response.status(201).json({ request: toEmergencyRequest(row) });
  }),
);

emergencyRouter.get("/", requireAuth, (request, response) => {
  const user = request.user!;

  // Donors and hospitals both work the live queue; recipients only ever see
  // what they raised themselves; admins audit everything.
  const rows =
    user.role === "recipient"
      ? (db
          .prepare(
            `SELECT * FROM emergency_requests
              WHERE requester_user_id = ?
              ORDER BY created_at DESC`,
          )
          .all(user.id) as EmergencyRequestRow[])
      : (db
          .prepare(
            `SELECT * FROM emergency_requests
              WHERE status IN ('pending', 'verified')
              ORDER BY ${URGENCY_RANK}, created_at DESC`,
          )
          .all() as EmergencyRequestRow[]);

  response.json({ requests: rows.map(toEmergencyRequest) });
});

/** Blood groups a patient can receive from, used for donor matching. */
const COMPATIBLE_DONORS: Record<string, readonly string[]> = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

emergencyRouter.get("/:id", optionalAuth, (request, response) => {
  const id = request.params.id;

  const row = id
    ? (db.prepare("SELECT * FROM emergency_requests WHERE id = ?").get(id) as
        | EmergencyRequestRow
        | undefined)
    : undefined;

  if (!row) {
    throw new ApiError("not_found", "That request could not be found.");
  }

  response.json({
    request: toEmergencyRequest(row),
    compatibleDonorGroups: COMPATIBLE_DONORS[row.blood_group] ?? [],
  });
});

/**
 * Roles that work the whole queue rather than their own requests.
 *
 * A hospital receives every open request and is expected to correct or
 * withdraw one (a duplicate, a cancelled theatre slot, a wrong unit count), so
 * it manages the queue the same way an admin audits it.
 */
const QUEUE_MANAGER_ROLES = new Set<UserRow["role"]>(["admin", "hospital"]);

/**
 * Loads a request and confirms the signed-in user is allowed to change it.
 *
 * A requester may change their own; hospital staff and admins may change any;
 * anonymous requests (`requester_user_id IS NULL`) belong to no account, so
 * only the queue managers can touch those.
 */
function loadManagedRequest(id: string | undefined, user: UserRow): EmergencyRequestRow {
  const row = id
    ? (db.prepare("SELECT * FROM emergency_requests WHERE id = ?").get(id) as
        | EmergencyRequestRow
        | undefined)
    : undefined;

  if (!row) {
    throw new ApiError("not_found", "That request could not be found.");
  }

  const mayManageQueue = QUEUE_MANAGER_ROLES.has(user.role);

  if (!mayManageQueue && row.requester_user_id !== user.id) {
    // 404 rather than 403 so a probe can't confirm which ids exist.
    throw new ApiError("not_found", "That request could not be found.");
  }

  return row;
}

/** Only a request still in the field can be changed — no editing history. */
function assertEditable(row: EmergencyRequestRow): void {
  if (row.status === "fulfilled" || row.status === "cancelled") {
    throw new ApiError("conflict", "This request is already closed and can no longer be changed.");
  }
}

// Columns a client edit may touch, mapped from the API's camelCase to SQLite.
const UPDATABLE_COLUMNS: Record<string, string> = {
  patientName: "patient_name",
  bloodGroup: "blood_group",
  units: "units",
  hospital: "hospital",
  district: "district",
  contactName: "contact_name",
  contactMobile: "contact_mobile",
  urgency: "urgency",
  notes: "notes",
};

emergencyRouter.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = request.user!;
    const row = loadManagedRequest(request.params.id, user);
    assertEditable(row);

    const input = parseBody(emergencyRequestUpdateSchema, request.body);

    const assignments: string[] = [];
    const values: (string | number | null)[] = [];

    for (const [key, column] of Object.entries(UPDATABLE_COLUMNS)) {
      const value = input[key as keyof typeof input];

      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value === null ? null : value);
      }
    }

    if (assignments.length === 0) {
      throw new ApiError("validation", "No changes were supplied.");
    }

    assignments.push("updated_at = ?");
    values.push(now());

    db.prepare(`UPDATE emergency_requests SET ${assignments.join(", ")} WHERE id = ?`).run(
      ...values,
      row.id,
    );

    const updated = db
      .prepare("SELECT * FROM emergency_requests WHERE id = ?")
      .get(row.id) as EmergencyRequestRow;

    response.json({ request: toEmergencyRequest(updated) });
  }),
);

/**
 * Cancels a request. A cancel is a status flip, never a row delete: triage and
 * donors keep the audit trail, and a fulfilled transfusion cannot be un-logged.
 */
emergencyRouter.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = request.user!;
    const row = loadManagedRequest(request.params.id, user);

    if (row.status === "fulfilled") {
      throw new ApiError("conflict", "This request has already been fulfilled.");
    }

    if (row.status !== "cancelled") {
      db.prepare(
        "UPDATE emergency_requests SET status = 'cancelled', updated_at = ? WHERE id = ?",
      ).run(now(), row.id);
    }

    const cancelled = db
      .prepare("SELECT * FROM emergency_requests WHERE id = ?")
      .get(row.id) as EmergencyRequestRow;

    response.json({ request: toEmergencyRequest(cancelled) });
  }),
);
