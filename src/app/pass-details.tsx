import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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

export default function PassDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    ticket?: string;
    donor?: string;
    bloodGroup?: string;
    patient?: string;
    hospital?: string;
    district?: string;
    units?: string;
    urgency?: string;
    caseId?: string;
    expiresAt?: string;
    raw?: string;
  }>();

  // If raw scan data was passed in (e.g. from camera/pasted), parse it
  const parsedFromRaw = parseRawScanData(params.raw ?? params.ticket ?? "");

  const donor = params.donor || parsedFromRaw.donor || "Verified Blood Donor";
  const bloodGroup = params.bloodGroup || parsedFromRaw.bloodGroup || "O+";
  const patient = params.patient || parsedFromRaw.patient || "Patient in Triage";
  const hospital = params.hospital || parsedFromRaw.hospital || "National Hospital of Sri Lanka";
  const district = params.district || parsedFromRaw.district || "Colombo";
  const units = params.units || parsedFromRaw.units || "1";
  const urgency = params.urgency || parsedFromRaw.urgency || "urgent";
  const ticket = params.ticket || parsedFromRaw.ticket || "";
  const caseId = params.caseId || parsedFromRaw.caseId || (ticket ? ticket.split(":")[1] : "BL-PASS");

  const [inputCode, setInputCode] = useState(ticket);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedStage, setVerifiedStage] = useState<"pending" | "arrived">("pending");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extract the requestId and token from ticket string (e.g. bloodlink-intake:req_123:token456)
  const tokenParts = (inputCode || ticket).split(":");
  const resolvedRequestId = tokenParts.length >= 2 ? tokenParts[1] : caseId;
  const resolvedToken = tokenParts.length >= 3 ? tokenParts[2] : inputCode;

  async function handleConfirmIntake() {
    if (isVerifying) return;
    setIsVerifying(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await verifyDonorCheckIn(resolvedRequestId, resolvedToken);
      setVerifiedStage("arrived");
      setStatusMessage("Donor intake verified successfully! Donor status set to Arrived.");
    } catch (caught) {
      setErrorMessage(apiErrorMessage(caught));
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <View style={styles.root}>
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
      >
        {/* Verification Status Banner */}
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
              <Text style={styles.bloodText}>{bloodGroup}</Text>
            </View>

            <View style={styles.cardTopInfo}>
              <Text style={styles.hospitalName} numberOfLines={1}>
                {hospital}
              </Text>
              <Text style={styles.districtName}>{district} District</Text>
            </View>

            <View style={styles.urgencyBadge}>
              <Text style={styles.urgencyText}>{urgency.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailsList}>
            <DetailRow label="Donor Full Name" value={donor} icon="user" isBold />
            <DetailRow label="Patient Name" value={patient} icon="heart" />
            <DetailRow label="Blood Group Needed" value={bloodGroup} icon="droplet" highlight />
            <DetailRow
              label="Units Requested"
              value={`${units} ${Number(units) === 1 ? "Unit" : "Units"}`}
              icon="activity"
            />
            <DetailRow
              label="Case Reference"
              value={`#${caseId.slice(-6).toUpperCase()}`}
              icon="hash"
            />
            {ticket ? (
              <DetailRow
                label="Security Ticket"
                value={ticket.length > 25 ? `${ticket.slice(0, 25)}...` : ticket}
                icon="lock"
              />
            ) : null}
          </View>

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
        {verifiedStage !== "arrived" ? (
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
        {!ticket && (
          <View style={styles.manualWrap}>
            <Text style={styles.manualLabel}>Or verify with ticket code:</Text>
            <TextInput
              value={inputCode}
              onChangeText={setInputCode}
              placeholder="e.g. bloodlink-intake:req_123:abc..."
              placeholderTextColor={Surface.textMuted}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}
      </ScrollView>
    </View>
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

function parseRawScanData(raw: string): Partial<{
  donor: string;
  bloodGroup: string;
  patient: string;
  hospital: string;
  district: string;
  units: string;
  urgency: string;
  caseId: string;
  ticket: string;
}> {
  if (!raw) return {};

  // If raw is a URL, extract search params
  if (raw.includes("?") && (raw.startsWith("http") || raw.startsWith("exp:") || raw.startsWith("/"))) {
    try {
      const queryString = raw.split("?")[1] || "";
      const searchParams = new URLSearchParams(queryString);
      return {
        donor: searchParams.get("donor") ?? undefined,
        bloodGroup: searchParams.get("bloodGroup") ?? undefined,
        patient: searchParams.get("patient") ?? undefined,
        hospital: searchParams.get("hospital") ?? undefined,
        district: searchParams.get("district") ?? undefined,
        units: searchParams.get("units") ?? undefined,
        urgency: searchParams.get("urgency") ?? undefined,
        caseId: searchParams.get("caseId") ?? undefined,
        ticket: searchParams.get("ticket") ?? undefined,
      };
    } catch {
      // ignore
    }
  }

  // If raw is key-value formatted text (e.g. from our formatted QR code)
  const lines = raw.split("\n");
  const result: Record<string, string> = {};

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();

      if (key.includes("donor")) result.donor = val;
      if (key.includes("blood group") || key === "group") result.bloodGroup = val;
      if (key.includes("patient")) result.patient = val;
      if (key.includes("hospital")) result.hospital = val;
      if (key.includes("district")) result.district = val;
      if (key.includes("unit")) result.units = val.replace(/[^0-9]/g, "");
      if (key.includes("priority") || key.includes("urgency")) result.urgency = val;
      if (key.includes("case") || key.includes("ref")) result.caseId = val.replace("#", "");
      if (key.includes("ticket") || val.startsWith("bloodlink-intake:")) result.ticket = val;
    }
  }

  // If raw string itself is a ticket token
  if (raw.startsWith("bloodlink-intake:")) {
    result.ticket = raw;
    const parts = raw.split(":");
    if (parts[1]) result.caseId = parts[1];
  }

  return result;
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
