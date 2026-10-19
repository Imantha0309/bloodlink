"use strict";
/**
 * Request status and donation stage state machines.
 *
 * Both were previously expressed as `CASE` expressions inside SQL `WHERE`
 * clauses, which meant an illegal move produced an empty result set and had to
 * be guessed at. Here the illegal move is named, so the message can say what
 * went wrong.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_ORDER = exports.REQUEST_TRANSITIONS = void 0;
exports.canTransition = canTransition;
exports.assertTransition = assertTransition;
exports.isOpen = isOpen;
exports.isResponseMutable = isResponseMutable;
const http_1 = require("../http");
/**
 * Legal moves. Terminal states have no exits — `fulfilled` and `cancelled`
 * never reopen, which is what makes a completed request safe to treat as done.
 */
exports.REQUEST_TRANSITIONS = {
    pending: ["verified", "fulfilled", "cancelled"],
    verified: ["fulfilled", "cancelled"],
    fulfilled: [],
    cancelled: [],
};
function canTransition(from, to) {
    return exports.REQUEST_TRANSITIONS[from].includes(to);
}
/** The copy shown when a move is refused; kept human-readable on purpose. */
const TRANSITION_MESSAGE = "This status change is not allowed for this request.";
function assertTransition(from, to) {
    if (from === to) {
        throw http_1.fail.conflict("That request is already in that state.");
    }
    if (!canTransition(from, to)) {
        throw http_1.fail.conflict(TRANSITION_MESSAGE);
    }
}
/** Statuses that still accept donor responses. */
function isOpen(status) {
    return status === "pending" || status === "verified";
}
/**
 * A response may only change while the donor has not started travelling.
 * Once `en_route` is set the hospital is expecting them, so the choice is spent.
 */
function isResponseMutable(stage) {
    return stage === "accepted";
}
/** Ordered list of stages a donor passes through. */
exports.STAGE_ORDER = ["accepted", "en_route", "arrived", "completed"];
