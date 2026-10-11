import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import {
  URGENCY_OPTIONS,
  type UrgencyLevel,
  type UrgencyMeta,
} from "@/constants/emergency";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type { EmergencyRequest, RequestStatus } from "@/services/requests/emergency-requests";
import { timeAgo } from "@/utils/relative-time";

// Keyed lookup so the card can colour itself from the same catalogue the form
// renders, rather than keeping a second copy of the palette.
const URGENCY_BY_LEVEL = Object.fromEntries(
  URGENCY_OPTIONS.map((option) => [option.level, option]),
) as Record<UrgencyLevel, UrgencyMeta>;

const STATUS_META: Record<
  RequestStatus,
  {
    label: string;
    icon: ComponentProps<typeof Feather>["name"];
    background: string;
    border: string;
    color: string;
  }
> = {
  pending: {
    label: "Awaiting verification",
    icon: "clock",
    background: Surface.iconWash,
    border: Surface.border,
    color: Surface.textSecondary,
  },
  verified: {
    label: "Verified — donors notified",
    icon: "check-circle",
    background: Surface.softBlue,
    border: Surface.softBlueBorder,
    color: Surface.textSecondary,
  },
  fulfilled: {
    label: "Fulfilled",
    icon: "check",
    background: Surface.softGreen,
    border: Surface.softGreenBorder,
    color: Surface.online,
  },
  cancelled: {
    label: "Cancelled",
    icon: "x",
    background: Surface.iconWash,
    border: Surface.border,
    color: Surface.textMuted,
  },
};

type RequestCardProps = {
  request: EmergencyRequest;
  /** Adds the shared "compatible with you" treatment on the donor dashboard. */
  matchesDonor?: boolean;
  /**
   * Shows the Manage / Cancel actions. Set only for a recipient's own requests
   * that are still open — the server refuses edits to anything closed, and a
   * donor or admin only reads the queue.
   */
  isManageable?: boolean;
  /** Opens the edit form for this request. */
  onEdit?: (request: EmergencyRequest) => void;
  /** Cancels the request after a confirmation; receives the live request. */
  onCancel?: (request: EmergencyRequest) => Promise<void>;
};

/** One emergency request, as it appears in every dashboard's triage list. */
export function RequestCard({
  request,
  matchesDonor = false,
  isManageable = false,
  onEdit,
  onCancel,
}: RequestCardProps) {
  const urgency = URGENCY_BY_LEVEL[request.urgency];
  const status = STATUS_META[request.status];
  const posted = timeAgo(request.createdAt);

  function confirmCancel() {
    if (onCancel === undefined) {
      return;
    }

    // Cancelling stops donors being matched to this request, so it takes an
    // explicit confirmation — an accidental tap must not close a live case.
    Alert.alert(
      "Cancel this request?",
      `The ${request.bloodGroup} request for ${request.units} ${
        request.units === 1 ? "unit" : "units"
      } will be withdrawn and donors will no longer be alerted.`,
      [
        { text: "Keep Request", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: () => {
            void onCancel(request);
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.card, matchesDonor && styles.cardMatching]}>
      <View style={styles.topRow}>
        <View style={styles.groupBadge}>
          <Text style={styles.groupText}>{request.bloodGroup}</Text>
        </View>

        <View style={styles.heading}>
          <Text style={styles.patient} numberOfLines={1}>
            {request.patientName}
          </Text>

          <Text style={styles.hospital} numberOfLines={1}>
            {request.hospital}
            {request.district !== null ? ` · ${request.district}` : ""}
          </Text>
        </View>

        <View style={[styles.urgency, { backgroundColor: urgency.background, borderColor: urgency.border }]}>
          <Feather name={urgency.icon} size={11} color={urgency.accent} />
          <Text style={[styles.urgencyText, { color: urgency.accent }]}>{urgency.label}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.meta}>
          <Feather name="droplet" size={11} color={Surface.textMuted} />
          <Text style={styles.metaText}>
            {request.units} {request.units === 1 ? "unit" : "units"}
          </Text>
        </View>

        <View style={styles.meta}>
          <Feather name="phone" size={11} color={Surface.textMuted} />
          <Text style={styles.metaText}>{request.contactName}</Text>
        </View>

        {posted !== "" ? (
          <View style={styles.meta}>
            <Feather name="clock" size={11} color={Surface.textMuted} />
            <Text style={styles.metaText}>{posted}</Text>
          </View>
        ) : null}
      </View>

      {request.notes !== null && request.notes !== "" ? (
        <Text style={styles.notes} numberOfLines={3}>
          {request.notes}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={[styles.status, { backgroundColor: status.background, borderColor: status.border }]}>
          <Feather name={status.icon} size={10} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>

        {matchesDonor ? (
          <View style={styles.matchPill}>
            <Feather name="zap" size={10} color={Surface.online} />
            <Text style={styles.matchText}>You can donate</Text>
          </View>
        ) : null}

        {request.isAnonymous ? (
          <Text style={styles.anonymous}>Zero-login request</Text>
        ) : null}
      </View>

      {isManageable ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Manage request for ${request.bloodGroup}`}
            onPress={() => onEdit?.(request)}
            hitSlop={6}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          >
            <Feather name="edit-2" size={13} color={Blood.primary} />
            <Text style={styles.actionText}>Manage</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Cancel request for ${request.bloodGroup}`}
            onPress={confirmCancel}
            hitSlop={6}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          >
            <Feather name="x-circle" size={13} color={Surface.textMuted} />
            <Text style={[styles.actionText, styles.actionTextMuted]}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  cardMatching: {
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
    backgroundColor: "#F6FEF9",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  groupBadge: {
    minWidth: 44,
    height: 40,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  groupText: {
    ...Typography.cardTitle,
    color: Blood.primary,
  },

  heading: {
    flex: 1,
    gap: 1,
  },

  patient: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  hospital: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  urgency: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  urgencyText: {
    ...Typography.micro,
    fontSize: 9.5,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  notes: {
    ...Typography.small,
    color: Surface.textSecondary,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: Surface.border,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  statusText: {
    ...Typography.micro,
    fontSize: 9.5,
  },

  matchPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
    backgroundColor: Surface.softGreen,
  },

  matchText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.online,
  },

  anonymous: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textMuted,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    minHeight: 36,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.background,
  },

  actionPressed: {
    opacity: 0.6,
  },

  actionText: {
    ...Typography.label,
    color: Blood.primary,
  },

  actionTextMuted: {
    color: Surface.textSecondary,
  },
});
