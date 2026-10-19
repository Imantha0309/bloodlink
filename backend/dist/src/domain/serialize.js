"use strict";
/**
 * Row shaping.
 *
 * The app validates every payload field by field before it renders —
 * `readEmergencyRequest`, `readAlert` and friends reject a row whose `createdAt`
 * is not a string or whose `id` is missing. These functions produce exactly the
 * keys those validators expect, which is why they build plain objects instead of
 * relying on the models' `toJSON`.
 *
 * Dates are left as `Date` and become ISO strings when Express serialises the
 * response, which is the format the app parses.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.asId = asId;
exports.requestRow = requestRow;
exports.alertRow = alertRow;
exports.passOwnerRow = passOwnerRow;
exports.authUserRow = authUserRow;
exports.adminUserRow = adminUserRow;
exports.discrepancyRow = discrepancyRow;
exports.handoverRow = handoverRow;
exports.bankRow = bankRow;
exports.inventoryRow = inventoryRow;
/** ObjectId → string, and `null` stays `null` rather than becoming "null". */
function asId(value) {
    return value === null || value === undefined ? null : String(value);
}
/**
 * One request, as the app reads it.
 *
 * `isAnonymous` is derived rather than stored: a request with no `requester` is
 * by definition one that came through the zero-login urgent path.
 */
function requestRow(doc, extras = {}) {
    return {
        id: String(doc._id),
        patientName: doc.patientName,
        bloodGroup: doc.bloodGroup,
        units: doc.units,
        hospital: doc.hospital,
        district: doc.district ?? null,
        contactName: doc.contactName,
        contactMobile: doc.contactMobile,
        urgency: doc.urgency,
        notes: doc.notes ?? null,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        isAnonymous: doc.requester === null || doc.requester === undefined,
        /** Lets the client show owner-only affordances (edit/cancel); the API still enforces them. */
        requesterId: doc.requester === null || doc.requester === undefined ? null : String(doc.requester),
        donorResponse: extras.donorResponse ?? null,
        donorStage: extras.donorStage ?? null,
        acceptedByOtherDonor: extras.acceptedByOtherDonor ?? false,
    };
}
function alertRow(doc) {
    return {
        id: String(doc._id),
        type: doc.type,
        requestId: asId(doc.request),
        title: doc.title,
        body: doc.body,
        readAt: doc.readAt ?? null,
        createdAt: doc.createdAt,
    };
}
/**
 * The identity behind a scanned pass, as `ResolvedPass`.
 *
 * Deliberately narrower than `authUserRow`. A pass is shown to whoever scans it,
 * so it carries only what identifies a person at a desk — name, role, and the
 * station or district they work in. Contact details are not included: a pass is
 * not a way to lift someone's email or phone number off them.
 */
function passOwnerRow(user) {
    return {
        id: String(user._id),
        fullName: user.fullName,
        role: user.role,
        bloodGroup: user.bloodGroup ?? null,
        district: user.district ?? null,
        station: user.station ?? null,
        wardLabel: user.wardLabel ?? null,
        isVerified: user.isVerified ?? false,
        avatarUrl: user.avatarUrl ?? null,
    };
}
/**
 * The signed-in user, as `AuthUser`.
 *
 * Note this is *not* the document: `passwordHash`, `failedLoginAttempts` and
 * `lockedUntil` are deliberately absent, and the id is a string.
 *
 * `station` and `wardLabel` are passed through as plain strings rather than being
 * validated against the catalogue here — the app re-narrows them with
 * `readStationAssignment`, which is where "is this a station I know about"
 * belongs.
 */
function authUserRow(user) {
    const bloodGroup = user.bloodGroup ?? null;
    return {
        id: String(user._id),
        role: user.role,
        fullName: user.fullName,
        email: user.email ?? null,
        mobile: user.mobile ?? null,
        district: user.district ?? null,
        bloodGroup,
        station: user.station ?? null,
        wardLabel: user.wardLabel ?? null,
        avatarUrl: user.avatarUrl ?? null,
        // A recipient who has set a blood group can donate as well, which is what
        // every donor-facing query in the old SQL keyed off.
        isDonorEligible: user.role === "donor" || (user.role === "recipient" && bloodGroup !== null),
    };
}
/**
 * A row in the admin account table.
 *
 * Unlike `authUserRow` this carries `registrationNumber`, because approving a
 * hospital means checking the number it registered with. It still excludes every
 * credential field.
 */
function adminUserRow(user) {
    return {
        uid: String(user._id),
        role: user.role,
        fullName: user.fullName,
        email: user.email ?? null,
        mobile: user.mobile ?? null,
        district: user.district ?? null,
        bloodGroup: user.bloodGroup ?? null,
        registrationNumber: user.registrationNumber ?? null,
        isVerified: user.isVerified === true,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
    };
}
function discrepancyRow(report) {
    return {
        id: String(report._id),
        district: report.district ?? null,
        type: report.type,
        severity: report.severity,
        detail: report.detail,
        reporterName: report.reporterName,
        // The app reads a boolean plus a timestamp rather than triaging a null.
        resolved: report.resolvedAt !== null,
        resolvedAt: report.resolvedAt ?? null,
        createdAt: report.createdAt,
    };
}
function handoverRow(handover) {
    return {
        id: String(handover._id),
        district: handover.district ?? null,
        shiftLabel: handover.shiftLabel,
        notes: handover.notes,
        pendingCrossMatches: handover.pendingCrossMatches,
        authorName: handover.authorName,
        createdAt: handover.createdAt,
    };
}
function bankRow(doc, totalUnits) {
    return {
        id: String(doc._id),
        name: doc.name,
        district: doc.district,
        address: doc.address ?? null,
        phone: doc.phone ?? null,
        hours: doc.hours ?? null,
        isVerified: doc.isVerified === true,
        note: doc.note ?? null,
        ...(typeof totalUnits === "number" ? { totalUnits } : {}),
    };
}
function inventoryRow(doc) {
    return {
        bloodGroup: doc.bloodGroup,
        component: doc.component,
        units: doc.units,
        updatedAt: doc.updatedAt,
    };
}
