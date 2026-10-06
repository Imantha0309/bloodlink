import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import {
  URGENCY_OPTIONS,
  type UrgencyLevel,
  type UrgencyMeta,
} from "@/constants/emergency";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type {
  DonorResponse,
  EmergencyRequest,
  RequestStatus,
} from "@/services/requests/emergency-requests";
import { apiErrorMessage } from "@/services/auth";

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

/** Coarse relative time — enough for a triage list, no date library needed. */
function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();

  if (Number.isNaN(then)) {
    return "";
  }

  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return `${Math.round(hours / 24)}d ago`;
}

type RequestCardProps = {
  request: EmergencyRequest;
  /** Adds the shared "compatible with you" treatment on the donor dashboard. */
  matchesDonor?: boolean;
  canAccept?: boolean;
  onDonorResponse?: (id: string, response: DonorResponse) => Promise<DonorResponse>;
};

/** One emergency request, as it appears in every dashboard's triage list. */
export function RequestCard({
  request,
  matchesDonor = false,
  canAccept = true,
  onDonorResponse,
}: RequestCardProps) {
  const [localResponse, setLocalResponse] = useState<DonorResponse | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const urgency = URGENCY_BY_LEVEL[request.urgency];
  const status = STATUS_META[request.status];
  const posted = timeAgo(request.createdAt);
  const donorResponse = request.donorResponse ?? localResponse;

  async function handleDonorResponse(next: DonorResponse) {
    if (!onDonorResponse || isResponding) return;

    setIsResponding(true);
    setResponseError(null);

    try {
      setLocalResponse(await onDonorResponse(request.id, next));
    } catch (caught) {
      setResponseError(apiErrorMessage(caught));
    } finally {
      setIsResponding(false);
    }
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

      {matchesDonor && donorResponse !== null ? (
        <View style={[styles.responseStatus, donorResponse === "accepted" ? styles.accepted : styles.declined]}>
          <Feather
            name={donorResponse === "accepted" ? "check-circle" : "x-circle"}
            size={14}
            color={donorResponse === "accepted" ? Surface.online : Surface.textSecondary}
          />
          <Text style={styles.responseStatusText}>
            {donorResponse === "accepted" ? "You accepted this request" : "You declined this request"}
          </Text>
        </View>
      ) : null}

      {matchesDonor && donorResponse === null && onDonorResponse ? (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Accept request for ${request.patientName}`}
            disabled={isResponding || !canAccept}
            onPress={() => void handleDonorResponse("accepted")}
            style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed, (isResponding || !canAccept) && styles.disabled]}
          >
            {isResponding ? (
              <ActivityIndicator size="small" color={Surface.card} />
            ) : (
              <Feather name="check" size={15} color={Surface.card} />
            )}
            <Text style={styles.acceptText}>Accept & respond</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Decline request for ${request.patientName}`}
            disabled={isResponding}
            onPress={() => void handleDonorResponse("declined")}
            style={({ pressed }) => [styles.declineButton, pressed && styles.pressed, isResponding && styles.disabled]}
          >
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
        </View>
      ) : null}

      {matchesDonor && donorResponse === null && !canAccept && onDonorResponse ? (
        <Text style={styles.responseHint}>Turn on your availability to accept a request. You can still decline it.</Text>
      ) : null}

      {responseError !== null ? <Text style={styles.responseError}>{responseError}</Text> : null}
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
    gap: 8,
    marginTop: 2,
  },

  acceptButton: {
    minHeight: 42,
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Blood.primary,
  },

  acceptText: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.card,
  },

  declineButton: {
    minHeight: 42,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
  },

  declineText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  pressed: {
    opacity: 0.78,
  },

  disabled: {
    opacity: 0.55,
  },

  responseStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },

  accepted: {
    backgroundColor: Surface.softGreen,
  },

  declined: {
    backgroundColor: Surface.iconWash,
  },

  responseStatusText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  responseError: {
    ...Typography.small,
    color: Surface.danger,
  },

  responseHint: {
    ...Typography.micro,
    color: Surface.textMuted,
  },
});
