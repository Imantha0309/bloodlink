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
  forgotPassword: "/forgot-password",
  emergencyRequest: "/emergency-request",
  donors: "/donors",
  compatibility: "/compatibility",
  location: "/location",
  bloodBankDetail: "/blood-bank-detail",
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