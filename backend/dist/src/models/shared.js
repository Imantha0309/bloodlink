"use strict";
/**
 * Shared model plumbing.
 *
 * Every document is serialised as camelCase JSON with `id` as a **string**,
 * because that is what the app has always received — the GraphQL layer aliased
 * its columns to exactly these names, and the service modules validate them. A
 * raw ObjectId here would fail those validators and blank the screen.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISCREPANCY_SEVERITIES = exports.DISCREPANCY_TYPES = exports.STAFF_STATIONS = exports.EXTRACTION_STATUSES = exports.ALERT_TYPES = exports.BLOOD_COMPONENTS = exports.DONATION_STAGES = exports.DONOR_RESPONSES = exports.URGENCY_LEVELS = exports.REQUEST_STATUSES = exports.USER_ROLES = void 0;
exports.applyJsonTransform = applyJsonTransform;
function applyJsonTransform(schema) {
    schema.set("toJSON", {
        versionKey: false,
        transform: (_doc, ret) => {
            if (ret._id !== undefined) {
                ret.id = String(ret._id);
            }
            delete ret._id;
            return ret;
        },
    });
}
/** The app's role list, shared by the schema enum and the auth middleware. */
exports.USER_ROLES = ["recipient", "donor", "hospital", "admin"];
exports.REQUEST_STATUSES = ["pending", "verified", "fulfilled", "cancelled"];
exports.URGENCY_LEVELS = ["critical", "urgent", "standard"];
exports.DONOR_RESPONSES = ["accepted", "declined"];
exports.DONATION_STAGES = ["accepted", "en_route", "arrived", "completed"];
exports.BLOOD_COMPONENTS = ["whole_blood", "prbc", "platelets", "plasma"];
exports.ALERT_TYPES = [
    "new_match",
    "status_change",
    "donor_accepted",
    "request_fulfilled",
];
exports.EXTRACTION_STATUSES = ["in_progress", "completed"];
/**
 * The desks a staff member can declare themselves onto.
 *
 * Self-declared rather than assigned: a shift swap is a fact about right now,
 * not a permission, so the row is just a note of where to route work.
 */
exports.STAFF_STATIONS = ["reception", "ward", "laboratory", "donation", "dispatch"];
/** What went wrong with a unit of blood. */
exports.DISCREPANCY_TYPES = ["labeling", "volume", "hemolysis", "transport", "other"];
exports.DISCREPANCY_SEVERITIES = ["low", "medium", "high", "critical"];
