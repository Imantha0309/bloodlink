import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { EXTRACTION } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  completeExtraction,
  completeDonationCase,
  getRequestWorkflow,
  startExtraction,
  type RequestWorkflow,
} from "@/services/hospital";
import { recordDonatedUnit } from "@/services/storage/blood-stock";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";
import { referenceFor } from "@/utils/reference";

/* ================= COLLECTION CLOCK ================= */

/** Cadence of the pump readout â€” also how often the ring repaints. */
const TICK_MS = 250;

/**
 * The ETA pill's copy: "~1m 05s left", "~18s left", then "Unit complete".
 *
 * Driven by the same clock as the fill, so the countdown can never disagree
 * with how far the ring has actually got.
 */
function formatEta(secondsRemaining: number): string {
  const total = Math.max(0, Math.ceil(secondsRemaining));

  if (total === 0) {
    return "Unit complete";
  }

  if (total < 60) {
    return `~${total}s left`;
  }

  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return `~${minutes}m ${String(seconds).padStart(2, "0")}s left`;
}

/* ================= COLLECTION RING ================= */

const RING_SIZE = 172;
const RING_THICKNESS = 16;

/**
 * The arc is drawn as tangential bars laid around the circle rather than one
 * stroke â€” React Native has no vector canvas, and overlapping bars keep the
 * ring smooth while staying in plain views.
 */
const RING_SEGMENTS = 90;
const RING_RADIUS = (RING_SIZE - RING_THICKNESS) / 2;
const SEGMENT_DEGREES = 360 / RING_SEGMENTS;
const SEGMENT_STEP = (Math.PI * RING_RADIUS * SEGMENT_DEGREES) / 180;
const SEGMENT_LENGTH = SEGMENT_STEP * 2;
const SEGMENT_RADIUS = Math.min(SEGMENT_LENGTH, RING_THICKNESS) / 2;

/**
 * Live collection dial for the phlebotomy session.
 *
 * `fraction` is the share of the unit already drawn; the remainder is the
 * light track. The droplet badge beats while the pump is running and holds
 * still once the unit is full.
 */
function CollectionRing({
  fraction,
  collectedMl,
  volumeLabel,
  elapsedLabel,
}: {
  fraction: number;
  collectedMl: number | null;
  volumeLabel: string;
  elapsedLabel: string;
}) {
<<<<<<< HEAD:src/app/dashboard/hospital/extraction-session.tsx
  const filled = Math.round(fraction * RING_SEGMENTS);
  const percent = Math.round(fraction * 100);
  const isComplete = percent >= 100;

  // Ambient motion for the pump: an opacity beat that stops with the draw.
  // Held in state rather than a ref, the same way the loading screen keeps
  // its animated values.
  const [dropPulse] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    if (isComplete) {
      dropPulse.stopAnimation();
      dropPulse.setValue(1);
      return;
    }

    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(dropPulse, {
          toValue: 1,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dropPulse, {
          toValue: 0.45,
          duration: 620,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    beat.start();

    return () => {
      beat.stop();
    };
  }, [dropPulse, isComplete]);
=======
  const filled = fraction >= 1 ? RING_SEGMENTS : 0;
>>>>>>> origin/feature/recipient-module:frontend/src/app/dashboard/hospital/extraction-session.tsx

  return (
    <View
      accessibilityLabel="Collection session status"
      style={styles.ring}
    >
      {Array.from({ length: RING_SEGMENTS }, (_, index) => {
        const angle = (index + 0.5) * SEGMENT_DEGREES;
        const radians = (angle * Math.PI) / 180;
        const offsetX = RING_RADIUS * Math.sin(radians);
        const offsetY = -RING_RADIUS * Math.cos(radians);

        return (
          <View
            key={index}
            pointerEvents="none"
            style={[
              styles.ringSegment,
              {
                left: RING_SIZE / 2 + offsetX - SEGMENT_LENGTH / 2,
                top: RING_SIZE / 2 + offsetY - RING_THICKNESS / 2,
                backgroundColor: index < filled ? Blood.primary : Surface.softBlue,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}

      <View style={styles.ringCenter} pointerEvents="none">
        <View style={styles.dropBadge}>
          <Animated.View style={{ opacity: dropPulse }}>
            <Feather name="droplet" size={15} color={Blood.primary} />
          </Animated.View>
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>{collectedMl ?? "—"}</Text>
          <Text style={styles.amountTotal}>mL</Text>
        </View>

        <Text style={styles.amountPercent}>{volumeLabel}</Text>

<<<<<<< HEAD:src/app/dashboard/hospital/extraction-session.tsx
        <View style={[styles.etaPill, isComplete && styles.etaPillComplete]}>
          <Text style={styles.etaText}>{eta}</Text>
=======
        <View style={styles.etaPill}>
          <Text style={styles.etaText}>{elapsedLabel}</Text>
>>>>>>> origin/feature/recipient-module:frontend/src/app/dashboard/hospital/extraction-session.tsx
        </View>
      </View>
    </View>
  );
}

/* ================= SCREEN ================= */

/** Loading placeholder for the collection screen. */
function SessionSkeleton() {
  return (
    <View style={styles.skeletonBlock}>
      <SkeletonCard lines={3} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </View>
  );
}

/**
 * Collection telemetry for the unit being drawn.
 *
 * Loads the real workflow: the dial tracks elapsed time while the extraction
 * session runs â€” millilitre readout, percentage and ETA pill all advancing off
 * the same clock, with the droplet badge beating until the unit is full â€” and
 * sealing submits the drawn volume through `completeExtraction`, banks the
 * unit into the station's stock, and unlocks the donor's case completion.
 */
export default function HospitalExtractionSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const params = useLocalSearchParams<{ requestId?: string }>();
  const requestId = params.requestId ?? null;

  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volumeText, setVolumeText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompletingCase, setIsCompletingCase] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tick, setTick] = useState(() => Date.now());

  // Derived (not stored): a cold open without a request id shows the error
  // banner without a setState round-trip inside the effect.
  const paramError =
    requestId === null ? "This session needs a requisition â€” open it from the board." : null;

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

  const extraction = workflow?.extraction ?? null;
  const isInProgress = extraction?.status === "in_progress";

  // A running session repaints on a short tick so the dial creeps forward.
  useEffect(() => {
    if (!isInProgress) {
      return;
    }

    const timer = setInterval(() => {
      setTick(Date.now());
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [isInProgress]);

  /** Retry â€” invoked from event handlers only. */
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

  async function beginCollection() {
    if (requestId === null || workflow === null) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const started = await startExtraction(requestId);
      haptics.medium();
      setTick(Date.now());
      setWorkflow({ ...workflow, extraction: started });
    } catch (caught) {
      haptics.error();
      setSubmitError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function sealUnit() {
    if (requestId === null || workflow === null) {
      return;
    }

    const volumeMl = Number.parseInt(volumeText, 10);

    if (!Number.isFinite(volumeMl) || volumeMl < 1 || volumeMl > 1000) {
      setSubmitError("Enter the drawn volume in mL (1â€“1000).");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await completeExtraction(requestId, {
        volumeMl,
        phlebotomistName: session?.user.fullName ?? undefined,
      });

      // Sealing is what makes the unit real on this device too: the bank
      // stock, the group's reserve gauge and the cold vault all move with it,
      // and the storage monitor's fresh-intake strip reads those totals.
      recordDonatedUnit(workflow.request.bloodGroup);

      haptics.success();
<<<<<<< HEAD:src/app/dashboard/hospital/extraction-session.tsx
      router.replace(ROUTES.hospitalStorage);
=======
      setWorkflow({ ...workflow, extraction: completed });
      await finalizeCase();
>>>>>>> origin/feature/recipient-module:frontend/src/app/dashboard/hospital/extraction-session.tsx
    } catch (caught) {
      haptics.error();
      setSubmitError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function finalizeCase() {
    if (requestId === null) {
      return;
    }

    setIsCompletingCase(true);
    setSubmitError(null);

    try {
      await completeDonationCase(requestId);
      setWorkflow((current) =>
        current === null
          ? current
          : {
              ...current,
              request: {
                ...current.request,
                status: "fulfilled",
                updatedAt: new Date().toISOString(),
              },
              response:
                current.response === null
                  ? null
                  : { ...current.response, stage: "completed" },
            },
      );
      haptics.success();
    } catch (caught) {
      setSubmitError(apiErrorMessage(caught));
      haptics.error();
    } finally {
      setIsCompletingCase(false);
    }
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ROLE_HOME.hospital);
  }

  const request = workflow?.request ?? null;

  // The dial reads elapsed wall clock while drawing; a finished session shows
  // the sealed volume.
  const elapsedSeconds =
    extraction !== null ? Math.max(0, (tick - Date.parse(extraction.startedAt)) / 1000) : 0;
  const fraction = extraction?.status === "completed" ? 1 : 0;
  const recordedVolume = extraction?.status === "completed" ? extraction.volumeMl : null;
  const elapsedLabel =
    extraction === null
      ? "Session not started"
      : extraction.status === "completed"
<<<<<<< HEAD:src/app/dashboard/hospital/extraction-session.tsx
        ? "Unit sealed"
        : remaining > 0
          ? formatEta(remaining)
          : "Ready to seal";
=======
        ? "Collection completed"
        : `${Math.floor(elapsedSeconds / 60)}m ${Math.floor(elapsedSeconds % 60)}s elapsed`;
>>>>>>> origin/feature/recipient-module:frontend/src/app/dashboard/hospital/extraction-session.tsx

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= BACK ================= */}

        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Feather name="arrow-left" size={22} color={Surface.text} />
        </Pressable>

        <AsyncState
          isLoading={paramError === null && isLoading}
          error={paramError ?? error}
          skeleton={<SessionSkeleton />}
          onRetry={() => {
            void load();
          }}
        >
          {workflow === null || request === null ? null : (
            <>
              {/* ================= SUITE ================= */}

              <View style={styles.suiteRow}>
                <Text style={styles.suiteText}>Hospital extraction session</Text>

                <View
                  style={[
                    styles.protocolPill,
                    !isInProgress && styles.protocolPillStandby,
                  ]}
                >
                  <Feather
                    name={isInProgress ? "sun" : "clock"}
                    size={11}
                    color={isInProgress ? Blood.primary : Surface.textSecondary}
                  />
                  <Text
                    style={[
                      styles.protocolText,
                      !isInProgress && styles.protocolTextStandby,
                    ]}
                  >
                    {isInProgress ? EXTRACTION.livePill : "Standby"}
                  </Text>
                </View>
              </View>

              {/* ================= TELEMETRY ================= */}

              <View style={styles.card}>
                <View style={styles.telemetryHead}>
                  <View style={styles.telemetryText}>
                    <Text style={styles.eyebrow}>{EXTRACTION.telemetryLabel}</Text>

                    <Text style={styles.unitTitle} accessibilityRole="header">
                      {request.notes?.startsWith("Component: ")
                        ? request.notes.slice("Component: ".length)
                        : "Blood donation"}
                    </Text>
                  </View>

                  <View style={styles.isoGroup}>
                    <View style={styles.groupPill}>
                      <Text style={styles.groupText}>{request.bloodGroup}</Text>
                    </View>

                    <Text style={styles.isoLabel}>{EXTRACTION.isoLabel}</Text>
                  </View>
                </View>

                <View style={styles.ringWrap}>
                  <CollectionRing
                    fraction={fraction}
                    collectedMl={recordedVolume}
                    volumeLabel={recordedVolume === null ? "Measured volume pending" : "Volume saved"}
                    elapsedLabel={elapsedLabel}
                  />
                </View>

                <View style={styles.rfidRow}>
                  <Feather name="grid" size={16} color={Surface.textSecondary} />

                  <View style={styles.rfidText}>
                    <Text style={styles.rfidCode} numberOfLines={1}>
                      {`#REQ-${referenceFor(request.id)}`}
                    </Text>

                    <Text style={styles.rfidDetail}>
                      {extraction !== null
                        ? `Collection started ${new Date(extraction.startedAt).toLocaleTimeString(
                            "en-GB",
                            { hour: "2-digit", minute: "2-digit" },
<<<<<<< HEAD:src/app/dashboard/hospital/extraction-session.tsx
                          )} â€¢ Tri-pack Bag`
                        : EXTRACTION.rfidDetail}
=======
                          )}`
                        : "Collection has not started"}
>>>>>>> origin/feature/recipient-module:frontend/src/app/dashboard/hospital/extraction-session.tsx
                    </Text>
                  </View>

                  <Feather
                    name={extraction?.status === "completed" ? "check-circle" : "clock"}
                    size={18}
                    color={
                      extraction?.status === "completed" ? Surface.online : Surface.textSecondary
                    }
                  />
                </View>
              </View>

              {/* ================= LINKED CASE ================= */}

              <View style={styles.card}>
                <View style={styles.cardHead}>
                  <Text style={[styles.eyebrow, styles.eyebrowUpper]}>Linked requisition</Text>

                  <View style={styles.statPill}>
                    <Text style={styles.statText}>{`#REQ-${referenceFor(request.id)}`}</Text>
                  </View>
                </View>

                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personInitials}>
                      {initialsOf(request.patientName, "PT")}
                    </Text>
                  </View>

                  <View style={styles.personText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {request.patientName}
                      </Text>

                      <Text style={styles.personMeta}>
                        {`${request.bloodGroup} â€¢ ${request.units} ${
                          request.units === 1 ? "unit" : "units"
                        }`}
                      </Text>
                    </View>

                    <Text style={styles.personWard}>{request.hospital}</Text>
                  </View>
                </View>

                <View style={styles.noteRow}>
                  <Feather name="shuffle" size={13} color={Blood.primary} />

                  <Text style={styles.noteText}>
                    {request.notes ?? "No additional request notes."}
                  </Text>
                </View>
              </View>

              {/* ================= PHLEBOTOMIST ================= */}

              <View style={styles.card}>
                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.personInitials}>
                      {initialsOf(session?.user.fullName, "DR")}
                    </Text>
                  </View>

                  <View style={styles.personText}>
                    <View style={styles.nameRow}>
                      <Text style={styles.personName} numberOfLines={1}>
                        {session?.user.fullName ?? "Hospital staff"}
                      </Text>

                      <Feather name="check-circle" size={14} color={Surface.online} />
                    </View>

                    <Text style={styles.personWard}>Authenticated hospital staff</Text>
                  </View>

                </View>
              </View>

              {/* ================= DECISIONS ================= */}

              {isInProgress ? (
                <View style={styles.volumeCard}>
                  <TextField
                    label="Drawn volume (mL)"
                    value={volumeText}
                    onChangeText={(value) => {
                      setVolumeText(value);
                      setSubmitError(null);
                    }}
                    placeholder="Enter measured volume"
                    size="dense"
                    keyboardType="number-pad"
                    hint="Recorded on the sealed unit and linked to this case."
                  />
                </View>
              ) : null}

              {submitError !== null ? (
                <View style={styles.submitError}>
                  <Feather name="alert-circle" size={14} color={Blood.primary} />
                  <Text style={styles.submitErrorText}>{submitError}</Text>
                </View>
              ) : null}

              {extraction === null ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start the collection session"
                  accessibilityState={{ disabled: isSubmitting }}
                  disabled={isSubmitting}
                  onPress={() => {
                    void beginCollection();
                  }}
                  style={({ pressed }) => [
                    styles.seal,
                    pressed && styles.pressed,
                    isSubmitting && styles.sealDisabled,
                  ]}
                >
                  <Feather name="play" size={16} color={Surface.onPrimary} />

                  <Text style={styles.sealText} numberOfLines={1}>
                    {isSubmitting ? "Startingâ€¦" : "Start Collection Session"}
                  </Text>
                </Pressable>
              ) : extraction.status === "in_progress" ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={EXTRACTION.sealCta}
                    accessibilityState={{ disabled: isSubmitting }}
                    disabled={isSubmitting}
                    onPress={() => {
                      void sealUnit();
                    }}
                    style={({ pressed }) => [
                      styles.seal,
                      pressed && styles.pressed,
                      isSubmitting && styles.sealDisabled,
                    ]}
                  >
                    <Feather name="lock" size={16} color={Surface.onPrimary} />

                    <Text style={styles.sealText} numberOfLines={1}>
                      {isSubmitting ? "Sealingâ€¦" : EXTRACTION.sealCta}
                    </Text>
                  </Pressable>

                </>
              ) : workflow.response?.stage !== "completed" ? (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Complete donation case"
                    accessibilityState={{ disabled: isCompletingCase }}
                    disabled={isCompletingCase}
                    onPress={() => {
                      void finalizeCase();
                    }}
                    style={({ pressed }) => [
                      styles.seal,
                      pressed && styles.pressed,
                      isCompletingCase && styles.sealDisabled,
                    ]}
                  >
                    <Feather name="check-circle" size={16} color={Surface.onPrimary} />
                    <Text style={styles.sealText} numberOfLines={1}>
                      {isCompletingCase ? "Completing case…" : "Complete Donation Case"}
                    </Text>
                  </Pressable>
                  <Text style={styles.personMeta}>
                    The sealed collection is saved. Complete the case to mark the requisition fulfilled.
                  </Text>
                </>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Return to the requisition board"
                  onPress={() => {
                    router.replace(ROLE_HOME.hospital);
                  }}
                  style={({ pressed }) => [styles.seal, pressed && styles.pressed]}
                >
                  <Feather name="check-circle" size={16} color={Surface.onPrimary} />

                  <Text style={styles.sealText} numberOfLines={1}>
                    Unit Sealed â€” Return To Board
                  </Text>
                </Pressable>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open the donor desk again"
                onPress={() => {
                  if (requestId !== null) {
                    router.push({
                      pathname: ROUTES.hospitalVerifyDonor,
                      params: { requestId },
                    });
                  }
                }}
                style={({ pressed }) => [styles.linkBack, pressed && styles.pressed]}
              >
                <Feather name="user-check" size={14} color={Blood.primary} />
                <Text style={styles.linkBackText}>Back To Donor Desk</Text>
              </Pressable>
            </>
          )}
        </AsyncState>
      </ScrollView>
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

  pressed: {
    opacity: 0.75,
  },

  /* ================= BACK & SUITE ================= */

  backButton: {
    alignSelf: "flex-start",
    padding: 4,
  },

  suiteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  suiteText: {
    flex: 1,
    ...Typography.micro,
    textTransform: "uppercase",
    color: Surface.textSecondary,
  },

  protocolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  protocolPillStandby: {
    backgroundColor: Surface.iconWash,
    borderColor: Surface.border,
  },

  protocolText: {
    ...Typography.micro,
    fontSize: 9.5,
    textTransform: "uppercase",
    color: Blood.primary,
  },

  protocolTextStandby: {
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

  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  eyebrow: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  eyebrowUpper: {
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "700",
    fontSize: 10,
  },

  /* ================= TELEMETRY ================= */

  telemetryHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  telemetryText: {
    flex: 1,
    gap: 3,
  },

  unitTitle: {
    ...Typography.title,
    color: Surface.text,
  },

  isoGroup: {
    alignItems: "flex-end",
    gap: 4,
  },

  groupPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  groupText: {
    ...Typography.label,
    color: Surface.onPrimary,
  },

  isoLabel: {
    ...Typography.small,
    fontSize: 10,
    color: Surface.textMuted,
  },

  ringWrap: {
    alignItems: "center",
    paddingVertical: 4,
  },

  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  ringSegment: {
    position: "absolute",
    width: SEGMENT_LENGTH,
    height: RING_THICKNESS,
    borderRadius: SEGMENT_RADIUS,
  },

  ringCenter: {
    alignItems: "center",
    gap: 6,
  },

  dropBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },

  amountValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1,
    color: Surface.text,
  },

  amountTotal: {
    ...Typography.label,
    color: Surface.textMuted,
  },

  amountPercent: {
    ...Typography.label,
    color: Blood.primary,
  },

  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  /** Full unit â€” the countdown gives way to a completed state. */
  etaPillComplete: {
    backgroundColor: Surface.softGreen,
    borderColor: Surface.softGreenBorder,
  },

  etaText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.text,
  },

  rfidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  rfidText: {
    flex: 1,
    gap: 2,
  },

  rfidCode: {
    ...Typography.label,
    letterSpacing: 0.5,
    color: Surface.text,
  },

  rfidDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  /* ================= LINKED CASE ================= */

  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  statText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  personAvatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  personInitials: {
    ...Typography.label,
    color: Surface.text,
  },

  personText: {
    flex: 1,
    gap: 3,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  personName: {
    flexShrink: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  personMeta: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  personWard: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  noteText: {
    flex: 1,
    ...Typography.small,
    lineHeight: 17,
    color: Blood.primary,
  },

  /* ================= BUZZER ================= */

  buzzer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  buzzerText: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.text,
  },

  /* ================= DECISIONS ================= */

  volumeCard: {
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
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

  seal: {
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

  sealText: {
    flexShrink: 1,
    ...Typography.button,
    color: Surface.onPrimary,
  },

  sealDisabled: {
    opacity: 0.6,
  },

  halt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  haltText: {
    ...Typography.button,
    fontSize: 14,
    color: Blood.primary,
  },

  linkBack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 40,
  },

  linkBackText: {
    ...Typography.label,
    color: Blood.primary,
  },
});
