import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Elevation, Surface } from "@/constants/colors";
import {
  BLOOD_STORAGE,
  CRITICAL_RESERVE,
  RESERVE_GAUGES,
  STORAGE_FRACTIONS,
  VAULT_COMPARTMENTS,
  type ReserveGauge,
  type VaultCompartment,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/** Shared pill palette for the reserve tags. */
const TONE_PILL = {
  surplus: { background: Surface.softGreen, border: Surface.softGreenBorder, color: Surface.online },
  critical: { background: Surface.softRed, border: Surface.softRedBorder, color: Blood.primary },
  safe: { background: Surface.softBlue, border: Surface.softBlueBorder, color: Surface.textSecondary },
} as const;

/** Shared pill palette for compartment health. */
const STATUS_COLOR = {
  optimal: Surface.online,
  alert: Blood.primary,
} as const;

/**
 * Blood bank storage monitor.
 *
 * Reached from the Home tab's storage card. Content is the approved design,
 * fed from `@/constants/hospital-demo` until a storage API exists — the screen
 * reads only the shapes in that file.
 */
export default function HospitalStorageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Opened directly (deep link / cold start) — the Home tab is the parent.
    router.replace(ROLE_HOME.hospital);
  }

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
                {BLOOD_STORAGE.subtitle}
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

        {/* ================= VAULT BANNER ================= */}

        <View style={styles.banner}>
          <View style={styles.bannerHead}>
            <Feather name="command" size={15} color={Blood.primary} />

            <View style={styles.bannerHeadText}>
              <Text style={styles.bannerName} numberOfLines={1}>
                {BLOOD_STORAGE.vaultName}
              </Text>

              <Text style={styles.bannerNote} numberOfLines={1}>
                {BLOOD_STORAGE.vaultNote}
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
                Total Bank Stock: {BLOOD_STORAGE.totalUnits.toLocaleString("en-US")} Units
              </Text>

              <Text style={styles.stockPct}>{BLOOD_STORAGE.capacityPct}% of Capacity</Text>
            </View>

            <View style={styles.stockTrack}>
              <View style={[styles.stockFill, { width: `${BLOOD_STORAGE.capacityPct}%` }]} />
            </View>
          </View>
        </View>

        {/* ================= CYLINDER GAUGES ================= */}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Cylinder Reserve Gauges</Text>

          <View style={styles.typePill}>
            <Text style={styles.typePillText}>{BLOOD_STORAGE.bloodTypeCount} Blood Types</Text>
          </View>
        </View>

        <Text style={styles.sectionNote}>{BLOOD_STORAGE.gaugeNote}</Text>

        <View style={styles.criticalCard}>
          <View style={styles.criticalBadge}>
            <Text style={styles.criticalBadgeText}>{CRITICAL_RESERVE.group}</Text>
          </View>

          <View style={styles.criticalText}>
            <View style={styles.criticalHead}>
              <Text style={styles.criticalLabel} numberOfLines={1}>
                {CRITICAL_RESERVE.label}
              </Text>

              <View style={styles.criticalTag}>
                <Text style={styles.criticalTagText}>{CRITICAL_RESERVE.tag}</Text>
              </View>
            </View>

            <Text style={styles.criticalDetail} numberOfLines={1}>
              {CRITICAL_RESERVE.detail}
            </Text>
          </View>

          <Feather name="info" size={15} color={Blood.primary} />
        </View>

        <View style={styles.gaugeRow}>
          {RESERVE_GAUGES.map((gauge) => (
            <ReserveGaugeCard key={gauge.group} gauge={gauge} />
          ))}
        </View>

        {/* ================= VAULT COMPARTMENTS ================= */}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Vault Compartments</Text>

          <Text style={styles.sectionNote}>{BLOOD_STORAGE.compartmentNote}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {STORAGE_FRACTIONS.map((fraction) => (
            <View
              key={fraction.label}
              style={[styles.chip, fraction.active && styles.chipActive]}
            >
              <Text style={[styles.chipText, fraction.active && styles.chipTextActive]}>
                {fraction.label}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {VAULT_COMPARTMENTS.map((item) => (
            <VaultCompartmentCard key={item.id} item={item} />
          ))}
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
function ReserveGaugeCard({ gauge }: { gauge: ReserveGauge }) {
  const tone = TONE_PILL[gauge.tone];

  return (
    <View style={styles.gaugeCard}>
      <View style={styles.gaugeHead}>
        <Text style={styles.gaugeGroup}>{gauge.group}</Text>

        <View style={[styles.gaugeTag, { backgroundColor: tone.background, borderColor: tone.border }]}>
          <Text style={[styles.gaugeTagText, { color: tone.color }]} numberOfLines={1}>
            {gauge.tag}
          </Text>
        </View>
      </View>

      <View style={styles.tubeRow}>
        <View style={styles.tube}>
          <View style={[styles.tubeFill, { height: `${gauge.fillPct}%` }]} />
        </View>

        <View style={styles.ticks}>
          <View style={styles.tick} />
          <View style={styles.tick} />
          <View style={styles.tick} />
          <View style={styles.tick} />
        </View>
      </View>

      <Text style={styles.gaugeUnits} adjustsFontSizeToFit numberOfLines={1}>
        {gauge.units} U
      </Text>

      <Text style={styles.gaugePct}>{gauge.fillPct}% full</Text>
    </View>
  );
}

/** One cold-storage compartment and its live telemetry. */
function VaultCompartmentCard({ item }: { item: VaultCompartment }) {
  return (
    <View style={styles.compartment}>
      <View style={styles.compartmentIcon}>
        <Feather name={item.icon} size={16} color={Blood.primary} />
      </View>

      <View style={styles.compartmentText}>
        <View style={styles.compartmentHead}>
          <Text style={styles.compartmentName} numberOfLines={1}>
            {item.name}
          </Text>

          <View style={styles.tempChip}>
            <Text style={styles.tempChipText}>{item.temperature}</Text>
          </View>

          <Text style={styles.compartmentPct}>{item.capacityPct}%</Text>
        </View>

        <Text style={styles.compartmentDetail} numberOfLines={1}>
          {item.detail}
        </Text>

        <Text style={[styles.compartmentStatus, { color: STATUS_COLOR[item.tone] }]}>
          {item.status}
        </Text>
      </View>
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

  /* ================= COMPARTMENTS ================= */

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

  list: {
    gap: 10,
  },

  compartment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  compartmentIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  compartmentText: {
    flex: 1,
    gap: 3,
  },

  compartmentHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  compartmentName: {
    flexShrink: 1,
    ...Typography.label,
    color: Surface.text,
  },

  tempChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softBlue,
  },

  tempChipText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textSecondary,
  },

  compartmentPct: {
    marginLeft: "auto",
    ...Typography.label,
    color: Surface.text,
  },

  compartmentDetail: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  compartmentStatus: {
    ...Typography.micro,
    fontSize: 10,
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
