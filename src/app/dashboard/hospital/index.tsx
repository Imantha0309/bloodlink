import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DonorCheckInModal } from "@/components/hospital/donor-check-in-modal";
import { HospitalHeader } from "@/components/hospital/hospital-header";
import { RequisitionCard } from "@/components/hospital/requisition-card";
import { Blood, Elevation, Surface } from "@/constants/colors";
import {
  HOSPITAL_CENTER,
  REQUISITIONS,
  REQUISITION_TOTAL,
  STORAGE_CARD,
  TRIAGE_STATS,
  type TriageStat,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/** Requisitions surfaced on Home; the rest live in the Requests tab. */
const HOME_REQUISITIONS = REQUISITIONS.slice(0, 2);

/**
 * Hospital staff landing tab.
 *
 * Content is the approved station-monitor design, fed from the fixtures in
 * `@/constants/hospital-demo` until the dashboard API carries these fields.
 */
export default function HospitalHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [checkInOpen, setCheckInOpen] = useState(false);

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
          <Text style={styles.centerText}>{HOSPITAL_CENTER}</Text>
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

        <View style={styles.statRow}>
          {TRIAGE_STATS.map((stat) => (
            <TriageStatCard key={stat.key} stat={stat} />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Issue new emergency requisition"
          onPress={() => {
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
          onPress={() => setCheckInOpen(true)}
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
            Showing {HOME_REQUISITIONS.length} of {REQUISITION_TOTAL}
          </Text>
        </View>

        <View style={styles.list}>
          {HOME_REQUISITIONS.map((item) => (
            <RequisitionCard key={item.reference} item={item} />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={STORAGE_CARD.label}
          onPress={() => {
            router.push(ROUTES.hospitalStorage);
          }}
          style={({ pressed }) => [styles.storage, pressed && styles.pressed]}
        >
          <View style={styles.storageIcon}>
            <Feather name="droplet" size={15} color={Blood.primary} />
          </View>

          <Text style={styles.storageTitle}>{STORAGE_CARD.label}</Text>

          <Feather name="chevron-right" size={18} color={Blood.primary} />
        </Pressable>
      </ScrollView>

      <DonorCheckInModal visible={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </View>
  );
}

/** One KPI card; the reserve card inverts to a warning tint. */
function TriageStatCard({ stat }: { stat: TriageStat }) {
  const isReserve = stat.key === "reserve";

  return (
    <View style={[styles.statCard, isReserve && styles.statCardReserve]}>
      <View style={styles.statHead}>
        <Text style={styles.statLabel} numberOfLines={2}>
          {stat.label}
        </Text>

        <Feather
          name={stat.icon}
          size={14}
          color={isReserve ? Blood.primary : Surface.textSecondary}
        />
      </View>

      <View style={styles.statValueRow}>
        <Text
          style={[
            styles.statValue,
            stat.key === "critical" && styles.statValueCritical,
            isReserve && styles.statValueReserve,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {stat.value}
        </Text>

        {stat.unit !== null ? <Text style={styles.statUnit}>{stat.unit}</Text> : null}
      </View>

      <Text
        style={[
          styles.statCaption,
          stat.key === "transit" && styles.statCaptionGreen,
          isReserve && styles.statCaptionRed,
        ]}
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

  statCaptionGreen: {
    color: Surface.online,
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
