/**
 * Presentation metadata for notification types.
 *
 * One map so the alerts feed, the tab badge and any future deep link into an
 * alert render the same icon and tint for the same event.
 */

import type { ComponentProps } from "react";
import { Feather } from "@expo/vector-icons";

import { Blood, Surface } from "@/constants/colors";
import type { AlertType } from "@/services/alerts";

export const ALERT_META: Record<
  AlertType,
  {
    label: string;
    icon: ComponentProps<typeof Feather>["name"];
    background: string;
    color: string;
  }
> = {
  new_match: {
    label: "New match",
    icon: "zap",
    background: Surface.softRed,
    color: Blood.primary,
  },
  donor_accepted: {
    label: "Donor accepted",
    icon: "user-check",
    background: Surface.softGreen,
    color: Surface.online,
  },
  status_change: {
    label: "Status change",
    icon: "refresh-cw",
    background: Surface.softBlue,
    color: Surface.accentBlue,
  },
  request_fulfilled: {
    label: "Fulfilled",
    icon: "check-circle",
    background: Surface.softGreen,
    color: Surface.successText,
  },
};
