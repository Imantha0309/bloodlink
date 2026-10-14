import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HospitalHeader } from "@/components/hospital/hospital-header";
import { QrCodeScanner } from "@/components/qr-code-scanner";
import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { DONATION_STAGE_META } from "@/constants/emergency";
import { VERIFY_DONOR } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  getRequestWorkflow,
  submitScreening,
  type RequestWorkflow,
} from "@/services/hospital";
import { verifyDonorCheckIn } from "@/services/donors/donor-workflow";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";
import { referenceFor } from "@/utils/reference";
import { timeAgo } from "@/utils/time";

/** Loading placeholder for the workflow screen. */
function WorkflowSkeleton() {
  return (
    <View style={styles.skeletonBlock}>
      <SkeletonCard lines={2} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
    </View>
  );
}

/**
 * Donor arrival desk.
 *
 * Loads the real workflow for one requisition: who accepted, their stage, any
 * recorded screening and the running extraction. Staff record vitals here
 * (`submitScreening`) and approve the donor onward to the collection suite;
 * a deferral is the same record with `eligible: false`.
 */
export default function HospitalVerifyDonorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId ?? null;

  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [temperature, setTemperature] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [pulse, setPulse] = useState("");
  const [hemoglobin, setHemoglobin] = useState("");
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bedLabel, setBedLabel] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [ticketText, setTicketText] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Derived (not stored): a cold open without a request id shows the error
  // banner without a setState round-trip inside the effect.
  const paramError =
    requestId === null
      ? "Open this desk from the requisition board — no request was passed."
      : null;

  // Initial load: state only changes inside the promise callbacks, so the
  // effect body itself never triggers a cascading render.
  useEffect(() => {
    if (requestId === null) {
      return;
    }

    let cancelled = false;

    getRequestWorkflow(requestId)
      .then((next) => {
        if (!cancelled) {
          setWorkflow(next);
          setError(null);
        }
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
  }, [requestId]);

  /** Retry — invoked from event handlers only. */
  async function load() {
    if (requestId === null) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      setWorkflow(await getRequestWorkflow(requestId));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCheckIn(rawTicket: string) {
    const [prefix, scannedRequestId, token, ...extra] = rawTicket.trim().split(":");

    setCheckInError(null);

    if (
      prefix !== "bloodlink-intake" ||
      !scannedRequestId ||
      !token ||
      extra.length > 0
    ) {
      setCheckInError("This is not a valid BloodLink intake pass.");
      return;
    }

    if (requestId !== null && scannedRequestId !== requestId) {
      setCheckInError("This pass belongs to a different requisition.");
      return;
    }

    setIsVerifying(true);

    try {
      await verifyDonorCheckIn(scannedRequestId, token);
      setWorkflow(await getRequestWorkflow(scannedRequestId));
      setTicketText("");
      setIsScanning(false);
      haptics.success();
    } catch (caught) {
      setCheckInError(apiErrorMessage(caught));
      haptics.error();
    } finally {
      setIsVerifying(false);
    }
  }

  async function recordScreening(eligible: boolean) {
    if (requestId === null || workflow === null) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const screening = await submitScreening(requestId, {
        temperature: temperature.trim(),
        bloodPressure: bloodPressure.trim(),
        pulse: pulse.trim(),
        hemoglobin: hemoglobin.trim(),
        eligible,
        bedLabel: bedLabel.trim() || undefined,
      });

      haptics.success();
      setWorkflow({ ...workflow, screening });
    } catch (caught) {
      haptics.error();
      setSubmitError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  function approve() {
    if (requestId === null) {
      return;
    }

    haptics.medium();
    router.push({
      pathname: ROUTES.hospitalExtractionSession,
      params: { requestId },
    });
  }

  const request = workflow?.request ?? null;
  const donor = workflow?.donor ?? null;
  const response = workflow?.response ?? null;
  const screening = workflow?.screening ?? null;
  const hasDonor = donor !== null && response !== null;
  const hasArrived = response?.stage === "arrived";
  const isCleared = screening?.eligible === true;
  const canApprove = hasDonor && screening !== null && isCleared;
  const stage = response !== null ? DONATION_STAGE_META[response.stage] : null;

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

        <AsyncState
          isLoading={paramError === null && isLoading}
          error={paramError ?? error}
          skeleton={<WorkflowSkeleton />}
          onRetry={() => {
            void load();
          }}
        >
          {workflow === null || request === null ? null : (
            <>
              {/* ================= TITLE ================= */}

              <View style={styles.titleRow}>
                <View style={styles.titleText}>
                  <Text style={styles.title} accessibilityRole="header">
                    {VERIFY_DONOR.title}
                  </Text>

                  <Text style={styles.subtitle} numberOfLines={2}>
                    {`#REQ-${referenceFor(request.id)} • ${request.hospital}`}
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
                      {response?.stage === "arrived" ? "DONOR ARRIVED" : "AWAITING CHECK-IN"}
                    </Text>

                    <Feather
                      name={response?.stage === "arrived" ? "check-circle" : "clock"}
                      size={15}
                      color={response?.stage === "arrived" ? Surface.online : Surface.textMuted}
                    />
                  </View>

                  {Platform.OS !== "web" ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={VERIFY_DONOR.scanLabel}
                      hitSlop={4}
                      onPress={() => {
                        setCheckInError(null);
                        setIsScanning(true);
                      }}
                      style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
                    >
                      <Feather name="maximize" size={18} color={Surface.onPrimary} />
                    </Pressable>
                  ) : null}
                </View>

                {isScanning && response?.stage === "en_route" ? (
                  <QrCodeScanner
                    onScanned={(value) => {
                      void handleCheckIn(value);
                    }}
                    onCancel={() => setIsScanning(false)}
                  />
                ) : null}

                <View style={styles.form}>
                  <TextField
                    label="Intake pass code"
                    value={ticketText}
                    onChangeText={setTicketText}
                    placeholder="bloodlink-intake:request-id:token"
                    size="dense"
                    autoCapitalize="none"
                  />
                  {checkInError ? (
                    <Text style={styles.submitErrorText}>{checkInError}</Text>
                  ) : null}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Verify donor intake pass"
                    disabled={
                      isVerifying ||
                      ticketText.trim() === "" ||
                      response?.stage !== "en_route"
                    }
                    onPress={() => {
                      void handleCheckIn(ticketText);
                    }}
                    style={({ pressed }) => [
                      styles.record,
                      pressed && styles.pressed,
                      (isVerifying ||
                        ticketText.trim() === "" ||
                        response?.stage !== "en_route") &&
                        styles.recordDisabled,
                    ]}
                  >
                    <Feather name="shield" size={15} color={Surface.onPrimary} />
                    <Text style={styles.recordText}>
                      {isVerifying ? "Verifying…" : "Verify intake pass"}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* ================= DONOR MATCH ================= */}

              <View style={styles.card}>
                <View style={styles.matchRow}>
                  <View
                    style={[
                      styles.matchBadge,
                      !hasDonor && styles.matchBadgeWaiting,
                    ]}
                  >
                    <Feather
                      name={hasDonor ? "check" : "clock"}
                      size={13}
                      color={hasDonor ? Surface.onPrimary : Surface.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.matchLabel,
                      !hasDonor && styles.matchLabelWaiting,
                    ]}
                  >
                    {hasDonor ? VERIFY_DONOR.matchLabel : "AWAITING DONOR CHECK-IN"}
                  </Text>

                  <View style={styles.groupPill}>
                    <Text style={styles.groupText}>
                      {donor?.bloodGroup ?? request.bloodGroup}
                    </Text>
                  </View>
                </View>

                <View style={styles.nameRow}>
                  <Text style={styles.donorName} numberOfLines={2}>
                    {donor?.fullName ?? "No donor has accepted yet"}
                  </Text>

                  {stage !== null ? (
                    <View
                      style={[
                        styles.stageChip,
                        { backgroundColor: stage.background, borderColor: stage.border },
                      ]}
                    >
                      <Feather name={stage.icon} size={10} color={stage.color} />
                      <Text style={[styles.stageText, { color: stage.color }]}>
                        {stage.label}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personInitials}>
                      {initialsOf(donor?.fullName ?? request.patientName, "DR")}
                    </Text>
                  </View>

                  <View style={styles.personText}>
                    <View style={styles.refChip}>
                      <Text style={styles.refChipText}>
                        {`#REQ-${referenceFor(request.id)}`}
                      </Text>
                    </View>

                    <Text style={styles.personLine}>{`Patient ${request.patientName}`}</Text>

                    <Text style={styles.personMeta}>
                      {stage !== null
                        ? `${stage.label} • updated ${timeAgo(request.updatedAt)}`
                        : `${request.bloodGroup} • ${request.units} ${
                            request.units === 1 ? "unit" : "units"
                          }`}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ================= SCREENING ================= */}

              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{VERIFY_DONOR.screeningTitle}</Text>

                  <View
                    style={[
                      styles.clearedPill,
                      screening !== null && !isCleared && styles.clearedPillDeferred,
                    ]}
                  >
                    <Feather
                      name={screening === null ? "clock" : isCleared ? "check-circle" : "x"}
                      size={11}
                      color={screening === null || isCleared ? Surface.online : Blood.primary}
                    />
                    <Text
                      style={[
                        styles.clearedText,
                        screening !== null && !isCleared && styles.clearedTextDeferred,
                      ]}
                    >
                      {screening === null
                        ? "Awaiting vitals"
                        : isCleared
                          ? "Cleared"
                          : "Deferred"}
                    </Text>
                  </View>
                </View>

                {screening === null ? (
                  <View style={styles.form}>
                    <View style={styles.fieldGrid}>
                      <View style={styles.fieldCell}>
                        <TextField
                          label="Temperature"
                          value={temperature}
                          onChangeText={setTemperature}
                          placeholder="Enter measured temperature"
                          size="dense"
                          keyboardType="decimal-pad"
                        />
                      </View>

                      <View style={styles.fieldCell}>
                        <TextField
                          label="Blood pressure"
                          value={bloodPressure}
                          onChangeText={setBloodPressure}
                          placeholder="Enter measured blood pressure"
                          size="dense"
                        />
                      </View>

                      <View style={styles.fieldCell}>
                        <TextField
                          label="Pulse (bpm)"
                          value={pulse}
                          onChangeText={setPulse}
                          placeholder="Enter measured pulse"
                          size="dense"
                          keyboardType="number-pad"
                        />
                      </View>

                      <View style={styles.fieldCell}>
                        <TextField
                          label="Hemoglobin (g/dL)"
                          value={hemoglobin}
                          onChangeText={setHemoglobin}
                          placeholder="Enter measured hemoglobin"
                          size="dense"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityLabel="Identity and consent form confirmed"
                      accessibilityState={{ checked: consent }}
                      onPress={() => {
                        haptics.light();
                        setConsent((current) => !current);
                      }}
                      style={styles.consentRow}
                    >
                      <View style={[styles.checkbox, consent && styles.checkboxChecked]}>
                        {consent ? (
                          <Feather name="check" size={13} color={Surface.onPrimary} />
                        ) : null}
                      </View>

                      <Text style={styles.consentText}>
                        Identity matched and donor consent signed at the desk
                      </Text>
                    </Pressable>

                    {submitError !== null ? (
                      <View style={styles.submitError}>
                        <Feather name="alert-circle" size={14} color={Blood.primary} />
                        <Text style={styles.submitErrorText}>{submitError}</Text>
                      </View>
                    ) : null}

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Record screening and clear the donor"
                      accessibilityState={{
                        disabled: !consent || isSubmitting || !hasDonor || !hasArrived,
                      }}
                      disabled={!consent || isSubmitting || !hasDonor || !hasArrived}
                      onPress={() => {
                        void recordScreening(true);
                      }}
                      style={({ pressed }) => [
                        styles.record,
                        pressed && styles.pressed,
                        (!consent || isSubmitting || !hasDonor || !hasArrived) &&
                          styles.recordDisabled,
                      ]}
                    >
                      <Feather name="clipboard" size={16} color={Surface.onPrimary} />
                      <Text style={styles.recordText}>
                        {isSubmitting ? "Recording…" : "Record Screening & Clear Donor"}
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.screenList}>
                    <ScreeningRowCard
                      row={{
                        icon: "activity",
                        title: "Vitals Clearance",
                        detail: `${screening.temperature ?? "—"} • BP ${
                          screening.bloodPressure ?? "—"
                        } • pulse ${screening.pulse ?? "—"}`,
                        value: isCleared ? "Normal" : "Flagged",
                        tone: isCleared ? "positive" : "neutral",
                      }}
                    />

                    <ScreeningRowCard
                      row={{
                        icon: "droplet",
                        title: "Hemoglobin Rapid Test",
                        detail: "Recorded during donor screening",
                        value: `${screening.hemoglobin ?? "—"} g/dL`,
                        tone: "neutral",
                      }}
                    />

                    <ScreeningRowCard
                      row={{
                        icon: "file-text",
                        title: "Eligibility decision",
                        detail: "Recorded by hospital staff",
                        value: isCleared ? "Cleared" : "Deferred",
                        tone: "pill",
                      }}
                    />
                  </View>
                )}
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

                </View>

                <TextField
                  label="Assigned bed / bay (optional)"
                  value={bedLabel}
                  onChangeText={setBedLabel}
                  placeholder="Enter the assigned bed or bay"
                  size="dense"
                />
              </View>

              {/* ================= DECISIONS ================= */}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={VERIFY_DONOR.approveCta}
                accessibilityHint="Opens the collection telemetry for this donor"
                accessibilityState={{ disabled: !canApprove }}
                disabled={!canApprove}
                onPress={approve}
                style={({ pressed }) => [
                  styles.approve,
                  pressed && styles.pressed,
                  !canApprove && styles.approveDisabled,
                ]}
              >
                <Feather name="check-circle" size={17} color={Surface.onPrimary} />

                <Text style={styles.approveText} numberOfLines={1}>
                  {VERIFY_DONOR.approveCta}
                </Text>
              </Pressable>

              {screening === null && hasDonor ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={VERIFY_DONOR.deferCta}
                  accessibilityState={{ disabled: isSubmitting || !hasArrived }}
                  disabled={isSubmitting || !hasArrived}
                  onPress={() => {
                    void recordScreening(false);
                  }}
                  style={({ pressed }) => [styles.defer, pressed && styles.pressed]}
                >
                  <Feather name="flag" size={16} color={Blood.primary} />

                  <Text style={styles.deferText}>{VERIFY_DONOR.deferCta}</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </AsyncState>
      </ScrollView>
    </View>
  );
}

type ScreeningRow = {
  icon: "activity" | "droplet" | "file-text";
  title: string;
  detail: string;
  value: string;
  tone: "positive" | "neutral" | "pill";
};

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

  skeletonBlock: {
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

  /* ================= DONOR MATCH ================= */

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

  matchBadgeWaiting: {
    backgroundColor: Surface.iconWash,
  },

  matchLabel: {
    flex: 1,
    ...Typography.micro,
    color: Surface.online,
  },

  matchLabelWaiting: {
    color: Surface.textMuted,
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

  stageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 4,
  },

  stageText: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "700",
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

  clearedPillDeferred: {
    backgroundColor: Surface.softRed,
    borderColor: Surface.softRedBorder,
  },

  clearedText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.online,
  },

  clearedTextDeferred: {
    color: Blood.primary,
  },

  form: {
    gap: 12,
  },

  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  fieldCell: {
    flexGrow: 1,
    minWidth: "45%",
  },

  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 32,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm - 3,
    borderWidth: 1.5,
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  consentText: {
    flex: 1,
    ...Typography.small,
    color: Surface.textSecondary,
  },

  submitError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  submitErrorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  record: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.text,
  },

  recordText: {
    ...Typography.button,
    fontSize: 13,
    color: Surface.onPrimary,
  },

  recordDisabled: {
    opacity: 0.5,
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

  approveDisabled: {
    opacity: 0.45,
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
