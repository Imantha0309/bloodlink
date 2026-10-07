import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import {
  ActiveRequestCard,
  type ActiveRequest,
} from "@/components/dashboard/active-request-card";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  DashboardTabBar,
  type DashboardTab,
  type DashboardTabKey,
} from "@/components/dashboard/dashboard-tab-bar";
import { EmergencyAlertCard } from "@/components/dashboard/emergency-alert-card";
import { GreetingSection } from "@/components/dashboard/greeting-section";
import { HomeHeader } from "@/components/dashboard/home-header";
import {
  NearbyBloodBanks,
  type BloodBankSummary,
} from "@/components/dashboard/nearby-blood-banks";
import { QuickActionGrid, type QuickAction } from "@/components/dashboard/quick-action-grid";
import { SupportCard } from "@/components/dashboard/support-card";
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
import { useAuth } from "@/providers/auth-provider";
import type { EmergencyRequest } from "@/services/requests/emergency-requests";
import { isRequestLive } from "@/utils/request-timeline";
import { referenceFor } from "@/utils/reference";
import { timeAgo } from "@/utils/time";

/**
 * Calculate alert count from open requests.
 * In a full implementation, this would come from a notifications endpoint.
 */
function getAlertCount(requests: EmergencyRequest[]): string {
  const openCount = requests.filter(
    (r) => r.status === "pending" || r.status === "verified"
  ).length;
  return String(openCount > 0 ? openCount : 0);
}

/**
 * Nearby banks are static for now — the API exposes no bank or inventory
 * endpoint, and fabricating distances would read as real data.
 * This provides helpful reference information until real data is available.
 */
const BLOOD_BANKS: BloodBankSummary[] = [
  {
    id: "bank_national",
    name: "National Hospital",
    meta: "Colombo 07 · 2.4 km",
    availability: "Open",
    isOpen: true,
  },
  {
    id: "bank_lady_ridge",
    name: "Lady Ridgeway Hospital",
    meta: "Colombo 05 · 4.1 km",
    availability: "Open",
    isOpen: true,
  },
];

function getTabs(alertCount: string): DashboardTab[] {
  return [
    { key: "home", label: "Home", icon: "home" },
    { key: "requests", label: "Requests", icon: "file-text" },
    { key: "alerts", label: "Alerts", icon: "bell", badge: alertCount },
    { key: "profile", label: "Profile", icon: "user" },
  ];
}

const TAB_HREFS = DASHBOARD_TABS;

/** Headline for the active request, built from fields the API does return. */
function needLabel(request: EmergencyRequest): string {
  const units = `${request.units} unit${request.units === 1 ? "" : "s"}`;

  return `${units} of ${request.bloodGroup} urgently needed`;
}

export default function RecipientDashboardScreen() {
  const router = useRouter();
  const { session } = useAuth();

  const user = session?.user ?? null;

  const goToTab = (key: DashboardTabKey) => {
    // Home is already the active tab; re-pushing it would stack a duplicate of
    // the screen the user is already looking at.
    if (key === "home") {
      return;
    }

    router.push(TAB_HREFS[key]);
  };

  const quickActions: QuickAction[] = [
    {
      key: "donors",
      title: "Find & Browse Donors",
      icon: "users",
      onPress: () => {
        router.push(ROUTES.donors);
      },
    },
    {
      key: "compatibility",
      title: "Compatibility Chart",
      icon: "grid",
      onPress: () => {
        router.push(ROUTES.compatibility);
      },
    },
  ];

  return (
    <DashboardShell
      title="Dashboard"
      header={
        <HomeHeader
          roleLabel="Recipient"
          screenLabel="Home"
          onAlertsPress={() => {
            goToTab("alerts");
          }}
          onProfilePress={() => {
            goToTab("profile");
          }}
        />
      }
      footer={
        <DashboardTabBar tabs={getTabs("0")} activeKey="home" onSelect={goToTab} />
      }
    >
      {(summary) => {
        const request = summary.requests[0] ?? null;
        const notificationCount = getAlertCount(summary.requests);

        // Only a live (pending/verified) request belongs on the home card;
        // fulfilled and cancelled history lives in the Requests tab.
        const activeRequest: ActiveRequest | null =
          request === null || !isRequestLive(request.status)
            ? null
            : {
                reference: referenceFor(request.id),
                bloodGroup: request.bloodGroup,
                title: needLabel(request),
                facilityName: request.hospital,
                district: request.district ?? "Location pending",
                status: request.status,
                postedLabel: timeAgo(request.createdAt),
              };

        return (
          <View style={styles.body}>
            <GreetingSection
              fullName={user?.fullName ?? ""}
              district={user?.district ?? null}
              notificationCount={notificationCount}
              onLocationPress={() => {
                router.push(ROUTES.location);
              }}
            />

            <EmergencyAlertCard
              onPress={() => {
                router.push(ROUTES.emergencyRequest);
              }}
            />

            {activeRequest === null || request === null ? null : (
              <ActiveRequestCard
                request={activeRequest}
                onPress={() => {
                  router.push({
                    pathname: ROUTES.requestStatus,
                    params: { id: request.id },
                  });
                }}
              />
            )}

            <QuickActionGrid actions={quickActions} />

            <NearbyBloodBanks
              banks={BLOOD_BANKS}
              onBankPress={() => {
                router.push(ROUTES.bloodBankDetail);
              }}
            />

            <SupportCard />
          </View>
        );
      }}
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});