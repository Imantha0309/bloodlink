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
import { emergencyRequestSchema, parseBody } from "../lib/validate";
import { optionalAuth, requireAuth } from "../middleware/auth";
import { toEmergencyRequest, type EmergencyRequestRow } from "../types";

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
