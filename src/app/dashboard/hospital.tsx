import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export default function HospitalDashboardScreen() {
  return (
    <DashboardShell title="Hospital Dashboard">
      {(summary) => {
        // The server returns the open queue for this role; splitting it is a
        // layout decision, not an authorization one.
        const awaiting = summary.requests.filter((request) => request.status === "pending");
        const handled = summary.requests.filter((request) => request.status !== "pending");

        return (
          <>
            <StatGrid stats={summary.stats} />

            <View style={styles.notice}>
              <Feather name="shield" size={14} color={Surface.textSecondary} />

              <Text style={styles.noticeText}>
                Verifying a request releases it to matching donors. Unverified requests stay in
                triage only.
              </Text>
            </View>

            <SectionHeading
              label="Awaiting verification"
              trailing={<Text style={styles.count}>{awaiting.length}</Text>}
            />

            <RequestList
              requests={awaiting}
              emptyTitle="Triage queue is clear"
              emptyMessage="Every request has been verified or closed."
            />

            {handled.length > 0 ? (
              <>
                <SectionHeading label="Verified and recent" />

                <RequestList requests={handled} />
              </>
            ) : null}
          </>
        );
      }}
    </DashboardShell>
  );
}

const styles = StyleSheet.create({
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  noticeText: {
    ...Typography.small,
    color: Surface.textSecondary,
    flex: 1,
  },

  count: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },
});
