import { useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { Surface } from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";

/**
 * Triage queue — every open request in the country, most urgent first.
 *
 * Admins are not district-scoped, so `getDashboardSummary` returns the whole
 * queue rather than one hospital's board. Each card opens the same arrival-desk
 * workflow hospital staff use: the SQL behind it admits `role = 'admin'` on the
 * same terms as a verified hospital account.
 */
export default function AdminQueueScreen() {
  const router = useRouter();

  return (
    <DashboardShell title="Triage Queue">
      {(summary) => (
        <>
          <StatGrid stats={summary.stats} />

          <SectionHeading
            label="Open requests — most urgent first"
            trailing={<Text style={styles.count}>{summary.requests.length}</Text>}
          />

          <RequestList
            requests={summary.requests}
            emptyTitle="Nothing in the queue"
            emptyMessage="No emergency requests are open right now."
            onManage={(request) => {
              router.push({
                pathname: ROUTES.hospitalVerifyDonor,
                params: { requestId: request.id },
              });
            }}
          />
        </>
      )}
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  count: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },
});
