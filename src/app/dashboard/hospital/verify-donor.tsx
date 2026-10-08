import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HospitalHeader } from "@/components/hospital/hospital-header";
import { Blood, Elevation, Surface } from "@/constants/colors";
import {
  BED_SLOTS,
  DEFAULT_BED_ID,
  SCREENING_ROWS,
  VERIFY_DONOR,
  type BedSlot,
  type ScreeningRow,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/** Occupied and sanitising bays are visible but cannot be picked. */
function isAssignable(slot: BedSlot) {
  return slot.state === "ready" || slot.state === "free";
}

/**
 * Donor arrival desk.
 *
 * Everything on the card is fixture state — biometric match, screening
 * readings, bed roster — because the dashboard API reports none of it yet. The
 * bay picker is live, and approving opens the collection telemetry; the
 * deferral action is laid out but does not submit anywhere.
 */
export default function HospitalVerifyDonorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [bedId, setBedId] = useState(DEFAULT_BED_ID);
  const selectedBed = BED_SLOTS.find((slot) => slot.id === bedId) ?? BED_SLOTS[0];

  const selectedNumber = selectedBed.label.replace(/\D/g, "");

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
          subtitle={VERIFY_DONOR.headerSubtitle}
          initials={initialsOf(session?.user.fullName)}
          alertDot
        />

        {/* ================= TITLE ================= */}

        <View style={styles.titleRow}>
          <View style={styles.titleText}>
            <Text style={styles.title} accessibilityRole="header">
              {VERIFY_DONOR.title}
            </Text>

            <Text style={styles.subtitle} numberOfLines={2}>
              {VERIFY_DONOR.station}
            </Text>
          </View>

          <View style={styles.livePill}>
            <View style={styles.liveDot} pointerEvents="none" />
            <Text style={styles.liveText}>{VERIFY_DONOR.livePill}</Text>
          </View>
        </View>

        {/* ================= IDENTIFICATION ================= */}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{VERIFY_DONOR.identificationTitle}</Text>

            <View style={styles.syncPill}>
              <Feather name="zap" size={11} color={Blood.primary} />
              <Text style={styles.syncText}>{VERIFY_DONOR.syncLabel}</Text>
            </View>
          </View>

          <View style={styles.tokenRow}>
            <View style={styles.tokenField}>
              <Feather name="key" size={15} color={Surface.textSecondary} />

              <Text style={styles.tokenText} numberOfLines={1} selectable>
                {VERIFY_DONOR.token}
              </Text>

              <Feather name="copy" size={15} color={Surface.textMuted} />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={VERIFY_DONOR.scanLabel}
              hitSlop={4}
              style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
            >
              <Feather name="maximize" size={18} color={Surface.onPrimary} />
            </Pressable>
          </View>
        </View>

        {/* ================= BIOMETRIC MATCH ================= */}

        <View style={styles.card}>
          <View style={styles.matchRow}>
            <View style={styles.matchBadge}>
              <Feather name="check" size={13} color={Surface.onPrimary} />
            </View>

            <Text style={styles.matchLabel}>{VERIFY_DONOR.matchLabel}</Text>

            <View style={styles.groupPill}>
              <Text style={styles.groupText}>{VERIFY_DONOR.bloodGroup}</Text>
            </View>
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.donorName} numberOfLines={2}>
              {VERIFY_DONOR.donorName}
            </Text>

            <Text style={styles.verifiedLabel}>{VERIFY_DONOR.verifiedLabel}</Text>
          </View>

          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <Text style={styles.personInitials}>
                {initialsOf(VERIFY_DONOR.donorName, "RW")}
              </Text>
            </View>

            <View style={styles.personText}>
              <View style={styles.refChip}>
                <Text style={styles.refChipText}>{VERIFY_DONOR.requisition}</Text>
              </View>

              <Text style={styles.personLine}>{VERIFY_DONOR.ward}</Text>

              <Text style={styles.personMeta}>{VERIFY_DONOR.arrival}</Text>
            </View>
          </View>
        </View>

        {/* ================= SCREENING ================= */}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{VERIFY_DONOR.screeningTitle}</Text>

            <View style={styles.clearedPill}>
              <Feather name="check-circle" size={11} color={Surface.online} />
              <Text style={styles.clearedText}>{VERIFY_DONOR.screeningCount}</Text>
            </View>
          </View>

          <View style={styles.screenList}>
            {SCREENING_ROWS.map((row) => (
              <ScreeningRowCard key={row.id} row={row} />
            ))}
          </View>
        </View>

        {/* ================= RECIPIENT NOTICE ================= */}

        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Feather name="bell" size={14} color={Blood.primary} />
          </View>

          <Text style={styles.noticeText}>
            <Text style={styles.noticeLead}>{VERIFY_DONOR.noticeLead}</Text>
            {VERIFY_DONOR.noticeBody}
          </Text>
        </View>

        {/* ================= BED ASSIGNMENT ================= */}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{VERIFY_DONOR.bedTitle}</Text>

            <View style={styles.readyPill}>
              <Feather name="check" size={11} color={Surface.onPrimary} />
              <Text style={styles.readyText}>{`Bed ${selectedNumber} ${selectedBed.caption}`}</Text>
            </View>
          </View>

          <View style={styles.bedRow}>
            {BED_SLOTS.map((slot) => {
              const selected = slot.id === bedId;
              const assignable = isAssignable(slot);

              return (
                <Pressable
                  key={slot.id}
                  disabled={!assignable}
                  onPress={() => {
                    setBedId(slot.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={`${slot.label} ${slot.caption}`}
                  accessibilityState={{ selected, disabled: !assignable }}
                  style={({ pressed }) => [
                    styles.bedChip,
                    selected && styles.bedChipSelected,
                    !assignable && styles.bedChipDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.bedText,
                      selected && styles.bedTextSelected,
                      !assignable && styles.bedTextDisabled,
                    ]}
                    numberOfLines={1}
                  >
                    {`${slot.label} ${slot.caption}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================= DECISIONS ================= */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={VERIFY_DONOR.approveCta}
          accessibilityHint="Opens the collection telemetry for this donor"
          onPress={() => {
            router.push(ROUTES.hospitalExtractionSession);
          }}
          style={({ pressed }) => [styles.approve, pressed && styles.pressed]}
        >
          <Feather name="check-circle" size={17} color={Surface.onPrimary} />

          <Text style={styles.approveText} numberOfLines={1}>
            {VERIFY_DONOR.approveCta}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={VERIFY_DONOR.deferCta}
          style={({ pressed }) => [styles.defer, pressed && styles.pressed]}
        >
          <Feather name="flag" size={16} color={Blood.primary} />

          <Text style={styles.deferText}>{VERIFY_DONOR.deferCta}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** One screening line — reading on the left, result on the right. */
function ScreeningRowCard({ row }: { row: ScreeningRow }) {
  return (
    <View style={styles.screenRow}>
      <View style={styles.screenIcon}>
        <Feather name={row.icon} size={14} color={Surface.onPrimary} />
      </View>

      <View style={styles.screenText}>
        <Text style={styles.screenTitle} numberOfLines={1}>
          {row.title}
        </Text>

        <Text style={styles.screenDetail}>{row.detail}</Text>

        {row.note !== null ? <Text style={styles.screenNote}>{row.note}</Text> : null}
      </View>

      {row.tone === "pill" ? (
        <View style={styles.valuePill}>
          <Text style={styles.valuePillText} numberOfLines={1}>
            {row.value}
          </Text>
        </View>
      ) : (
        <Text
          style={[styles.screenValue, row.tone === "positive" && styles.screenValuePositive]}
          numberOfLines={1}
        >
          {row.value}
        </Text>
      )}
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

  /* ================= TITLE ================= */

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 2,
  },

  titleText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.title,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.online,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Surface.onPrimary,
  },

  liveText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.onPrimary,
  },

  /* ================= CARDS ================= */

  card: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  cardTitle: {
    flex: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  pressed: {
    opacity: 0.75,
  },

  /* ================= IDENTIFICATION ================= */

  syncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  syncText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textSecondary,
  },

  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  tokenField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.background,
  },

  tokenText: {
    flex: 1,
    ...Typography.input,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: Surface.text,
  },

  scanButton: {
    width: 46,
    height: 46,
    borderRadius: Radius.field,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  /* ================= BIOMETRIC MATCH ================= */

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  matchBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.online,
  },

  matchLabel: {
    flex: 1,
    ...Typography.micro,
    color: Surface.online,
  },

  groupPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  groupText: {
    ...Typography.label,
    color: Surface.onPrimary,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  donorName: {
    flex: 1,
    ...Typography.title,
    fontSize: 19,
    lineHeight: 25,
    color: Surface.text,
  },

  verifiedLabel: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.online,
    paddingTop: 6,
  },

  personRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 2,
  },

  personAvatar: {
    width: 54,
    height: 54,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  personInitials: {
    ...Typography.cardTitle,
    color: Blood.primary,
  },

  personText: {
    flex: 1,
    gap: 5,
  },

  refChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.sm - 4,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  refChipText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  personLine: {
    ...Typography.label,
    color: Surface.text,
  },

  personMeta: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  /* ================= SCREENING ================= */

  clearedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softGreenBorder,
  },

  clearedText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.online,
  },

  screenList: {
    gap: 8,
  },

  screenRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.background,
  },

  screenIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm - 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  screenText: {
    flex: 1,
    gap: 2,
  },

  screenTitle: {
    ...Typography.label,
    color: Surface.text,
  },

  screenDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  screenNote: {
    ...Typography.small,
    color: Surface.textMuted,
    paddingTop: 2,
  },

  screenValue: {
    ...Typography.label,
    color: Surface.text,
    textAlign: "right",
    maxWidth: 96,
  },

  screenValuePositive: {
    color: Surface.online,
  },

  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Surface.online,
  },

  valuePillText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.onPrimary,
  },

  /* ================= RECIPIENT NOTICE ================= */

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  noticeIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm - 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  noticeText: {
    flex: 1,
    ...Typography.small,
    lineHeight: 17,
    color: Surface.textSecondary,
  },

  noticeLead: {
    fontWeight: "700",
    color: Surface.text,
  },

  /* ================= BED ASSIGNMENT ================= */

  readyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Surface.online,
  },

  readyText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.onPrimary,
  },

  bedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  bedChip: {
    flexGrow: 1,
    minWidth: "45%",
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  bedChipSelected: {
    borderColor: Blood.primary,
    backgroundColor: Blood.primary,
  },

  bedChipDisabled: {
    backgroundColor: Surface.iconWash,
    borderColor: Surface.border,
  },

  bedText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  bedTextSelected: {
    color: Surface.onPrimary,
  },

  bedTextDisabled: {
    color: Surface.textMuted,
  },

  /* ================= DECISIONS ================= */

  approve: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  approveText: {
    flexShrink: 1,
    ...Typography.button,
    color: Surface.onPrimary,
  },

  defer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  deferText: {
    ...Typography.button,
    color: Blood.primary,
  },
});
