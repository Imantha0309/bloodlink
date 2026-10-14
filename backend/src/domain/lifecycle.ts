/**
 * Request status and donation stage state machines.
 *
 * Both were previously expressed as `CASE` expressions inside SQL `WHERE`
 * clauses, which meant an illegal move produced an empty result set and had to
 * be guessed at. Here the illegal move is named, so the message can say what
 * went wrong.
 */

import { fail } from "../http";
import type { DonationStage, RequestStatus } from "../models/shared";

/**
 * Legal moves. Terminal states have no exits — `fulfilled` and `cancelled`
 * never reopen, which is what makes a completed request safe to treat as done.
 */
export const REQUEST_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ["verified", "fulfilled", "cancelled"],
  verified: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
};

export function canTransition(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from].includes(to);
}

/** The copy shown when a move is refused; kept human-readable on purpose. */
const TRANSITION_MESSAGE = "This status change is not allowed for this request.";

export function assertTransition(from: RequestStatus, to: RequestStatus): void {
  if (from === to) {
    throw fail.conflict("That request is already in that state.");
  }

  if (!canTransition(from, to)) {
    throw fail.conflict(TRANSITION_MESSAGE);
  }
}

/** Statuses that still accept donor responses. */
export function isOpen(status: RequestStatus): boolean {
  return status === "pending" || status === "verified";
}

/** Terminal statuses, for the "nothing more will happen" cases. */
export function isTerminal(status: RequestStatus): boolean {
  return status === "fulfilled" || status === "cancelled";
}

/**
 * A response may only change while the donor has not started travelling.
 * Once `en_route` is set the hospital is expecting them, so the choice is spent.
 */
export function isResponseMutable(stage: DonationStage): boolean {
  return stage === "accepted";
}

/** Ordered list of stages a donor passes through. */
export const STAGE_ORDER: readonly DonationStage[] = ["accepted", "en_route", "arrived", "completed"];
