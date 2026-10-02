/**
 * Urgency levels for an emergency request.
 *
 * Ordered most severe first — the order the picker renders them in and the
 * order the server triages them by.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

import { Blood, Surface } from "@/constants/colors";

export const URGENCY_LEVELS = ["critical", "urgent", "standard"] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export function isUrgencyLevel(value: unknown): value is UrgencyLevel {
  return typeof value === "string" && (URGENCY_LEVELS as readonly string[]).includes(value);
}

export type UrgencyMeta = {
  level: UrgencyLevel;
  label: string;
  description: string;
  icon: ComponentProps<typeof Feather>["name"];
  /** Panel background when selected. */
  background: string;
  /** Border tint when selected. */
  border: string;
  /** Icon and text colour when selected. */
  accent: string;
};

export const URGENCY_OPTIONS: readonly UrgencyMeta[] = [
  {
    level: "critical",
    label: "Critical",
    description: "Life-threatening — needed within the hour",
    icon: "alert-octagon",
    background: Surface.softRed,
    border: Surface.softRedBorder,
    accent: Blood.primary,
  },
  {
    level: "urgent",
    label: "Urgent",
    description: "Needed within 24 hours",
    icon: "clock",
    background: Surface.softBlue,
    border: Surface.softBlueBorder,
    accent: Surface.textSecondary,
  },
  {
    level: "standard",
    label: "Standard",
    description: "Planned or scheduled transfusion",
    icon: "calendar",
    background: Surface.softGreen,
    border: Surface.softGreenBorder,
    accent: Surface.online,
  },
];

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  critical: "Critical",
  urgent: "Urgent",
  standard: "Standard",
};
