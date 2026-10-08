/**
 * Donor statistics for the sign-in screen's reassurance card.
 *
 * Returns exactly the `ActiveDonorsSummary` shape the app already consumes:
 * `{total, provinces, avatarInitials, updatedAt}`. Every number here is derived
 * from real rows — there is no hard-coded "12,480" inflating the figure.
 */

import { Router } from "express";
import { z } from "zod";

import { timingSafeEqual } from "node:crypto";

import { db, now } from "../db";
import { ApiError } from "../lib/errors";
import { initialsOf, provinceOf } from "../lib/geo";
import { checkInSchema, donorStageSchema, extractionSchema, parseBody, screeningSchema } from "../lib/validate";
import { generateId, generateToken, hashToken } from "../lib/tokens";
import { requireAuth } from "../middleware/auth";
import { requireHospitalStaff } from "./hospital";
import {
  BLOOD_GROUPS,
  toEmergencyRequest,
  type BloodGroup,
  type EmergencyRequestRow,
} from "../types";

type AvailableDonor = { full_name: string; district: string | null };

/** At most this many monograms are shown before the card runs out of room. */
const AVATAR_LIMIT = 4;

export const donorsRouter = Router();

const CHECKIN_TOKEN_TTL_MS = 15 * 60 * 1000;

donorsRouter.get("/stats", (_request, response) => {
  const donors = db
    .prepare(
      `SELECT u.full_name, u.district
         FROM users u
         JOIN donor_availability d ON d.user_id = u.id
        WHERE u.role = 'donor'
          AND d.is_available = 1
          AND u.is_locked = 0
        ORDER BY u.full_name`,
    )
    .all() as AvailableDonor[];

  // Distinct provinces, in the order donors appear, so the card is stable
  // between requests rather than reshuffling.
  const provinces: string[] = [];

  for (const donor of donors) {
    const province = provinceOf(donor.district);

    if (province !== null && !provinces.includes(province)) {
      provinces.push(province);
    }
  }

  response.json({
    total: donors.length,
    provinces,
    avatarInitials: donors.slice(0, AVATAR_LIMIT).map((donor) => initialsOf(donor.full_name)),
    updatedAt: now(),
  });
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
  lastDonationAt: z.string().trim().min(1).nullable().optional(),
});

/**
 * Turns a donor's alerts on or off. A donor that is paused is excluded from
 * `/donors/stats` and from hospital dispatch lists.
 */
donorsRouter.put("/me/availability", requireAuth, (request, response) => {
  const user = request.user!;

  if (user.role !== "donor") {
    response.status(403).json({
      error: { code: "unauthorized", message: "Only donors have an availability window." },
    });
    return;
  }

  const input = parseBody(availabilitySchema, request.body);
  const timestamp = now();

  // Upsert: a donor registered before this feature existed has no row yet.
  db.prepare(
    `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       is_available = excluded.is_available,
       last_donation_at = CASE WHEN ? = 1 THEN excluded.last_donation_at ELSE donor_availability.last_donation_at END,
       updated_at = excluded.updated_at`,
  ).run(
    user.id,
    input.isAvailable ? 1 : 0,
    input.lastDonationAt ?? null,
    timestamp,
    input.lastDonationAt !== undefined ? 1 : 0,
  );

  const row = db
    .prepare("SELECT * FROM donor_availability WHERE user_id = ?")
    .get(user.id) as { is_available: number; last_donation_at: string | null };

  response.json({
    availability: {
      isAvailable: row.is_available === 1,
      lastDonationAt: row.last_donation_at,
      recordExists: true,
    },
  });
});

/** Read the donor's availability record; a missing record means paused. */
donorsRouter.get("/me/availability", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can view donor availability.", { status: 403 });
  }

  const row = db
    .prepare("SELECT is_available, last_donation_at FROM donor_availability WHERE user_id = ?")
    .get(user.id) as { is_available: number; last_donation_at: string | null } | undefined;

  response.json({
    availability: {
      isAvailable: row?.is_available === 1,
      lastDonationAt: row?.last_donation_at ?? null,
      recordExists: row !== undefined,
    },
  });
});

/** Delete the self-service record; missing availability is treated as paused. */
donorsRouter.delete("/me/availability", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can remove donor availability.", { status: 403 });
  }

  db.prepare("DELETE FROM donor_availability WHERE user_id = ?").run(user.id);
  response.json({
    availability: { isAvailable: false, lastDonationAt: null, recordExists: false },
  });
});

/** Accepted donor cases, including completed history for the donor's dashboard. */
donorsRouter.get("/me/commitments", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can view donor commitments.", { status: 403 });
  }

  const rows = db
    .prepare(
      `SELECT r.*, dr.response AS donor_response, dr.stage AS donor_stage
         FROM donor_request_responses dr
         JOIN emergency_requests r ON r.id = dr.request_id
        WHERE dr.donor_id = ? AND dr.response = 'accepted'
        ORDER BY CASE dr.stage
          WHEN 'en_route' THEN 0 WHEN 'accepted' THEN 1 WHEN 'arrived' THEN 2 ELSE 3 END,
          dr.updated_at DESC`,
    )
    .all(user.id) as EmergencyRequestRow[];

  response.json({ commitments: rows.map(toEmergencyRequest), updatedAt: now() });
});

/** Read every response the donor has created, including declined responses. */
donorsRouter.get("/me/responses", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can view donor responses.", { status: 403 });
  }

  const rows = db
    .prepare(
      `SELECT r.*, dr.response AS donor_response, dr.stage AS donor_stage,
              dr.created_at AS response_created_at, dr.updated_at AS response_updated_at
         FROM donor_request_responses dr
         JOIN emergency_requests r ON r.id = dr.request_id
        WHERE dr.donor_id = ?
        ORDER BY dr.updated_at DESC`,
    )
    .all(user.id) as (EmergencyRequestRow & {
    response_created_at: string;
    response_updated_at: string;
  })[];

  response.json({
    responses: rows.map((row) => ({
      request: toEmergencyRequest(row),
      response: row.donor_response,
      stage: row.donor_stage,
      createdAt: row.response_created_at,
      updatedAt: row.response_updated_at,
    })),
  });
});

/** The donor can only start travelling after accepting the matched request. */
donorsRouter.post("/me/commitments/:requestId/en-route", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can update donor commitments.", { status: 403 });
  }

  const result = db
    .prepare(
      `UPDATE donor_request_responses
          SET stage = 'en_route', checkin_token_hash = NULL,
              checkin_token_expires_at = NULL, updated_at = ?
        WHERE donor_id = ? AND request_id = ?
          AND response = 'accepted' AND stage = 'accepted'`,
    )
    .run(now(), user.id, request.params.requestId);

  if (result.changes === 0) {
    throw new ApiError("conflict", "Accept this open request before starting transit.");
  }

  response.json({ requestId: request.params.requestId, stage: "en_route", updatedAt: now() });
});

/** Issue a short-lived, single-use ticket for the hospital intake QR scan. */
donorsRouter.post("/me/commitments/:requestId/check-in-ticket", requireAuth, (request, response) => {
  const user = request.user!;
  if (user.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can request an intake ticket.", { status: 403 });
  }

  const commitment = db
    .prepare(
      `SELECT request_id FROM donor_request_responses
        WHERE donor_id = ? AND request_id = ?
          AND response = 'accepted' AND stage = 'en_route'`,
    )
    .get(user.id, request.params.requestId);

  if (!commitment) {
    throw new ApiError("conflict", "Start transit before opening your intake QR.");
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + CHECKIN_TOKEN_TTL_MS).toISOString();
  db.prepare(
    `UPDATE donor_request_responses
        SET checkin_token_hash = ?, checkin_token_expires_at = ?, updated_at = ?
      WHERE donor_id = ? AND request_id = ?`,
  ).run(hashToken(token), expiresAt, now(), user.id, request.params.requestId);

  response.json({
    ticket: `bloodlink-intake:${request.params.requestId}:${token}`,
    expiresAt,
  });
});

/** Hospital scan endpoint: the ticket is request-bound, expiring and single-use. */
donorsRouter.post("/requests/:requestId/check-in", requireAuth, (request, response) => {
  const staff = request.user!;
  if (staff.role !== "hospital" && staff.role !== "admin") {
    throw new ApiError("unauthorized", "Only hospital staff can verify donor intake.", { status: 403 });
  }
  if (staff.role === "hospital" && staff.is_verified !== 1) {
    throw new ApiError("unauthorized", "Your hospital account must be verified before intake.", {
      status: 403,
    });
  }

  const { token } = parseBody(checkInSchema, request.body);
  const activeTickets = db
    .prepare(
      `SELECT * FROM donor_request_responses
        WHERE request_id = ? AND response = 'accepted' AND stage = 'en_route'`,
    )
    .all(request.params.requestId) as {
    id: string;
    checkin_token_hash: string | null;
    checkin_token_expires_at: string | null;
  }[];
  const presentedHash = Buffer.from(hashToken(token));
  const timestamp = now();
  const matchedTicket = activeTickets.find((candidate) => {
    if (
      !candidate.checkin_token_hash ||
      !candidate.checkin_token_expires_at ||
      candidate.checkin_token_expires_at <= timestamp
    ) {
      return false;
    }

    const expectedHash = Buffer.from(candidate.checkin_token_hash);
    return presentedHash.length === expectedHash.length && timingSafeEqual(presentedHash, expectedHash);
  });

  if (!matchedTicket) {
    throw new ApiError("unauthorized", "This intake QR is invalid or has expired.", { status: 403 });
  }

  db.prepare(
    `UPDATE donor_request_responses
        SET stage = 'arrived', checkin_token_hash = NULL,
            checkin_token_expires_at = NULL, updated_at = ?
      WHERE id = ?`,
  ).run(timestamp, matchedTicket.id);

  response.json({ requestId: request.params.requestId, stage: "arrived", checkedInAt: timestamp });
});

/**
 * Directory for the Find Donors page. Privacy-safe by construction: only
 * available donors, and only initials + blood group + district — no names,
 * contacts or identifiers that could be used to reach someone off-platform.
 */
donorsRouter.get("/directory", requireAuth, (request, response) => {
  const requestedGroup =
    typeof request.query.bloodGroup === "string" ? request.query.bloodGroup : null;
  const district = typeof request.query.district === "string" ? request.query.district : null;

  const filters = ["u.role = 'donor'", "u.is_locked = 0", "d.is_available = 1"];
  const params: string[] = [];

  if (requestedGroup && (BLOOD_GROUPS as readonly string[]).includes(requestedGroup)) {
    filters.push("u.blood_group = ?");
    params.push(requestedGroup);
  }

  if (district) {
    filters.push("u.district = ?");
    params.push(district);
  }

  const rows = db
    .prepare(
      `SELECT u.full_name, u.blood_group, u.district
         FROM users u
         JOIN donor_availability d ON d.user_id = u.id
        WHERE ${filters.join(" AND ")}
        ORDER BY u.full_name
        LIMIT 50`,
    )
    .all(...params) as { full_name: string; blood_group: BloodGroup | null; district: string | null }[];

  response.json({
    donors: rows
      .filter((row) => row.blood_group !== null)
      .map((row) => ({
        initials: initialsOf(row.full_name),
        bloodGroup: row.blood_group,
        district: row.district,
      })),
    count: rows.length,
  });
});

/** Read the accepted donor's commitment for one request, including workflow state. */
donorsRouter.get("/requests/:requestId/commitment", requireAuth, (request, response) => {
  const user = request.user!;

  const row = db
    .prepare(
      `SELECT r.*, dr.response AS donor_response, dr.stage AS donor_stage, dr.id AS response_id
         FROM donor_request_responses dr
         JOIN emergency_requests r ON r.id = dr.request_id
        WHERE dr.request_id = ? AND dr.response = 'accepted'`,
    )
    .get(request.params.requestId) as (EmergencyRequestRow & { response_id: string }) | undefined;

  if (!row) {
    throw new ApiError("not_found", "No donor has accepted this request.");
  }

  // Donors may read only their own commitment; staff may read any case they
  // are triaging.
  const isStaff = user.role === "hospital" || user.role === "admin";
  if (!isStaff) {
    const donorId = db
      .prepare("SELECT donor_id FROM donor_request_responses WHERE id = ?")
      .get(row.response_id) as { donor_id: string } | undefined;

    if (donorId?.donor_id !== user.id) {
      throw new ApiError("unauthorized", "You cannot read this commitment.", { status: 403 });
    }
  }

  response.json({
    request: toEmergencyRequest(row),
    response: { id: row.response_id, stage: row.donor_stage },
  });
});

/** Record intake vitals for the accepted donor; replaces nothing — history. */
donorsRouter.post("/requests/:requestId/screening", requireAuth, (request, response) => {
  const staff = request.user!;
  requireHospitalStaff(staff);

  const commitment = db
    .prepare(
      `SELECT id, stage FROM donor_request_responses
        WHERE request_id = ? AND response = 'accepted'`,
    )
    .get(request.params.requestId) as { id: string; stage: string } | undefined;

  if (!commitment) {
    throw new ApiError("not_found", "No donor has accepted this request.");
  }
  if (commitment.stage !== "arrived") {
    throw new ApiError("conflict", "Check the donor in before recording vitals.");
  }

  const input = parseBody(screeningSchema, request.body);
  const timestamp = now();

  db.prepare(
    `INSERT INTO donor_screening
       (id, response_id, temperature, blood_pressure, pulse, hemoglobin,
        eligible, bed_label, screened_by_user_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    generateId("scr"),
    commitment.id,
    input.temperature ?? null,
    input.bloodPressure ?? null,
    input.pulse ?? null,
    input.hemoglobin ?? null,
    input.eligible ? 1 : 0,
    input.bedLabel ?? null,
    staff.id,
    timestamp,
  );

  response.status(201).json({
    screening: { eligible: input.eligible, createdAt: timestamp },
    stage: commitment.stage,
  });
});

/** Start the extraction session after an eligible screening. */
donorsRouter.post("/requests/:requestId/extraction", requireAuth, (request, response) => {
  const staff = request.user!;
  requireHospitalStaff(staff);

  const commitment = db
    .prepare(
      `SELECT id, stage FROM donor_request_responses
        WHERE request_id = ? AND response = 'accepted'`,
    )
    .get(request.params.requestId) as { id: string; stage: string } | undefined;

  if (!commitment) throw new ApiError("not_found", "No donor has accepted this request.");
  if (commitment.stage !== "arrived") {
    throw new ApiError("conflict", "The donor must be checked in first.");
  }

  const screening = db
    .prepare(
      `SELECT eligible FROM donor_screening WHERE response_id = ?
        ORDER BY created_at DESC LIMIT 1`,
    )
    .get(commitment.id) as { eligible: number } | undefined;

  if (!screening) throw new ApiError("conflict", "Record the screening before starting collection.");
  if (screening.eligible !== 1) {
    throw new ApiError("conflict", "This donor was not cleared for collection.");
  }

  const running = db
    .prepare(
      `SELECT 1 FROM extraction_sessions WHERE response_id = ? AND status = 'in_progress'`,
    )
    .get(commitment.id);
  if (running) throw new ApiError("conflict", "A collection session is already running.");

  const timestamp = now();
  const id = generateId("ext");

  db.prepare(
    `INSERT INTO extraction_sessions (id, response_id, status, started_at, created_at)
     VALUES (?, ?, 'in_progress', ?, ?)`,
  ).run(id, commitment.id, timestamp, timestamp);

  response.status(201).json({ extraction: { id, status: "in_progress", startedAt: timestamp } });
});

/** Close the running session with the volume actually collected. */
donorsRouter.patch("/requests/:requestId/extraction", requireAuth, (request, response) => {
  const staff = request.user!;
  requireHospitalStaff(staff);

  const input = parseBody(extractionSchema, request.body);
  const timestamp = now();

  const running = db
    .prepare(
      `SELECT es.id FROM extraction_sessions es
         JOIN donor_request_responses dr ON dr.id = es.response_id
        WHERE dr.request_id = ? AND es.status = 'in_progress'
        ORDER BY es.started_at DESC LIMIT 1`,
    )
    .get(request.params.requestId) as { id: string } | undefined;

  if (!running) throw new ApiError("conflict", "There is no collection session to complete.");

  db.prepare(
    `UPDATE extraction_sessions
        SET status = 'completed', volume_ml = ?, phlebotomist_name = ?, completed_at = ?
      WHERE id = ?`,
  ).run(input.volumeMl, input.phlebotomistName ?? null, timestamp, running.id);

  response.json({
    extraction: { id: running.id, status: "completed", volumeMl: input.volumeMl, completedAt: timestamp },
  });
});

/** Hospital staff finish the case after confirming intake. */
donorsRouter.post("/requests/:requestId/complete", requireAuth, (request, response) => {
  const staff = request.user!;
  if (staff.role !== "hospital" && staff.role !== "admin") {
    throw new ApiError("unauthorized", "Only hospital staff can complete donor intake.", { status: 403 });
  }
  if (staff.role === "hospital" && staff.is_verified !== 1) {
    throw new ApiError("unauthorized", "Your hospital account must be verified before intake.", {
      status: 403,
    });
  }

  const timestamp = now();
  const updated = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE donor_request_responses SET stage = 'completed', updated_at = ?
          WHERE request_id = ? AND response = 'accepted' AND stage = 'arrived'`,
      )
      .run(timestamp, request.params.requestId);

    if (result.changes === 0) return false;

    db.prepare(
      `UPDATE emergency_requests SET status = 'fulfilled', updated_at = ?
        WHERE id = ? AND status IN ('pending', 'verified')`,
    ).run(timestamp, request.params.requestId);
    return true;
  })();

  if (!updated) {
    throw new ApiError("conflict", "The donor must be checked in before completing this request.");
  }

  response.json({ requestId: request.params.requestId, stage: "completed", completedAt: timestamp });
});
