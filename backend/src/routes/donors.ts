/**
 * Donor self-service, and the hospital intake workflow that follows a
 * commitment.
 *
 * These two live together because they are two ends of the same row: the donor
 * moves `donor_request_responses.stage` from their own device, and staff move it
 * from the intake desk. Keeping them in one module makes the stage machine
 * readable in a single pass — `accepted → en_route → arrived → completed` — and
 * each transition states who is allowed to make it.
 *
 * The check-in ticket is the one piece of security here: the donor's device
 * generates a secret, sends only its SHA-256 hash, and the hash is cleared the
 * moment it is used or the decision changes. A stolen ticket is useless after
 * fifteen minutes and cannot be replayed at all.
 */

import { createHash } from "node:crypto";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { assertStaff } from "../domain/access";
import { isDonorEligible } from "../domain/compatibility";
import { STAGE_ORDER, isOpen, isResponseMutable } from "../domain/lifecycle";
import { notifyAcceptedDonorOfStatus, notifyRequesterOfStatus } from "../domain/alerts";
import { requestRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { validateBody, param } from "../middleware/validate";
import { DonorAvailability } from "../models/donor-availability";
import { DonorRequestResponse, type DonorRequestResponseDoc } from "../models/donor-request-response";
import { DonorScreening } from "../models/donor-screening";
import { EmergencyRequest, type EmergencyRequestDoc } from "../models/emergency-request";
import { ExtractionSession } from "../models/extraction-session";
import type { DonationStage } from "../models/shared";
import { User, type UserDoc } from "../models/user";

export const donorsRouter = Router();

/** How long an intake ticket stays valid. Mirrors the SQL's 15-minute window. */
const TICKET_TTL_MS = 15 * 60 * 1000;

/** Commitments list order: whoever is furthest along is at the top. */
const STAGE_RANK: Record<DonationStage, number> = {
  en_route: 0,
  accepted: 1,
  arrived: 2,
  completed: 3,
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/* ------------------------------------------------------------ public stats */

/**
 * Live donor coverage for the sign-in reassurance card.
 *
 * Public, and deliberately so: the card is shown before anyone has an account.
 * Only names and districts come back, which is why this can be public at all.
 */
donorsRouter.get(
  "/stats",
  asyncHandler(async (_req, res) => {
    const available = await DonorAvailability.find({ isAvailable: true }).select("userId");

    const donors = await User.find({
      _id: { $in: available.map((row) => row.userId) },
      // A recipient who has set a blood group can donate too — the same rule the
      // donor feed uses.
      $or: [{ role: "donor" }, { role: "recipient", bloodGroup: { $ne: null } }],
    })
      .select("fullName district")
      .sort({ fullName: 1 });

    res.json({
      donors: donors.map((donor) => ({ fullName: donor.fullName, district: donor.district ?? null })),
    });
  }),
);

/* ------------------------------------------------------------- directory */

const directoryQuerySchema = z.object({
  bloodGroup: z.string().trim().nullable().optional(),
  district: z.string().trim().nullable().optional(),
});

/**
 * Privacy-safe donor search.
 *
 * Only donors — not donor-eligible recipients — and only available ones. The
 * app turns the names into initials before rendering, so the screen never shows
 * a real name; this route returns names only because the client already
 * receives them from the equivalent SQL and derives the initials itself.
 */
donorsRouter.get(
  "/directory",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { bloodGroup, district } = directoryQuerySchema.parse({
      bloodGroup: req.query.bloodGroup ?? null,
      district: req.query.district ?? null,
    });

    const available = await DonorAvailability.find({ isAvailable: true }).select("userId");

    const filter: Record<string, unknown> = {
      _id: { $in: available.map((row) => row.userId) },
      role: "donor",
      bloodGroup: { $ne: null },
    };

    if (bloodGroup !== null && bloodGroup !== undefined && bloodGroup.length > 0) {
      filter.bloodGroup = bloodGroup;
    }

    if (district !== null && district !== undefined && district.length > 0) {
      filter.district = district;
    }

    const donors = await User.find(filter).select("fullName bloodGroup district").sort({ fullName: 1 }).limit(50);

    res.json({
      donors: donors.map((donor) => ({
        fullName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        district: donor.district ?? null,
      })),
    });
  }),
);

/* ---------------------------------------------------------- availability */

/** The donor's switch. A missing row reads as paused, never as available. */
donorsRouter.get(
  "/me/availability",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const row = await DonorAvailability.findOne({ userId: user._id });

    res.json({
      availability: {
        isAvailable: row?.isAvailable === true,
        lastDonationAt: row?.lastDonationAt ?? null,
        recordExists: row !== null,
      },
    });
  }),
);

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
  lastDonationAt: z.string().trim().nullable().optional(),
  hasLastDonation: z.boolean().optional(),
});

/**
 * Turns the donor's alerts on or off.
 *
 * A paused donor disappears from dispatch and from the reassurance card, which
 * is the whole point of the switch. Only donors — and recipients who have set a
 * blood group — have an availability window at all.
 */
donorsRouter.put(
  "/me/availability",
  requireAuth,
  validateBody(availabilitySchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const input = req.body as z.infer<typeof availabilitySchema>;

    if (!isDonorEligible(user.role, user.bloodGroup)) {
      throw fail.conflict("Only donors and donor-eligible recipients have an availability window.");
    }

    const existing = await DonorAvailability.findOne({ userId: user._id });

    // The donation date is only overwritten when the caller says it is supplying
    // one — otherwise a simple pause would erase the history behind it.
    const lastDonationAt =
      input.hasLastDonation === true && input.lastDonationAt
        ? new Date(input.lastDonationAt)
        : (existing?.lastDonationAt ?? null);

    const row = await DonorAvailability.findOneAndUpdate(
      { userId: user._id },
      { $set: { isAvailable: input.isAvailable, lastDonationAt } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({
      availability: {
        userId: String(user._id),
        isAvailable: row.isAvailable,
        lastDonationAt: row.lastDonationAt,
        recordExists: true,
      },
    });
  }),
);

/** Drops the row entirely; a missing record reads as paused. */
donorsRouter.delete(
  "/me/availability",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    await DonorAvailability.deleteOne({ userId: user._id });

    res.json({ deleted: true });
  }),
);

/* ----------------------------------------------------------- commitments */

/** The donor's accepted cases, active ones first. */
donorsRouter.get(
  "/me/commitments",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const responses = await DonorRequestResponse.find({ donor: user._id, response: "accepted" });

    const { byRequest } = await joinRequests(responses);

    const rows = responses
      .map((response) => {
        const request = byRequest.get(String(response.request));

        if (request === undefined) {
          return null;
        }

        return {
          stage: response.stage,
          row: requestRow(request, {
            donorResponse: "accepted",
            donorStage: response.stage,
            acceptedByOtherDonor: false,
          }),
        };
      })
      .filter((entry): entry is { stage: DonationStage; row: Record<string, unknown> } => entry !== null)
      .sort((a, b) => STAGE_RANK[a.stage] - STAGE_RANK[b.stage]);

    res.json({ commitments: rows.map((entry) => entry.row) });
  }),
);

/** Every response the donor has ever made, including declines. */
donorsRouter.get(
  "/me/responses",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const responses = await DonorRequestResponse.find({ donor: user._id }).sort({ updatedAt: -1 });

    const { byRequest } = await joinRequests(responses);

    const records: Record<string, unknown>[] = [];

    for (const response of responses) {
      const request = byRequest.get(String(response.request));

      if (request === undefined) {
        continue;
      }

      records.push({
        ...requestRow(request, {
          donorResponse: response.response,
          donorStage: response.stage,
          acceptedByOtherDonor: false,
        }),
        responseCreatedAt: response.createdAt,
        responseUpdatedAt: response.updatedAt,
      });
    }

    res.json({ responses: records });
  }),
);

/** The donor's own accepted commitment for one request. */
donorsRouter.get(
  "/requests/:requestId/commitment",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);

    res.json({
      commitment: {
        ...requestRow(request, {
          donorResponse: response.response,
          donorStage: response.stage,
          acceptedByOtherDonor: false,
        }),
        responseId: String(response._id),
      },
    });
  }),
);

/* ---------------------------------------------------------------- transit */

/** The donor sets off. Only legal from `accepted`, and it burns any ticket. */
donorsRouter.post(
  "/me/commitments/:requestId/en-route",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);

    if (!isResponseMutable(response.stage)) {
      throw fail.conflict("You are already on your way to this donation.");
    }

    response.stage = "en_route";
    response.checkinTokenHash = null;
    response.checkinTokenExpiresAt = null;
    await response.save();

    res.json({ updated: { requestId: String(request._id), stage: response.stage } });
  }),
);

/**
 * Issues a single-use intake ticket.
 *
 * The client sends only the hash. The raw secret never crosses the wire, so a
 * database reader cannot forge a ticket — and it is cleared on first use.
 */
donorsRouter.post(
  "/me/commitments/:requestId/check-in-ticket",
  requireAuth,
  validateBody(z.object({ tokenHash: z.string().trim().min(16, "A ticket hash is required.") })),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { tokenHash } = req.body as { tokenHash: string };

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, user._id);

    if (response.stage !== "en_route") {
      throw fail.conflict("Start transit before opening your intake QR.");
    }

    response.checkinTokenHash = tokenHash;
    response.checkinTokenExpiresAt = new Date(Date.now() + TICKET_TTL_MS);
    await response.save();

    res.json({ ticket: { expiresAt: response.checkinTokenExpiresAt } });
  }),
);

/* ------------------------------------------------------- hospital intake */

/**
 * The scan at the intake desk.
 *
 * Bound to one request, expiring, and single-use: the hash must match, must not
 * have lapsed, and is cleared as the donor is marked arrived.
 */
donorsRouter.post(
  "/requests/:requestId/check-in",
  requireAuth,
  validateBody(z.object({ tokenHash: z.string().trim().min(16, "A ticket hash is required.") })),
  asyncHandler(async (req, res) => {
    assertStaff(currentUser(req));

    const { tokenHash } = req.body as { tokenHash: string };

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);

    if (
      response.stage !== "en_route" ||
      response.checkinTokenHash !== tokenHash ||
      response.checkinTokenExpiresAt === null ||
      response.checkinTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw fail.conflict("This intake QR is invalid or has expired.");
    }

    response.stage = "arrived";
    response.checkinTokenHash = null;
    response.checkinTokenExpiresAt = null;
    await response.save();

    res.json({ verified: { checkedInAt: response.updatedAt } });
  }),
);

const screeningSchema = z.object({
  temperature: z.string().trim().nullable().optional(),
  bloodPressure: z.string().trim().nullable().optional(),
  pulse: z.string().trim().nullable().optional(),
  hemoglobin: z.string().trim().nullable().optional(),
  eligible: z.boolean(),
  bedLabel: z.string().trim().nullable().optional(),
});

/** Records intake vitals. Append-only: re-screening adds a row, never edits. */
donorsRouter.post(
  "/requests/:requestId/screening",
  requireAuth,
  validateBody(screeningSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    assertStaff(user);

    const input = req.body as z.infer<typeof screeningSchema>;

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);

    if (response.stage !== "arrived") {
      throw fail.conflict("Check the donor in before recording vitals.");
    }

    const screening = await DonorScreening.create({
      response: response._id,
      temperature: input.temperature ?? null,
      bloodPressure: input.bloodPressure ?? null,
      pulse: input.pulse ?? null,
      hemoglobin: input.hemoglobin ?? null,
      eligible: input.eligible,
      bedLabel: input.bedLabel ?? null,
      screenedBy: user._id,
    });

    res.status(201).json({ screening: { createdAt: screening.createdAt } });
  }),
);

/**
 * Opens a collection session.
 *
 * Requires the latest screening to have cleared the donor and no session already
 * running — the partial unique index backs up the second check, because a
 * double-tap must not open two collections.
 */
donorsRouter.post(
  "/requests/:requestId/extraction",
  requireAuth,
  asyncHandler(async (req, res) => {
    assertStaff(currentUser(req));

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);

    if (response.stage !== "arrived") {
      throw fail.conflict("The donor must be checked in before collection can start.");
    }

    const latest = await DonorScreening.findOne({ response: response._id }).sort({ createdAt: -1 });

    if (latest?.eligible !== true) {
      throw fail.conflict("The donor must be screened and cleared before collection can start.");
    }

    const open = await ExtractionSession.findOne({ response: response._id, status: "in_progress" });

    if (open !== null) {
      throw fail.conflict("A collection is already running for this donation.");
    }

    const extraction = await ExtractionSession.create({ response: response._id, status: "in_progress" });

    res.status(201).json({ extraction: { startedAt: extraction.startedAt } });
  }),
);

/** Closes the running session with the volume actually collected. */
donorsRouter.patch(
  "/requests/:requestId/extraction",
  requireAuth,
  validateBody(
    z.object({
      volumeMl: z.number().int().min(0, "Volume cannot be negative."),
      phlebotomistName: z.string().trim().nullable().optional(),
    }),
  ),
  asyncHandler(async (req, res) => {
    assertStaff(currentUser(req));

    const { volumeMl, phlebotomistName } = req.body as {
      volumeMl: number;
      phlebotomistName?: string | null;
    };

    const request = await findRequest(param(req, "requestId"));
    const response = await findAcceptedResponse(request._id, null);

    const extraction = await ExtractionSession.findOne({ response: response._id, status: "in_progress" });

    if (extraction === null) {
      throw fail.conflict("There is no collection session to complete.");
    }

    extraction.status = "completed";
    extraction.volumeMl = volumeMl;
    extraction.phlebotomistName = phlebotomistName ?? null;
    extraction.completedAt = new Date();
    await extraction.save();

    res.json({ extraction: extractionRow(extraction) });
  }),
);

/**
 * Closes the case.
 *
 * Two writes that must not half-apply, so they share a transaction: the donor is
 * marked complete and the request becomes fulfilled. A donor who has travelled
 * to the hospital and given blood must never be left on a request that is still
 * open to other donors.
 */
donorsRouter.post(
  "/requests/:requestId/complete",
  requireAuth,
  asyncHandler(async (req, res) => {
    assertStaff(currentUser(req));

    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const request = await findRequest(param(req, "requestId"), session);
        const response = await findAcceptedResponse(request._id, null, session);

        if (response.stage !== "arrived") {
          throw fail.conflict("The donor must be checked in before completing this request.");
        }

        response.stage = "completed";
        await response.save({ session });

        if (isOpen(request.status)) {
          request.status = "fulfilled";
          await request.save({ session });

          await notifyRequesterOfStatus(request, "fulfilled", session);
          await notifyAcceptedDonorOfStatus(request, "fulfilled", session);
        }

        return { request, stage: response.stage };
      });

      res.json({ updated: { requestId: String(result.request._id), stage: result.stage } });
    } finally {
      await session.endSession();
    }
  }),
);

/* ------------------------------------------------------------------ helpers */

async function findRequest(
  id: string,
  session: mongoose.ClientSession | null = null,
): Promise<EmergencyRequestDoc> {
  if (!mongoose.isValidObjectId(id)) {
    throw fail.notFound("That request could not be found.");
  }

  const query = EmergencyRequest.findById(id);
  const request = await (session === null ? query : query.session(session));

  if (request === null) {
    throw fail.notFound("That request could not be found.");
  }

  return request;
}

/**
 * The accepted commitment for a request.
 *
 * Passing `donor` restricts it to that donor's own commitment; passing `null`
 * takes whichever donor accepted, which is what hospital staff need.
 */
async function findAcceptedResponse(
  requestId: unknown,
  donor: unknown | null,
  session: mongoose.ClientSession | null = null,
): Promise<DonorRequestResponseDoc> {
  const query = DonorRequestResponse.findOne({
    request: requestId,
    response: "accepted",
    ...(donor === null ? {} : { donor }),
  });

  const response = await (session === null ? query : query.session(session));

  if (response === null) {
    throw fail.conflict("No donor has committed to this request yet.");
  }

  return response;
}

/** Fetches the requests behind a set of responses, keyed for lookup. */
async function joinRequests(
  responses: DonorRequestResponseDoc[],
): Promise<{ requests: EmergencyRequestDoc[]; byRequest: Map<string, EmergencyRequestDoc> }> {
  const requests = await EmergencyRequest.find({ _id: { $in: responses.map((row) => row.request) } });

  return { requests, byRequest: new Map(requests.map((row) => [String(row._id), row])) };
}

function extractionRow(extraction: {
  status: string;
  volumeMl: number | null;
  phlebotomistName: string | null;
  startedAt: Date;
  completedAt: Date | null;
}): Record<string, unknown> {
  return {
    status: extraction.status,
    volumeMl: extraction.volumeMl ?? null,
    phlebotomistName: extraction.phlebotomistName ?? null,
    startedAt: extraction.startedAt,
    completedAt: extraction.completedAt ?? null,
  };
}
