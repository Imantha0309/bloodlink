import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AvailabilityCard } from "@/components/dashboard/availability-card";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { HomeHeader } from "@/components/dashboard/home-header";
import { RequestList } from "@/components/dashboard/request-list";
import { recipientTabs } from "@/components/dashboard/recipient-tabs";
import { CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
<<<<<<< HEAD
import { DASHBOARD_TABS } from "@/constants/routes";
=======
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
>>>>>>> origin/feature/recipient-module
import { useUnreadAlerts } from "@/hooks/use-unread-alerts";
import { useAuth } from "@/providers/auth-provider";
import type { DashboardSummary } from "@/services/dashboard/dashboard";
import {
  deleteEmergencyResponse,
  respondToEmergencyRequest,
  updateEmergencyResponse,
} from "@/services/requests/emergency-requests";

/**
 * Donate — the recipient-side answer to an open emergency request.
 *
 * This used to be an in-screen tab on the recipient dashboard, which meant it had
 * no URL of its own and could not be linked to. Making it a route also means it
 * gets the same header, pull-to-refresh and availability wiring as every other
 * dashboard screen, because it now runs through `DashboardShell` like they do.
 */
export default function DonateScreen() {
  const router = useRouter();
  const unreadAlerts = useUnreadAlerts();
  const { session } = useAuth();

  const isDonorEligible = session?.user.isDonorEligible === true;

  function goToTab(key: DashboardTabKey) {
    if (key === "donate") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  return (
    <DashboardShell
      title="Dashboard"
      header={
        <HomeHeader
          roleLabel="Recipient"
          screenLabel="Donate"
          onAlertsPress={() => {
            goToTab("alerts");
          }}
          onProfilePress={() => {
            goToTab("profile");
          }}
        />
      }
      footer={
        <DashboardTabBar
          tabs={recipientTabs(unreadAlerts > 0 ? String(unreadAlerts) : undefined, isDonorEligible)}
          activeKey="donate"
          onSelect={goToTab}
        />
      }
    >
      {(summary, helpers) => <DonateContent summary={summary} helpers={helpers} />}
    </DashboardShell>
  );
}

/**
 * Everything below the shell, driven by the summary it already fetched — this
 * screen makes no request of its own.
 */
function DonateContent({
  summary,
  helpers,
}: {
  summary: DashboardSummary;
  helpers: DashboardHelpers;
}) {
<<<<<<< HEAD
=======
  const router = useRouter();
>>>>>>> origin/feature/recipient-module
  const { session } = useAuth();
  const rawGroup = session?.user.bloodGroup ?? null;
  const donorGroup = isBloodGroup(rawGroup) ? rawGroup : null;

  const matching = useMemo(() => {
    if (donorGroup === null) {
      return [];
    }

    const receivable = CAN_DONATE_TO[donorGroup];

    // `availableRequests` — the compatible open feed — not `summary.requests`,
    // which for a recipient is the list of requests they raised themselves.
    return (summary.availableRequests ?? []).filter(
      (request) =>
        (request.status === "pending" || request.status === "verified") &&
        receivable.includes(request.bloodGroup),
    );
  }, [summary.availableRequests, donorGroup]);

  return (
    <View style={styles.body}>
      {summary.availability !== null ? (
        <AvailabilityCard
          availability={summary.availability}
          onSaved={(next) => {
            // The write endpoints return the confirmed value, so the switch is
            // correct immediately; the refetch settles the request list.
            helpers.applyAvailability(next);
            helpers.reload();
          }}
        />
      ) : null}

      <RequestList
        requests={matching}
        donorGroup={donorGroup}
        canAccept={summary.availability?.isAvailable ?? false}
        onDonorResponse={async (id, response, isUpdate) => {
          const saved = isUpdate
            ? await updateEmergencyResponse(id, response)
            : await respondToEmergencyRequest(id, response);
          helpers.reload();
          return saved;
        }}
        onRemoveDonorResponse={async (id) => {
          await deleteEmergencyResponse(id);
          helpers.reload();
        }}
<<<<<<< HEAD
=======
        onAccepted={() => router.push(ROUTES.donorTransit)}
>>>>>>> origin/feature/recipient-module
        emptyTitle={donorGroup === null ? "No blood group set" : "No matching requests right now"}
        emptyMessage={
          donorGroup === null
            ? "Your profile doesn't have a blood group yet."
            : "You'll be notified when a compatible request comes in."
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
