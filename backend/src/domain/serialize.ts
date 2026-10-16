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

import type {
  AlertType,
  BloodComponent,
  DiscrepancySeverity,
  DiscrepancyType,
  DonationStage,
  DonorResponse,
  RequestStatus,
  UrgencyLevel,
  UserRole,
} from "../models/shared";

/** ObjectId → string, and `null` stays `null` rather than becoming "null". */
export function asId(value: unknown): string | null {
  return value === null || value === undefined ? null : String(value);
}

type RequestFields = {
  _id: unknown;
  requester?: unknown;
  patientName: string;
  bloodGroup: string;
  units: number;
  hospital: string;
  district: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type RequestRowExtras = {
  donorResponse?: DonorResponse | null;
  donorStage?: DonationStage | null;
  acceptedByOtherDonor?: boolean;
  /** A donor was matched to this request by staff reading their pass at a desk. */
  donorMatchedOnBehalf?: boolean;
};

/**
 * One request, as the app reads it.
 *
 * `isAnonymous` is derived rather than stored: a request with no `requester` is
 * by definition one that came through the zero-login urgent path.
 */
export function requestRow(
  doc: RequestFields,
  extras: RequestRowExtras = {},
): Record<string, unknown> {
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
    donorMatchedOnBehalf: extras.donorMatchedOnBehalf ?? false,
  };
}

type AlertFields = {
  _id: unknown;
  type: AlertType;
  request?: unknown;
  title: string;
  body: string;
  readAt: Date | null;
  createdAt: Date;
};

export function alertRow(doc: AlertFields): Record<string, unknown> {
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

type UserFields = {
  _id: unknown;
  role: UserRole;
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  district?: string | null;
  bloodGroup?: string | null;
  station?: string | null;
  wardLabel?: string | null;
  avatarUrl?: string | null;
};

/**
 * The identity behind a scanned pass, as `ResolvedPass`.
 *
 * Deliberately narrower than `authUserRow`. A pass is shown to whoever scans it,
 * so it carries only what identifies a person at a desk — name, role, and the
 * station or district they work in. Contact details are not included: a pass is
 * not a way to lift someone's email or phone number off them.
 */
export function passOwnerRow(user: UserFields & { isVerified?: boolean }): Record<string, unknown> {
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
export function authUserRow(user: UserFields): Record<string, unknown> {
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

type AdminUserFields = UserFields & {
  registrationNumber?: string | null;
  isVerified: boolean;
  createdAt: Date;
};

/**
 * A row in the admin account table.
 *
 * Unlike `authUserRow` this carries `registrationNumber`, because approving a
 * hospital means checking the number it registered with. It still excludes every
 * credential field.
 */
export function adminUserRow(user: AdminUserFields): Record<string, unknown> {
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

type DiscrepancyFields = {
  _id: unknown;
  district?: string | null;
  type: DiscrepancyType;
  severity: DiscrepancySeverity;
  detail: string;
  reporterName: string;
  resolvedAt: Date | null;
  createdAt: Date;
};

export function discrepancyRow(report: DiscrepancyFields): Record<string, unknown> {
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

type HandoverFields = {
  _id: unknown;
  district?: string | null;
  shiftLabel: string;
  notes: string;
  pendingCrossMatches: number;
  authorName: string;
  createdAt: Date;
};

export function handoverRow(handover: HandoverFields): Record<string, unknown> {
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

type BankFields = {
  _id: unknown;
  name: string;
  district: string;
  address?: string | null;
  phone?: string | null;
  hours?: string | null;
  isVerified: boolean;
  note?: string | null;
};

export function bankRow(doc: BankFields, totalUnits?: number): Record<string, unknown> {
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

type InventoryFields = {
  bloodGroup: string;
  component: BloodComponent;
  units: number;
  updatedAt: Date;
};

export function inventoryRow(doc: InventoryFields): Record<string, unknown> {
  return {
    bloodGroup: doc.bloodGroup,
    component: doc.component,
    units: doc.units,
    updatedAt: doc.updatedAt,
  };
}
