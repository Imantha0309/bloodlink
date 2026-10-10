import type { RequestStatus } from "@/services/requests/emergency-requests";

export type TimelineStepState = "done" | "current" | "pending";

export type TimelineStep = {
  title: string;
  description: string;
  state: TimelineStepState;
};

/**
 * Derives the four-step lifecycle from a request's real status.
 *
 * The server only knows `pending | verified | fulfilled | cancelled`, so this
 * is the single place that maps those onto the visual timeline: submitted is
 * always done, verification lights up while pending, donor notification while
 * verified, and completion only when fulfilled. A cancelled request stops
 * after "submitted" with a red terminal step instead of pretending to progress.
 */
export function buildRequestTimeline(
  status: RequestStatus,
  createdAtLabel: string,
  updatedAtLabel: string,
): TimelineStep[] {
  const submitted: TimelineStep = {
    title: "Request Submitted",
    description: `Received by BloodLink ${createdAtLabel}.`,
    state: "done",
  };

  if (status === "cancelled") {
    return [
      submitted,
      {
        title: "Request Cancelled",
        description: `Withdrawn ${updatedAtLabel}. Donors will no longer be notified.`,
        state: "current",
      },
    ];
  }

  const verification: TimelineStep = {
    title: "Hospital Verification",
    description:
      status === "pending"
        ? "Waiting for the hospital to verify this request."
        : "The hospital verified this request.",
    state: status === "pending" ? "current" : "done",
  };

  const notification: TimelineStep = {
    title: "Donors Notified",
    description:
      status === "verified"
        ? "Compatible donors can now respond to this request."
        : "Compatible donor groups will be notified.",
    state:
      status === "fulfilled"
        ? "done"
        : status === "verified"
          ? "current"
          : "pending",
  };

  const completion: TimelineStep = {
    title: "Donation Completed",
    description:
      status === "fulfilled"
        ? "The hospital confirmed fulfilment."
        : "Pending donation at the facility.",
    state: status === "fulfilled" ? "done" : "pending",
  };

  return [submitted, verification, notification, completion];
}

/** True while the request may still change server-side (poll worth keeping on). */
export function isRequestLive(status: RequestStatus): boolean {
  return status === "pending" || status === "verified";
}
