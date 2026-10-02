/**
 * Role-selection catalogue.
 *
 * `UserRole` (in `@/services/auth/types`) is the domain type and includes
 * `admin`. This module holds the subset a person may claim for themselves, plus
 * all the copy and accent styling for those cards — in one place, so the
 * role-select screen, registration and the dashboards cannot drift apart.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

import { Blood, Surface } from "@/constants/colors";
import type { UserRole } from "@/services/auth/types";

/**
 * Roles offered on the "Choose Your Role" screen.
 *
 * `admin` is deliberately absent: admin accounts are provisioned internally and
 * must never be self-claimed.
 */
export const SELF_REGISTER_ROLES = ["recipient", "donor", "hospital"] as const satisfies readonly UserRole[];

export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

/** Narrow guard for values arriving from a URL param. */
export function isSelfRegisterRole(value: unknown): value is SelfRegisterRole {
  return typeof value === "string" && (SELF_REGISTER_ROLES as readonly string[]).includes(value);
}

/** Short label used in button copy, e.g. "Continue as Donor". */
export const ROLE_LABEL: Record<SelfRegisterRole, string> = {
  recipient: "Recipient",
  donor: "Donor",
  hospital: "Hospital",
};

type RoleAccent = {
  /** Panel background behind the icon. */
  background: string;
  /** Border tint, used for the icon container. */
  border: string;
  /** Icon colour — the one saturated colour per role. */
  icon: string;
};

export type RoleCardMeta = {
  role: SelfRegisterRole;
  title: string;
  badge: string;
  description: string;
  /** The two capability chips shown in the card's meta row. */
  features: readonly [string, string];
  icon: ComponentProps<typeof Feather>["name"];
  accent: RoleAccent;
};

/** Ordered as displayed. Donor carries the green accent. */
export const ROLE_CARDS: readonly RoleCardMeta[] = [
  {
    role: "recipient",
    title: "Blood Recipient / Family",
    badge: "Emergency Ready",
    description: "Request blood urgently, track requests, and find nearby verified donors in real-time.",
    features: ["Priority Triage", "GPS Radius Alerts"],
    icon: "heart",
    accent: { background: Surface.softRed, border: Surface.softRedBorder, icon: Blood.primary },
  },
  {
    role: "donor",
    title: "Blood Donor",
    badge: "Hero Badge",
    description: "Receive emergency blood alerts, set your live availability window, and save lives nearby.",
    features: ["Verified Donor ID", "Direct SOS Pushes"],
    icon: "droplet",
    accent: { background: Surface.softGreen, border: Surface.softGreenBorder, icon: Surface.online },
  },
  {
    role: "hospital",
    title: "Hospital / Blood Bank",
    badge: "Medical ID Required",
    description: "Verify requests, manage blood stock requisitions, and audit incoming certified donors.",
    features: ["Stock Requisitions", "Donor Auditing"],
    icon: "home",
    accent: { background: Surface.softBlue, border: Surface.softBlueBorder, icon: Surface.textSecondary },
  },
];