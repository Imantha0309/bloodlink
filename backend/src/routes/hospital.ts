/**
 * Hospital-scoped operations: district stock, transmission candidates, the
 * accepted donor's case file, and the two append-only logs a desk keeps — shift
 * handovers and transfusion discrepancies.
 *
 * Everything here is staff-only, and a verified hospital is confined to its own
 * district — the same gate the SQL used, checked once at the top of each handler
 * rather than repeated inside every query. An admin is scoped to nothing.
 */

import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { assertCanManageBank, assertStaff, districtFilter } from "../domain/access";
import { donorsForRecipient, isBloodGroup } from "../domain/compatibility";
import { discrepancyRow, handoverRow, inventoryRow, requestRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { validateBody, param } from "../middleware/validate";
import { BloodBank } from "../models/blood-bank";
import { BloodInventory } from "../models/blood-inventory";
import { DiscrepancyReport } from "../models/discrepancy-report";
import { DonorAvailability } from "../models/donor-availability";
import { DonorRequestResponse } from "../models/donor-request-response";
import { DonorScreening } from "../models/donor-screening";
import { EmergencyRequest, type EmergencyRequestDoc } from "../models/emergency-request";
import { ExtractionSession } from "../models/extraction-session";
import { ShiftHandover } from "../models/shift-handover";
import {
  BLOOD_COMPONENTS,
  DISCREPANCY_SEVERITIES,
  DISCREPANCY_TYPES,
  STAFF_STATIONS,
} from "../models/shared";
import { User } from "../models/user";

export const hospitalRouter = Router();

/** How many rows a list route returns in one page. */
const PAGE_LIMIT = 100;

/** Every bank this staff member may manage, each wrapped for the app's reader. */
hospitalRouter.get(
  "/inventory",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    // An admin manages the whole country; a hospital only its own district.
    const filter = districtFilter(user);

    const banks = await BloodBank.find(filter).sort({ name: 1 });

    const inventory = await BloodInventory.find({ bank: { $in: banks.map((bank) => bank._id) } }).sort({
      bloodGroup: 1,
      component: 1,
    });

    const byBank = new Map<string, ReturnType<typeof inventoryRow>[]>();

    for (const row of inventory) {
      const key = String(row.bank);
      const list = byBank.get(key) ?? [];

      list.push(inventoryRow(row));
      byBank.set(key, list);
    }

    res.json({
      banks: banks.map((bank) => ({
        bank: {
          id: String(bank._id),
          name: bank.name,
          district: bank.district,
          inventory: byBank.get(String(bank._id)) ?? [],
        },
      })),
    });
  }),
);

/** Restocks, reserves or corrects one stock line. */
hospitalRouter.put(
  "/inventory/:bankId/:bloodGroup/:component",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const bankId = param(req, "bankId");
    const bloodGroup = param(req, "bloodGroup");
    const component = param(req, "component");

    if (!mongoose.isValidObjectId(bankId)) {
      throw fail.notFound("That blood bank could not be found.");
    }

    if (!isBloodGroup(bloodGroup) || !(BLOOD_COMPONENTS as readonly string[]).includes(component)) {
      throw fail.validation("That is not a stock line this hospital can hold.");
    }

    const bank = await BloodBank.findById(bankId);

    if (bank === null) {
      throw fail.notFound("That blood bank could not be found.");
    }

    assertCanManageBank(user, bank.district);

    const units = readUnits(req.body);

    const updated = await BloodInventory.findOneAndUpdate(
      { bank: bank._id, bloodGroup, component },
      { $set: { units } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ inventory: inventoryRow(updated) });
  }),
);

/**
 * Live numbers for the transmission screen.
 *
 * `compatibleAvailable` counts only outright donors — a recipient who set a
 * blood group is donor-eligible for alerts, but the hospital is asking "how many
 * donors can I actually call", so the narrower rule is the right one here.
 */
hospitalRouter.get(
  "/requests/:id/candidates",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const request = await findRequest(param(req, "id"));
    const groups = donorsForRecipient(request.bloodGroup);

    const donors = await User.find({ role: "donor", bloodGroup: { $in: groups } }).select("_id");

    const [compatibleAvailable, responses] = await Promise.all([
      DonorAvailability.countDocuments({
        userId: { $in: donors.map((donor) => donor._id) },
        isAvailable: true,
      }),
      DonorRequestResponse.find({ request: request._id }),
    ]);

    const accepted = responses.filter((row) => row.response === "accepted");
    const enRoute = accepted.filter((row) => row.stage !== "accepted");

    res.json({
      candidates: {
        requestId: String(request._id),
        status: request.status,
        bloodGroup: request.bloodGroup,
        compatibleAvailable,
        accepted: accepted.length,
        enRoute: enRoute.length,
      },
    });
  }),
);

/**
 * The accepted donor's case file, flattened.
 *
 * The app reads this as one flat row and reassembles it — that is the shape the
 * SQL `LIST` query returned, and reproducing it keeps the screen untouched.
 */
hospitalRouter.get(
  "/requests/:id/responses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const request = await findRequest(param(req, "id"));

    const response = await DonorRequestResponse.findOne({
      request: request._id,
      response: "accepted",
    }).sort({ updatedAt: -1 });

    const donor = response === null ? null : await User.findById(response.donor);
    const screening =
      response === null ? null : await DonorScreening.findOne({ response: response._id }).sort({ createdAt: -1 });
    const extraction =
      response === null ? null : await ExtractionSession.findOne({ response: response._id }).sort({ startedAt: -1 });

    res.json({
      workflow: {
        ...requestRow(request, {
          donorResponse: response?.response ?? null,
          donorStage: response?.stage ?? null,
          acceptedByOtherDonor: false,
        }),
        responseId: response === null ? null : String(response._id),
        stage: response?.stage ?? null,
        acceptedAt: response?.createdAt ?? null,

        donorId: donor === null ? null : String(donor._id),
        donorFullName: donor?.fullName ?? null,
        donorBloodGroup: donor?.bloodGroup ?? null,
        donorDistrict: donor?.district ?? null,

        temperature: screening?.temperature ?? null,
        bloodPressure: screening?.bloodPressure ?? null,
        pulse: screening?.pulse ?? null,
        hemoglobin: screening?.hemoglobin ?? null,
        eligible: screening?.eligible ?? null,
        bedLabel: screening?.bedLabel ?? null,
        screeningCreatedAt: screening?.createdAt ?? null,

        extractionStatus: extraction?.status ?? null,
        volumeMl: extraction?.volumeMl ?? null,
        phlebotomistName: extraction?.phlebotomistName ?? null,
        startedAt: extraction?.startedAt ?? null,
        completedAt: extraction?.completedAt ?? null,
      },
    });
  }),
);

/* ------------------------------------------------------------------ station */

/**
 * The desk this staff member is covering.
 *
 * Self-declared, not assigned: a shift swap is a fact about right now rather
 * than a permission, so there is no approval step. It is stored on the user row
 * and comes back out through `authUserRow`, which is how the app reads it back
 * without a second request.
 */
hospitalRouter.put(
  "/me/station",
  requireAuth,
  validateBody(
    z.object({
      station: z.enum(STAFF_STATIONS),
      wardLabel: z.string().trim().nullable().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const { station, wardLabel } = req.body as { station: string; wardLabel?: string | null };

    user.station = station;
    // Only the ward station carries a label, and a blank one is stored as null
    // rather than "" so "no label" has exactly one representation.
    const label = wardLabel?.trim() ?? "";
    user.wardLabel = station === "ward" && label.length > 0 ? label : null;
    await user.save();

    res.json({ station: user.station, wardLabel: user.wardLabel });
  }),
);

/* ------------------------------------------------------------ discrepancies */

/** Open reports by default; `includeResolved=true` brings the history back. */
hospitalRouter.get(
  "/discrepancies",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const includeResolved = req.query.includeResolved === "true";

    const filter: Record<string, unknown> = districtFilter(user);

    if (!includeResolved) {
      filter.resolvedAt = null;
    }

    const reports = await DiscrepancyReport.find(filter).sort({ createdAt: -1 }).limit(PAGE_LIMIT);

    res.json({ reports: reports.map(discrepancyRow) });
  }),
);

/**
 * Files a report.
 *
 * Append-only: there is no edit or delete route anywhere in this file, and there
 * will not be one. Near misses are worth reporting too, which is why nothing
 * here requires an actual harm to have occurred.
 */
hospitalRouter.post(
  "/discrepancies",
  requireAuth,
  validateBody(
    z.object({
      type: z.enum(DISCREPANCY_TYPES),
      severity: z.enum(DISCREPANCY_SEVERITIES),
      detail: z.string().trim().min(1, "Describe what happened."),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const input = req.body as { type: string; severity: string; detail: string };

    const report = await DiscrepancyReport.create({
      district: user.district ?? null,
      type: input.type,
      severity: input.severity,
      detail: input.detail,
      reporter: user._id,
      reporterName: user.fullName,
    });

    res.status(201).json({ report: discrepancyRow(report) });
  }),
);

/**
 * Marks a report dealt with.
 *
 * The report is not deleted and its text is not changed — only who closed it and
 * when. Resolving one twice is rejected rather than silently re-stamped, so the
 * log keeps the time the incident was actually closed.
 */
hospitalRouter.patch(
  "/discrepancies/:id/resolve",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    if (!mongoose.isValidObjectId(req.params.id)) {
      throw fail.notFound("That report could not be found.");
    }

    const report = await DiscrepancyReport.findOne({
      _id: req.params.id,
      ...districtFilter(user),
    });

    if (report === null) {
      throw fail.notFound("That report could not be found.");
    }

    if (report.resolvedAt !== null) {
      throw fail.conflict("That report has already been resolved.");
    }

    report.resolvedAt = new Date();
    report.resolvedBy = user._id;
    await report.save();

    res.json({ report: discrepancyRow(report) });
  }),
);

/* --------------------------------------------------------------- handovers */

/** The district's handover log, newest first. */
hospitalRouter.get(
  "/handovers",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const handovers = await ShiftHandover.find(districtFilter(user))
      .sort({ createdAt: -1 })
      .limit(PAGE_LIMIT);

    res.json({ handovers: handovers.map(handoverRow) });
  }),
);

/** Files one. Never edited afterwards — a handover records what was believed. */
hospitalRouter.post(
  "/handovers",
  requireAuth,
  validateBody(
    z.object({
      shiftLabel: z.string().trim().min(1, "Choose a shift."),
      notes: z.string().trim().min(1, "Add a note for the incoming shift."),
      pendingCrossMatches: z.number().int().min(0, "Cannot be negative."),
    }),
  ),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const input = req.body as { shiftLabel: string; notes: string; pendingCrossMatches: number };

    const handover = await ShiftHandover.create({
      district: user.district ?? null,
      shiftLabel: input.shiftLabel,
      notes: input.notes,
      pendingCrossMatches: input.pendingCrossMatches,
      author: user._id,
      authorName: user.fullName,
    });

    res.status(201).json({ handover: handoverRow(handover) });
  }),
);

/* ------------------------------------------------------------------ helpers */

async function findRequest(id: string): Promise<EmergencyRequestDoc> {
  if (!mongoose.isValidObjectId(id)) {
    throw fail.notFound("That request could not be found.");
  }

  const request = await EmergencyRequest.findById(id);

  if (request === null) {
    throw fail.notFound("That request could not be found.");
  }

  return request;
}

/** Reads `units` off the body, insisting on a whole non-negative number. */
function readUnits(body: unknown): number {
  const value = (body as { units?: unknown } | null | undefined)?.units;

  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw fail.validation("Enter the number of units in stock.", {
      units: "Enter a whole number of units.",
    });
  }

  return value;
}
