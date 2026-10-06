import { Feather } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
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
  const [commitment, setCommitment] = useState<DonorCommitment | null>(null);
  const [ticket, setTicket] = useState<DonorCheckInTicket | null>(null);
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
              <Text style={styles.scanInfoText}>Secure single-use ticket · expires {expiresText}</Text>
            </View>

            <View style={styles.qrWrap}>
              {ticket ? (
                <QRCode value={ticket.ticket} size={216} color="#151923" backgroundColor="#FFFFFF" ecl="H" />
              ) : <ActivityIndicator size="large" color={Blood.primary} />}
            </View>

            <Text style={styles.holdText}>Keep your screen bright. Let hospital staff scan this code to confirm arrival.</Text>
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
  qrWrap: { alignSelf: "center", alignItems: "center", justifyContent: "center", width: 244, height: 244, borderRadius: 18, backgroundColor: "white", borderWidth: 1, borderColor: Surface.border },
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
