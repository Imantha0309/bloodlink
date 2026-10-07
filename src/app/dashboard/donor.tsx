import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ActiveCommitmentBanner } from "@/components/dashboard/active-commitment-banner";
import { AvailabilityCard } from "@/components/dashboard/availability-card";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { DonorCompatibilityCard } from "@/components/dashboard/donor-compatibility-card";
import { DonorHeroCard } from "@/components/dashboard/donor-hero-card";
import { DonorQuickActions } from "@/components/dashboard/donor-quick-actions";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { RequestList } from "@/components/dashboard/request-list";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { StatGrid } from "@/components/dashboard/stat-grid";
import { CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
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

type FilterMode = "all" | "critical" | "district";

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
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showOthers, setShowOthers] = useState(false);

  const rawGroup = session?.user.bloodGroup ?? null;
  const donorGroup = isBloodGroup(rawGroup) ? rawGroup : null;
  const donorDistrict = session?.user.district ?? null;
  const isAvailable = summary.availability?.isAvailable ?? false;

  const { matching, others } = useMemo(() => {
    const open = summary.requests.filter((request) => isOpen(request.status));

    if (donorGroup === null) {
      return { matching: [], others: open };
    }

    const receivable = CAN_DONATE_TO[donorGroup];

    return {
      matching: open.filter((request) => receivable.includes(request.bloodGroup)),
      others: open.filter((request) => !receivable.includes(request.bloodGroup)),
    };
  }, [summary.requests, donorGroup]);

  // Apply quick filter on matching requests
  const filteredMatching = useMemo(() => {
    if (filterMode === "critical") {
      return matching.filter((item) => item.urgency === "critical");
    }
    if (filterMode === "district" && donorDistrict) {
      return matching.filter((item) => item.district === donorDistrict);
    }
    return matching;
  }, [matching, filterMode, donorDistrict]);

  const criticalCount = matching.filter((item) => item.urgency === "critical").length;
  const districtCount = donorDistrict
    ? matching.filter((item) => item.district === donorDistrict).length
    : 0;

  return (
    <View style={styles.container}>
      {/* 1. Donor Identity Hero Banner */}
      <DonorHeroCard
        fullName={session?.user.fullName ?? "Donor"}
        bloodGroup={donorGroup}
        district={donorDistrict}
        isAvailable={isAvailable}
      />

      {/* 2. Active Commitment / Journey Alert */}
      <ActiveCommitmentBanner onCommitmentChange={helpers.reload} />

      {/* 3. Availability Dispatch Controller */}
      {summary.availability !== null ? (
        <AvailabilityCard
          availability={summary.availability}
          onSaved={(next) => {
            helpers.applyAvailability(next);
            helpers.reload();
          }}
        />
      ) : null}

      {/* 4. KPI Stats */}
      <StatGrid stats={summary.stats} />

      {/* 5. Quick Workflow Launcher */}
      <View style={styles.sectionWrap}>
        <SectionHeading label="Quick shortcuts" />
        <DonorQuickActions matchingCount={matching.length} />
      </View>

      {/* 6. Emergency Requests Section with Interactive Filter Tabs */}
      <View style={styles.requestsSection}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.titleWithLive}>
            <Text style={styles.sectionTitle}>
              {donorGroup === null ? "Emergency Requests" : `Requests for ${donorGroup} Donors`}
            </Text>
            <View style={styles.liveBadge}>
              <View style={styles.pulsingLiveDot} />
              <Text style={styles.liveText}>LIVE · {matching.length}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.liveHint}>
          Auto-refreshes every 10 seconds. Accept only if you can travel to the hospital.
        </Text>

        {/* Filter Chips */}
        {matching.length > 0 ? (
          <View style={styles.filterRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter all compatible requests (${matching.length})`}
              onPress={() => setFilterMode("all")}
              style={[styles.filterChip, filterMode === "all" && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterMode === "all" && styles.filterChipTextActive]}>
                All Compatible ({matching.length})
              </Text>
            </Pressable>

            {criticalCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Filter critical requests (${criticalCount})`}
                onPress={() => setFilterMode("critical")}
                style={[
                  styles.filterChip,
                  filterMode === "critical" && styles.filterChipCriticalActive,
                ]}
              >
                <Feather
                  name="alert-octagon"
                  size={12}
                  color={filterMode === "critical" ? "#FFFFFF" : Blood.primary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filterMode === "critical" && styles.filterChipTextActive,
                  ]}
                >
                  Critical ({criticalCount})
                </Text>
              </Pressable>
            ) : null}

            {donorDistrict !== null && districtCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Filter in district requests (${districtCount})`}
                onPress={() => setFilterMode("district")}
                style={[styles.filterChip, filterMode === "district" && styles.filterChipActive]}
              >
                <Feather
                  name="map-pin"
                  size={12}
                  color={filterMode === "district" ? "#FFFFFF" : Surface.textSecondary}
                />
                <Text
                  style={[
                    styles.filterChipText,
                    filterMode === "district" && styles.filterChipTextActive,
                  ]}
                >
                  In {donorDistrict} ({districtCount})
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Request List */}
        <RequestList
          requests={filteredMatching}
          donorGroup={donorGroup}
          canAccept={isAvailable}
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
          emptyTitle={
            donorGroup === null
              ? "No blood group on your profile"
              : filterMode !== "all"
              ? "No requests matching this filter"
              : "No matching requests right now"
          }
          emptyMessage={
            donorGroup === null
              ? "Add your blood group to see emergency cases you can donate for."
              : filterMode !== "all"
              ? "Switch back to 'All Compatible' to see other open requests."
              : "Nothing open right now needs your blood type. You will receive an alert as soon as a hospital posts one."
          }
        />
      </View>

      {/* 7. Blood Compatibility Guide & Donor Readiness */}
      <DonorCompatibilityCard bloodGroup={donorGroup} />

      {/* 8. Other Open Nationwide Requests (Collapsible) */}
      {others.length > 0 ? (
        <View style={styles.othersSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Toggle other open requests"
            onPress={() => setShowOthers((prev) => !prev)}
            style={styles.othersHeader}
          >
            <View style={styles.othersHeadingWrap}>
              <Text style={styles.othersTitle}>Other nationwide open requests</Text>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>{others.length}</Text>
              </View>
            </View>

            <Feather
              name={showOthers ? "chevron-up" : "chevron-down"}
              size={18}
              color={Surface.textSecondary}
            />
          </Pressable>

          <Text style={styles.othersSubtitle}>
            These requests require a different blood group — displayed for awareness.
          </Text>

          {showOthers ? (
            <RequestList requests={others} donorGroup={donorGroup} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  sectionWrap: {
    gap: 8,
  },

  requestsSection: {
    gap: 10,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleWithLive: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  sectionTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Surface.text,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Surface.softGreen,
  },

  pulsingLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Surface.online,
  },

  liveText: {
    ...Typography.micro,
    color: Surface.online,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  liveHint: {
    ...Typography.small,
    fontSize: 11,
    color: Surface.textMuted,
    marginTop: -4,
  },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 2,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  filterChipActive: {
    backgroundColor: Surface.text,
    borderColor: Surface.text,
  },

  filterChipCriticalActive: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  filterChipText: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.textSecondary,
    fontSize: 11.5,
  },

  filterChipTextActive: {
    color: "#FFFFFF",
  },

  othersSection: {
    gap: 8,
    paddingTop: 8,
  },

  othersHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  othersHeadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  othersTitle: {
    ...Typography.label,
    fontWeight: "700",
    color: Surface.textSecondary,
  },

  countPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
  },

  countPillText: {
    ...Typography.micro,
    fontWeight: "700",
    color: Surface.textSecondary,
  },

  othersSubtitle: {
    ...Typography.small,
    fontSize: 11.5,
    color: Surface.textMuted,
    marginTop: -4,
  },
});
