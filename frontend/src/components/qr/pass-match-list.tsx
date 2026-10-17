/**
 * What a scanned pass resolves to, once someone has acted on it.
 *
 * Split out of `scan.tsx` because it is a different shape of screen: the scanner
 * has finished with the camera, and everything here is about one donor's
 * compatibility with the open requests this account can see.
 *
 * The list is filtered against `CAN_DONATE_TO`, the same mirrored compatibility
 * table the donor dashboards use, and the source list is whatever the caller's
 * role already has access to — a recipient's own requests, a hospital's district
 * board. No new read endpoint is involved: the server was already returning the
 * right rows, they were just never cross-referenced against a scanned donor.
 *
 * Only a hospital can record the response, and it is recorded against the pass
 * rather than a donor id, so the donor is whoever the pass belongs to. A
 * recipient sees the same list read-only: a third party committing someone else
 * to a donation is a desk action, not a phone one.
 */

import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
import { REQUEST_STATUS_META } from "@/constants/emergency";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import { respondForScannedPass, type ResolvedPass } from "@/services/auth/pass-service";
import { listEmergencyRequests, type EmergencyRequest } from "@/services/requests/emergency-requests";
import { haptics } from "@/utils/haptics";
import { wardOf } from "@/utils/request-ward";
import { referenceFor } from "@/utils/reference";
import { ROUTES } from "@/constants/routes";

type MatchListProps = {
  resolved: ResolvedPass;
  /** The raw pass code, kept for the on-behalf write and never put in a URL. */
  secret: string;
  /** Whether this account may record the response, not just read the list. */
  canRespond: boolean;
  /** A recipient reads their own requests; staff read the district board. */
  scope: "mine" | "board";
  onBack: () => void;
};

export function PassMatchList({ resolved, secret, canRespond, scope, onBack }: MatchListProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [handled, setHandled] = useState<Record<string, "accepted" | "declined">>({});

  const { owner } = resolved;
  const group = isBloodGroup(owner.bloodGroup) ? owner.bloodGroup : null;

  // State changes only inside the promise callbacks, so the effect body itself
  // never triggers a cascading render. `cancelled` covers the scope changing
  // under an in-flight request.
  useEffect(() => {
    let cancelled = false;

    listEmergencyRequests(scope === "mine" ? { mine: true } : {})
      .then((data) => {
        if (cancelled) return;
        setRequests(data);
        setLoadError(null);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setLoadError(apiErrorMessage(caught));
      });

    return () => {
      cancelled = true;
    };
  }, [scope]);

  // Still accepting responses, and this donor's blood can serve them. The
  // server re-checks all of this on write; filtering here only avoids showing
  // rows the write would refuse.
  const matches = (requests ?? [])
    .filter((request) => (request.status === "pending" || request.status === "verified"))
    .filter((request) => group !== null && (CAN_DONATE_TO[group] ?? []).includes(request.bloodGroup as never));

  async function respond(request: EmergencyRequest) {
    if (workingId !== null) return;

    setWorkingId(request.id);
    setActionError(null);

    try {
      await respondForScannedPass(request.id, secret, "accepted");
      setHandled((current) => ({ ...current, [request.id]: "accepted" }));
      haptics.success();
    } catch (caught) {
      setActionError(apiErrorMessage(caught));
      haptics.error();
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to the scan"
          hitSlop={6}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Feather name="arrow-left" size={18} color={Surface.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MATCHING REQUESTS</Text>
          <Text style={styles.title} numberOfLines={1}>
            {owner.fullName}
          </Text>
        </View>
      </View>

      {/* Who was scanned, and the ward they report from — the two facts the
          desk needs before deciding anything. */}
      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Feather name="droplet" size={13} color={Surface.textMuted} />
            <Text style={styles.summaryLabel}>Blood group</Text>
            <Text style={styles.summaryValue}>{group ?? "Not set"}</Text>
          </View>

          {owner.wardLabel !== null ? (
            <View style={styles.summaryItem}>
              <Feather name="home" size={13} color={Surface.textMuted} />
              <Text style={styles.summaryLabel}>Donor ward</Text>
              <Text style={styles.summaryValue}>{owner.wardLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {actionError !== null ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Feather name="alert-circle" size={14} color={Blood.primary} />
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      {loadError !== null ? (
        <View style={styles.error} accessibilityLiveRegion="polite">
          <Feather name="wifi-off" size={14} color={Blood.primary} />
          <Text style={styles.errorText}>{loadError}</Text>
        </View>
      ) : null}

      {requests === null ? (
        <View style={styles.loading}>
          <ActivityIndicator color={Blood.primary} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="droplet" size={28} color={Surface.textMuted} />
          <Text style={styles.emptyTitle}>
            {group === null ? "No blood group on this pass" : "Nothing they can donate to"}
          </Text>
          <Text style={styles.emptyText}>
            {group === null
              ? "A donor needs a blood group on their profile before they can be matched."
              : scope === "mine"
              ? "None of your open requests can take this blood group. New requests appear here automatically."
              : "No open request in your district can take this blood group."}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
          {matches.map((request) => {
            const done = handled[request.id];
            const ward = wardOf(request.notes);
            const meta = REQUEST_STATUS_META[request.status];

            return (
              <View key={request.id} style={styles.card}>
                <View style={styles.cardTop}>
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
                </View>

                <View style={styles.facts}>
                  <Text style={[styles.fact, styles.requestCode]}>Request #{referenceFor(request.id)}</Text>
                  <Text style={styles.fact}>·</Text>
                  <Text style={styles.fact}>
                    {request.units} {request.units === 1 ? "unit" : "units"}
                  </Text>
                  <Text style={styles.fact}>·</Text>
                  <Text style={styles.fact}>{request.urgency} priority</Text>
                  {ward !== null ? (
                    <>
                      <Text style={styles.fact}>·</Text>
                      <Text style={[styles.fact, styles.factWard]}>{ward}</Text>
                    </>
                  ) : null}
                </View>

                {request.notes ? <Text style={styles.requestNotes}>{request.notes}</Text> : null}

                {done === "accepted" ? (
                  <>
                    <View style={styles.accepted} accessibilityLiveRegion="polite">
                      <Feather name="check-circle" size={15} color={Surface.online} />
                      <Text style={styles.acceptedText}>
                        {owner.fullName.split(" ")[0]} is accepted. Go to request #{referenceFor(request.id)}.
                      </Text>
                    </View>
                    {canRespond ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Go to request ${referenceFor(request.id)}`}
                        onPress={() => router.push({ pathname: ROUTES.hospitalVerifyDonor, params: { requestId: request.id } })}
                        style={({ pressed }) => [styles.goToRequest, pressed && styles.pressed]}
                      >
                        <Feather name="arrow-right" size={15} color={Surface.onPrimary} />
                        <Text style={styles.acceptText}>Go to request</Text>
                      </Pressable>
                    ) : null}
                  </>
                ) : canRespond ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Record ${owner.fullName} as accepting request for ${request.patientName}`}
                    disabled={workingId !== null}
                    onPress={() => void respond(request)}
                    style={({ pressed }) => [styles.accept, pressed && styles.pressed]}
                  >
                    {workingId === request.id ? (
                      <ActivityIndicator size="small" color={Surface.onPrimary} />
                    ) : (
                      <>
                        <Feather name="check" size={15} color={Surface.onPrimary} />
                        <Text style={styles.acceptText}>Accept for {owner.fullName.split(" ")[0]}</Text>
                      </>
                    )}
                  </Pressable>
                ) : (
                  <View style={styles.readOnly}>
                    <Feather name="eye" size={13} color={Surface.textMuted} />
                    <Text style={styles.readOnlyText}>
                      Read-only — a hospital desk records the response
                    </Text>
                  </View>
                )}

                <Text style={styles.status}>{meta?.label ?? request.status}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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

  headerText: {
    flex: 1,
    gap: 2,
  },

  eyebrow: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  title: {
    ...Typography.title,
    color: Surface.text,
  },

  summary: {
    padding: 13,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  summaryRow: {
    flexDirection: "row",
    gap: 18,
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },

  summaryLabel: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  summaryValue: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.text,
  },

  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  errorText: {
    ...Typography.small,
    flex: 1,
    color: Blood.primary,
  },

  loading: {
    paddingVertical: 40,
    alignItems: "center",
  },

  empty: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 36,
    paddingHorizontal: 12,
  },

  emptyTitle: {
    ...Typography.title,
    color: Surface.text,
    textAlign: "center",
  },

  emptyText: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  list: {
    maxHeight: 460,
  },

  listContent: {
    gap: 10,
    paddingBottom: 8,
  },

  card: {
    padding: 14,
    gap: 9,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
    backgroundColor: Surface.card,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  groupBadge: {
    minWidth: 38,
    paddingVertical: 5,
    paddingHorizontal: 7,
    borderRadius: Radius.sm,
    alignItems: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  groupText: {
    ...Typography.label,
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

  facts: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  fact: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  factWard: {
    fontWeight: "700",
    color: Blood.primary,
  },

  requestCode: {
    fontWeight: "800",
    color: Blood.primary,
  },

  requestNotes: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  goToRequest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 42,
    borderRadius: Radius.sm,
    backgroundColor: Blood.primary,
  },

  accept: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    borderRadius: Radius.sm,
    backgroundColor: Blood.primary,
  },

  acceptText: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.onPrimary,
  },

  accepted: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softGreen,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },

  acceptedText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.successText,
  },

  readOnly: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    backgroundColor: Surface.iconWash,
  },

  readOnlyText: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  status: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  pressed: {
    opacity: 0.78,
  },
});
