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
  requestStatus: "/dashboard/request-status",
  forgotPassword: "/forgot-password",
  emergencyRequest: "/emergency-request",
  /** Edit form for a recipient's own emergency request; takes an `id` param. */
  manageRequest: "/manage-request",
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
  /**
   * The pass scanner, available to every signed-in role.
   *
   * Lives at the top level rather than under a dashboard because the desk that
   * needs it is whichever one the person is standing at, not the one their
   * account's home tab happens to be.
   */
  scan: "/scan",
  /** User settings and profile management for all roles. */
  settings: "/settings",
  /**
   * Donate tab for donor-eligible recipients.
   *
   * A route in its own right so it deep-links and so the tab bar navigates the
   * same way every other tab does.
   */
  donate: "/dashboard/donate",
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
  /** Nurse handover notes and outstanding cross-matches for the district. */
  hospitalHandover: "/dashboard/hospital/handover",
  /** Static NBTS transfusion protocol reference. */
  hospitalGuidelines: "/dashboard/hospital/guidelines",
  /** Incident reporting for bag labeling, volume and hemolysis errors. */
  hospitalDiscrepancy: "/dashboard/hospital/discrepancy",
  /** Switch ward, blood bank desk or transfer lead. */
  hospitalReassignment: "/dashboard/hospital/reassignment",
  /** Triage queue tab. */
  adminQueue: "/dashboard/admin",
  /** Every blood bank, for admins who are not scoped to one district. */
  adminBanks: "/dashboard/admin/banks",
  /** Account administration: roles and hospital verification. */
  adminUsers: "/dashboard/admin/users",
  /**
   * Staff profile for an administrator.
   *
   * Admins previously had no profile screen at all, which is why they had
   * nowhere to show a pass; this gives them the same one every other role has.
   */
  adminProfile: "/dashboard/admin-profile",
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
  donate: "/dashboard/donate",
} as const satisfies Record<string, Href>;

/** Dashboard for each role, per the post-authentication flow. */
export const ROLE_HOME = {
  recipient: "/dashboard/recipient",
  donor: "/dashboard/donor",
  hospital: "/dashboard/hospital",
  admin: "/dashboard/admin",
} as const satisfies Record<UserRole, Href>;
