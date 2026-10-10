import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AsyncState } from "@/components/ui/async-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import { BLOOD_STORAGE } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  type BloodComponent,
  type HospitalInventoryBank,
  type InventoryItem,
} from "@/services/blood-banks";
import { getHospitalInventory, updateInventoryItem } from "@/services/hospital";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";

const COMPONENT_ORDER: readonly BloodComponent[] = [
  "whole_blood",
  "prbc",
  "plasma",
  "platelets",
];

const COMPONENT_LABELS: Record<BloodComponent, string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC Red Cells",
  plasma: "FFP Plasma",
  platelets: "Platelets",
};

/** Shared pill palette for the reserve tags. */
const TONE_PILL = {
  surplus: { background: Surface.softGreen, border: Surface.softGreenBorder, color: Surface.online },
  critical: { background: Surface.softRed, border: Surface.softRedBorder, color: Blood.primary },
  safe: { background: Surface.softBlue, border: Surface.softBlueBorder, color: Surface.textSecondary },
} as const;

type ReserveTone = keyof typeof TONE_PILL;

type GroupTotal = { group: BloodGroup; units: number; tone: ReserveTone; tag: string };

function unitsFor(inventory: InventoryItem[], group: BloodGroup, component?: BloodComponent) {
  return inventory
    .filter(
      (item) => item.bloodGroup === group && (component === undefined || item.component === component),
    )
    .reduce((sum, item) => sum + item.units, 0);
}

function toneFor(units: number): { tone: ReserveTone; tag: string } {
  if (units < 8) return { tone: "critical", tag: "Critical" };
  if (units < 20) return { tone: "safe", tag: "Low" };
  return { tone: "surplus", tag: "Surplus" };
}

/**
 * Blood bank storage monitor.
 *
 * Reached from the Home tab's storage card. Stock comes from the hospital
 * inventory endpoint and the steppers write back through
 * `updateInventoryItem`, so a restock here is visible to recipients
 * immediately; the banner's plant telemetry stays fixture copy.
 */
export default function HospitalStorageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [banks, setBanks] = useState<HospitalInventoryBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [componentFilter, setComponentFilter] = useState<BloodComponent>("whole_blood");
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Initial load: state only changes inside the promise callbacks, so the
  // effect body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    getHospitalInventory()
      .then((result) => {
        if (!cancelled) {
          setBanks(result.banks);
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

  /** Retry — invoked from event handlers only. */
  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      setBanks((await getHospitalInventory()).banks);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  async function adjust(group: BloodGroup, delta: number) {
    const bank = banks[0];

    if (bank === undefined || isSaving) {
      return;
    }

    const current = unitsFor(bank.inventory, group, componentFilter);
    const next = Math.max(0, current + delta);

    if (next === current) {
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const updated = await updateInventoryItem(bank.id, group, componentFilter, next);
      haptics.light();

      setBanks((previous) =>
        previous.map((entry) => {
          if (entry.id !== bank.id) {
            return entry;
          }

          const exists = entry.inventory.some(
            (item) => item.bloodGroup === group && item.component === componentFilter,
          );

          return {
            ...entry,
            inventory: exists
              ? entry.inventory.map((item) =>
                  item.bloodGroup === group && item.component === componentFilter
                    ? updated
                    : item,
                )
              : [...entry.inventory, updated],
          };
        }),
      );
    } catch (caught) {
      haptics.error();
      setEditError(apiErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Opened directly (deep link / cold start) — the Home tab is the parent.
    router.replace(ROLE_HOME.hospital);
  }

  const bank = banks[0] ?? null;
  const inventory = bank?.inventory ?? [];

  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const stockLines = inventory.length;
  const stockedLines = inventory.filter((item) => item.units > 0).length;
  const capacityPct = stockLines > 0 ? Math.round((stockedLines / stockLines) * 100) : 0;
  const bloodTypeCount = new Set(inventory.map((item) => item.bloodGroup)).size;

  const groupTotals: GroupTotal[] = BLOOD_GROUPS.map((group) => {
    const units = unitsFor(inventory, group);
    return { group, units, ...toneFor(units) };
  });
  const gaugeScale = Math.max(40, ...groupTotals.map((entry) => entry.units));
  const gauges = [...groupTotals].sort((a, b) => a.units - b.units).slice(0, 3);
  const lowest = gauges[0];

  const componentTotals = COMPONENT_ORDER.map((component) => ({
    component,
    label: COMPONENT_LABELS[component],
    units: inventory
      .filter((item) => item.component === component)
      .reduce((sum, item) => sum + item.units, 0),
  }));

  const storageSkeleton = (
    <View style={styles.skeletonBlock}>
      <Skeleton height={150} radius={Radius.field} />
      <Skeleton height={96} radius={Radius.field} />
      <Skeleton height={200} radius={Radius.card} />
      <Skeleton height={260} radius={Radius.card} />
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
        {/* ================= HEADER ================= */}

        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={6}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Feather name="arrow-left" size={20} color={Surface.text} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.title} numberOfLines={1}>
              {BLOOD_STORAGE.title}
            </Text>

            <View style={styles.subtitleRow}>
              <View style={styles.subtitleDot} />

              <Text style={styles.subtitle} numberOfLines={1}>
                {bank !== null ? `${bank.name} • ${bank.district}` : "Loading stock…"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Feather name="cloud-snow" size={16} color={Surface.textSecondary} />

            <Pressable
              onPress={() => router.push(ROUTES.hospitalProfile)}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              hitSlop={6}
              style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
            >
              <Text style={styles.avatarText}>{initialsOf(session?.user.fullName)}</Text>
            </Pressable>
          </View>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={bank === null}
          emptyTitle="No storage assigned"
          emptyMessage="This account has no blood bank in its district yet."
          skeleton={storageSkeleton}
          onRetry={() => {
            void load();
          }}
        >
          {bank === null ? null : (
            <>
              {/* ================= VAULT BANNER ================= */}

              <View style={styles.banner}>
                <View style={styles.bannerHead}>
                  <Feather name="command" size={15} color={Blood.primary} />

                  <View style={styles.bannerHeadText}>
                    <Text style={styles.bannerName} numberOfLines={1}>
                      {bank.name}
                    </Text>

                    <Text style={styles.bannerNote} numberOfLines={1}>
                      {`${bank.district} District • ${BLOOD_STORAGE.vaultNote}`}
                    </Text>
                  </View>

                  <View style={styles.tempPill}>
                    <Feather name="cloud-snow" size={11} color={Surface.onPrimary} />
                    <Text style={styles.tempText}>{BLOOD_STORAGE.temperature}</Text>
                  </View>
                </View>

                <View style={styles.bannerFacts}>
                  <BannerFact icon="zap" label={BLOOD_STORAGE.powerLabel} value={BLOOD_STORAGE.powerValue} />
                  <BannerFact icon="clock" label={BLOOD_STORAGE.auditLabel} value={BLOOD_STORAGE.auditValue} />
                </View>

                <View style={styles.stockStrip}>
                  <View style={styles.stockRow}>
                    <Feather name="droplet" size={13} color={Blood.primary} />

                    <Text style={styles.stockText} numberOfLines={1}>
                      Total Bank Stock: {totalUnits.toLocaleString("en-US")} Units
                    </Text>

                    <Text style={styles.stockPct}>{`${stockedLines}/${stockLines} lines`}</Text>
                  </View>

                  <View style={styles.stockTrack}>
                    <View style={[styles.stockFill, { width: `${capacityPct}%` }]} />
                  </View>
                </View>
              </View>

              {/* ================= CYLINDER GAUGES ================= */}

              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Cylinder Reserve Gauges</Text>

                <View style={styles.typePill}>
                  <Text style={styles.typePillText}>{bloodTypeCount} Blood Types</Text>
                </View>
              </View>

              <Text style={styles.sectionNote}>Lowest reserves across all components</Text>

              {lowest !== undefined ? (
                <View style={styles.criticalCard}>
                  <View style={styles.criticalBadge}>
                    <Text style={styles.criticalBadgeText}>{lowest.group}</Text>
                  </View>

                  <View style={styles.criticalText}>
                    <View style={styles.criticalHead}>
                      <Text style={styles.criticalLabel} numberOfLines={1}>
                        {`${lowest.group} Reserve`}
                      </Text>

                      <View style={styles.criticalTag}>
                        <Text style={styles.criticalTagText}>
                          {lowest.units < 8 ? "Critical Low" : "Lowest"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.criticalDetail} numberOfLines={1}>
                      {`Current: ${lowest.units} Units • across ${stockLines} stock lines`}
                    </Text>
                  </View>

                  <Feather name="info" size={15} color={Blood.primary} />
                </View>
              ) : null}

              <View style={styles.gaugeRow}>
                {gauges.map((gauge) => (
                  <ReserveGaugeCard
                    key={gauge.group}
                    group={gauge.group}
                    units={gauge.units}
                    tone={gauge.tone}
                    tag={gauge.tag}
                    fillPct={Math.min(100, Math.round((gauge.units / gaugeScale) * 100))}
                  />
                ))}
              </View>

              {/* ================= STOCK BY COMPONENT ================= */}

              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Stock Adjustments</Text>

                <Text style={styles.sectionNote}>Tap ± to restock or quarantine</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chips}
              >
                {componentTotals.map((entry) => {
                  const active = entry.component === componentFilter;

                  return (
                    <Pressable
                      key={entry.component}
                      onPress={() => {
                        haptics.light();
                        setComponentFilter(entry.component);
                        setEditError(null);
                      }}
                      accessibilityRole="tab"
                      accessibilityLabel={entry.label}
                      accessibilityState={{ selected: active }}
                      style={({ pressed }) => [
                        styles.chip,
                        active && styles.chipActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {`${entry.label} (${entry.units})`}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {editError !== null ? (
                <View style={styles.editError}>
                  <Feather name="alert-circle" size={14} color={Blood.primary} />
                  <Text style={styles.editErrorText}>{editError}</Text>
                </View>
              ) : null}

              <View style={styles.list}>
                {BLOOD_GROUPS.map((group) => {
                  const units = unitsFor(inventory, group, componentFilter);
                  const { tone } = toneFor(units);
                  const toneMeta = TONE_PILL[tone];
                  const updated = inventory.find(
                    (item) => item.bloodGroup === group && item.component === componentFilter,
                  );

                  return (
                    <View key={group} style={styles.stockCard}>
                      <View
                        style={[
                          styles.stockBadge,
                          { backgroundColor: toneMeta.background, borderColor: toneMeta.border },
                        ]}
                      >
                        <Text style={[styles.stockBadgeText, { color: toneMeta.color }]}>
                          {group}
                        </Text>
                      </View>

                      <View style={styles.stockInfo}>
                        <Text style={styles.stockName} numberOfLines={1}>
                          {`${units} Units`}
                        </Text>

                        <Text style={styles.stockMeta} numberOfLines={1}>
                          {updated !== undefined
                            ? `Updated ${new Date(updated.updatedAt).toLocaleTimeString("en-GB", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "No stock on this line"}
                        </Text>
                      </View>

                      <View style={styles.stepper}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Remove one ${group} unit`}
                          accessibilityState={{ disabled: units <= 0 || isSaving }}
                          disabled={units <= 0 || isSaving}
                          onPress={() => {
                            void adjust(group, -1);
                          }}
                          style={({ pressed }) => [
                            styles.stepButton,
                            pressed && styles.pressed,
                            (units <= 0 || isSaving) && styles.stepButtonDisabled,
                          ]}
                        >
                          <Feather name="minus" size={15} color={Surface.text} />
                        </Pressable>

                        <Text style={styles.stepValue} accessibilityLiveRegion="polite">
                          {units}
                        </Text>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Add one ${group} unit`}
                          accessibilityState={{ disabled: isSaving }}
                          disabled={isSaving}
                          onPress={() => {
                            void adjust(group, 1);
                          }}
                          style={({ pressed }) => [
                            styles.stepButton,
                            pressed && styles.pressed,
                            isSaving && styles.stepButtonDisabled,
                          ]}
                        >
                          <Feather name="plus" size={15} color={Surface.text} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Request blood"
                onPress={() => {
                  router.push(ROUTES.hospitalCreateRequest);
                }}
                style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
              >
                <Feather name="bar-chart-2" size={18} color={Surface.onPrimary} />
                <Text style={styles.ctaText}>Request blood</Text>
              </Pressable>
            </>
          )}
        </AsyncState>
      </ScrollView>
    </View>
  );
}

/** Labelled fact inside the vault banner. */
function BannerFact({
  icon,
  label,
  value,
}: {
  icon: "zap" | "clock";
  label: string;
  value: string;
}) {
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={13} color={Surface.textSecondary} />

      <View style={styles.factText}>
        <Text style={styles.factLabel}>{label}</Text>
        <Text style={styles.factValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/** One blood group's calibrated reserve cylinder. */
function ReserveGaugeCard({
  group,
  units,
  tone,
  tag,
  fillPct,
}: {
  group: BloodGroup;
  units: number;
  tone: ReserveTone;
  tag: string;
  fillPct: number;
}) {
  const toneMeta = TONE_PILL[tone];

  return (
    <View style={styles.gaugeCard}>
      <View style={styles.gaugeHead}>
        <Text style={styles.gaugeGroup}>{group}</Text>

        <View
          style={[styles.gaugeTag, { backgroundColor: toneMeta.background, borderColor: toneMeta.border }]}
        >
          <Text style={[styles.gaugeTagText, { color: toneMeta.color }]} numberOfLines={1}>
            {tag}
          </Text>
        </View>
      </View>

      <View style={styles.tubeRow}>
        <View style={styles.tube}>
          <View style={[styles.tubeFill, { height: `${fillPct}%` }]} />
        </View>

        <View style={styles.ticks}>
          <View style={styles.tick} />
          <View style={styles.tick} />
          <View style={styles.tick} />
          <View style={styles.tick} />
        </View>
      </View>

      <Text style={styles.gaugeUnits} adjustsFontSizeToFit numberOfLines={1}>
        {units} U
      </Text>

      <Text style={styles.gaugePct}>{fillPct}% full</Text>
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

  skeletonBlock: {
    gap: 14,
  },

  /* ================= HEADER ================= */

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  backButtonPressed: {
    backgroundColor: Surface.border,
  },

  headerText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  subtitleDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  /* ================= VAULT BANNER ================= */

  banner: {
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  bannerHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  bannerHeadText: {
    flex: 1,
    gap: 1,
  },

  bannerName: {
    ...Typography.label,
    color: Surface.text,
  },

  bannerNote: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  tempPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.online,
  },

  tempText: {
    ...Typography.micro,
    fontSize: 10,
    color: Surface.onPrimary,
  },

  bannerFacts: {
    flexDirection: "row",
    gap: 12,
  },

  fact: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  factText: {
    flex: 1,
    gap: 1,
  },

  factLabel: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textMuted,
  },

  factValue: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  stockStrip: {
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softRed,
  },

  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  stockText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "700",
    color: Surface.text,
  },

  stockPct: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  stockTrack: {
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: Surface.card,
    overflow: "hidden",
  },

  stockFill: {
    height: "100%",
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
  },

  /* ================= SECTIONS ================= */

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },

  sectionTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  sectionNote: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },

  typePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  typePillText: {
    ...Typography.micro,
    fontSize: 10,
    color: Surface.textSecondary,
  },

  /* ================= CRITICAL CALLOUT ================= */

  criticalCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  criticalBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  criticalBadgeText: {
    ...Typography.label,
    color: Surface.onPrimary,
  },

  criticalText: {
    flex: 1,
    gap: 3,
  },

  criticalHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  criticalLabel: {
    flexShrink: 1,
    ...Typography.label,
    color: Surface.text,
  },

  criticalTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  criticalTagText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.onPrimary,
  },

  criticalDetail: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  /* ================= GAUGES ================= */

  gaugeRow: {
    flexDirection: "row",
    gap: 10,
  },

  gaugeCard: {
    flex: 1,
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  gaugeHead: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  gaugeGroup: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  gaugeTag: {
    maxWidth: "55%",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  gaugeTagText: {
    ...Typography.micro,
    fontSize: 9,
  },

  tubeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  tube: {
    width: 52,
    height: 150,
    overflow: "hidden",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    borderWidth: 1.5,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.card,
  },

  tubeFill: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: Blood.primary,
  },

  ticks: {
    height: 150,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  tick: {
    width: 12,
    height: 2,
    borderRadius: Radius.full,
    backgroundColor: Surface.border,
  },

  gaugeUnits: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  gaugePct: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },

  /* ================= COMPONENT CHIPS ================= */

  chips: {
    gap: 8,
    paddingRight: 20,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  chipActive: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  chipText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  chipTextActive: {
    color: Surface.onPrimary,
  },

  editError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  editErrorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  /* ================= STOCK LINES ================= */

  list: {
    gap: 10,
  },

  stockCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  stockBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  stockBadgeText: {
    ...Typography.cardTitle,
  },

  stockInfo: {
    flex: 1,
    gap: 2,
  },

  stockName: {
    ...Typography.label,
    color: Surface.text,
  },

  stockMeta: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  stepButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  stepButtonDisabled: {
    opacity: 0.4,
  },

  stepValue: {
    minWidth: 24,
    textAlign: "center",
    ...Typography.cardTitle,
    color: Blood.primary,
  },

  /* ================= CTA ================= */

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  ctaText: {
    ...Typography.button,
    color: Surface.onPrimary,
  },

  pressed: {
    opacity: 0.75,
  },
});
