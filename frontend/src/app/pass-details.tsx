import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import { verifyDonorCheckIn } from "@/services/donors/donor-workflow";
import {
  getEmergencyRequest,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { intakePayloadOf } from "@/utils/qr-payload";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";

/**
 * The intake ticket behind a scanned QR.
 *
 * Everything shown here used to be scraped out of the QR payload itself — it
 * parsed `?donor=...&bloodGroup=...` query strings and `Donor: Jane` line pairs,
 * then rendered whatever it found as though a desk could rely on it. That was
 * both forgeable and unreadable by the server.
 *
 * Now the code carries nothing but an opaque secret, this screen reads it with
 * the one canonical decoder, and the details come from `getEmergencyRequest`.
 * The donor's *identity* is not on an intake ticket at all; that is what the
 * identity pass is for, and this screen says so rather than inventing a name.
 */
export default function PassDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    ticket?: string;
    raw?: string;
  }>();

  const rawPayload = params.raw ?? params.ticket ?? "";
  const scanned = intakePayloadOf(rawPayload);

  const [inputCode, setInputCode] = useState(rawPayload);
  const [loaded, setLoaded] = useState<{ id: string; request: EmergencyRequest | null } | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStage, setVerifiedStage] = useState<"pending" | "arrived">("pending");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const requestId = scanned?.requestId ?? null;

  // The ticket only proves the holder is the right donor for this request; who
  // they are, and what is needed, both come from the server. The id is stored
  // alongside the row — a `null` request records a lookup that failed, so a
  // stale response can never be shown against a different code, and "still
  // loading" is derived from whether *this* id has resolved rather than being
  // set from inside the effect.
  useEffect(() => {
    if (requestId === null) {
      return;
    }

    let cancelled = false;

    void getEmergencyRequest(requestId)
      .then((detail) => {
        if (!cancelled) {
          setLoaded({ id: requestId, request: detail.request });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoaded({ id: requestId, request: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const settled = loaded !== null && loaded.id === requestId;
  const request = settled ? loaded.request : null;
  const isLoading = requestId !== null && !settled;

  // Re-read whenever the operator types a different code into the retry box.
  const editable = intakePayloadOf(inputCode);
  const isPassValid = scanned !== null;

  async function handleConfirmIntake() {
    if (isVerifying || editable === null) {
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await verifyDonorCheckIn(editable.requestId, editable.secret);
      setVerifiedStage("arrived");
      setStatusMessage("Donor intake verified successfully! Donor status set to Arrived.");
    } catch (caught) {
      setErrorMessage(apiErrorMessage(caught));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <KeyboardDismissView style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/dashboard/donor" as never);
            }
          }}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={20} color={Surface.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Intake Pass Verification</Text>

        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {isPassValid ? null : (
          <>
            <View style={[styles.banner, styles.bannerInvalid]}>
              <View style={[styles.bannerIconWrap, styles.iconWrapInvalid]}>
                <Feather name="alert-triangle" size={22} color={Blood.primary} />
              </View>

              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>UNREADABLE PASS</Text>
                <Text style={styles.bannerSubtitle}>
                  This scan carried no readable intake ticket, so there is nothing to verify.
                </Text>
              </View>
            </View>

            <View style={styles.errorBox}>
              <Feather name="info" size={15} color={Surface.danger} />
              <Text style={styles.errorText}>
                Ask the donor to show their pass on screen instead of handing over a printed code.
                If they do have a code, enter it below to try again.
              </Text>
            </View>
          </>
        )}

        {/* Verification Status Banner */}
        {isPassValid ? (
          <View
            style={[
              styles.banner,
              verifiedStage === "arrived" ? styles.bannerArrived : styles.bannerValid,
            ]}
          >
            <View
              style={[
                styles.bannerIconWrap,
                verifiedStage === "arrived" ? styles.iconWrapArrived : styles.iconWrapValid,
              ]}
            >
              <Feather
                name={verifiedStage === "arrived" ? "check-circle" : "shield"}
                size={22}
                color={verifiedStage === "arrived" ? Surface.online : Blood.primary}
              />
            </View>

            <View style={styles.bannerTextWrap}>
              <Text
                style={[
                  styles.bannerTitle,
                  verifiedStage === "arrived" ? styles.titleArrived : styles.titleValid,
                ]}
              >
                {verifiedStage === "arrived"
                  ? "INTAKE VERIFIED & CONFIRMED"
                  : "OFFICIAL BLOODLINK PASS"}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {verifiedStage === "arrived"
                  ? "Donor arrival registered in hospital intake log."
                  : "Single-use emergency donation check-in pass."}
              </Text>
            </View>
          </View>
        ) : null}

        {statusMessage ? (
          <View style={styles.successBox}>
            <Feather name="check" size={15} color={Surface.online} />
            <Text style={styles.successText}>{statusMessage}</Text>
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={15} color={Surface.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* The Pass Details Card */}
        <View style={styles.passCard}>
          {/* Card Top: Blood Type & Hospital */}
          <View style={styles.cardTop}>
            <View style={styles.bloodBadge}>
              <Feather name="droplet" size={16} color="#FFFFFF" />
              <Text style={styles.bloodText}>{request?.bloodGroup ?? "—"}</Text>
            </View>

            <View style={styles.cardTopInfo}>
              <Text style={styles.hospitalName} numberOfLines={1}>
                {request?.hospital ?? "Unknown facility"}
              </Text>
              <Text style={styles.districtName}>
                {request?.district ? `${request.district} District` : "—"}
              </Text>
            </View>

            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>
                {request?.urgency ? request.urgency.toUpperCase() : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsList}>
            <DetailRow
              label="Donor"
              value="Not on an intake pass"
              icon="user"
              isBold
            />
            <DetailRow label="Patient Name" value={request?.patientName ?? "—"} icon="heart" />
            <DetailRow
              label="Blood Group Needed"
              value={request?.bloodGroup ?? "—"}
              icon="droplet"
              highlight
            />
            <DetailRow
              label="Units Requested"
              value={request === null ? "—" : `${request.units} ${request.units === 1 ? "Unit" : "Units"}`}
              icon="activity"
            />
            <DetailRow
              label="Case Reference"
              value={request === null ? "—" : `#${request.id.slice(-6).toUpperCase()}`}
              icon="hash"
            />
            {requestId !== null ? (
              <DetailRow
                label="Security Ticket"
                value={`bloodlink-intake:v1:${requestId}:••••`}
                icon="lock"
              />
            ) : null}
          </View>

          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Surface.textSecondary} />
              <Text style={styles.loadingText}>Loading the requisition…</Text>
            </View>
          ) : null}

          {/* Status Chip */}
          <View style={styles.cardFooter}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>
                {verifiedStage === "arrived" ? "ARRIVED AT HOSPITAL" : "EN ROUTE / READY"}
              </Text>
            </View>

            <Text style={styles.timestampNote}>Verified by BloodLink Health Network</Text>
          </View>
        </View>

        {/* Hospital Intake Confirmation Button */}
        {isPassValid && verifiedStage !== "arrived" ? (
          <View style={styles.actionSection}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm donor intake"
              disabled={isVerifying}
              onPress={() => void handleConfirmIntake()}
              style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
            >
              {isVerifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmButtonText}>Confirm Donor Intake (Arrived)</Text>
                </>
              )}
            </Pressable>

            <Text style={styles.confirmHint}>
              Hospital staff: Tap to log this donor as arrived and begin triage.
            </Text>
          </View>
        ) : null}

        {/* Manual Code Input / Ticket Inspection */}
        {!isPassValid && (
          <View style={styles.manualWrap}>
            <Text style={styles.manualLabel}>Or verify with ticket code:</Text>
            <TextInput
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="e.g. bloodlink-intake:v1:req_123:abc..."
              placeholderTextColor={Surface.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardDismissView>
  );
}

function DetailRow({
  label,
  value,
  icon,
  isBold,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  isBold?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabelWrap}>
        <Feather name={icon} size={14} color={Surface.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>

      <Text
        style={[
          styles.rowValue,
          isBold && styles.boldText,
          highlight && styles.highlightText,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Surface.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  headerTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Surface.text,
  },

  placeholder: {
    width: 38,
  },

  content: {
    padding: 16,
    gap: 16,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1.5,
  },

  bannerValid: {
    backgroundColor: "#FFF5F5",
    borderColor: Surface.softRedBorder,
  },

  bannerArrived: {
    backgroundColor: "#F6FEF9",
    borderColor: Surface.softGreenBorder,
  },

  /** A scan with no readable ticket reads as unreadable, not as valid. */
  bannerInvalid: {
    backgroundColor: "#FFF5F5",
    borderColor: Surface.softRedBorder,
  },

  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapValid: {
    backgroundColor: Surface.softRed,
  },

  iconWrapArrived: {
    backgroundColor: Surface.softGreen,
  },

  iconWrapInvalid: {
    backgroundColor: Surface.softRed,
  },

  bannerTextWrap: {
    flex: 1,
    gap: 2,
  },

  bannerTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
    letterSpacing: 0.5,
  },

  titleValid: {
    color: Blood.primary,
  },

  titleArrived: {
    color: Surface.online,
  },

  bannerSubtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontSize: 12,
  },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.softGreen,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },

  successText: {
    ...Typography.small,
    color: "#027A48",
    fontWeight: "600",
    flex: 1,
  },

  errorBox: {
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
    color: Surface.danger,
    fontWeight: "600",
    flex: 1,
  },

  passCard: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  bloodBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  bloodText: {
    ...Typography.title,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  cardTopInfo: {
    flex: 1,
    gap: 2,
  },

  hospitalName: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Surface.text,
  },

  districtName: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  urgencyText: {
    ...Typography.micro,
    fontWeight: "800",
    color: Blood.primary,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Surface.border,
  },

  detailsList: {
    gap: 10,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  rowLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  rowLabel: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontSize: 12,
  },

  rowValue: {
    ...Typography.small,
    color: Surface.text,
    fontSize: 12.5,
  },

  boldText: {
    fontWeight: "700",
    color: Surface.text,
  },

  highlightText: {
    fontWeight: "800",
    color: Blood.primary,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },

  loadingText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  cardFooter: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Surface.online,
  },

  statusPillText: {
    ...Typography.micro,
    fontWeight: "800",
    color: Surface.online,
  },

  timestampNote: {
    ...Typography.micro,
    fontSize: 10,
    color: Surface.textMuted,
  },

  actionSection: {
    gap: 8,
    alignItems: "center",
  },

  confirmButton: {
    width: "100%",
    height: 48,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  confirmButtonText: {
    ...Typography.button,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  confirmHint: {
    ...Typography.micro,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  manualWrap: {
    gap: 6,
    paddingTop: 8,
  },

  manualLabel: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontWeight: "600",
  },

  input: {
    height: 44,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    paddingHorizontal: 12,
    fontSize: 13,
    color: Surface.text,
  },

  pressed: {
    opacity: 0.8,
  },
});
