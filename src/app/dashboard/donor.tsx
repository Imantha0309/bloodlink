import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";

import { AvailabilityCard } from "@/components/dashboard/availability-card";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import type { DashboardSummary } from "@/services/dashboard/dashboard";

/** Requests nobody has closed yet — the ones a donor can still act on. */
function isOpen(status: string): boolean {
  return status === "pending" || status === "verified";
}

export default function DonorDashboardScreen() {
  return (
    <DashboardShell title="Donor Dashboard">
      {(summary, helpers) => <DonorContent summary={summary} helpers={helpers} />}
    </DashboardShell>
  );
}

function DonorContent({
  summary,
  helpers,
}: {
  summary: DashboardSummary;
  helpers: DashboardHelpers;
}) {
  const { session } = useAuth();

  // The stored session carries the blood group as a plain string, so it has to
  // be narrowed before it can index the compatibility table.
  const rawGroup = session?.user.bloodGroup ?? null;
  const donorGroup = isBloodGroup(rawGroup) ? rawGroup : null;

  const { matching, others } = useMemo(() => {
    const open = summary.requests.filter((request) => isOpen(request.status));

    if (donorGroup === null) {
      return { matching: [], others: open };
    }

    // The server decides what a donor is shown; this only splits the list so
    // compatible requests float to the top.
    const receivable = CAN_DONATE_TO[donorGroup];

    return {
      matching: open.filter((request) => receivable.includes(request.bloodGroup)),
      others: open.filter((request) => !receivable.includes(request.bloodGroup)),
    };
  }, [summary.requests, donorGroup]);

  return (
    <>
      {summary.availability !== null ? (
        <AvailabilityCard
          availability={summary.availability}
          onSaved={(next) => {
            helpers.applyAvailability(next);
            // The stat tiles read availability too, so pull them in behind it.
            helpers.reload();
          }}
        />
      ) : null}

      <StatGrid stats={summary.stats} />

      <SectionHeading
        label={donorGroup === null ? "Open requests" : `Compatible with ${donorGroup}`}
        trailing={<Text style={styles.count}>{matching.length}</Text>}
      />

      <RequestList
        requests={matching}
        donorGroup={donorGroup}
        emptyTitle={donorGroup === null ? "No blood group on your profile" : "No matching requests"}
        emptyMessage={
          donorGroup === null
            ? "Add your blood group to see requests you can serve."
            : "Nothing open right now needs your blood group. You will be alerted when something does."
        }
      />

      {others.length > 0 ? (
        <>
          <SectionHeading
            label="Other open requests"
            trailing={<Text style={styles.count}>{others.length}</Text>}
          />

          <Text style={styles.note}>
            These need a different blood group — shown for awareness only.
          </Text>

          <RequestList requests={others} donorGroup={donorGroup} />
        </>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  count: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  note: {
    ...Typography.small,
    color: Surface.textMuted,
    marginTop: -10,
  },
});
