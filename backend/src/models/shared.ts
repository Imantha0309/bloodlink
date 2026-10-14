/**
 * Shared model plumbing.
 *
 * Every document is serialised as camelCase JSON with `id` as a **string**,
 * because that is what the app has always received — the GraphQL layer aliased
 * its columns to exactly these names, and the service modules validate them. A
 * raw ObjectId here would fail those validators and blank the screen.
 */

import type { Schema } from "mongoose";

export function applyJsonTransform(schema: Schema): void {
  schema.set("toJSON", {
    versionKey: false,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      if (ret._id !== undefined) {
        ret.id = String(ret._id);
      }

      delete ret._id;

      return ret;
    },
  });
}

/** The app's role list, shared by the schema enum and the auth middleware. */
export const USER_ROLES = ["recipient", "donor", "hospital", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const REQUEST_STATUSES = ["pending", "verified", "fulfilled", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const URGENCY_LEVELS = ["critical", "urgent", "standard"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const DONOR_RESPONSES = ["accepted", "declined"] as const;
export type DonorResponse = (typeof DONOR_RESPONSES)[number];

export const DONATION_STAGES = ["accepted", "en_route", "arrived", "completed"] as const;
export type DonationStage = (typeof DONATION_STAGES)[number];

export const BLOOD_COMPONENTS = ["whole_blood", "prbc", "platelets", "plasma"] as const;
export type BloodComponent = (typeof BLOOD_COMPONENTS)[number];

export const ALERT_TYPES = [
  "new_match",
  "status_change",
  "donor_accepted",
  "request_fulfilled",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const EXTRACTION_STATUSES = ["in_progress", "completed"] as const;
export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

/**
 * The desks a staff member can declare themselves onto.
 *
 * Self-declared rather than assigned: a shift swap is a fact about right now,
 * not a permission, so the row is just a note of where to route work.
 */
export const STAFF_STATIONS = ["reception", "ward", "laboratory", "donation", "dispatch"] as const;
export type StaffStation = (typeof STAFF_STATIONS)[number];

/** What went wrong with a unit of blood. */
export const DISCREPANCY_TYPES = ["labeling", "volume", "hemolysis", "transport", "other"] as const;
export type DiscrepancyType = (typeof DISCREPANCY_TYPES)[number];

export const DISCREPANCY_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type DiscrepancySeverity = (typeof DISCREPANCY_SEVERITIES)[number];
