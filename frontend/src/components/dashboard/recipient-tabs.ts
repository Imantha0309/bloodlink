import type { DashboardTab } from "@/components/dashboard/dashboard-tab-bar";

/**
 * The recipient tab list, including the Donate tab.
 *
 * Donate only appears for accounts that can actually donate — a recipient with
 * no blood group has nothing to match — so the home dashboard and the Donate
 * screen itself both ask this for the list instead of each rebuilding the rule.
 */
export function recipientTabs(
  alertCount: string | undefined,
  isDonorEligible: boolean,
): DashboardTab[] {
  const tabs: DashboardTab[] = [
    { key: "home", label: "Home", icon: "home" },
    { key: "requests", label: "Requests", icon: "file-text" },
    { key: "alerts", label: "Alerts", icon: "bell", badge: alertCount },
    { key: "profile", label: "Profile", icon: "user" },
  ];

  if (isDonorEligible) {
    // Donate sits second, next to the emergency path it feeds.
    tabs.splice(1, 0, { key: "donate", label: "Donate", icon: "heart" });
  }

  return tabs;
}
