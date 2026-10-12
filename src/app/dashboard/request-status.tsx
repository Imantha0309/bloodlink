import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentProps } from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { MapPreview } from "@/components/emergency/map-preview";
import { StepHeader } from "@/components/emergency/step-header";
import { AsyncState } from "@/components/ui/async-state";
import type { BloodGroup } from "@/constants/blood-groups";
import { REQUEST_STATUS_META, URGENCY_OPTIONS } from "@/constants/emergency";
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  getEmergencyRequest,
  listEmergencyRequests,
  updateEmergencyRequestStatus,
  type EmergencyRequest,
  type EmergencyRequestDetail,
} from "@/services/requests/emergency-requests";
import { buildRequestTimeline, isRequestLive } from "@/utils/request-timeline";
import { referenceFor } from "@/utils/reference";
import { timeAgo } from "@/utils/time";

/**
 * Request Status — real, server-backed tracking for one emergency request.
 *
 * Follows the wizard/profile recipe: `StepHeader` on top (back + brand +
 * trailing controls), ScrollView with pull-to-refresh, `DashboardTabBar`
 * pinned below. The request is fetched by `?id=`, or resolved to the
 * recipient's most recent request when no id was passed. While the request is
 * still open (pending/verified) the detail refetches silently every 15
 * seconds; everything on screen — status, timeline, compatible groups, the
 * facility — comes from the API. Nothing here is simulated: no donor names,
 * no ETAs, no routes, no invented phone numbers.
 */

const C = {
  primary: "#C8102E",
  dark: "#B51224",
  bg: "#F6F8FC",
  card: "#FFFFFF",
  border: "#E4E8ED",
  text: "#17212B",
  sub: "#687586",
  muted: "#929AA6",
  paleRed: "#FFF0F1",
  paleBlue: "#EEF4FF",
  paleGreen: "#EAF8EF",
  green: "#16834A",
  blue: "#4C73B8",
  wash: "#F1F3F9",
  shadow: "#0F172A",
} as const;

/** Silent background refetch cadence while the request may still change. */
const POLL_MS = 15_000;

type InfoSheet = {
  title: string;
  lines: string[];
};

type CalloutTone = "pending" | "good" | "bad";

type Callout = {
  icon: ComponentProps<typeof Feather>["name"];
  title: string;
  message: string;
  tone: CalloutTone;
};

export default function RequestStatusScreen() {
  const router = useRouter();
  const onBack = useAuthBack(DASHBOARD_TABS.requests);
  const { session } = useAuth();

  const params = useLocalSearchParams<{ id?: string }>();
  const initialId = typeof params.id === "string" && params.id !== "" ? params.id : null;
  const idRef = useRef<string | null>(initialId);
  const hasLoadedRef = useRef(false);

  // Kept in a ref so the fetch callback stays stable (and lint-clean) without
  // re-running the mount effect when the session object is replaced. Synced
  // in an effect, never written during render.
  const sessionRef = useRef(session);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const [detail, setDetail] = useState<EmergencyRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<InfoSheet | null>(null);

  /**
   * Resolves which request to show (param id → recipient's latest → none)
   * and fetches it. Returns `null` when there is genuinely nothing to show.
   */
  const resolveAndFetch = useCallback(async (): Promise<EmergencyRequestDetail | null> => {
    let target = idRef.current;

    if (target === null) {
      const role = sessionRef.current?.user.role ?? "recipient";

      if (role !== "recipient") {
        return null;
      }

      const mine = await listEmergencyRequests();
      target = mine[0]?.id ?? null;
      idRef.current = target;
    }

    if (target === null) {
      return null;
    }

    return getEmergencyRequest(target);
  }, []);

  useEffect(() => {
    let cancelled = false;

    // isLoading already starts true and error starts null, so the effect
    // itself only touches state inside the promise callbacks below.
    resolveAndFetch()
      .then((data) => {
        if (cancelled) {
          return;
        }

        hasLoadedRef.current = data !== null;
        setDetail(data);
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
  }, [resolveAndFetch]);

  /** Silent refetch for the 15s poll — never disturbs the UI on failure. */
  const pollOnce = useCallback(async () => {
    const target = idRef.current;

    if (target === null) {
      return;
    }

    try {
      setDetail(await getEmergencyRequest(target));
      hasLoadedRef.current = true;
    } catch {
      // Keep the last known data; the next tick retries.
    }
  }, []);

  const liveStatus = detail !== null && isRequestLive(detail.request.status)
    ? detail.request.status
    : null;

  useEffect(() => {
    if (liveStatus === null) {
      return;
    }

    const timer = setInterval(() => {
      void pollOnce();
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [liveStatus, pollOnce]);

  /** Pull-to-refresh (or an explicit refresh) from the empty state. */
  async function pullRefresh(options?: { useLoader?: boolean }) {
    if (options?.useLoader === true) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    setError(null);

    try {
      const data = await resolveAndFetch();
      hasLoadedRef.current = data !== null;
      setDetail(data);
    } catch (caught) {
      const message = apiErrorMessage(caught);

      if (hasLoadedRef.current) {
        // Already showing data — report the failed refresh without blanking it.
        openInfo("Refresh Failed", [message]);
      } else {
        setError(message);
      }
    } finally {
      if (options?.useLoader === true) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }

  const request = detail?.request ?? null;
  const groups = detail?.compatibleDonorGroups ?? [];
  const statusMeta = request === null ? undefined : REQUEST_STATUS_META[request.status];
  const urgencyMeta = request === null
    ? undefined
    : URGENCY_OPTIONS.find((option) => option.level === request.urgency);
  const isLive = request !== null && isRequestLive(request.status);
  const canCancel =
    request !== null &&
    isRequestLive(request.status) &&
    !request.isAnonymous &&
    session !== null;

  const stripLabel =
    request === null
      ? ""
      : isLive
        ? "ACTIVE EMERGENCY REQUEST"
        : request.status === "fulfilled"
          ? "FULFILLED REQUEST"
          : "CANCELLED REQUEST";

  const wardLine =
    request === null
      ? null
      : ((request.notes ?? "")
          .split("\n")
          .map((line) => line.trim())
          .find((line) => /^ward\b/i.test(line)) ?? null);

  const timeline =
    request === null
      ? []
      : buildRequestTimeline(
          request.status,
          timeAgo(request.createdAt),
          timeAgo(request.updatedAt),
        );

  const callout = request === null ? null : calloutFor(request, groups);
  const showEmptyAction = !isLoading && error === null && detail === null;

  function openInfo(title: string, lines: string[]) {
    setInfo({ title, lines });
  }

  function goTab(key: DashboardTabKey) {
    if (key === "requests") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  function confirmCancelRequest() {
    if (detail === null) {
      return;
    }

    Alert.alert(
      "Cancel Request",
      `Cancel request #BL-${referenceFor(detail.request.id)}? The hospital and any notified donors will see that it is withdrawn.`,
      [
        { text: "Keep Request", style: "cancel" },
        {
          text: "Cancel Request",
          style: "destructive",
          onPress: () => {
            void cancelRequest();
          },
        },
      ],
    );
  }

  async function cancelRequest() {
    if (detail === null) {
      return;
    }

    try {
      const updated = await updateEmergencyRequestStatus(detail.request.id, "cancelled");
      setDetail({ ...detail, request: updated });
      hasLoadedRef.current = true;

      openInfo("Request Cancelled", [
        `Request #BL-${referenceFor(updated.id)} has been cancelled.`,
        "The hospital coordinator and notified donors will see the update.",
      ]);
    } catch (caught) {
      openInfo("Could Not Cancel", [apiErrorMessage(caught)]);
    }
  }

  async function callContact() {
    if (request === null) {
      return;
    }

    const number = request.contactMobile.replace(/[^\d+]/g, "");

    try {
      await Linking.openURL(`tel:${number}`);
    } catch {
      openInfo("Call Contact", [
        `${request.contactName}: ${request.contactMobile}`,
        "Your device could not place this call.",
      ]);
    }
  }

  function openMaps() {
    if (request === null) {
      return;
    }

    const query = encodeURIComponent(
      [request.hospital, request.district].filter((part) => part !== null && part !== "").join(", "),
    );

    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
      openInfo("Open in Maps", [
        `Could not open the maps app. Search for:`,
        request.hospital,
        request.district ?? "",
      ]);
    });
  }

  return (
    <View style={styles.screen}>
      <StepHeader
        title="Request Status"
        onBack={onBack}
        right={
          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={6}
              onPress={() => {
                openInfo("Notifications", [
                  "Donor responses and hospital updates appear on this screen as it refreshes.",
                  "Push notifications are not wired up yet.",
                ]);
              }}
              style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            >
              <Feather name="bell" size={14} color={C.sub} />
            </Pressable>

            <View style={styles.headerAvatar}>
              <Image
                source={require("../../../assets/images/donoravatars.png")}
                style={styles.headerAvatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              void pullRefresh();
            }}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
        <Text style={styles.subtitle}>
          Verification, donor notification and fulfilment for this request — refreshed
          automatically while it is open.
        </Text>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={detail === null}
          emptyTitle="No request to show"
          emptyMessage="Open a request from the Requests tab, or raise a new emergency request."
          onRetry={() => {
            void pullRefresh({ useLoader: true });
          }}
        >
          {detail === null ? null : (
            <>
              {/* --------------------------------------- active request strip */}
              <View style={styles.card}>
                <View style={styles.stripRow}>
                  <View style={styles.stripCopy}>
                    <View style={styles.inlineRow}>
                      <View
                        style={[
                          styles.liveDot,
                          { backgroundColor: isLive ? C.primary : C.muted },
                        ]}
                      />
                      <Text
                        style={[
                          styles.stripLabel,
                          { color: isLive ? C.primary : C.muted },
                        ]}
                      >
                        {stripLabel}
                      </Text>
                    </View>
                    <Text style={styles.stripId}>#BL-{referenceFor(detail.request.id)}</Text>
                  </View>

                  {urgencyMeta !== undefined ? (
                    <View
                      style={[
                        styles.urgencyBadge,
                        {
                          backgroundColor: urgencyMeta.background,
                          borderColor: urgencyMeta.border,
                        },
                      ]}
                    >
                      <Text style={[styles.urgencyBadgeText, { color: urgencyMeta.accent }]}>
                        {urgencyMeta.label.toUpperCase()}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* ------------------------------------------------- main status */}
              <View style={styles.card}>
                <View style={styles.statusTopRow}>
                  <View style={styles.statusBloodBadge}>
                    <Text style={styles.statusBloodBadgeText}>{detail.request.bloodGroup}</Text>
                  </View>

                  <View style={styles.statusCopy}>
                    <Text style={styles.statusUnits}>
                      {detail.request.units} Unit{detail.request.units === 1 ? "" : "s"}{" "}
                      {detail.request.bloodGroup} Requested
                    </Text>
                    <Text style={styles.statusHospital} numberOfLines={1}>
                      {detail.request.hospital}
                    </Text>
                    <Text style={styles.statusWard} numberOfLines={1}>
                      {wardLine ?? `Submitted ${timeAgo(detail.request.createdAt)}`}
                    </Text>
                  </View>

                  {statusMeta !== undefined ? (
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: statusMeta.background,
                          borderColor: statusMeta.border,
                        },
                      ]}
                    >
                      <Feather name={statusMeta.icon} size={8} color={statusMeta.color} />
                      <Text
                        style={[styles.statusChipText, { color: statusMeta.color }]}
                        numberOfLines={1}
                      >
                        {statusMeta.label}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* ------------------------------------- compatible donor groups */}
              <View style={[styles.card, styles.responsesCard]}>
                <Text style={styles.sectionTitle}>Can Receive From</Text>

                <View style={styles.responsesTopRow}>
                  <View style={styles.responsesCount}>
                    <Text style={styles.responsesNumber}>{groups.length}</Text>
                    <Text style={styles.responsesCaption}>
                      {groups.length === 1
                        ? "donor group compatible with this request"
                        : "donor groups compatible with this request"}
                    </Text>
                  </View>
                </View>

                {groups.length > 0 ? (
                  <View style={styles.groupChips}>
                    {groups.map((group: BloodGroup) => (
                      <View key={group} style={styles.groupChip}>
                        <Text style={styles.groupChipText}>{group}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={styles.groupChips}>
                    <Text style={styles.responsesCaption}>
                      No compatible donor groups — this request cannot be matched right now.
                    </Text>
                  </View>
                )}
              </View>

              {/* ------------------------------------------------- delivery area */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Delivery Area</Text>
                </View>

                <View style={styles.mapFrame}>
                  <MapPreview area={detail.request.district ?? "Colombo"} />
                </View>

                <Text style={styles.mapCaption}>
                  {detail.request.hospital}
                  {detail.request.district !== null ? ` · ${detail.request.district}` : ""}
                </Text>
                <Text style={styles.mapCaption}>
                  Area preview only — this screen has no live GPS.
                </Text>
              </View>

              {/* ------------------------------------------------ request details */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Request Details</Text>
                </View>

                <View style={styles.detailList}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Feather name="user" size={12} color={C.sub} />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>PATIENT</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {detail.request.patientName}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Feather name="phone" size={12} color={C.sub} />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>CONTACT</Text>
                      <Text style={styles.detailValue} numberOfLines={2}>
                        {detail.request.contactName} · {detail.request.contactMobile}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailIcon}>
                      <Feather name="clock" size={12} color={C.sub} />
                    </View>
                    <View style={styles.detailCopy}>
                      <Text style={styles.detailLabel}>SUBMITTED</Text>
                      <Text style={styles.detailValue}>
                        {timeAgo(detail.request.createdAt)} · updated{" "}
                        {timeAgo(detail.request.updatedAt)}
                      </Text>
                    </View>
                  </View>

                  {detail.request.notes !== null && detail.request.notes.trim() !== "" ? (
                    <View style={styles.detailRow}>
                      <View style={styles.detailIcon}>
                        <Feather name="file-text" size={12} color={C.sub} />
                      </View>
                      <View style={styles.detailCopy}>
                        <Text style={styles.detailLabel}>NOTES</Text>
                        <Text style={styles.detailValue} numberOfLines={3}>
                          {detail.request.notes}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* --------------------------------------------------- timeline */}
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Request Progress</Text>
                </View>

                {timeline.map((step, index) => (
                  <View
                    key={step.title}
                    style={[
                      styles.timelineRow,
                      step.state === "current" && styles.timelineRowCurrent,
                      index === timeline.length - 1 && styles.timelineRowLast,
                    ]}
                  >
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.timelineDot,
                          step.state === "done" && styles.timelineDotDone,
                          step.state === "current" && styles.timelineDotCurrent,
                        ]}
                      >
                        {step.state === "done" ? (
                          <Feather name="check" size={10} color="#FFFFFF" />
                        ) : step.state === "current" ? (
                          <View style={styles.timelineDotPulse} />
                        ) : null}
                      </View>

                      {index < timeline.length - 1 ? (
                        <View
                          style={[
                            styles.timelineLine,
                            step.state === "done" && styles.timelineLineDone,
                          ]}
                        />
                      ) : null}
                    </View>

                    <View style={styles.timelineCopy}>
                      <View style={styles.timelineTitleRow}>
                        <Text
                          style={[
                            styles.timelineTitle,
                            step.state === "current" && styles.timelineTitleCurrent,
                          ]}
                        >
                          {step.title}
                        </Text>

                        <View
                          style={[
                            styles.stepChip,
                            step.state === "done" && styles.stepChipDone,
                            step.state === "current" && styles.stepChipCurrent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.stepChipText,
                              step.state === "done" && styles.stepChipTextDone,
                              step.state === "current" && styles.stepChipTextCurrent,
                            ]}
                          >
                            {step.state === "done"
                              ? "Completed"
                              : step.state === "current"
                                ? detail.request.status === "cancelled"
                                  ? "Cancelled"
                                  : "Current"
                                : "Pending"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.timelineDescription}>{step.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* ---------------------------------------------- status callout */}
              {callout !== null ? (
                <View
                  style={[
                    styles.card,
                    callout.tone === "pending" && styles.calloutPending,
                    callout.tone === "good" && styles.calloutGood,
                    callout.tone === "bad" && styles.calloutBad,
                  ]}
                >
                  <View style={styles.calloutTopRow}>
                    <View style={styles.calloutIcon}>
                      <Feather name={callout.icon} size={13} color={C.green} />
                    </View>
                    <Text style={styles.calloutHeading}>{callout.title}</Text>
                  </View>

                  <Text style={styles.calloutMessage}>{callout.message}</Text>
                </View>
              ) : null}

              {/* ------------------------------------------- delivery facility */}
              <Pressable
                accessibilityRole="button"
                onPress={openMaps}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Delivery Facility</Text>
                  {statusMeta !== undefined ? (
                    <Feather name={statusMeta.icon} size={13} color={statusMeta.color} />
                  ) : null}
                </View>

                <Text style={styles.facilityName}>{detail.request.hospital}</Text>
                {wardLine !== null ? <Text style={styles.facilityLine}>{wardLine}</Text> : null}
                <Text style={styles.facilityLine}>{detail.request.district ?? "Sri Lanka"}</Text>

                <View style={styles.facilityButton}>
                  <Feather name="map-pin" size={10} color={C.blue} />
                  <Text style={styles.facilityButtonText}>View Hospital</Text>
                </View>
              </Pressable>

              {/* ------------------------------------------------- need help */}
              <View style={[styles.card, styles.helpCard]}>
                <View style={styles.helpRow}>
                  <View style={styles.helpIcon}>
                    <Feather name="help-circle" size={13} color={C.blue} />
                  </View>

                  <View style={styles.helpCopy}>
                    <Text style={styles.helpTitle}>Need Help?</Text>
                    <Text style={styles.helpText}>
                      If anything changes, call the contact listed on this request before
                      anything else.
                    </Text>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void callContact();
                  }}
                  style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}
                >
                  <Feather name="phone" size={11} color={C.primary} />
                  <Text style={styles.helpButtonText}>
                    Call {detail.request.contactName}
                  </Text>
                </Pressable>
              </View>

              {/* --------------------------------------------------- actions */}
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void pullRefresh();
                }}
                style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
              >
                <View style={styles.primaryActionRow}>
                  <Feather name="refresh-cw" size={12} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>Refresh Status</Text>
                </View>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    void callContact();
                  }}
                  style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
                >
                  <Feather name="phone" size={11} color={C.blue} />
                  <Text style={styles.secondaryActionText}>Call Contact</Text>
                </Pressable>

                {canCancel ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={confirmCancelRequest}
                    style={({ pressed }) => [styles.dangerAction, pressed && styles.pressed]}
                  >
                    <Feather name="x-circle" size={11} color={C.primary} />
                    <Text style={styles.dangerActionText}>Cancel Request</Text>
                  </Pressable>
                ) : null}
              </View>

              <Text style={styles.autoRefreshNote}>
                Status refreshes automatically every 15 seconds while the request is
                pending or verified.
              </Text>
            </>
          )}
        </AsyncState>

        {showEmptyAction ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push(ROUTES.emergencyRequest)}
            style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
          >
            <Text style={styles.primaryActionText}>Raise an Emergency Request</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "alerts", label: "Alerts", icon: "bell" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="requests"
        onSelect={goTab}
      />

      {/* Shared info sheet for contacts, cancel results and refresh failures. */}
      <Modal
        visible={info !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfo(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setInfo(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {info?.title ?? ""}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={6}
                onPress={() => setInfo(null)}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              >
                <Feather name="x" size={14} color={C.sub} />
              </Pressable>
            </View>

            {(info?.lines ?? []).map((line, index) => (
              <Text key={`${index}-${line}`} style={styles.modalLine}>
                {line}
              </Text>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => setInfo(null)}
              style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/**
 * Status-specific headline under the timeline. Built only from fields the
 * API returns — a cancelled or unverifiable request says so plainly instead
 * of implying donors are on the way.
 */
function calloutFor(request: EmergencyRequest, groups: BloodGroup[]): Callout {
  if (request.status === "pending") {
    return {
      icon: "clock",
      title: "Awaiting Hospital Verification",
      message: `Submitted ${timeAgo(request.createdAt)}. The hospital verifies requests at the desk; this screen refreshes every 15 seconds while you wait.`,
      tone: "pending",
    };
  }

  if (request.status === "verified") {
    return {
      icon: "check-circle",
      title: "Verified — Donors Notified",
      message:
        groups.length > 0
          ? `${groups.length} compatible donor group${groups.length === 1 ? "" : "s"} can respond: ${groups.join(", ")}.`
          : "The request is verified, but no compatible donor groups are available right now.",
      tone: "good",
    };
  }

  if (request.status === "fulfilled") {
    return {
      icon: "check-circle",
      title: "Donation Completed",
      message: `The hospital confirmed fulfilment ${timeAgo(request.updatedAt)}. Thank you.`,
      tone: "good",
    };
  }

  return {
    icon: "x-circle",
    title: "Request Cancelled",
    message: `Withdrawn ${timeAgo(request.updatedAt)}. Donors will no longer be notified.`,
    tone: "bad",
  };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  pressed: {
    opacity: 0.7,
  },

  /* ------------------------------------------------------------ header */
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.wash,
  },

  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.wash,
    borderWidth: 1,
    borderColor: C.border,
  },

  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  /* ------------------------------------------------------------- scroll */
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
  },

  subtitle: {
    fontSize: 9.5,
    lineHeight: 14,
    color: C.sub,
    marginBottom: 9,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    padding: 11,
    marginBottom: 9,
    shadowColor: C.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7,
  },

  sectionTitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: C.text,
    flexShrink: 1,
  },

  /* ---------------------------------------------- active request strip */
  stripRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  stripCopy: {
    gap: 2,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },

  stripLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: C.primary,
  },

  stripId: {
    fontSize: 13.5,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
  },

  urgencyBadge: {
    backgroundColor: C.paleRed,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F6D2D7",
    paddingHorizontal: 7,
    paddingVertical: 3,
  },

  urgencyBadgeText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: C.primary,
  },

  /* ----------------------------------------------------- main status */
  statusTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  statusBloodBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },

  statusBloodBadgeText: {
    fontSize: 12.5,
    lineHeight: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  statusCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },

  statusUnits: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
  },

  statusHospital: {
    fontSize: 9,
    lineHeight: 12,
    color: C.sub,
  },

  statusWard: {
    fontSize: 8,
    lineHeight: 11,
    color: C.muted,
  },

  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
    maxWidth: 96,
  },

  statusChipText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    flexShrink: 1,
  },

  /* ------------------------------------- compatible donor group chips */
  responsesCard: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  responsesTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 2,
  },

  responsesCount: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    flexShrink: 1,
  },

  responsesNumber: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: C.text,
  },

  responsesCaption: {
    fontSize: 9,
    lineHeight: 12,
    color: C.sub,
    flexShrink: 1,
  },

  groupChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginTop: 8,
  },

  groupChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  groupChipText: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: "700",
    color: C.blue,
  },

  /* ------------------------------------------------- delivery area map */
  mapFrame: {
    borderRadius: 14,
    overflow: "hidden",
  },

  mapCaption: {
    fontSize: 7.5,
    lineHeight: 10,
    color: C.muted,
    marginTop: 4,
    textAlign: "center",
  },

  /* ------------------------------------------------------ request details */
  detailList: {
    gap: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detailIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.wash,
    borderWidth: 1,
    borderColor: C.border,
  },

  detailCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },

  detailLabel: {
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: C.muted,
  },

  detailValue: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: C.text,
  },

  /* ------------------------------------------------------ timeline */
  timelineRow: {
    flexDirection: "row",
    gap: 9,
  },

  timelineRowCurrent: {
    backgroundColor: C.paleRed,
    borderRadius: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: C.primary,
    marginLeft: -6,
    paddingLeft: 6,
    paddingRight: 6,
    paddingVertical: 5,
    marginVertical: 2,
  },

  timelineRowLast: {
    paddingBottom: 0,
  },

  timelineRail: {
    width: 18,
    alignItems: "center",
  },

  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.wash,
    borderWidth: 1.5,
    borderColor: C.border,
    marginTop: 1,
  },

  timelineDotDone: {
    backgroundColor: C.green,
    borderColor: C.green,
  },

  timelineDotCurrent: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },

  timelineDotPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 22,
    backgroundColor: C.border,
    marginVertical: 2,
  },

  timelineLineDone: {
    backgroundColor: "#ABEFC6",
  },

  timelineCopy: {
    flex: 1,
    gap: 2,
    paddingBottom: 10,
    minWidth: 0,
  },

  timelineTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  timelineTitle: {
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "600",
    color: C.sub,
    flexShrink: 1,
  },

  timelineTitleCurrent: {
    fontWeight: "700",
    color: C.text,
  },

  stepChip: {
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    backgroundColor: C.wash,
  },

  stepChipDone: {
    backgroundColor: C.paleGreen,
  },

  stepChipCurrent: {
    backgroundColor: C.primary,
  },

  stepChipText: {
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: C.muted,
  },

  stepChipTextDone: {
    color: C.green,
  },

  stepChipTextCurrent: {
    color: "#FFFFFF",
  },

  timelineDescription: {
    fontSize: 8,
    lineHeight: 11,
    color: C.muted,
  },

  /* ---------------------------------------------- status callout */
  calloutPending: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  calloutGood: {
    backgroundColor: C.paleGreen,
    borderColor: "#C9EEDB",
  },

  calloutBad: {
    backgroundColor: C.paleRed,
    borderColor: "#F6D2D7",
  },

  calloutTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  calloutIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  calloutHeading: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },

  calloutMessage: {
    fontSize: 8.5,
    lineHeight: 12,
    color: C.sub,
    marginTop: 6,
  },

  /* ------------------------------------------- delivery facility */
  facilityName: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "700",
    color: C.text,
  },

  facilityLine: {
    fontSize: 8.5,
    lineHeight: 12,
    color: C.sub,
    marginTop: 1,
  },

  facilityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.paleBlue,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    marginTop: 8,
  },

  facilityButtonText: {
    fontSize: 9.5,
    lineHeight: 12,
    fontWeight: "700",
    color: C.blue,
  },

  /* ------------------------------------------------- need help */
  helpCard: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  helpRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  helpIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  helpCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },

  helpTitle: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    color: C.text,
  },

  helpText: {
    fontSize: 8.5,
    lineHeight: 12,
    color: C.sub,
  },

  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.paleRed,
    borderWidth: 1,
    borderColor: "#F6D2D7",
    marginTop: 8,
  },

  helpButtonText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    color: C.primary,
  },

  /* --------------------------------------------------- actions */
  primaryAction: {
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    marginTop: 3,
    marginBottom: 8,
  },

  primaryActionPressed: {
    backgroundColor: C.dark,
    opacity: 1,
  },

  primaryActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  primaryActionText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "#FFFFFF",
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },

  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 9,
    backgroundColor: C.paleBlue,
    borderWidth: 1,
    borderColor: "#D6E3FF",
  },

  secondaryActionText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.blue,
  },

  dangerAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 9,
    backgroundColor: C.paleRed,
    borderWidth: 1,
    borderColor: "#F6D2D7",
  },

  dangerActionText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.primary,
  },

  autoRefreshNote: {
    fontSize: 7.5,
    lineHeight: 11,
    color: C.muted,
    textAlign: "center",
  },

  /* ------------------------------------------------------------ modal */
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    paddingHorizontal: 32,
  },

  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 7,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  modalTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
    flexShrink: 1,
  },

  modalClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.wash,
  },

  modalLine: {
    fontSize: 10,
    lineHeight: 15,
    color: C.sub,
  },

  modalButton: {
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.paleBlue,
    marginTop: 3,
  },

  modalButtonText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    color: C.text,
  },
});
