/**
 * Domain types shared across routes.
 *
 * The row types mirror the SQLite columns exactly (snake_case); the API types
 * are what goes over the wire (camelCase) and match the app's TypeScript
 * definitions in `src/services/**` field for field.
 */

export const USER_ROLES = ["recipient", "donor", "hospital", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const URGENCY_LEVELS = ["critical", "urgent", "standard"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const REQUEST_STATUSES = ["pending", "verified", "fulfilled", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export const DONOR_RESPONSES = ["accepted", "declined"] as const;
export type DonorResponse = (typeof DONOR_RESPONSES)[number];
export const DONATION_STAGES = ["accepted", "en_route", "arrived", "completed"] as const;
export type DonationStage = (typeof DONATION_STAGES)[number];

/** A `users` row. */
export type UserRow = {
  id: string;
  role: UserRole;
  full_name: string;
  email: string | null;
  mobile: string | null;
  district: string | null;
  registration_number: string | null;
  blood_group: BloodGroup | null;
  password_hash: string;
  is_verified: number;
  is_locked: number;
  created_at: string;
  updated_at: string;
};

/** A `sessions` row. */
export type SessionRow = {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: string;
  expires_at: string;
  revoked_at: string | null;
};

/** An `emergency_requests` row. */
export type EmergencyRequestRow = {
  id: string;
  requester_user_id: string | null;
  patient_name: string;
  blood_group: BloodGroup;
  units: number;
  hospital: string;
  district: string | null;
  contact_name: string;
  contact_mobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  /** Present on donor request feeds; null means not answered yet. */
  donor_response?: DonorResponse | null;
  donor_stage?: DonationStage | null;
  /** True when another donor has already accepted this request. */
  accepted_by_other_donor?: number | boolean;
  checkin_token_hash?: string | null;
  checkin_token_expires_at?: string | null;
};

/** The user object the app reads off a session. Mirrors `AuthUser`. */
export type AuthUser = {
  id: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district: string | null;
  bloodGroup: BloodGroup | null;
};

/** Mirrors `AuthSession` in the app. */
export type AuthSessionPayload = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

/** The emergency request shape the app consumes. */
export type EmergencyRequestPayload = {
  id: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  district: string | null;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  /** True when the request came through the account-free urgent path. */
  isAnonymous: boolean;
  /** Donor's response to this request; null when the donor has not responded. */
  donorResponse: DonorResponse | null;
  donorStage: DonationStage | null;
  acceptedByOtherDonor: boolean;
};

export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    mobile: row.mobile,
    district: row.district,
    bloodGroup: row.blood_group,
  };
}

export function toEmergencyRequest(row: EmergencyRequestRow): EmergencyRequestPayload {
  return {
    id: row.id,
    patientName: row.patient_name,
    bloodGroup: row.blood_group,
    units: row.units,
    hospital: row.hospital,
    district: row.district,
    contactName: row.contact_name,
    contactMobile: row.contact_mobile,
    urgency: row.urgency,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isAnonymous: row.requester_user_id === null,
    donorResponse: row.donor_response ?? null,
    donorStage: row.donor_stage ?? null,
    acceptedByOtherDonor: Boolean(row.accepted_by_other_donor),
  };
}
