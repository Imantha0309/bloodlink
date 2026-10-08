import type { Href } from "expo-router";

import type { UserRole } from "@/services/auth/types";

/**
 * Every path the login flow can navigate to, in one place.
 *
 * Typed as `Href` so expo-router's generated route types catch a rename or a
 * deleted screen at compile time instead of at runtime.
 */

export const ROUTES = {
  splash: "/",
  roleSelect: "/role-select",
  login: "/login",
  register: "/register",
  requestDetail: "/dashboard/request-detail",
  requestStatus: "/dashboard/request-status",
  forgotPassword: "/forgot-password",
  emergencyRequest: "/emergency-request",
  donors: "/donors",
  compatibility: "/compatibility",
  location: "/location",
  bloodBankDetail: "/blood-bank-detail",
  donorHome: "/dashboard/donor",
  donorRequests: "/dashboard/donor-requests",
  donorTransit: "/dashboard/donor-transit",
  donorIntake: "/dashboard/donor-intake",
  donorProfile: "/dashboard/donor-profile",
  passDetails: "/pass-details",
  /** Blood bank storage monitor, pushed from the hospital Home tab. */
  hospitalStorage: "/dashboard/hospital/storage",
  /** Requisition form, pushed from the hospital Home and storage screens. */
  hospitalCreateRequest: "/dashboard/hospital/create-request",
  /** Broadcast progress, pushed from the requisition form's submit action. */
  hospitalTransmission: "/dashboard/hospital/transmission",
  /** Requisition board, where a freshly broadcast requisition is tracked. */
  hospitalRequests: "/dashboard/hospital/requests",
  /** Donor arrival desk, pushed from a requisition card. */
  hospitalVerifyDonor: "/dashboard/hospital/verify-donor",
  /** Collection telemetry, pushed once a donor is cleared for extraction. */
  hospitalExtractionSession: "/dashboard/hospital/extraction-session",
  /** Staff profile, opened from the avatar in the hospital headers. */
  hospitalProfile: "/dashboard/hospital/profile",
} as const satisfies Record<string, Href>;

/**
 * Screens shown inside the dashboard tab bar.
 *
 * Keyed by tab name so `DashboardTabBar` stays a dumb presentational component
 * and the recipient dashboard supplies the active key.
 */
export const DASHBOARD_TABS = {
  home: "/dashboard/recipient",
  requests: "/dashboard/requests",
  alerts: "/dashboard/alerts",
  profile: "/dashboard/profile",
} as const satisfies Record<string, Href>;

/** Dashboard for each role, per the post-authentication flow. */
export const ROLE_HOME = {
  recipient: "/dashboard/recipient",
  donor: "/dashboard/donor",
  hospital: "/dashboard/hospital",
  admin: "/dashboard/admin",
} as const satisfies Record<UserRole, Href>;