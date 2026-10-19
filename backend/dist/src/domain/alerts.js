"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyCompatibleDonors = notifyCompatibleDonors;
exports.notifyRequesterOfStatus = notifyRequesterOfStatus;
exports.notifyAcceptedDonorOfStatus = notifyAcceptedDonorOfStatus;
exports.notifyRequesterOfAcceptance = notifyRequesterOfAcceptance;
const alert_1 = require("../models/alert");
const donor_availability_1 = require("../models/donor-availability");
const donor_request_response_1 = require("../models/donor-request-response");
const user_1 = require("../models/user");
const compatibility_1 = require("./compatibility");
async function insertAlerts(docs, session) {
    if (docs.length === 0) {
        return 0;
    }
    await alert_1.Alert.insertMany(docs, session ? { session } : {});
    return docs.length;
}
/**
 * "A matching request is open near you."
 *
 * Written the moment a request becomes `verified`, to every available donor
 * whose group is compatible. Returns how many were notified, which the route
 * does not use but the seed script and tests do.
 */
async function notifyCompatibleDonors(request, session = null) {
    const compatible = (0, compatibility_1.donorsForRecipient)(request.bloodGroup);
    if (compatible.length === 0) {
        return 0;
    }
    const candidates = await user_1.User.find({
        bloodGroup: { $in: compatible },
        role: { $in: ["donor", "recipient"] },
    })
        .select("_id role bloodGroup")
        .session(session);
    // A recipient only donates once they have a blood group; the model cannot
    // express that, so the rule is applied here.
    const eligible = candidates.filter((user) => (0, compatibility_1.isDonorEligible)(user.role, user.bloodGroup));
    if (eligible.length === 0) {
        return 0;
    }
    const available = await donor_availability_1.DonorAvailability.find({
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
    const title = `New ${request.urgency ?? "blood"} request in ${location}`;
    const body = `${request.bloodGroup} needed for ${request.patientName} at ${request.hospital}.`;
    return insertAlerts(recipients.map((user) => ({
        user: user._id,
        type: "new_match",
        request: request._id,
        title,
        body,
    })), session);
}
/**
 * The requester hears about any move on their own request.
 *
 * Skipped entirely for anonymous requests — there is nobody to tell, and the old
 * SQL guarded on `requester_uid IS NOT NULL` for the same reason.
 */
async function notifyRequesterOfStatus(request, status, session = null) {
    if (request.requester === null || request.requester === undefined) {
        return 0;
    }
    const fulfilled = status === "fulfilled";
    return insertAlerts([
        {
            user: request.requester,
            type: fulfilled ? "request_fulfilled" : "status_change",
            request: request._id,
            title: fulfilled ? "Request fulfilled" : "Request updated",
            body: fulfilled
                ? `${request.patientName}'s request was marked fulfilled. Thank you.`
                : `${request.patientName}'s request is now ${status}.`,
        },
    ], session);
}
/**
 * The accepted donor hears about a terminal move.
 *
 * Only fires for `fulfilled` and `cancelled`: a donor travelling to a hospital
 * needs to know if the trip is off, and nothing else about the request concerns
 * them.
 */
async function notifyAcceptedDonorOfStatus(request, status, session = null) {
    if (status !== "fulfilled" && status !== "cancelled") {
        return 0;
    }
    const accepted = await donor_request_response_1.DonorRequestResponse.find({
        request: request._id,
        response: "accepted",
    })
        .select("donor")
        .session(session);
    if (accepted.length === 0) {
        return 0;
    }
    const fulfilled = status === "fulfilled";
    return insertAlerts(accepted.map((row) => ({
        user: row.donor,
        type: fulfilled ? "request_fulfilled" : "status_change",
        request: request._id,
        title: fulfilled ? "Donation completed" : "Request cancelled",
        body: fulfilled
            ? `Your donation for ${request.patientName} has been recorded.`
            : `The request for ${request.patientName} was cancelled - no travel needed.`,
    })), session);
}
/**
 * The requester is told the moment a donor commits.
 *
 * Called inside the same transaction as the response itself, so the two are
 * written together or not at all.
 */
async function notifyRequesterOfAcceptance(request, donor, session = null) {
    if (request.requester === null || request.requester === undefined) {
        return 0;
    }
    return insertAlerts([
        {
            user: request.requester,
            type: "donor_accepted",
            request: request._id,
            title: "A donor accepted your request",
            body: `${donor.fullName} is ready to donate ${request.bloodGroup} for ${request.patientName}.`,
        },
    ], session);
}
