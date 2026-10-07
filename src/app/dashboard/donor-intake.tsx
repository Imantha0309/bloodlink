import { Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  createDonorCheckInTicket,
  listDonorCommitments,
  type DonorCheckInTicket,
  type DonorCommitment,
} from "@/services/donors/donor-workflow";

export default function DonorIntakeScreen() {
  return (
    <DashboardShell title="Hospital Intake" bottomNavigation={<DonorTabBar active="intake" />}>
      {() => <IntakeContent />}
    </DashboardShell>
  );
}

function IntakeContent() {
  const { session } = useAuth();
  const router = useRouter();
  const [commitment, setCommitment] = useState<DonorCommitment | null>(null);
  const [ticket, setTicket] = useState<DonorCheckInTicket | null>(null);
  const [qrFormat, setQrFormat] = useState<"details" | "token">("details");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (rotateTicket: boolean) => {
    try {
      const list = await listDonorCommitments();
      const traveling = list.find((item) => item.donorStage === "en_route") ?? null;
      const current = traveling ?? list.find((item) => item.donorStage === "arrived") ?? null;
      setCommitment(current);
      if (traveling && (rotateTicket || !ticket || new Date(ticket.expiresAt).getTime() <= Date.now())) {
        setTicket(await createDonorCheckInTicket(traveling.id));
      } else if (!current) {
        setTicket(null);
      } else if (current.donorStage === "arrived") {
        setTicket(null);
      }
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [ticket]);

  useFocusEffect(useCallback(() => {
    void load(false);
    const poll = setInterval(() => void load(false), 10_000);
    return () => clearInterval(poll);
  }, [load]));

  async function refreshTicket() {
    if (!commitment) return;
    setRefreshing(true);
    try {
      setTicket(await createDonorCheckInTicket(commitment.id));
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setRefreshing(false);
    }
  }

  const expiresText = ticket ? new Date(ticket.expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
  const donorName = session?.user.fullName ?? "Donor";
  const passText = commitment
    ? [
        "BLOODLINK DONOR INTAKE PASS",
        `Donor: ${donorName}`,
        `Blood Group: ${commitment.bloodGroup}`,
        `Patient: ${commitment.patientName}`,
        `Hospital: ${commitment.hospital}${commitment.district ? ` (${commitment.district})` : ""}`,
        `Units: ${commitment.units} unit(s)`,
        `Priority: ${commitment.urgency}`,
        `Case Ref: #${commitment.id.slice(-6).toUpperCase()}`,
        `Expires: ${expiresText}`,
        `Ticket: ${ticket?.ticket ?? ""}`,
      ].join("\n")
    : "";

  return (
    <>
      <View style={styles.headline}>
        <View style={styles.headIcon}><Feather name="shield" size={19} color={Blood.primary} /></View>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>SECURE HOSPITAL CHECK-IN</Text>
          <Text style={styles.title}>Your donor pass</Text>
          <Text style={styles.subtitle}>Present this one-time QR at the hospital intake desk.</Text>
        </View>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={Blood.primary} /> : null}

      {!loading && !commitment ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Feather name="grid" size={24} color={Surface.textMuted} /></View>
          <Text style={styles.emptyTitle}>No intake pass yet</Text>
          <Text style={styles.emptyCopy}>Accept a compatible request and start transit. Your secure hospital QR will appear here.</Text>
        </View>
      ) : null}

      {commitment && commitment.donorStage === "en_route" ? (
        <>
          <View style={styles.ticketCard}>
            <View style={styles.serviceBanner}>
              <View style={styles.greenDot} />
              <View style={styles.serviceText}>
                <Text style={styles.serviceEyebrow}>BLOODLINK DONOR PASS</Text>
                <Text style={styles.serviceTitle}>Present QR at Intake</Text>
              </View>
              <Text style={styles.bloodBadge}>{commitment.bloodGroup}</Text>
            </View>

            <View style={styles.scanInfo}>
              <Feather name="lock" size={13} color={Surface.textSecondary} />
              <Text style={styles.scanInfoText}>Scan to see full pass details · expires {expiresText}</Text>
            </View>

            {/* QR Format Selector */}
            <View style={styles.formatRow}>
              <Pressable
                onPress={() => setQrFormat("details")}
                style={[styles.formatChip, qrFormat === "details" && styles.formatChipActive]}
              >
                <Feather
                  name="file-text"
                  size={12}
                  color={qrFormat === "details" ? "#FFFFFF" : Surface.textSecondary}
                />
                <Text
                  style={[
                    styles.formatChipText,
                    qrFormat === "details" && styles.formatChipTextActive,
                  ]}
                >
                  Full Pass Details
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setQrFormat("token")}
                style={[styles.formatChip, qrFormat === "token" && styles.formatChipActive]}
              >
                <Feather
                  name="code"
                  size={12}
                  color={qrFormat === "token" ? "#FFFFFF" : Surface.textSecondary}
                />
                <Text
                  style={[
                    styles.formatChipText,
                    qrFormat === "token" && styles.formatChipTextActive,
                  ]}
                >
                  Compact Token
                </Text>
              </Pressable>
            </View>

            <View style={styles.qrWrap}>
              {ticket ? (
                <QRCode
                  value={qrFormat === "details" ? passText : ticket.ticket}
                  size={200}
                  color="#151923"
                  backgroundColor="#FFFFFF"
                  ecl="M"
                />
              ) : <ActivityIndicator size="large" color={Blood.primary} />}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Preview scanned pass details"
              onPress={() => {
                router.push({
                  pathname: "/pass-details",
                  params: {
                    ticket: ticket?.ticket ?? "",
                    donor: donorName,
                    bloodGroup: commitment.bloodGroup,
                    patient: commitment.patientName,
                    hospital: commitment.hospital,
                    district: commitment.district ?? "",
                    units: String(commitment.units),
                    urgency: commitment.urgency,
                    caseId: commitment.id,
                    expiresAt: expiresText,
                  },
                });
              }}
              style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
            >
              <Feather name="external-link" size={15} color="#FFFFFF" />
              <Text style={styles.previewButtonText}>Preview Scanned Pass Details</Text>
            </Pressable>

            <View style={styles.passDetails}>
              <Text style={styles.detailsTitle}>Pass details</Text>
              <PassDetail label="Donor" value={session?.user.fullName ?? "Donor"} />
              <PassDetail label="Patient" value={commitment.patientName} />
              <PassDetail label="Hospital" value={commitment.hospital} />
              {commitment.district ? <PassDetail label="District" value={commitment.district} /> : null}
              <PassDetail label="Blood group" value={commitment.bloodGroup} />
              <PassDetail label="Units requested" value={String(commitment.units)} />
              <PassDetail label="Case reference" value={`#${commitment.id.slice(-6).toUpperCase()}`} />
            </View>

            <Text style={styles.holdText}>Scanning this QR reveals the complete verified donor pass details on any phone camera or scanner.</Text>
            <View style={styles.tokenRow}>
              <Feather name="clock" size={13} color={Blood.primary} />
              <Text style={styles.tokenText}>This QR expires at {expiresText}. Refresh if needed.</Text>
            </View>

            <Pressable disabled={refreshing} onPress={() => void refreshTicket()} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
              {refreshing ? <ActivityIndicator color={Blood.primary} /> : <Feather name="refresh-cw" size={15} color={Blood.primary} />}
              <Text style={styles.refreshText}>Refresh secure QR</Text>
            </Pressable>
          </View>

          <View style={styles.caseCard}>
            <View style={styles.caseHeader}><Feather name="heart" size={16} color={Blood.primary} /><Text style={styles.caseTitle}>Donation case</Text><Text style={styles.caseId}>#{commitment.id.slice(-6).toUpperCase()}</Text></View>
            <Text style={styles.patient}>Patient {commitment.patientName}</Text>
            <Text style={styles.hospital}>{commitment.hospital}{commitment.district ? ` · ${commitment.district}` : ""}</Text>
            <View style={styles.units}><Feather name="droplet" size={14} color={Blood.primary} /><Text style={styles.unitsText}>{commitment.units} {commitment.units === 1 ? "unit" : "units"} requested</Text></View>
          </View>
        </>
      ) : null}

      {commitment?.donorStage === "arrived" ? (
        <View style={styles.arrivedCard}>
          <Feather name="check-circle" size={34} color={Surface.online} />
          <Text style={styles.emptyTitle}>Intake verified</Text>
          <Text style={styles.emptyCopy}>Hospital staff scanned your pass. Please follow their instructions for the donation.</Text>
        </View>
      ) : null}
    </>
  );
}

function PassDetail({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.passDetailRow}>
      <Text style={styles.passDetailLabel}>{label}</Text>
      <Text style={styles.passDetailValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { flexDirection: "row", alignItems: "center", gap: 12 },
  headIcon: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: Surface.softRed },
  headText: { flex: 1, gap: 2 },
  eyebrow: { ...Typography.micro, color: Surface.textMuted, letterSpacing: 0.6 },
  title: { fontSize: 20, fontWeight: "800", color: Surface.text },
  subtitle: { ...Typography.small, color: Surface.textSecondary },
  ticketCard: { padding: 15, gap: 13, borderRadius: 22, backgroundColor: Surface.card, borderWidth: 1, borderColor: Surface.border },
  serviceBanner: { flexDirection: "row", alignItems: "center", gap: 9, padding: 13, borderRadius: 15, backgroundColor: Blood.primary },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#67E9A6" },
  serviceText: { flex: 1, gap: 2 },
  serviceEyebrow: { fontSize: 9, letterSpacing: 0.7, fontWeight: "800", color: "#FFE4E8" },
  serviceTitle: { fontSize: 17, fontWeight: "800", color: "white" },
  bloodBadge: { overflow: "hidden", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: "white", color: Blood.primary, fontWeight: "900" },
  scanInfo: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 4 },
  scanInfoText: { ...Typography.small, color: Surface.textSecondary },
  formatRow: { flexDirection: "row", gap: 8, paddingHorizontal: 4 },
  formatChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
  },
  formatChipActive: {
    backgroundColor: Surface.text,
    borderColor: Surface.text,
  },
  formatChipText: {
    ...Typography.micro,
    color: Surface.textSecondary,
    fontWeight: "700",
  },
  formatChipTextActive: {
    color: "#FFFFFF",
  },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },
  previewButtonText: {
    ...Typography.button,
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  qrWrap: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 244, height: 244, borderRadius: 18, backgroundColor: "white", borderWidth: 1, borderColor: Surface.border },
  passDetails: { padding: 12, gap: 8, borderRadius: 14, backgroundColor: Surface.background, borderWidth: 1, borderColor: Surface.border },
  detailsTitle: { ...Typography.small, color: Surface.text, fontWeight: "800", marginBottom: 2 },
  passDetailRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  passDetailLabel: { ...Typography.micro, color: Surface.textMuted, flex: 1 },
  passDetailValue: { ...Typography.micro, color: Surface.text, fontWeight: "700", textAlign: "right", flex: 1.5 },
  holdText: { ...Typography.small, color: Surface.textSecondary, textAlign: "center", paddingHorizontal: 8 },
  tokenRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6, padding: 10, borderRadius: 12, backgroundColor: Surface.softRed },
  tokenText: { ...Typography.micro, color: Blood.primary, fontWeight: "700" },
  refreshButton: { minHeight: 42, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderWidth: 1, borderColor: Surface.softRedBorder, borderRadius: 12 },
  refreshText: { ...Typography.small, color: Blood.primary, fontWeight: "800" },
  caseCard: { padding: 14, gap: 7, borderRadius: Radius.card, backgroundColor: Surface.card, borderWidth: 1, borderColor: Surface.border },
  caseHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  caseTitle: { flex: 1, ...Typography.cardTitle, color: Surface.text },
  caseId: { ...Typography.micro, color: Surface.textMuted },
  patient: { ...Typography.cardTitle, color: Surface.text },
  hospital: { ...Typography.small, color: Surface.textSecondary },
  units: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  unitsText: { ...Typography.small, color: Surface.textSecondary },
  empty: { alignItems: "center", gap: 9, paddingVertical: 30, paddingHorizontal: 22, borderRadius: 20, backgroundColor: Surface.card },
  emptyIcon: { width: 52, height: 52, alignItems: "center", justifyContent: "center", borderRadius: 26, backgroundColor: Surface.iconWash },
  emptyTitle: { ...Typography.cardTitle, color: Surface.text, textAlign: "center" },
  emptyCopy: { ...Typography.small, color: Surface.textSecondary, textAlign: "center", lineHeight: 18 },
  arrivedCard: { alignItems: "center", gap: 10, padding: 28, borderRadius: 20, backgroundColor: Surface.softGreen },
  error: { ...Typography.small, color: Surface.danger },
  pressed: { opacity: 0.72 },
});
