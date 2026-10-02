import { useRouter } from "expo-router";

import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { ROUTES } from "@/constants/routes";

export default function RecipientDashboardScreen() {
  const router = useRouter();

  return (
    <DashboardShell title="Recipient Dashboard">
      {(summary) => (
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
            emptyTitle="No requests yet"
            emptyMessage="Raise a request and it will appear here with its live status."
          />
        </>
      )}
    </DashboardShell>
  );
}
