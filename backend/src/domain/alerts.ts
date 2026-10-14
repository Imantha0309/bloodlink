/**
 * Alert fan-out.
 *
 * Every write here used to be a set-based `INSERT ... SELECT` inside a SQL
 * mutation. The rule they all share is that an alert is a *side effect* of the
 * action that caused it: it is written in the same transaction, so a rolled-back
 * response can never leave a donor's phone claiming something happened.
 *
 * The copy is carried over verbatim from the old SQL — the wording is what
 * users already see, and none of it is generated at render time.
 */

import type { ClientSession } from "mongoose";

import { Alert } from "../models/alert";
import { DonorAvailability } from "../models/donor-availability";
import { DonorRequestResponse } from "../models/donor-request-response";
import { User, type UserDoc } from "../models/user";
import type { RequestStatus } from "../models/shared";
import { donorsForRecipient, isDonorEligible } from "./compatibility";

type Session = ClientSession | null;

/** The subset of a request every alert helper needs. */
export type AlertRequest = {
  _id: unknown;
  requester?: unknown;
  patientName: string;
  bloodGroup: string;
  hospital: string;
  district: string | null;
};

type AlertInsert = {
  user: unknown;
  type: "new_match" | "status_change" | "donor_accepted" | "request_fulfilled";
  request: unknown;
  title: string;
  body: string;
};

async function insertAlerts(docs: AlertInsert[], session: Session): Promise<number> {
  if (docs.length === 0) {
    return 0;
  }

  await Alert.insertMany(docs, session ? { session } : {});

  return docs.length;
}

/**
 * "A matching request is open near you."
 *
 * Written the moment a request becomes `verified`, to every available donor
 * whose group is compatible. Returns how many were notified, which the route
 * does not use but the seed script and tests do.
 */
export async function notifyCompatibleDonors(
  request: AlertRequest,
  session: Session = null,
): Promise<number> {
  const compatible = donorsForRecipient(request.bloodGroup);

  if (compatible.length === 0) {
    return 0;
  }

  const candidates = await User.find({
    bloodGroup: { $in: compatible },
    role: { $in: ["donor", "recipient"] },
  })
    .select("_id role bloodGroup")
    .session(session);

  // A recipient only donates once they have a blood group; the model cannot
  // express that, so the rule is applied here.
  const eligible = candidates.filter((user) => isDonorEligible(user.role, user.bloodGroup));

  if (eligible.length === 0) {
    return 0;
  }

  const available = await DonorAvailability.find({
    userId: { $in: eligible.map((user) => user._id) },
    isAvailable: true,
  })
    .select("userId")
    .session(session);

  const availableIds = new Set(available.map((row) => String(row.userId)));
  const recipients = eligible.filter((user) => availableIds.has(String(user._id)));

  if (recipients.length === 0) {
    return 0;
  }

  const location = request.district ?? "your area";
  const title = `New ${(request as { urgency?: string }).urgency ?? "blood"} request in ${location}`;
  const body = `${request.bloodGroup} needed for ${request.patientName} at ${request.hospital}.`;

  return insertAlerts(
    recipients.map((user) => ({
      user: user._id,
      type: "new_match" as const,
      request: request._id,
      title,
      body,
    })),
    session,
  );
}

/**
 * The requester hears about any move on their own request.
 *
 * Skipped entirely for anonymous requests — there is nobody to tell, and the old
 * SQL guarded on `requester_uid IS NOT NULL` for the same reason.
 */
export async function notifyRequesterOfStatus(
  request: AlertRequest,
  status: RequestStatus,
  session: Session = null,
): Promise<number> {
  if (request.requester === null || request.requester === undefined) {
    return 0;
  }

  const fulfilled = status === "fulfilled";

  return insertAlerts(
    [
      {
        user: request.requester,
        type: fulfilled ? "request_fulfilled" : "status_change",
        request: request._id,
        title: fulfilled ? "Request fulfilled" : "Request updated",
        body: fulfilled
          ? `${request.patientName}'s request was marked fulfilled. Thank you.`
          : `${request.patientName}'s request is now ${status}.`,
      },
    ],
    session,
  );
}

/**
 * The accepted donor hears about a terminal move.
 *
 * Only fires for `fulfilled` and `cancelled`: a donor travelling to a hospital
 * needs to know if the trip is off, and nothing else about the request concerns
 * them.
 */
export async function notifyAcceptedDonorOfStatus(
  request: AlertRequest,
  status: RequestStatus,
  session: Session = null,
): Promise<number> {
  if (status !== "fulfilled" && status !== "cancelled") {
    return 0;
  }

  const accepted = await DonorRequestResponse.find({
    request: request._id,
    response: "accepted",
  })
    .select("donor")
    .session(session);

  if (accepted.length === 0) {
    return 0;
  }

  const fulfilled = status === "fulfilled";

  return insertAlerts(
    accepted.map((row) => ({
      user: row.donor,
      type: fulfilled ? ("request_fulfilled" as const) : ("status_change" as const),
      request: request._id,
      title: fulfilled ? "Donation completed" : "Request cancelled",
      body: fulfilled
        ? `Your donation for ${request.patientName} has been recorded.`
        : `The request for ${request.patientName} was cancelled - no travel needed.`,
    })),
    session,
  );
}

/**
 * The requester is told the moment a donor commits.
 *
 * Called inside the same transaction as the response itself, so the two are
 * written together or not at all.
 */
export async function notifyRequesterOfAcceptance(
  request: AlertRequest,
  donor: Pick<UserDoc, "_id" | "fullName">,
  session: Session = null,
): Promise<number> {
  if (request.requester === null || request.requester === undefined) {
    return 0;
  }

  return insertAlerts(
    [
      {
        user: request.requester,
        type: "donor_accepted",
        request: request._id,
        title: "A donor accepted your request",
        body: `${donor.fullName} is ready to donate ${request.bloodGroup} for ${request.patientName}.`,
      },
    ],
    session,
  );
}
