import { useMemo } from "react";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { AvailabilityCard } from "@/components/dashboard/availability-card";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import type { DashboardSummary } from "@/services/dashboard/dashboard";
import {
  deleteEmergencyResponse,
  respondToEmergencyRequest,
  updateEmergencyResponse,
} from "@/services/requests/emergency-requests";

/** Requests nobody has closed yet — the ones a donor can still act on. */
function isOpen(status: string): boolean {
  return status === "pending" || status === "verified";
}

export default function DonorDashboardScreen() {
  return (
    <DashboardShell title="Donor Home" bottomNavigation={<DonorTabBar active="home" />}>
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

  const firstName = session?.user.fullName.trim().split(/\s+/)[0] ?? "Donor";

  return (
    <>
      <View style={styles.intro}>
        <Text style={styles.greeting}>Hello, {firstName}</Text>
        <Text style={styles.introText}>Your availability can help someone get blood in time.</Text>
      </View>

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
        label={donorGroup === null ? "Emergency requests" : `Requests for ${donorGroup} donors`}
        trailing={
          <View style={styles.liveBadge}>
            <Feather name="radio" size={11} color={Surface.online} />
            <Text style={styles.liveText}>LIVE · {matching.length}</Text>
          </View>
        }
      />

      <Text style={styles.liveHint}>New matching requests refresh automatically every 10 seconds.</Text>

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
  intro: {
    gap: 4,
    paddingTop: 2,
  },

  greeting: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  introText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  liveText: {
    ...Typography.micro,
    color: Surface.online,
    fontWeight: "700",
  },

  liveHint: {
    ...Typography.micro,
    color: Surface.textMuted,
    marginTop: -14,
  },

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

