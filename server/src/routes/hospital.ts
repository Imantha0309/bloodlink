/**
 * Hospital operations: district stock and per-case donor workflow.
 *
 * The intake pipeline mirrors the stages the donor app walks through —
 * `accepted → en_route → arrived → completed`. This router covers what the
 * hospital screens need after check-in: vitals screening, the extraction
 * session, and the live candidate counts behind the transmission screen.
 */

import { Router } from "express";

import { db, now } from "../db";
import { asyncHandler } from "../lib/async-handler";
import { ApiError } from "../lib/errors";
import { CAN_RECEIVE_FROM } from "../lib/blood-compatibility";
import { generateId } from "../lib/tokens";
import {
  extractionSchema,
  inventoryUnitsSchema,
  parseBody,
  screeningSchema,
} from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { toEmergencyRequest, type EmergencyRequestRow, type UserRow } from "../types";

export const hospitalRouter = Router();

/** Hospitals must be admin-verified before they may touch stock or patients. */
export function requireHospitalStaff(user: UserRow): void {
  if (user.role !== "hospital" && user.role !== "admin") {
    throw new ApiError("unauthorized", "Only hospital staff can do that.", { status: 403 });
  }

  if (user.role === "hospital" && user.is_verified !== 1) {
    throw new ApiError("unauthorized", "Your hospital account must be verified first.", {
      status: 403,
    });
  }
}

/** A hospital sees its own district; an admin sees everything. */
function assertBankInScope(user: UserRow, bankDistrict: string): void {
  if (user.role === "admin") return;
  if (user.district !== bankDistrict) {
    throw new ApiError("unauthorized", "That blood bank is outside your district.", {
      status: 403,
    });
  }
}

type BankRow = { id: string; name: string; district: string };

type InventoryRow = {
  blood_group: string;
  component: string;
  units: number;
  updated_at: string;
};

function banksInScope(user: UserRow): BankRow[] {
  if (user.role === "admin" || !user.district) {
    return db.prepare("SELECT id, name, district FROM blood_banks ORDER BY name").all() as BankRow[];
  }

  return db
    .prepare("SELECT id, name, district FROM blood_banks WHERE district = ? ORDER BY name")
    .all(user.district) as BankRow[];
}

function bankInventory(bankId: string): InventoryRow[] {
  return db
    .prepare(
      `SELECT blood_group, component, units, updated_at
         FROM blood_inventory
        WHERE blood_bank_id = ?
        ORDER BY blood_group, component`,
    )
    .all(bankId) as InventoryRow[];
}

/**
 * The storage screen: every bank the staff member may manage, each with its
 * full matrix of stock rows.
 */
hospitalRouter.get("/inventory", requireAuth, (request, response) => {
  const user = request.user!;
  requireHospitalStaff(user);

  response.json({
    banks: banksInScope(user).map((bank) => ({
      id: bank.id,
      name: bank.name,
      district: bank.district,
      inventory: bankInventory(bank.id).map((row) => ({
        bloodGroup: row.blood_group,
        component: row.component,
        units: row.units,
        updatedAt: row.updated_at,
      })),
    })),
    updatedAt: now(),
  });
});

/** Adjust one stock line — a restock, a reservation, or a correction. */
hospitalRouter.put(
  "/inventory/:bankId/:bloodGroup/:component",
  requireAuth,
  asyncHandler(async (request, response) => {
    const user = request.user!;
    requireHospitalStaff(user);

    const { bankId, bloodGroup, component } = request.params;
    const bank = db.prepare("SELECT * FROM blood_banks WHERE id = ?").get(bankId) as
      | { id: string; district: string }
      | undefined;

    if (!bank) throw new ApiError("not_found", "That blood bank could not be found.");
    assertBankInScope(user, bank.district);

    const { units } = parseBody(inventoryUnitsSchema, request.body);
    const timestamp = now();

    db.prepare(
      `INSERT INTO blood_inventory (id, blood_bank_id, blood_group, component, units, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(blood_bank_id, blood_group, component)
       DO UPDATE SET units = excluded.units, updated_at = excluded.updated_at`,
    ).run(generateId("inv"), bankId, bloodGroup, component, units, timestamp);

    response.json({
      inventory: {
        bloodBankId: bankId,
        bloodGroup,
        component,
        units,
        updatedAt: timestamp,
      },
    });
  }),
);

/**
 * Live numbers behind the transmission screen: who is reachable, who has
 * accepted, and how far the accepted donor has got.
 */
hospitalRouter.get("/requests/:id/candidates", requireAuth, (request, response) => {
  const user = request.user!;
  requireHospitalStaff(user);

  const requestRow = db
    .prepare("SELECT * FROM emergency_requests WHERE id = ?")
    .get(request.params.id) as EmergencyRequestRow | undefined;

  if (!requestRow) throw new ApiError("not_found", "That request could not be found.");

  const compatible = CAN_RECEIVE_FROM[requestRow.blood_group];
  const placeholders = compatible.map(() => "?").join(", ") || "NULL";

  const available = db
    .prepare(
      `SELECT COUNT(*) AS n FROM users u
         JOIN donor_availability d ON d.user_id = u.id
        WHERE u.role = 'donor' AND u.is_locked = 0 AND d.is_available = 1
          AND u.blood_group IN (${placeholders})`,
    )
    .get(...compatible) as { n: number };

  const responses = db
    .prepare(
      `SELECT
         SUM(CASE WHEN response = 'accepted' THEN 1 ELSE 0 END) AS accepted,
         SUM(CASE WHEN response = 'accepted'
                   AND stage IN ('en_route','arrived','completed') THEN 1 ELSE 0 END) AS moving
       FROM donor_request_responses WHERE request_id = ?`,
    )
    .get(requestRow.id) as { accepted: number | null; moving: number | null };

  response.json({
    requestId: requestRow.id,
    status: requestRow.status,
    bloodGroup: requestRow.blood_group,
    compatibleAvailable: available.n,
    accepted: responses.accepted ?? 0,
    enRoute: responses.moving ?? 0,
    updatedAt: now(),
  });
});

/** The accepted donor's commitment for one request, with workflow state. */
hospitalRouter.get("/requests/:id/responses", requireAuth, (request, response) => {
  const user = request.user!;
  requireHospitalStaff(user);

  const requestRow = db
    .prepare("SELECT * FROM emergency_requests WHERE id = ?")
    .get(request.params.id) as EmergencyRequestRow | undefined;

  if (!requestRow) throw new ApiError("not_found", "That request could not be found.");

  const responseRow = db
    .prepare(
      `SELECT dr.*, u.full_name, u.blood_group, u.district
         FROM donor_request_responses dr
         JOIN users u ON u.id = dr.donor_id
        WHERE dr.request_id = ? AND dr.response = 'accepted'`,
    )
    .get(requestRow.id) as
    | {
        id: string;
        donor_id: string;
        stage: string;
        created_at: string;
        full_name: string;
        blood_group: string | null;
        district: string | null;
      }
    | undefined;

  const screening = responseRow
    ? (db
        .prepare(
          `SELECT * FROM donor_screening WHERE response_id = ?
            ORDER BY created_at DESC LIMIT 1`,
        )
        .get(responseRow.id) as Record<string, unknown> | undefined)
    : undefined;

  const extraction = responseRow
    ? (db
        .prepare(
          `SELECT * FROM extraction_sessions WHERE response_id = ?
            ORDER BY started_at DESC LIMIT 1`,
        )
        .get(responseRow.id) as Record<string, unknown> | undefined)
    : undefined;

  response.json({
    request: toEmergencyRequest(requestRow),
    response: responseRow
      ? { id: responseRow.id, stage: responseRow.stage, acceptedAt: responseRow.created_at }
      : null,
    donor: responseRow
      ? {
          id: responseRow.donor_id,
          fullName: responseRow.full_name,
          bloodGroup: responseRow.blood_group,
          district: responseRow.district,
        }
      : null,
    screening: screening
      ? {
          temperature: screening.temperature,
          bloodPressure: screening.blood_pressure,
          pulse: screening.pulse,
          hemoglobin: screening.hemoglobin,
          eligible: screening.eligible === 1,
          bedLabel: screening.bed_label,
          createdAt: screening.created_at,
        }
      : null,
    extraction: extraction
      ? {
          status: extraction.status,
          volumeMl: extraction.volume_ml,
          phlebotomistName: extraction.phlebotomist_name,
          startedAt: extraction.started_at,
          completedAt: extraction.completed_at,
        }
      : null,
    updatedAt: now(),
  });
});
