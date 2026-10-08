import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyNote } from "@/components/dashboard/empty-note";
import { DonorCheckInModal } from "@/components/hospital/donor-check-in-modal";
import { HospitalHeader } from "@/components/hospital/hospital-header";
import { RequisitionCard } from "@/components/hospital/requisition-card";
import { AsyncState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  getDashboardSummary,
  type DashboardStat,
  type DashboardSummary,
} from "@/services/dashboard/dashboard";
import { getHospitalInventory } from "@/services/hospital";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";
import { toRequisition } from "@/utils/requisition";

type TriageStat = {
  key: string;
  label: string;
  value: string;
  unit: string | null;
  caption: string;
  icon: ComponentProps<typeof Feather>["name"];
};

/** One icon per server stat key; unknown keys fall back to a neutral glyph. */
const STAT_ICONS: Record<string, ComponentProps<typeof Feather>["name"]> = {
  pending: "clock",
  critical: "alert-triangle",
  donors: "users",
  open: "inbox",
  total: "bar-chart-2",
  availability: "user-check",
  matching: "users",
  fulfilled: "check-circle",
};

function toTriageStat(stat: DashboardStat): TriageStat {
  return {
    key: stat.key,
    label: stat.label,
    value: stat.value,
    unit: null,
    caption: stat.hint ?? "",
    icon: STAT_ICONS[stat.key] ?? "activity",
  };
}

/**
 * Hospital staff landing tab.
 *
 * Content is the approved station-monitor design, fed from `/dashboard/me`
 * and the hospital inventory endpoint — stats, requisitions and the storage
 * tile all come from the API, with an offline fallback per service.
 */
export default function HospitalHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [checkInOpen, setCheckInOpen] = useState(false);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [storageBank, setStorageBank] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Summary plus the storage bank name; the bank is optional by design. */
  async function fetchSummary(): Promise<{
    summary: DashboardSummary;
    bankName: string | null;
  }> {
    const [nextSummary, bankName] = await Promise.all([
      getDashboardSummary(),
      getHospitalInventory()
        .then((result) => result.banks[0]?.name ?? null)
        // The storage tile degrades to generic copy rather than failing Home.
        .catch(() => null),
    ]);

    return { summary: nextSummary, bankName };
  }

  /** Pull-to-refresh / retry — invoked from event handlers only. */
  async function load(mode: "initial" | "refresh") {
    if (mode === "initial") {
      setIsLoading(true);
    }

    setError(null);

    try {
      const next = await fetchSummary();
      setStorageBank(next.bankName);
      setSummary(next.summary);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  // Initial load: state only changes inside the promise callbacks, so the
  // effect body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    fetchSummary()
      .then((next) => {
        if (!cancelled) {
          setStorageBank(next.bankName);
          setSummary(next.summary);
          setError(null);
        }
      })
      .catch((caught) => {
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
  }, []);

  const openRequests = (summary?.requests ?? []).filter(
    (request) => request.status === "pending" || request.status === "verified",
  );
  const stats = (summary?.stats ?? []).map(toTriageStat);
  const center = session?.user.district
    ? `${session.user.district} District`
    : "Your station";
  const storageLabel =
    storageBank !== null ? `Storage • ${storageBank}` : "Whole Blood Storage";

  const homeSkeleton = (
    <View style={styles.skeletonBlock}>
      <View style={styles.statRow}>
        <Skeleton height={96} radius={Radius.field} style={styles.flex} />
        <Skeleton height={96} radius={Radius.field} style={styles.flex} />
        <Skeleton height={96} radius={Radius.field} style={styles.flex} />
      </View>

      <Skeleton height={54} radius={Radius.field} />
      <Skeleton height={54} radius={Radius.field} />
      <Skeleton height={140} radius={Radius.card} />
      <Skeleton height={56} radius={Radius.field} />
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <HospitalHeader
          subtitle="Hospital Staff Dashboard"
          initials={initialsOf(session?.user.fullName)}
        />

        <View style={styles.centerPill}>
          <Feather name="map-pin" size={12} color={Surface.textSecondary} />
          <Text style={styles.centerText}>{center}</Text>
        </View>

        <View style={styles.banner}>
          <Feather name="command" size={15} color={Blood.primary} />

          <Text style={styles.bannerText} numberOfLines={1}>
            Staff Portal • Live Station Monitor
          </Text>

          <View style={styles.live}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Sync</Text>
          </View>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          skeleton={homeSkeleton}
          onRetry={() => {
            void load("initial");
          }}
        >
          <View style={styles.dynamic}>
            <View style={styles.statRow}>
              {stats.map((stat) => (
                <TriageStatCard key={stat.key} stat={stat} />
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Issue new emergency requisition"
              onPress={() => {
                haptics.medium();
                router.push(ROUTES.hospitalCreateRequest);
              }}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Feather name="plus-circle" size={18} color={Surface.onPrimary} />
              <Text style={styles.primaryButtonText}>Issue New Emergency Requisition</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan donor QR at reception"
              onPress={() => {
                haptics.light();
                setCheckInOpen(true);
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Feather name="maximize" size={17} color={Blood.primary} />
              <Text style={styles.secondaryButtonText}>Scan Donor QR at Reception</Text>
            </Pressable>

            <View style={styles.sectionRow}>
              <View style={styles.sectionLeft}>
                <Feather name="bell" size={15} color={Blood.primary} />
                <Text style={styles.sectionTitle}>Active Emergency Requisitions</Text>
              </View>

              <Text style={styles.sectionCount}>
                Showing {Math.min(openRequests.length, 2)} of {openRequests.length}
              </Text>
            </View>

            {openRequests.length === 0 ? (
              <EmptyNote
                title="No active requisitions"
                message="New emergency requisitions appear here the moment they are raised."
                icon="inbox"
              />
            ) : (
              <View style={styles.list}>
                {openRequests.slice(0, 2).map((request) => (
                  <RequisitionCard
                    key={request.id}
                    item={toRequisition(request)}
                    onManage={() => {
                      router.push({
                        pathname: ROUTES.hospitalVerifyDonor,
                        params: { requestId: request.id },
                      });
                    }}
                  />
                ))}
              </View>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={storageLabel}
              onPress={() => {
                router.push(ROUTES.hospitalStorage);
              }}
              style={({ pressed }) => [styles.storage, pressed && styles.pressed]}
            >
              <View style={styles.storageIcon}>
                <Feather name="droplet" size={15} color={Blood.primary} />
              </View>

              <Text style={styles.storageTitle}>{storageLabel}</Text>

              <Feather name="chevron-right" size={18} color={Blood.primary} />
            </Pressable>
          </View>
        </AsyncState>
      </ScrollView>

      <DonorCheckInModal visible={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </View>
  );
}

/** One KPI card; the critical card inverts to a warning tint. */
function TriageStatCard({ stat }: { stat: TriageStat }) {
  const isCritical = stat.key === "critical";

  return (
    <View style={[styles.statCard, isCritical && styles.statCardReserve]}>
      <View style={styles.statHead}>
        <Text style={styles.statLabel} numberOfLines={2}>
          {stat.label}
        </Text>

        <Feather
          name={stat.icon}
          size={14}
          color={isCritical ? Blood.primary : Surface.textSecondary}
        />
      </View>

      <View style={styles.statValueRow}>
        <Text
          style={[
            styles.statValue,
            isCritical && styles.statValueCritical,
            isCritical && styles.statValueReserve,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {stat.value}
        </Text>

        {stat.unit !== null ? <Text style={styles.statUnit}>{stat.unit}</Text> : null}
      </View>

      <Text
        style={[styles.statCaption, isCritical && styles.statCaptionRed]}
        numberOfLines={2}
      >
        {stat.caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    gap: 14,
  },

  dynamic: {
    gap: 14,
  },

  skeletonBlock: {
    gap: 14,
  },

  /* ================= HEADER ADJACENTS ================= */

  centerPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  centerText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  bannerText: {
    flex: 1,
    ...Typography.label,
    color: Surface.text,
  },

  live: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
  },

  liveText: {
    ...Typography.micro,
    fontSize: 10.5,
    color: Surface.online,
  },

  /* ================= TRIAGE STATS ================= */

  statRow: {
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    padding: 12,
    gap: 6,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  statCardReserve: {
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  statHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },

  statLabel: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  statValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },

  statValue: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: -0.6,
    color: Surface.text,
  },

  statValueCritical: {
    color: Blood.primary,
  },

  statValueReserve: {
    fontSize: 18,
    color: Blood.primary,
  },

  statUnit: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  statCaption: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  statCaptionRed: {
    fontWeight: "700",
    color: Blood.primary,
  },

  /* ================= ACTIONS ================= */

  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  primaryButtonText: {
    ...Typography.button,
    color: Surface.onPrimary,
  },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  secondaryButtonText: {
    ...Typography.button,
    color: Surface.text,
  },

  pressed: {
    opacity: 0.75,
  },

  /* ================= REQUISITIONS ================= */

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },

  sectionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  sectionTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  sectionCount: {
    ...Typography.small,
    fontSize: 11,
    color: Surface.textMuted,
  },

  list: {
    gap: 10,
  },

  /* ================= STORAGE ================= */

  storage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  storageIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  storageTitle: {
    flex: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },
});
