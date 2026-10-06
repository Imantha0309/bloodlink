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
import { CAN_RECEIVE_FROM } from "../lib/blood-compatibility";
import { generateId } from "../lib/tokens";
import { donorResponseSchema, emergencyRequestSchema, parseBody } from "../lib/validate";
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
  let rows: EmergencyRequestRow[];

  if (user.role === "recipient") {
    rows = db
      .prepare(
        `SELECT * FROM emergency_requests
          WHERE requester_user_id = ?
          ORDER BY created_at DESC`,
      )
      .all(user.id) as EmergencyRequestRow[];
  } else if (user.role === "donor") {
    const compatibleGroups = user.blood_group ? CAN_RECEIVE_FROM[user.blood_group] : [];
    const groupFilter = compatibleGroups.length
      ? `AND r.blood_group IN (${compatibleGroups.map(() => "?").join(", ")})`
      : "AND 1 = 0";

    rows = db
      .prepare(
        `SELECT r.*, dr.response AS donor_response, dr.stage AS donor_stage
           FROM emergency_requests r
           LEFT JOIN donor_request_responses dr
             ON dr.request_id = r.id AND dr.donor_id = ?
          WHERE r.status IN ('pending', 'verified')
            ${groupFilter}
          ORDER BY CASE r.urgency
            WHEN 'critical' THEN 0 WHEN 'urgent' THEN 1 ELSE 2 END,
            r.created_at DESC`,
      )
      .all(user.id, ...compatibleGroups) as EmergencyRequestRow[];
  } else {
    rows = db
      .prepare(
        `SELECT * FROM emergency_requests
          WHERE status IN ('pending', 'verified')
          ORDER BY ${URGENCY_RANK}, created_at DESC`,
      )
      .all() as EmergencyRequestRow[];
  }

  response.json({ requests: rows.map(toEmergencyRequest) });
});

/** Record a donor's choice. Matching and availability are enforced server-side. */
emergencyRouter.post("/:id/response", requireAuth, (request, response) => {
  const user = request.user!;

  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can respond to blood requests.", {
      status: 403,
    });
  }

  const input = parseBody(donorResponseSchema, request.body);
  const row = db
    .prepare("SELECT * FROM emergency_requests WHERE id = ?")
    .get(request.params.id) as EmergencyRequestRow | undefined;

  if (!row) {
    throw new ApiError("not_found", "That request could not be found.");
  }

  if (row.status !== "pending" && row.status !== "verified") {
    throw new ApiError("conflict", "This request is no longer accepting responses.");
  }

  const compatibleGroups = CAN_RECEIVE_FROM[row.blood_group];
  if (!user.blood_group || !compatibleGroups.includes(user.blood_group)) {
    throw new ApiError("unauthorized", "This request is not compatible with your blood group.", {
      status: 403,
    });
  }

  if (input.response === "accepted") {
    const availability = db
      .prepare("SELECT is_available FROM donor_availability WHERE user_id = ?")
      .get(user.id) as { is_available: number } | undefined;

    if (availability?.is_available !== 1) {
      throw new ApiError("conflict", "Turn on your availability before accepting a request.");
    }
  }

  const timestamp = now();
  db.prepare(
    `INSERT INTO donor_request_responses (id, request_id, donor_id, response, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(request_id, donor_id) DO UPDATE SET
       response = excluded.response,
       stage = CASE WHEN excluded.response = 'accepted' THEN 'accepted' ELSE donor_request_responses.stage END,
       checkin_token_hash = NULL,
       checkin_token_expires_at = NULL,
       updated_at = excluded.updated_at`,
  ).run(generateId("resp"), row.id, user.id, input.response, timestamp, timestamp);

  response.json({ response: input.response, requestId: row.id, updatedAt: timestamp });
});

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
    compatibleDonorGroups: CAN_RECEIVE_FROM[row.blood_group],
  });
});
