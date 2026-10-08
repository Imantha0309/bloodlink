import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import {
  CREATE_REQUEST,
  DEFAULT_REQUEST,
  REQUEST_COMPONENTS,
  TRANSMISSION,
  TRANSMISSION_METRICS,
  TRANSMISSION_STEPS,
  type RequestComponent,
  type TransmissionMetric,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/** Cadence of the pipeline advancing one stage. */
const STEP_INTERVAL_MS = 1300;

const METRIC_TONE = {
  positive: Surface.online,
  neutral: Blood.primary,
} as const;

/**
 * Broadcast progress for a requisition just submitted from the form.
 *
 * The relay is staged: each pipeline step lights up in turn so the station can
 * see the signal leave the vault and reach the donor network. Numbers come from
 * the hospital fixtures until the API reports broadcast telemetry.
 */
export default function HospitalTransmissionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const params = useLocalSearchParams<{
    bloodGroup?: string;
    component?: string;
    units?: string;
    volume?: string;
  }>();

  const [stepIndex, setStepIndex] = useState(0);
  const stepCount = TRANSMISSION_STEPS.length;
  const isComplete = stepIndex >= stepCount - 1;

  // The pipeline advances on its own until the last stage is lit.
  useEffect(() => {
    if (isComplete) {
      return;
    }

    const timer = setTimeout(() => {
      setStepIndex((current) => Math.min(stepCount - 1, current + 1));
    }, STEP_INTERVAL_MS);

    return () => clearTimeout(timer);
  }, [isComplete, stepCount]);

  // Deep links can land here without a payload — fall back to the form's seed.
  const bloodGroup = (
    BLOOD_GROUPS as readonly string[]
  ).includes(params.bloodGroup ?? "")
    ? (params.bloodGroup as BloodGroup)
    : DEFAULT_REQUEST.bloodGroup;

  const component = (
    REQUEST_COMPONENTS as readonly string[]
  ).includes(params.component ?? "")
    ? (params.component as RequestComponent)
    : DEFAULT_REQUEST.component;

  const units = Number.parseInt(params.units ?? "", 10) || DEFAULT_REQUEST.units;
  const volume = Number.parseInt(params.volume ?? "", 10) || units * CREATE_REQUEST.mlPerUnit;

  const coverage = Math.round(((stepIndex + 1) / stepCount) * 100);

  const statusTitle = isComplete
    ? TRANSMISSION.completeTitle
    : stepIndex === 0
      ? TRANSMISSION.queuedTitle
      : TRANSMISSION.statusTitle;

  const statusDetail = isComplete
    ? TRANSMISSION.completeDetail
    : stepIndex === 0
      ? TRANSMISSION.queuedDetail
      : TRANSMISSION.statusDetail;

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
              <View
                style={[styles.liveDot, isComplete && styles.liveDotDone]}
                pointerEvents="none"
              />

              <Text style={styles.liveText}>
                {isComplete ? "Delivered" : TRANSMISSION.livePill}
              </Text>
            </View>
          </View>

          <View style={styles.coverageRow}>
            <Text style={styles.coverageLabel}>{TRANSMISSION.coverageLabel}</Text>

            <Text style={styles.coverageValue}>{coverage}%</Text>
          </View>

          <View
            style={styles.track}
            accessibilityRole="progressbar"
            accessibilityLabel={TRANSMISSION.coverageLabel}
            accessibilityValue={{ min: 0, max: 100, now: coverage }}
          >
            <View style={[styles.trackFill, { width: `${coverage}%` }]} />
          </View>
        </View>

        {/* ================= PIPELINE ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{TRANSMISSION.stepsTitle}</Text>

          <View style={styles.steps}>
            {TRANSMISSION_STEPS.map((step, index) => {
              const isDone = index < stepIndex;
              const isActive = index === stepIndex;

              return (
                <View key={step.id} style={styles.step}>
                  <View
                    style={[
                      styles.stepBadge,
                      isDone && styles.stepBadgeDone,
                      isActive && styles.stepBadgeActive,
                    ]}
                  >
                    <Feather
                      name={isDone ? "check" : step.icon}
                      size={13}
                      color={
                        isDone || isActive ? Surface.onPrimary : Surface.textMuted
                      }
                    />
                  </View>

                  <View style={styles.stepText}>
                    <Text
                      style={[
                        styles.stepTitle,
                        isActive && styles.stepTitleActive,
                        !isDone && !isActive && styles.stepTitlePending,
                      ]}
                    >
                      {step.title}
                    </Text>

                    <Text style={styles.stepDetail}>{step.detail}</Text>
                  </View>

                  {isActive && !isComplete ? (
                    <Feather name="chevrons-right" size={15} color={Blood.primary} />
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* ================= TELEMETRY ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{TRANSMISSION.metricsTitle}</Text>

          <View style={styles.metricRow}>
            {TRANSMISSION_METRICS.map((metric) => (
              <MetricCard key={metric.key} metric={metric} />
            ))}
          </View>
        </View>

        {/* ================= PAYLOAD ================= */}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{TRANSMISSION.summaryTitle}</Text>

          <View style={styles.payloadRow}>
            <View style={styles.payloadCell}>
              <Text style={styles.payloadLabel}>Phenotype</Text>
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
                {units} {TRANSMISSION.unitsSuffix}
              </Text>
            </View>

            <View style={styles.payloadCell}>
              <Text style={styles.payloadLabel}>Volume</Text>
              <Text style={styles.payloadValue}>{volume.toLocaleString("en-US")} mL</Text>
            </View>
          </View>

          <View style={styles.reference}>
            <Feather name="lock" size={13} color={Surface.textSecondary} />

            <View style={styles.referenceText}>
              <Text style={styles.referenceLabel}>{TRANSMISSION.referenceLabel}</Text>
              <Text style={styles.referenceValue} selectable>
                {CREATE_REQUEST.complianceReference}
              </Text>
            </View>
          </View>
        </View>

        {/* ================= ACTIONS ================= */}

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

  liveDotDone: {
    backgroundColor: Blood.primary,
  },

  liveText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textSecondary,
  },

  coverageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  coverageLabel: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  coverageValue: {
    ...Typography.label,
    color: Blood.primary,
  },

  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
    overflow: "hidden",
  },

  trackFill: {
    height: "100%",
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
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

  /* ================= PIPELINE ================= */

  steps: {
    gap: 12,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  stepBadgeDone: {
    backgroundColor: Surface.online,
  },

  stepBadgeActive: {
    backgroundColor: Blood.primary,
  },

  stepText: {
    flex: 1,
    gap: 1,
  },

  stepTitle: {
    ...Typography.label,
    color: Surface.text,
  },

  stepTitleActive: {
    color: Blood.primary,
  },

  stepTitlePending: {
    color: Surface.textSecondary,
  },

  stepDetail: {
    ...Typography.small,
    color: Surface.textMuted,
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

  cta: {
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
