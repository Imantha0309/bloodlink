/**
 * Emergency requests — the heart of the app.
 *
 * Every rule here came out of a SQL `WHERE` clause in the retired Data Connect
 * connector. The clauses were safe but silent: an illegal move produced an empty
 * result set, so the app could only say "that didn't work". Each rule is now an
 * explicit check with its own message, which is what the screens display.
 *
 * Three writes fan out alerts and therefore run in a transaction, matching the
 * `@transaction` they used to sit inside: a rolled-back response must never
 * leave a requester holding an alert about something that did not happen.
 */

import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { assertStaff, districtFilter, ownsRequest } from "../domain/access";
import {
  notifyAcceptedDonorOfStatus,
  notifyCompatibleDonors,
  notifyRequesterOfAcceptance,
  notifyRequesterOfStatus,
} from "../domain/alerts";
import { donorsForRecipient, isBloodGroup, isDonorEligible, requestsForDonor } from "../domain/compatibility";
import { assertTransition } from "../domain/lifecycle";
import { requestRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { currentUser, optionalAuth, requireAuth } from "../middleware/auth";
import { validateBody, param } from "../middleware/validate";
import { DonorAvailability } from "../models/donor-availability";
import { DonorRequestResponse } from "../models/donor-request-response";
import { EmergencyRequest, type EmergencyRequestDoc } from "../models/emergency-request";
import { URGENCY_LEVELS, type UrgencyLevel } from "../models/shared";
import type { UserDoc } from "../models/user";

export const emergencyRouter = Router();

/** Sort weight for the feed and triage queue; `critical` floats to the top. */
const URGENCY_RANK: Record<UrgencyLevel, number> = { critical: 0, urgent: 1, standard: 2 };

/** Newest first, but only after the more urgent requests have been served. */
function byUrgencyThenNewest(a: EmergencyRequestDoc, b: EmergencyRequestDoc): number {
  const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];

  return rank !== 0 ? rank : b.createdAt.getTime() - a.createdAt.getTime();
}

/* ------------------------------------------------------------------- schemas */

const createSchema = z.object({
  patientName: z.string().trim().min(2, "Enter the patient's name."),
  bloodGroup: z.string().trim(),
  units: z.number().int().min(1, "At least one unit is needed.").max(20, "That is more than one request can carry."),
  hospital: z.string().trim().min(2, "Enter the hospital."),
  district: z.string().trim().nullable().optional(),
  registrationNumber: z.string().trim().nullable().optional(),
  contactName: z.string().trim().min(2, "Enter a contact name."),
  contactMobile: z.string().trim().min(6, "Enter a contact number."),
  urgency: z.enum(URGENCY_LEVELS),
  notes: z.string().trim().nullable().optional(),
});

const statusSchema = z.object({
  status: z.enum(["pending", "verified", "fulfilled", "cancelled"]),
});

const responseSchema = z.object({
  response: z.enum(["accepted", "declined"]),
});

/* --------------------------------------------------------------- list routes */

/**
 * The role-branched list.
 *
 * A donor sees the open requests their blood can serve, staff see the queue they
 * are standing at, and a recipient sees the requests they raised. The old SQL
 * expressed this as three separate queries with the caller's identity baked into
 * the `WHERE`; here it is one route that picks a branch, because the app has
 * always called it as one function.
 *
 * `?mine=true` pins the third branch for any role. That matters because a
 * recipient who has set a blood group is also donor-eligible, and the recipient
 * screens — "every emergency request you have raised" — would otherwise be
 * handed the donor feed and present strangers' requests as their own.
 */
emergencyRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    /** The requests this user raised, which is its own list for a recipient. */
    const ownRequests = async () =>
      (await EmergencyRequest.find({ requester: user._id }).sort({ createdAt: -1 })).map((row) =>
        requestRow(row),
      );

    if (req.query.mine === "true") {
      res.json({ requests: await ownRequests() });
      return;
    }

    if (user.role === "donor" || user.role === "recipient") {
      const eligible = isDonorEligible(user.role, user.bloodGroup);

      if (user.role === "donor" || eligible) {
        res.json({ requests: await donorFeed(user._id, user.bloodGroup, eligible) });
        return;
      }
    }

    if (user.role === "hospital" || user.role === "admin") {
      assertStaff(user);

      // A hospital triages its own district: the board is headed "Active board at
      // <district> District", and stock, discrepancies and handovers are all
      // confined the same way. An admin still reads the whole country.
      const rows = await EmergencyRequest.find({
        ...districtFilter(user),
        status: { $in: ["pending", "verified"] },
      });

      res.json({ requests: rows.sort(byUrgencyThenNewest).map((row) => requestRow(row)) });
      return;
    }

    // A recipient with no blood group is not a donor, so they only ever see
    // their own requests.
    res.json({ requests: await ownRequests() });
  }),
);

/** Open requests this user's blood can serve, with their own response state. */
async function donorFeed(
  userId: unknown,
  bloodGroup: string | null | undefined,
  eligible: boolean,
): Promise<Record<string, unknown>[]> {
  if (!eligible) {
    return [];
  }

  const groups = requestsForDonor(bloodGroup);

  if (groups.length === 0) {
    return [];
  }

  const requests = await EmergencyRequest.find({
    status: { $in: ["pending", "verified"] },
    bloodGroup: { $in: groups },
  });

  const ids = requests.map((row) => row._id);

  const [mine, accepted] = await Promise.all([
    DonorRequestResponse.find({ request: { $in: ids }, donor: userId }),
    DonorRequestResponse.find({ request: { $in: ids }, response: "accepted" }),
  ]);

  const mineByRequest = new Map(mine.map((row) => [String(row.request), row]));
  const acceptedByRequest = new Set(accepted.map((row) => String(row.request)));

  return requests.sort(byUrgencyThenNewest).map((row) => {
    const response = mineByRequest.get(String(row._id));
    const takenByAnother =
      acceptedByRequest.has(String(row._id)) && String(response?.donor ?? "") !== String(userId);

    return requestRow(row, {
      donorResponse: response?.response ?? null,
      donorStage: response?.stage ?? null,
      acceptedByOtherDonor: takenByAnother,
    });
  });
}

/* ------------------------------------------------------------- create + read */

/**
 * Creates a request.
 *
 * Deliberately reachable while signed out — that is the zero-login urgent path.
 * A request with no `requester` is rendered as anonymous, which is also how the
 * app decides whether to hide the "my requests" affordances.
 */
emergencyRouter.post(
  "/",
  optionalAuth,
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof createSchema>;

    if (!isBloodGroup(input.bloodGroup)) {
      throw fail.validation("Choose a valid blood group.", {
        bloodGroup: "Choose a valid blood group.",
      });
    }

    const request = await EmergencyRequest.create({
      requester: req.user?._id ?? null,
      patientName: input.patientName,
      bloodGroup: input.bloodGroup,
      units: input.units,
      hospital: input.hospital,
      district: input.district ?? null,
      registrationNumber: input.registrationNumber ?? null,
      contactName: input.contactName,
      contactMobile: input.contactMobile,
      urgency: input.urgency,
      notes: input.notes ?? null,
      status: "pending",
    });

    res.status(201).json({ request: requestRow(request) });
  }),
);

/**
 * One request, plus the donor groups that can serve it.
 *
 * Public on purpose: the urgent path lets a signed-out visitor open a shared
 * link and see whether they can help.
 */
emergencyRouter.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const request = await findRequest(param(req, "id"));

    res.json({
      request: {
        ...requestRow(request),
        compatibleDonorGroups: donorsForRecipient(request.bloodGroup),
      },
    });
  }),
);

/* ------------------------------------------------------------------- status */

/**
 * Moves a request to a new status.
 *
 * Two callers reach this: the owner, who may only cancel their own request, and
 * verified staff, who may review the queue. Everything else — a terminal state,
 * a no-op, a donor trying to verify — is refused with wording that says which.
 */
emergencyRouter.patch(
  "/:id",
  requireAuth,
  validateBody(statusSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { status: next } = req.body as z.infer<typeof statusSchema>;

    const session = await mongoose.startSession();

    try {
      const updated = await session.withTransaction(async () => {
        const request = await findRequest(param(req, "id"), session);

        const ownerMayCancel = next === "cancelled" && ownsRequest(user, request.requester);

        if (!ownerMayCancel) {
          assertStaff(user);
        }

        assertTransition(request.status, next);

        request.status = next;
        await request.save({ session });

        if (next === "verified") {
          await notifyCompatibleDonors(request, session);
        }

        await notifyRequesterOfStatus(request, next, session);
        await notifyAcceptedDonorOfStatus(request, next, session);

        return request;
      });

      res.json({ request: requestRow(updated) });
    } finally {
      await session.endSession();
    }
  }),
);

/* ---------------------------------------------------------------- responses */

/**
 * Records a donor's decision.
 *
 * The guards are all in one place because they all have to pass together: the
 * request must still be open, the caller must be donor-eligible with a blood
 * group, they must not have answered already, and an acceptance additionally
 * requires being available, being compatible, and no other donor having got
 * there first.
 */
emergencyRouter.post(
  "/:id/response",
  requireAuth,
  validateBody(responseSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { response: decision } = req.body as z.infer<typeof responseSchema>;

    const session = await mongoose.startSession();

    try {
      const created = await session.withTransaction(async () => {
        const request = await findRequest(param(req, "id"), session);

        await assertCanRespond(user, request, decision, session);

        const existing = await DonorRequestResponse.findOne({
          request: request._id,
          donor: user._id,
        }).session(session);

        if (existing !== null) {
          throw fail.conflict("You have already responded to this request.");
        }

        const [row] = await DonorRequestResponse.create(
          [{ request: request._id, donor: user._id, response: decision, stage: "accepted" }],
          { session },
        );

        if (decision === "accepted") {
          await notifyRequesterOfAcceptance(request, user, session);
        }

        return { response: row.response };
      });

      res.status(201).json({ created });
    } finally {
      await session.endSession();
    }
  }),
);

/** Changes an existing response, while the donor has not started travelling. */
emergencyRouter.put(
  "/:id/response",
  requireAuth,
  validateBody(responseSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { response: decision } = req.body as z.infer<typeof responseSchema>;

    const session = await mongoose.startSession();

    try {
      const updated = await session.withTransaction(async () => {
        const request = await findRequest(param(req, "id"), session);

        const existing = await DonorRequestResponse.findOne({
          request: request._id,
          donor: user._id,
        }).session(session);

        if (existing === null) {
          throw fail.conflict("You have not responded to this request yet.");
        }

        if (existing.stage !== "accepted") {
          throw fail.conflict("You have already started travelling for this request.");
        }

        await assertCanRespond(user, request, decision, session, existing._id);

        existing.response = decision;
        // A changed decision invalidates any ticket already issued.
        existing.checkinTokenHash = null;
        existing.checkinTokenExpiresAt = null;
        await existing.save({ session });

        return { response: existing.response };
      });

      res.json({ updated });
    } finally {
      await session.endSession();
    }
  }),
);

/** Withdraws a response. A commitment can only be pulled before transit. */
emergencyRouter.delete(
  "/:id/response",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const request = await findRequest(param(req, "id"));

    const existing = await DonorRequestResponse.findOne({
      request: request._id,
      donor: user._id,
    });

    if (existing === null) {
      throw fail.conflict("You have not responded to this request.");
    }

    if (existing.stage !== "accepted") {
      throw fail.conflict("A response cannot be removed once you have started travelling.");
    }

    await existing.deleteOne();

    res.json({ deleted: true });
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
 * Everything that has to hold before a donor's decision can be stored.
 *
 * `ignoreResponseId` is how an update excludes the row being changed from the
 * "another donor already accepted" test — without it, re-saving an existing
 * acceptance would find itself and refuse.
 */
async function assertCanRespond(
  user: UserDoc,
  request: EmergencyRequestDoc,
  decision: "accepted" | "declined",
  session: mongoose.ClientSession,
  ignoreResponseId?: unknown,
): Promise<void> {
  if (request.status !== "pending" && request.status !== "verified") {
    throw fail.conflict("This request is no longer accepting responses.");
  }

  if (!isDonorEligible(user.role, user.bloodGroup)) {
    throw fail.conflict("Only donors can respond to a request.");
  }

  // Declining is always allowed once eligible — the rules below exist to stop an
  // *acceptance* being recorded that could not be honoured.
  if (decision === "declined") {
    return;
  }

  const availability = await DonorAvailability.findOne({ userId: user._id }).session(session);

  if (availability?.isAvailable !== true) {
    throw fail.conflict("Turn your availability back on to accept a request.");
  }

  if (!isBloodGroup(user.bloodGroup) || !donorsForRecipient(request.bloodGroup).includes(user.bloodGroup)) {
    throw fail.conflict("This request is not compatible with your blood group.");
  }

  const accepted = await DonorRequestResponse.findOne({
    request: request._id,
    response: "accepted",
    ...(ignoreResponseId === undefined ? {} : { _id: { $ne: ignoreResponseId } }),
  })
    .select("_id")
    .session(session);

  if (accepted !== null) {
    throw fail.conflict("Another donor has already accepted this request.");
  }
}
