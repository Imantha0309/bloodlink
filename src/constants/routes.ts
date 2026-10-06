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
  forgotPassword: "/forgot-password",
  emergencyRequest: "/emergency-request",
  donorHome: "/dashboard/donor",
  donorRequests: "/dashboard/donor-requests",
  donorTransit: "/dashboard/donor-transit",
  donorIntake: "/dashboard/donor-intake",
  donorProfile: "/dashboard/donor-profile",
} as const satisfies Record<string, Href>;

/** Dashboard for each role, per the post-authentication flow. */
export const ROLE_HOME = {
  recipient: "/dashboard/recipient",
  donor: "/dashboard/donor",
  hospital: "/dashboard/hospital",
  admin: "/dashboard/admin",
} as const satisfies Record<UserRole, Href>;