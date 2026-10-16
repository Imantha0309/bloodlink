import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { REQUEST_STATUS_META } from "@/constants/emergency";
import { TRANSMISSION, type TransmissionMetric } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import { getRequestCandidates, type RequestCandidates } from "@/services/hospital";
import {
  getEmergencyRequest,
  updateEmergencyRequestStatus,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";
import { referenceFor } from "@/utils/reference";

const METRIC_TONE = {
  positive: Surface.online,
  neutral: Blood.primary,
} as const;

/**
 * Request status and donor counts are polled from the BloodLink API while the
 * screen is open. This screen reports persisted state instead of simulating a
 * delivery pipeline.
 */
export default function HospitalTransmissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const params = useLocalSearchParams<{
    requestId?: string;
  }>();

  const [candidates, setCandidates] = useState<RequestCandidates | null>(null);
  const [request, setRequest] = useState<EmergencyRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const requestId = params.requestId ?? null;

  async function handleVerifyRequisition() {
    if (requestId === null || isVerifying) return;
    setIsVerifying(true);
    setVerifyError(null);
    try {
      const updated = await updateEmergencyRequestStatus(requestId, "verified");
      haptics.success();
      setRequest(updated);
      setCandidates((prev) => (prev ? { ...prev, status: "verified" } : null));
    } catch (caught) {
      haptics.error();
      setVerifyError(apiErrorMessage(caught));
    } finally {
      setIsVerifying(false);
    }
  }

  // Refresh the saved request and its counts while this screen is open.
  useEffect(() => {
    if (requestId === null) {
      return;
    }

    const currentRequestId = requestId;
    let cancelled = false;

    async function refresh() {
      try {
        const [nextCandidates, nextRequest] = await Promise.all([
          getRequestCandidates(currentRequestId),
          getEmergencyRequest(currentRequestId),
        ]);
        if (!cancelled) {
          setCandidates(nextCandidates);
          setRequest(nextRequest.request);
          setError(null);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(apiErrorMessage(caught));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void refresh();
    const interval = setInterval(() => void refresh(), 10_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [requestId]);

  const metrics: TransmissionMetric[] = [
    {
      key: "available",
      label: "Compatible donors available",
      value: candidates !== null ? String(candidates.compatibleAvailable) : "—",
      icon: "bell",
      tone: "positive",
    },
    {
      key: "ack",
      label: "Acknowledged",
      value: candidates !== null ? String(candidates.accepted) : "—",
      icon: "check-circle",
      tone: "positive",
    },
    {
      key: "transit",
      label: "Currently en route",
      value: candidates !== null ? String(candidates.enRoute) : "—",
      icon: "navigation",
      tone: "neutral",
    },
  ];

  const statusTitle = candidates
    ? REQUEST_STATUS_META[candidates.status].label
    : requestId === null
      ? "Request reference missing"
      : isLoading
        ? "Loading requisition status"
        : "Status unavailable";
  const statusDetail = error
    ? `Unable to refresh request data: ${error}`
    : candidates
      ? candidates.status === "pending"
        ? "This request is saved and awaiting hospital or administrator verification."
        : candidates.status === "verified"
          ? "The request is verified. Compatible available donors can respond."
          : candidates.status === "fulfilled"
            ? "The request has been fulfilled."
            : "The request has been cancelled."
      : requestId === null
        ? "Open this screen from a saved requisition."
        : "Waiting for request data.";
  const component = request?.notes?.startsWith("Component: ")
    ? request.notes.slice("Component: ".length)
    : "—";
  const bloodGroup = candidates?.bloodGroup ?? request?.bloodGroup ?? "—";

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

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

          <Text style={styles.title} numberOfLines={1}>
            {TRANSMISSION.title}
          </Text>

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

        {/* ================= LIVE STATUS ================= */}

        <View style={styles.statusCard}>
          <View style={styles.statusHead}>
            <View style={styles.statusIcon}>
              <Feather name="radio" size={18} color={Blood.primary} />
            </View>

            <View style={styles.statusText}>
              <Text style={styles.statusTitle} accessibilityRole="header">
                {statusTitle}
              </Text>

              <Text style={styles.statusDetail}>{statusDetail}</Text>
            </View>

            <View style={styles.livePill}>
              <View style={styles.liveDot} pointerEvents="none" />
              <Text style={styles.liveText}>{TRANSMISSION.livePill}</Text>
            </View>
          </View>

        </View>

        {/* ================= TELEMETRY ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{TRANSMISSION.metricsTitle}</Text>

          <View style={styles.metricRow}>
            {metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </View>
        </View>

        {/* ================= PAYLOAD ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{TRANSMISSION.summaryTitle}</Text>

          <View style={styles.payloadRow}>
            <View style={styles.payloadCell}>
              <Text style={styles.payloadLabel}>Blood group</Text>
              <Text style={styles.payloadValue}>{bloodGroup}</Text>
            </View>

            <View style={styles.payloadCell}>
              <Text style={styles.payloadLabel}>Component</Text>
              <Text style={styles.payloadValue} numberOfLines={1}>
                {component}
              </Text>
            </View>

            <View style={styles.payloadCell}>
              <Text style={styles.payloadLabel}>Units</Text>
              <Text style={styles.payloadValue}>
                {request ? `${request.units} ${TRANSMISSION.unitsSuffix}` : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.reference}>
            <Feather name="lock" size={13} color={Surface.textSecondary} />

            <View style={styles.referenceText}>
              <Text style={styles.referenceLabel}>{TRANSMISSION.referenceLabel}</Text>
              <Text style={styles.referenceValue} selectable>
                {requestId !== null ? `#REQ-${referenceFor(requestId)}` : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= ACTIONS ================= */}

        {verifyError ? (
          <View style={styles.verifyErrorBox}>
            <Feather name="alert-triangle" size={14} color={Blood.primary} />
            <Text style={styles.verifyErrorText}>{verifyError}</Text>
          </View>
        ) : null}

        {candidates?.status === "pending" ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Verify and broadcast requisition to donors"
            disabled={isVerifying}
            onPress={() => void handleVerifyRequisition()}
            style={({ pressed }) => [styles.verifyCta, pressed && styles.pressed]}
          >
            <Feather name="radio" size={17} color={Surface.onPrimary} />

            <Text style={styles.ctaText} numberOfLines={1}>
              {isVerifying ? "Broadcasting..." : "Verify & Broadcast to Donors"}
            </Text>

            <Feather name="arrow-right" size={16} color={Surface.onPrimary} />
          </Pressable>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TRANSMISSION.trackCta}
          onPress={() => {
            router.push(ROUTES.hospitalRequests);
          }}
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        >
          <Feather name="inbox" size={17} color={Surface.onPrimary} />

          <Text style={styles.ctaText} numberOfLines={1}>
            {TRANSMISSION.trackCta}
          </Text>

          <Feather name="arrow-right" size={16} color={Surface.onPrimary} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={TRANSMISSION.homeCta}
          onPress={() => {
            router.replace(ROLE_HOME.hospital);
          }}
          style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}
        >
          <Feather name="home" size={16} color={Blood.primary} />

          <Text style={styles.secondaryText}>{TRANSMISSION.homeCta}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

/** One telemetry figure; the positive tone turns the value green. */
function MetricCard({ metric }: { metric: TransmissionMetric }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel} numberOfLines={2}>
          {metric.label}
        </Text>

        <Feather name={metric.icon} size={13} color={Surface.textSecondary} />
      </View>

      <Text
        style={[
          styles.metricValue,
          metric.tone === "positive" && styles.metricValuePositive,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {metric.value}
      </Text>

      <View style={styles.metricFoot}>
        <View
          style={[
            styles.metricDot,
            { backgroundColor: METRIC_TONE[metric.tone] },
          ]}
        />

        <Text style={styles.metricState}>
          {metric.tone === "positive" ? "Live" : "Tracking"}
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

  backButtonPressed: {
    backgroundColor: Surface.border,
  },

  title: {
    flex: 1,
    ...Typography.cardTitle,
    color: Surface.text,
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

  /* ================= LIVE STATUS ================= */

  statusCard: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  statusHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  statusIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  statusText: {
    flex: 1,
    gap: 2,
  },

  statusTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  statusDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
  },

  liveText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textSecondary,
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

  cardTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  pressed: {
    opacity: 0.75,
  },

  /* ================= TELEMETRY ================= */

  metricRow: {
    flexDirection: "row",
    gap: 10,
  },

  metricCard: {
    flex: 1,
    gap: 6,
    padding: 11,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.background,
  },

  metricHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 5,
  },

  metricLabel: {
    flex: 1,
    ...Typography.small,
    fontSize: 10.5,
    fontWeight: "600",
    color: Surface.text,
  },

  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Surface.text,
  },

  metricValuePositive: {
    color: Surface.online,
  },

  metricFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metricDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.full,
  },

  metricState: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textMuted,
  },

  /* ================= PAYLOAD ================= */

  payloadRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  payloadCell: {
    flexGrow: 1,
    minWidth: "45%",
    gap: 2,
    padding: 10,
    borderRadius: Radius.sm,
    backgroundColor: Surface.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  payloadLabel: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  payloadValue: {
    ...Typography.label,
    color: Surface.text,
  },

  reference: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  referenceText: {
    flex: 1,
    gap: 2,
  },

  referenceLabel: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  referenceValue: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  /* ================= ACTIONS ================= */

  verifyCta: {
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

  verifyErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  verifyErrorText: {
    flex: 1,
    ...Typography.small,
    color: Blood.primary,
    fontWeight: "600",
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.text,
    ...Elevation.button,
  },

  ctaText: {
    flexShrink: 1,
    ...Typography.button,
    color: Surface.onPrimary,
  },

  secondary: {
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

  secondaryText: {
    ...Typography.button,
    color: Blood.primary,
  },
});
