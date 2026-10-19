"use strict";
/**
 * Who may do what.
 *
 * Every one of these was an `EXISTS (SELECT 1 FROM users WHERE ...)` clause in
 * the old SQL. They are collected here so the same rule cannot drift between the
 * six places that ask a version of it.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStaff = isStaff;
exports.assertStaff = assertStaff;
exports.canManageBank = canManageBank;
exports.assertCanManageBank = assertCanManageBank;
exports.ownsRequest = ownsRequest;
exports.districtFilter = districtFilter;
const http_1 = require("../http");
/**
 * Hospital staff and admins.
 *
 * An unverified hospital is nobody: it cannot touch stock, patients or triage
 * until an admin approves it. `admin` bypasses the check entirely.
 */
function isStaff(user) {
    return user.role === "admin" || (user.role === "hospital" && user.isVerified);
}
/** Throws unless the caller is verified staff. */
function assertStaff(user) {
    if (!isStaff(user)) {
        throw http_1.fail.conflict("Your account is not cleared for hospital operations yet.");
    }
}
/**
 * Whether staff may manage a given bank.
 *
 * Admins manage every bank; a hospital is confined to its own district, so a
 * staff member at one facility cannot restock another's shelves.
 */
function canManageBank(user, bankDistrict) {
    if (user.role === "admin") {
        return true;
    }
    return user.role === "hospital" && user.isVerified && user.district === bankDistrict;
}
function assertCanManageBank(user, bankDistrict) {
    if (!canManageBank(user, bankDistrict)) {
        throw http_1.fail.conflict("That blood bank could not be found or is outside your district.");
    }
}
/** The caller owns this request outright. */
function ownsRequest(user, requesterId) {
    return requesterId !== null && requesterId !== undefined && String(requesterId) === String(user._id);
}
/**
 * The district scope for everything a hospital reads or writes.
 *
 * An admin works the whole country; a verified hospital is confined to its own
 * district — its stock, its discrepancy log, its handover book and the triage
 * board it is actually standing at.
 *
 * A hospital with no district on file matches `district: null`, which is what
 * its own rows were stamped with, so it keeps seeing its own work rather than an
 * empty list.
 *
 * Returns a filter *fragment* rather than running the query, which is why the
 * call site composes it: `{ ...districtFilter(user), status: { $in: OPEN } }`.
 */
function districtFilter(user) {
    return user.role === "admin" ? {} : { district: user.district ?? null };
}
