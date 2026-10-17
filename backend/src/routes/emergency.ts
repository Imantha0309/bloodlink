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
import { assertTransition, isResponseMutable } from "../domain/lifecycle";
import { requestRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { currentUser, optionalAuth, requireAuth } from "../middleware/auth";
import { validateBody, param } from "../middleware/validate";
import { DonorAvailability } from "../models/donor-availability";
import { DonorRequestResponse } from "../models/donor-request-response";
import { EmergencyRequest, type EmergencyRequestDoc } from "../models/emergency-request";
import { URGENCY_LEVELS, type UrgencyLevel } from "../models/shared";
import { User, type UserDoc } from "../models/user";

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

/**
 * Clinical fields a request owner may change, restricted to the subset of
 * `createSchema` that describes the situation rather than the paperwork.
 *
 * `district` and `registrationNumber` are deliberately absent: they come from the
 * account, so letting a requester rewrite them would let them re-scope a request
 * into another hospital's district. Reusing `createSchema`'s shapes keeps the
 * create and edit messages identical, because they should be.
 */
const editDetailsSchema = createSchema
  .pick({
    patientName: true,
    bloodGroup: true,
    units: true,
    hospital: true,
    contactName: true,
    contactMobile: true,
    urgency: true,
    notes: true,
  })
  .partial()
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: "Change at least one field before saving.",
  });

const responseSchema = z.object({
  response: z.enum(["accepted", "declined"]),
});

/**
 * A response recorded at a desk, on behalf of a donor the staff member scanned.
 *
 * The body carries the *pass*, not a donor id. That is the whole security model:
 * the client cannot name who it is responding for, so staff can only act for a
 * donor whose pass they physically read — and the same hash `/pass/resolve`
 * already takes is what identifies them. Naming a donor directly would let any
 * verified hospital account commit any account in the country to a donation.
 */
const onBehalfResponseSchema = z.object({
  tokenHash: z.string().trim().min(1),
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

    /**
     * The requests this user raised, which is its own list for a recipient.
     *
     * Also annotates whether a donor was matched to each one at a desk — a
     * response carrying `recordedBy` means staff accepted for a donor whose pass
     * they scanned. Derived from the responses rather than a match table, so
     * there is nothing extra to write when a match happens.
     */
    const ownRequests = async () => {
      const rows = await EmergencyRequest.find({ requester: user._id }).sort({ createdAt: -1 });

      if (rows.length === 0) {
        return [];
      }

      const matched = await DonorRequestResponse.find({
        request: { $in: rows.map((row) => row._id) },
        recordedBy: { $ne: null },
      })
        .select("request")
        .lean();

      const matchedIds = new Set(matched.map((entry) => String(entry.request)));

      return rows.map((row) => requestRow(row, { donorMatchedOnBehalf: matchedIds.has(String(row._id)) }));
    };

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
    status: "verified",
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
    const user = req.user;
    const isRequester = user !== undefined && request.requester !== null && ownsRequest(user, request.requester);
    const matchedOnBehalf = isRequester
      ? await DonorRequestResponse.exists({ request: request._id, recordedBy: { $ne: null } })
      : null;

    res.json({
      request: {
        ...requestRow(request, { donorMatchedOnBehalf: matchedOnBehalf !== null }),
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
/**
 * Clinical edits by the request's owner.
 *
 * Split from the status transition on purpose: a status change moves a request
 * through its lifecycle and may notify donors, while this changes the request
 * underneath them. Two rules define the boundary.
 *
 * Only the owner, and only while pending. Once `verified` the request has been
 * broadcast, so changing the units or the hospital would contradict what donors
 * were notified about — the honest fix is cancel and re-raise. Anonymous requests
 * carry no owner at all, so there is nobody to authorise.
 */
emergencyRouter.patch(
  "/:id/details",
  requireAuth,
  validateBody(editDetailsSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const input = req.body as z.infer<typeof editDetailsSchema>;

    const request = await findRequest(param(req, "id"));

    if (request.requester === null || !ownsRequest(user, request.requester)) {
      throw fail.unauthorized("Only the recipient who raised this request can edit it.");
    }

    if (request.status !== "pending") {
      throw fail.conflict(
        request.status === "verified"
          ? "This request is live. Cancel it and raise a new one if the details changed."
          : "A closed request cannot be edited.",
      );
    }

    if (input.bloodGroup !== undefined && !isBloodGroup(input.bloodGroup)) {
      throw fail.validation("Choose a valid blood group.", {
        bloodGroup: "Choose a valid blood group.",
      });
    }

    if (input.patientName !== undefined) request.patientName = input.patientName;
    if (input.bloodGroup !== undefined) request.bloodGroup = input.bloodGroup;
    if (input.units !== undefined) request.units = input.units;
    if (input.hospital !== undefined) request.hospital = input.hospital;
    if (input.contactName !== undefined) request.contactName = input.contactName;
    if (input.contactMobile !== undefined) request.contactMobile = input.contactMobile;
    if (input.urgency !== undefined) request.urgency = input.urgency;
    if (input.notes !== undefined) request.notes = input.notes ?? null;

    await request.save();

    res.json({ request: requestRow(request) });
  }),
);

const patchEmergencySchema = z
  .object({
    status: z.enum(["pending", "verified", "fulfilled", "cancelled"]).optional(),
    patientName: z.string().trim().min(2, "Enter the patient's name.").optional(),
    bloodGroup: z.string().trim().optional(),
    units: z.number().int().min(1, "At least one unit is needed.").max(20, "That is more than one request can carry.").optional(),
    hospital: z.string().trim().min(2, "Enter the hospital.").optional(),
    contactName: z.string().trim().min(2, "Enter a contact name.").optional(),
    contactMobile: z.string().trim().min(6, "Enter a contact number.").optional(),
    urgency: z.enum(URGENCY_LEVELS).optional(),
    notes: z.string().trim().nullable().optional(),
  })
  .refine(
    (value) => value.status !== undefined || Object.entries(value).some(([k, v]) => k !== "status" && v !== undefined),
    { message: "Provide a status or at least one clinical field to update." },
  );

emergencyRouter.patch(
  "/:id",
  requireAuth,
  validateBody(patchEmergencySchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const input = req.body as z.infer<typeof patchEmergencySchema>;

    const hasClinicalFields =
      input.patientName !== undefined ||
      input.bloodGroup !== undefined ||
      input.units !== undefined ||
      input.hospital !== undefined ||
      input.contactName !== undefined ||
      input.contactMobile !== undefined ||
      input.urgency !== undefined ||
      input.notes !== undefined;

    if (hasClinicalFields) {
      const request = await findRequest(param(req, "id"));

      if (request.requester === null || !ownsRequest(user, request.requester)) {
        throw fail.unauthorized("Only the recipient who raised this request can edit it.");
      }

      if (request.status !== "pending") {
        throw fail.conflict(
          request.status === "verified"
            ? "This request is live. Cancel it and raise a new one if the details changed."
            : "A closed request cannot be edited.",
        );
      }

      if (input.bloodGroup !== undefined && !isBloodGroup(input.bloodGroup)) {
        throw fail.validation("Choose a valid blood group.", {
          bloodGroup: "Choose a valid blood group.",
        });
      }

      if (input.patientName !== undefined) request.patientName = input.patientName;
      if (input.bloodGroup !== undefined) request.bloodGroup = input.bloodGroup;
      if (input.units !== undefined) request.units = input.units;
      if (input.hospital !== undefined) request.hospital = input.hospital;
      if (input.contactName !== undefined) request.contactName = input.contactName;
      if (input.contactMobile !== undefined) request.contactMobile = input.contactMobile;
      if (input.urgency !== undefined) request.urgency = input.urgency;
      if (input.notes !== undefined) request.notes = input.notes ?? null;

      if (input.status === undefined) {
        await request.save();
        return res.json({ request: requestRow(request) });
      }

      await request.save();
    }

    if (input.status !== undefined) {
      const next = input.status;
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

/**
 * Records a response for a donor whose pass the caller just scanned.
 *
 * A recipient gets the read-only match list but not this: a third party
 * committing someone else to a donation is a hospital desk action, which is why
 * the role check below is `hospital` and not `assertStaff` (the latter also lets
 * an admin through, since `isStaff` admits `admin`).
 *
 * The donor is resolved from the pass rather than named by the client, so this
 * cannot be used to act for anyone whose pass the caller has not read. The donor
 * themself is never told — an acceptance recorded here shows up in their journey
 * and on the requester's dashboard, which is the honest record of what happened.
 */
emergencyRouter.post(
  "/:id/response/on-behalf",
  requireAuth,
  validateBody(onBehalfResponseSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { tokenHash, response: decision } = req.body as z.infer<typeof onBehalfResponseSchema>;

    if (user.role !== "hospital") {
      throw fail.conflict("Only hospital staff can record a response on a donor's behalf.");
    }

    assertStaff(user);

    const session = await mongoose.startSession();

    try {
      const created = await session.withTransaction(async () => {
        const request = await findRequest(param(req, "id"), session);

        // Same coarse failure as `/pass/resolve`: a wrong, retired and expired
        // pass are indistinguishable, so this cannot enumerate pass secrets.
        const donor = await User.findOne({ passTokenHash: tokenHash })
          .select("+passTokenHash")
          .session(session);

        if (
          donor === null ||
          donor.passTokenExpiresAt === null ||
          donor.passTokenExpiresAt.getTime() <= Date.now()
        ) {
          throw fail.conflict("This pass is invalid or has expired.");
        }

        if (String(donor._id) === String(user._id)) {
          throw fail.conflict("That is your own pass — respond to the request from your dashboard.");
        }

        await assertCanRespond(donor, request, decision, session, undefined, false);

        const existing = await DonorRequestResponse.findOne({
          request: request._id,
          donor: donor._id,
        }).session(session);

        if (existing !== null) {
          throw fail.conflict("That donor has already responded to this request.");
        }

        const [row] = await DonorRequestResponse.create(
          [
            {
              request: request._id,
              donor: donor._id,
              response: decision,
              stage: "accepted",
              recordedBy: user._id,
            },
          ],
          { session },
        );

        if (decision === "accepted") {
          // The donor, not the staff member — the requester is being told who is
          // coming, and the alert body already names them.
          await notifyRequesterOfAcceptance(request, donor, session);
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

        if (!isResponseMutable(existing.stage)) {
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

    if (!isResponseMutable(existing.stage)) {
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
/**
 * Whether `donor` may put `decision` on `request`.
 *
 * Takes the donor as an argument rather than reading `currentUser(req)`, because
 * two callers act for different people: a donor responding for themselves, and
 * hospital staff recording a response for a donor whose pass they scanned. Every
 * check below therefore has to be about `donor`, never about the caller — the
 * whole point of the on-behalf route is that the caller's own blood group is
 * irrelevant.
 */
async function assertCanRespond(
  donor: UserDoc,
  request: EmergencyRequestDoc,
  decision: "accepted" | "declined",
  session: mongoose.ClientSession,
  ignoreResponseId?: unknown,
  /**
   * Whether `donor` is the caller. Only picks the wording of the messages — the
   * checks are identical either way.
   */
  isSelf = true,
): Promise<void> {
  if (request.status !== "pending" && request.status !== "verified") {
    throw fail.conflict("This request is no longer accepting responses.");
  }

  if (!isDonorEligible(donor.role, donor.bloodGroup)) {
    throw fail.conflict(
      isSelf ? "Only donors can respond to a request." : "That account is not a donor, so it cannot be recorded.",
    );
  }

  // Declining is always allowed once eligible — the rules below exist to stop an
  // *acceptance* being recorded that could not be honoured.
  if (decision === "declined") {
    return;
  }

  const availability = await DonorAvailability.findOne({ userId: donor._id }).session(session);

  if (availability?.isAvailable !== true) {
    throw fail.conflict(
      isSelf
        ? "Turn your availability back on to accept a request."
        : "That donor has their availability switched off, so they cannot be recorded as accepted.",
    );
  }

  if (!isBloodGroup(donor.bloodGroup) || !donorsForRecipient(request.bloodGroup).includes(donor.bloodGroup)) {
    throw fail.conflict(
      isSelf
        ? "This request is not compatible with your blood group."
        : "This request is not compatible with that donor's blood group.",
    );
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
