import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useConfirm } from "@/components/ui/confirm-provider";
import { Blood, Surface } from "@/constants/colors";
import {
  REQUEST_STATUS_META,
  URGENCY_OPTIONS,
  type UrgencyLevel,
  type UrgencyMeta,
} from "@/constants/emergency";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type { DonorResponse, EmergencyRequest } from "@/services/requests/emergency-requests";
import { apiErrorMessage } from "@/services/auth";
import { timeAgo } from "@/utils/time";

// Keyed lookup so the card can colour itself from the same catalogue the form
// renders, rather than keeping a second copy of the palette.
const URGENCY_BY_LEVEL = Object.fromEntries(
  URGENCY_OPTIONS.map((option) => [option.level, option]),
) as Record<UrgencyLevel, UrgencyMeta>;

type RequestCardProps = {
  request: EmergencyRequest;
  /** Adds the shared "compatible with you" treatment on the donor dashboard. */
  matchesDonor?: boolean;
  /** Offers the accept/decline actions to a donor working the queue. */
  canAccept?: boolean;
  onDonorResponse?: (
    id: string,
    response: DonorResponse,
    isUpdate: boolean,
  ) => Promise<DonorResponse>;
  onRemoveDonorResponse?: (id: string) => Promise<void>;
  /**
   * Adds a trailing "Manage" affordance.
   *
   * Staff surfaces (the hospital requisition board, the admin triage queue)
   * need a way into the per-case workflow. Omit it everywhere else and the
   * footer stays exactly as it was.
   */
  onManage?: () => void;
  /**
   * Fired once a response of `accepted` has been confirmed by the server.
   *
   * The donor surfaces use it to send the donor straight to the journey tab,
   * because accepting is what creates the commitment that tab lists. It runs
   * only on success — a rejected write must leave the donor on the list where
   * the error is visible, not parked on an empty journey.
   */
  onAccepted?: () => void;
  /** Adds the staff manage/edit/cancel affordances. */
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
  canAccept = true,
  onDonorResponse,
  onRemoveDonorResponse,
  onManage,
  onAccepted,
  isManageable = false,
  onEdit,
  onCancel,
}: RequestCardProps) {
  const { confirm } = useConfirm();
  const [localResponse, setLocalResponse] = useState<{
    basedOn: DonorResponse | null;
    value: DonorResponse | null;
  } | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const urgency = URGENCY_BY_LEVEL[request.urgency];
  const status = REQUEST_STATUS_META[request.status];
  const posted = timeAgo(request.createdAt);
  const donorResponse = localResponse?.basedOn === request.donorResponse
    ? localResponse.value
    : request.donorResponse;
  const canEditResponse = donorResponse !== null &&
    (donorResponse === "declined" || request.donorStage === null || request.donorStage === "accepted");

  /**
   * Posts a donor response.
   *
   * Resolves `true` only when the server took it, so `onAccepted` can be gated
   * on the write actually landing rather than on the tap.
   */
  async function handleDonorResponse(next: DonorResponse): Promise<boolean> {
    if (!onDonorResponse || isResponding) return false;

    setIsResponding(true);
    setResponseError(null);

    try {
      setLocalResponse({
        basedOn: request.donorResponse,
        value: await onDonorResponse(request.id, next, donorResponse !== null),
      });
      return true;
    } catch (caught) {
      setResponseError(apiErrorMessage(caught));
      return false;
    } finally {
      setIsResponding(false);
    }
  }

  /** Accepts, then hands off to the journey if the write landed. */
  async function handleAccept() {
    if (await handleDonorResponse("accepted")) {
      onAccepted?.();
    }
  }

  async function handleRemoveResponse() {
    if (!onRemoveDonorResponse || isResponding) return;

    const approved = await confirm({
      title: "Remove response",
      message: "Are you sure you want to remove your donor response?",
      confirmLabel: "Remove",
      icon: "trash-2",
      destructive: true,
    });

    if (!approved) return;

    setIsResponding(true);
    setResponseError(null);

    try {
      await onRemoveDonorResponse(request.id);
    } catch (caught) {
      setResponseError(apiErrorMessage(caught));
    } finally {
      setIsResponding(false);
    }
  }

  async function confirmCancel() {
    if (!onCancel) return;

    const approved = await confirm({
      title: "Cancel request",
      message: "Are you sure you want to cancel this request?",
      confirmLabel: "Cancel",
      icon: "x-circle",
      destructive: true,
    });

    if (approved) {
      await onCancel(request);
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

        {onManage ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Manage the request for ${request.patientName}`}
            hitSlop={6}
            onPress={onManage}
            style={({ pressed }) => [styles.manage, pressed && styles.pressed]}
          >
            <Text style={styles.manageText}>Manage</Text>
            <Feather name="chevron-right" size={14} color={Blood.primary} />
          </Pressable>
        ) : null}
      </View>

      {isManageable ? (
        <View style={styles.manageActions}>
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

      {matchesDonor && request.acceptedByOtherDonor && donorResponse === null ? (
        <View style={[styles.responseStatus, styles.acceptedByOther]}>
          <Feather name="check-circle" size={14} color={Surface.online} />
          <Text style={styles.responseStatusText}>Already accepted by another donor</Text>
        </View>
      ) : null}

      {matchesDonor && !request.acceptedByOtherDonor && donorResponse !== null && canEditResponse && onDonorResponse ? (
        <View style={styles.actions}>
          {canAccept ? (
            <Pressable
              accessibilityRole="button"
              disabled={isResponding}
              onPress={() => void handleAccept()}
              style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed, isResponding && styles.disabled]}
            >
              <Feather name="check" size={14} color={Surface.card} />
              <Text style={styles.acceptText}>Accept</Text>
            </Pressable>
          ) : (
            <View style={styles.acceptLockedButton}>
              <Feather name="lock" size={13} color={Surface.textMuted} />
              <Text style={styles.acceptLockedText}>Unavailable</Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={isResponding}
            onPress={() => void handleDonorResponse("declined")}
            style={({ pressed }) => [styles.declineButton, pressed && styles.pressed, isResponding && styles.disabled]}
          >
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
          {onRemoveDonorResponse ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove your response"
              disabled={isResponding}
              onPress={() => void handleRemoveResponse()}
              style={({ pressed }) => [styles.removeButton, pressed && styles.pressed, isResponding && styles.disabled]}
            >
              {isResponding ? <ActivityIndicator size="small" color={Surface.danger} /> : <Feather name="trash-2" size={14} color={Surface.danger} />}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {matchesDonor && donorResponse === "accepted" && !canEditResponse ? (
        <Text style={styles.responseHint}>Transit has started. This response can no longer be changed or removed.</Text>
      ) : null}

      {matchesDonor && !request.acceptedByOtherDonor && donorResponse === null && onDonorResponse ? (
        <>
          {canAccept ? (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Accept request for ${request.patientName}`}
                disabled={isResponding}
                onPress={() => void handleAccept()}
                style={({ pressed }) => [styles.acceptButton, pressed && styles.pressed, isResponding && styles.disabled]}
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
          ) : (
            <View style={styles.availabilityGate}>
              <View style={styles.availabilityGateIcon}>
                <Feather name="lock" size={14} color="#B54708" />
              </View>
              <View style={styles.availabilityGateText}>
                <Text style={styles.availabilityGateTitle}>Availability required to accept</Text>
                <Text style={styles.availabilityGateSubtitle}>
                  Turn on your availability switch before accepting a request.
                </Text>
              </View>
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
          )}
        </>
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

  /** Pushed to the far end of the wrapping footer row. */
  manage: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  manageText: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "700",
    color: Blood.primary,
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },

  manageActions: {
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

  removeButton: {
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.card,
  },

  pressed: {
    opacity: 0.78,
  },

  disabled: {
    opacity: 0.55,
  },

  acceptLockedButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  acceptLockedText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textMuted,
  },

  availabilityGate: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: Radius.sm,
    backgroundColor: "#FEF0C7",
    borderWidth: 1,
    borderColor: "#FEDF89",
    marginTop: 2,
  },

  availabilityGateIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  availabilityGateText: {
    flex: 1,
    gap: 1,
  },

  availabilityGateTitle: {
    ...Typography.small,
    fontWeight: "700",
    color: "#B54708",
    fontSize: 12,
  },

  availabilityGateSubtitle: {
    ...Typography.micro,
    color: "#92400E",
    fontSize: 10.5,
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

  acceptedByOther: {
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
