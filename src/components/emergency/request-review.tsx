import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { FieldError } from "@/components/auth/field-error";
import { urgencyTitle } from "@/components/emergency/urgency-card-list";
import { BLOOD_GROUP_LONG, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { URGENCY_LABEL, type UrgencyLevel } from "@/constants/emergency";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type RequestReviewData = {
  patientName: string;
  bloodGroup: BloodGroup | null;
  units: number;
  hospital: string | null;
  district: string | null;
  ward: string;
  urgency: UrgencyLevel | null;
  contactName: string;
  contactMobile: string;
};

type RequestReviewProps = {
  data: RequestReviewData;
  broadcastEnabled: boolean;
  onToggleBroadcast: (next: boolean) => void;
  /** Shown under the broadcast card when the user tries to send with it off. */
  broadcastError: string | null;
  /** `0` returns to step 1, `1` to step 2. */
  onEdit: (target: 0 | 1) => void;
};

type ReviewRow = {
  key: string;
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  /** Second line, where the field carries more than one piece of detail. */
  detail?: string | null;
  /** Renders the value in a filled red circle, e.g. the blood group. */
  badge?: string | null;
  /** Overrides the value colour — the triage level reads as the urgent part. */
  accent?: boolean;
  editTarget: 0 | 1;
};

/** Placeholder for a value the user has not filled in yet. */
const DASH = "—";

function orDash(value: string): string {
  const trimmed = value.trim();

  return trimmed === "" ? DASH : trimmed;
}

/**
 * Splits the ward into the two lines the summary shows.
 *
 * Step 2 collects ward and room as a single field, so the bed / attending
 * detail only appears on its own line when the user typed it behind a `·`.
 * Nothing is invented when it is missing.
 */
function splitWard(ward: string): [string, string | null] {
  const [main, ...rest] = ward.split("·");
  const first = (main ?? "").trim();
  const second = rest.join("·").trim();

  return [orDash(first), second === "" ? null : second];
}

/**
 * Step 3 of the emergency request: the final read-back before broadcasting.
 *
 * Presentational only. It renders whatever the wizard currently holds and
 * reports intent upward through `onEdit` / `onToggleBroadcast`, so the screen
 * stays the single owner of form state and the submit gate. The send button and
 * "Edit All Details" live in the screen's pinned footer rather than here, which
 * is what keeps them reachable at any scroll depth.
 */
export function RequestReview({
  data,
  broadcastEnabled,
  onToggleBroadcast,
  broadcastError,
  onEdit,
}: RequestReviewProps) {
  const [wardMain, wardDetail] = splitWard(data.ward);

  const rows: ReviewRow[] = [
    {
      key: "patient",
      icon: "user",
      label: "Patient",
      value: orDash(data.patientName),
      editTarget: 0,
    },
    {
      key: "bloodGroup",
      icon: "droplet",
      label: "Required Group",
      value: data.bloodGroup === null ? DASH : BLOOD_GROUP_LONG[data.bloodGroup],
      badge: data.bloodGroup,
      editTarget: 0,
    },
    {
      key: "units",
      icon: "package",
      label: "Volume Requested",
      value: `${data.units} Unit${data.units === 1 ? "" : "s"} (Whole Blood)`,
      editTarget: 1,
    },
    {
      key: "facility",
      icon: "home",
      label: "Target Facility",
      value: data.hospital === null ? DASH : orDash(data.hospital),
      detail: data.district === null ? null : orDash(data.district),
      editTarget: 1,
    },
    {
      key: "ward",
      icon: "clipboard",
      label: "Specific Unit / Ward",
      value: wardMain,
      detail: wardDetail,
      editTarget: 1,
    },
    {
      key: "triage",
      icon: "alert-octagon",
      label: "Triage Level",
      value: data.urgency === null ? DASH : `${urgencyTitle(data.urgency)} (${URGENCY_LABEL[data.urgency]})`,
      accent: true,
      editTarget: 1,
    },
    {
      key: "coordinator",
      icon: "phone",
      label: "On-Site Coordinator",
      value: orDash(data.contactName),
      detail: orDash(data.contactMobile),
      editTarget: 1,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <Text style={styles.introTitle} accessibilityRole="header">
          Review Emergency Request
        </Text>

        <Text style={styles.introBody}>
          Please review all parameters carefully before{"\n"}
          triggering the provincial network broadcast.
        </Text>
      </View>

      <View style={styles.broadcastCard}>
        <View style={styles.broadcastIconCircle}>
          <Feather name="radio" size={14} color={Surface.accentBlue} />
        </View>

        <View style={styles.broadcastText}>
          <Text style={styles.broadcastTitle}>Broadcast Radius Activated</Text>

          <Text style={styles.broadcastBody}>
            Please confirm details{"\n"}
            before broadcasting{"\n"}
            emergency alert
          </Text>
        </View>

        <Switch
          value={broadcastEnabled}
          onValueChange={onToggleBroadcast}
          accessibilityLabel="Broadcast radius"
          trackColor={{ false: Surface.borderStrong, true: Blood.primary }}
          thumbColor={Surface.card}
          ios_backgroundColor={Surface.borderStrong}
          // The platform switch is wider than this card's design calls for, so
          // it is scaled down and given a larger touch area to compensate.
          hitSlop={HIT_SLOP_MIN / 2}
          style={styles.switch}
        />
      </View>

      <FieldError message={broadcastError} />

      <View style={styles.summaryHeading}>
        <Feather name="briefcase" size={13} color={Blood.primary} />

        <Text style={styles.summaryHeadingText}>
          Requisition{"\n"}
          Summary
        </Text>

        <View style={styles.validatedPill}>
          <View style={styles.validatedDot} />

          <Text style={styles.validatedText}>System Validated</Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        {rows.map((row, index) => (
          <ReviewSummaryRow
            key={row.key}
            row={row}
            last={index === rows.length - 1}
            onEdit={onEdit}
          />
        ))}
      </View>

      <View style={styles.certCard}>
        <Feather name="award" size={14} color={Blood.primary} />

        <View style={styles.certText}>
          <Text style={styles.certTitle}>Physician-Certified Requisition</Text>

          <Text style={styles.certBody}>
            I confirm this is a verified medical{"\n"}
            requisition requested by attending{"\n"}
            physician. Misuse of the emergency{"\n"}
            network carries disciplinary and legal{"\n"}
            review.
          </Text>
        </View>
      </View>
    </View>
  );
}

type ReviewSummaryRowProps = {
  row: ReviewRow;
  last: boolean;
  onEdit: (target: 0 | 1) => void;
};

function ReviewSummaryRow({ row, last, onEdit }: ReviewSummaryRowProps) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowIcon}>
        <Feather name={row.icon} size={12} color={Surface.accentBlue} />
      </View>

      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{row.label}</Text>

        <View style={styles.rowValueLine}>
          {row.badge === null || row.badge === undefined ? null : (
            <View style={styles.groupBadge}>
              <Text style={styles.groupBadgeText}>{row.badge}</Text>
            </View>
          )}

          <Text
            style={[styles.rowValue, row.accent === true && styles.rowValueAccent]}
            numberOfLines={1}
          >
            {row.value}
          </Text>
        </View>

        {row.detail === null || row.detail === undefined ? null : (
          <Text style={styles.rowDetail} numberOfLines={1}>
            {row.detail}
          </Text>
        )}
      </View>

      <Pressable
        onPress={() => onEdit(row.editTarget)}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${row.label.toLowerCase()}`}
        accessibilityHint={
          row.editTarget === 0 ? "Returns to step 1" : "Returns to step 2"
        }
        hitSlop={HIT_SLOP_MIN / 2}
        style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
      >
        <Feather name="edit-2" size={9} color={Blood.primary} />

        <Text style={styles.editButtonText}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },

  intro: {
    gap: 4,
  },

  introTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    lineHeight: 21,
    color: Surface.text,
  },

  introBody: {
    ...Typography.small,
    fontSize: 9.5,
    lineHeight: 13,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  broadcastCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  broadcastIconCircle: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  broadcastText: {
    flex: 1,
    gap: 2,
  },

  broadcastTitle: {
    ...Typography.small,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  broadcastBody: {
    ...Typography.small,
    fontSize: 8.5,
    lineHeight: 12,
    color: Surface.textSecondary,
  },

  /** RN ships a fixed-size switch that is taller than this layout allows. */
  switch: {
    transform: [{ scale: 0.78 }],
  },

  summaryHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 2,
  },

  summaryHeadingText: {
    ...Typography.small,
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
    flexShrink: 1,
  },

  validatedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
  },

  validatedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Surface.successText,
  },

  validatedText: {
    ...Typography.micro,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: Surface.successText,
  },

  summaryCard: {
    borderRadius: Radius.sm,
    paddingHorizontal: 12,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  rowText: {
    flex: 1,
    gap: 2,
  },

  rowLabel: {
    ...Typography.micro,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: Surface.textMuted,
  },

  rowValueLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  groupBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  groupBadgeText: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0,
    color: Surface.onPrimary,
  },

  rowValue: {
    ...Typography.small,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Surface.text,
    flexShrink: 1,
  },

  rowValueAccent: {
    color: Blood.primary,
  },

  rowDetail: {
    ...Typography.small,
    fontSize: 9,
    lineHeight: 12,
    color: Surface.textSecondary,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: Surface.softRed,
  },

  editButtonPressed: {
    backgroundColor: Surface.softRedBorder,
  },

  editButtonText: {
    ...Typography.micro,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: Blood.primary,
  },

  certCard: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  certText: {
    flex: 1,
    gap: 3,
  },

  certTitle: {
    ...Typography.small,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  certBody: {
    ...Typography.small,
    fontSize: 8.5,
    lineHeight: 12.5,
    color: Surface.textSecondary,
  },
});