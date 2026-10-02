import { StyleSheet, Text } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

export default function AdminDashboardScreen() {
  return (
    <DashboardShell title="Admin Dashboard">
      {(summary) => (
        <>
          <StatGrid stats={summary.stats} />

          <SectionHeading
            label="Triage queue — most urgent first"
            trailing={<Text style={styles.count}>{summary.requests.length}</Text>}
          />

          <RequestList
            requests={summary.requests}
            emptyTitle="Nothing in the queue"
            emptyMessage="No emergency requests have been raised."
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
