import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { StepHeader } from "@/components/emergency/step-header";
import { AsyncState } from "@/components/ui/async-state";
import { SelectField } from "@/components/ui/select-field";
import { SkeletonCard } from "@/components/ui/skeleton";
import { BLOOD_GROUPS, type BloodGroup, isBloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Radius } from "@/constants/radius";
import { DASHBOARD_TABS, ROLE_HOME } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import { searchDonors, type DirectoryDonor } from "@/services/donors/directory";

/**
 * Find Donors — privacy-safe donor search.
 *
 * `?bloodGroup=` (set by the Compatibility Chart) seeds the filter; the screen
 * then searches the donor directory by group and district. Only initials,
 * blood group and district ever come back, so the rows can never leak a
 * contact detail.
 */

export default function DonorsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);
  const { bloodGroup: groupParam } = useLocalSearchParams<{ bloodGroup?: string }>();

  const initialGroup: BloodGroup | null =
    typeof groupParam === "string" && isBloodGroup(groupParam) ? groupParam : null;

  // "All districts" is the empty string here; the select's value contract wants
  // a string, and `null` feeds the API the same way.
  const [district, setDistrict] = useState<string>(session?.user.district ?? "");
  const [group, setGroup] = useState<BloodGroup | null>(initialGroup);

  const [donors, setDonors] = useState<DirectoryDonor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    searchDonors({ bloodGroup: group, district: district === "" ? null : district })
      .then((result) => {
        if (!cancelled) {
          setDonors(result.donors);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(apiErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [group, district]);

  function goTab(key: DashboardTabKey) {
    if (key === "home") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  return (
    <View style={styles.screen}>
      <StepHeader title="Find Donors" onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Only available donors are listed, and only as initials — their contact details stay
          private until they accept.
        </Text>

        {/* ------------------------------------------------- filter panel */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Blood Group</Text>

          <View style={styles.groupRow}>
            <GroupChip label="All" active={group === null} onPress={() => setGroup(null)} />

            {BLOOD_GROUPS.map((candidate) => (
              <GroupChip
                key={candidate}
                label={candidate}
                active={group === candidate}
                onPress={() => setGroup(candidate)}
              />
            ))}
          </View>

          <View style={styles.districtField}>
            <SelectField
              label="District"
              value={district}
              options={DISTRICTS}
              onChange={setDistrict}
              placeholder="All districts"
              icon="map-pin"
              hideLabel
              size="dense"
            />
          </View>
        </View>

        {/* ---------------------------------------------------- results */}
        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={donors.length === 0}
          emptyTitle="No available donors match"
          emptyMessage="Try widening the search to all districts or another blood group."
          skeleton={
            <>
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </>
          }
          onRetry={() => {
            setIsLoading(true);
            setError(null);
            void searchDonors({ bloodGroup: group, district: district === "" ? null : district })
              .then((result) => setDonors(result.donors))
              .catch((caught: unknown) => setError(apiErrorMessage(caught)))
              .finally(() => setIsLoading(false));
          }}
        >
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {donors.length} available donor{donors.length === 1 ? "" : "s"}
            </Text>
            <Text style={styles.resultsHint}>
              {district === ""
                ? "National"
                : district}{" "}
              {group === null ? "• all groups" : `• ${group}`}
            </Text>
          </View>

          <View style={styles.list}>
            {donors.map((donor, index) => (
              <View key={`${donor.initials}-${index}`} style={styles.donor}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{donor.initials}</Text>
                </View>

                <View style={styles.donorCopy}>
                  <Text style={styles.donorGroup}>{donor.bloodGroup}</Text>
                  <Text style={styles.donorMeta} numberOfLines={1}>
                    {donor.district ?? "District not shared"}
                  </Text>
                </View>

                <View style={styles.availableBadge}>
                  <Feather name="check-circle" size={10} color={Surface.online} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              </View>
            ))}
          </View>
        </AsyncState>
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "alerts", label: "Alerts", icon: "bell" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="home"
        onSelect={goTab}
      />
    </View>
  );
}

function GroupChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`Filter by ${label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.groupChip,
        active && styles.groupChipActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.groupChipText, active && styles.groupChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  pressed: {
    opacity: 0.7,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  card: {
    padding: 12,
    gap: 10,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  sectionTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
    color: Surface.text,
  },

  groupRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  groupChip: {
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  groupChipActive: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  groupChipText: {
    ...Typography.label,
    fontSize: 12,
    color: Surface.textSecondary,
  },

  groupChipTextActive: {
    color: "#FFFFFF",
  },

  districtField: {
    marginTop: 2,
  },

  resultsHeader: {
    marginTop: 2,
    justifyContent: "space-between",
    gap: 2,
  },

  resultsCount: {
    ...Typography.cardTitle,
    fontSize: 13,
    color: Surface.text,
  },

  resultsHint: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  list: {
    gap: 8,
  },

  donor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
  },

  avatarText: {
    ...Typography.label,
    fontWeight: "700",
    color: Blood.primary,
  },

  donorCopy: {
    flex: 1,
    gap: 1,
  },

  donorGroup: {
    ...Typography.label,
    fontSize: 14,
    color: Surface.text,
  },

  donorMeta: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
  },

  availableBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.softGreen,
  },

  availableText: {
    ...Typography.micro,
    color: Surface.online,
  },
});