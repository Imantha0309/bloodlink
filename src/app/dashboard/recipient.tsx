import { useRouter } from "expo-router";

import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { ROUTES } from "@/constants/routes";
import { cancelEmergencyRequest } from "@/services/requests/emergency-requests";

export default function RecipientDashboardScreen() {
  const router = useRouter();

  return (
    <DashboardShell title="Recipient Dashboard">
      {(summary, helpers) => (
        <>
          <StatGrid stats={summary.stats} />

          <PrimaryAuthButton
            label="Request Blood Now"
            icon="alert-circle"
            onPress={() => router.push(ROUTES.emergencyRequest)}
          />

          <SectionHeading label="Your requests" />

          <RequestList
            requests={summary.requests}
            isManageable
            onCancel={async (request) => {
              await cancelEmergencyRequest(request.id);
              // A cancel is a status flip, so pull the fresh list rather than
              // guessing at the new state locally.
              helpers.reload();
            }}
            onEdit={(request) => {
              router.push({
                pathname: ROUTES.manageRequest,
                params: { id: request.id },
              });
            }}
            emptyTitle="No requests yet"
            emptyMessage="Raise a request and it will appear here with its live status."
          />
        </>
      )}
    </DashboardShell>
  );
}
