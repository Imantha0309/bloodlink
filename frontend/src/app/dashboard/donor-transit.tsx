import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { EmptyNote } from "@/components/dashboard/empty-note";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import {
  listDonorCommitments,
  listDonorResponses,
  startDonorTransit,
  type DonorCommitment,
  type DonorResponseRecord,
} from "@/services/donors/donor-workflow";

export default function DonorTransitScreen() {
  return (
    <DashboardShell title="Donation Journey" bottomNavigation={<DonorTabBar active="transit" />}>
      {() => <TransitContent />}
    </DashboardShell>
  );
}

function TransitContent() {
  const router = useRouter();
  const [commitments, setCommitments] = useState<DonorCommitment[]>([]);
  const [responses, setResponses] = useState<DonorResponseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const [nextCommitments, nextResponses] = await Promise.all([
        listDonorCommitments(),
        listDonorResponses(),
      ]);
      setCommitments(nextCommitments);
      setResponses(nextResponses);
      setError(null);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void reload();
    const poll = setInterval(() => void reload(), 10_000);
    return () => clearInterval(poll);
  }, [reload]));

  async function startTravel(item: DonorCommitment) {
    setWorkingId(item.id);
    setError(null);
    try {
      await startDonorTransit(item.id);
      setCommitments((current) => current.map((entry) => entry.id === item.id ? { ...entry, donorStage: "en_route" } : entry));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setWorkingId(null);
    }
  }

  function openMap(item: DonorCommitment) {
    const destination = [item.hospital, item.district].filter(Boolean).join(", ");
    void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(destination)}`);
  }

  const active = commitments.filter((item) => item.donorStage !== "completed");
  const completed = commitments.filter((item) => item.donorStage === "completed");

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Feather name="navigation" size={20} color={Blood.primary} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>DONOR JOURNEY</Text>
          <Text style={styles.heroTitle}>Every minute matters</Text>
          <Text style={styles.heroText}>Your accepted requests and hospital arrival status update live.</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh journey" onPress={() => void reload()} style={styles.refresh}>
          <Feather name="refresh-cw" size={17} color={Surface.textSecondary} />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={Blood.primary} /> : null}
      {!loading && active.length === 0 ? (
        <EmptyNote title="No active donation yet" message="When you accept a compatible emergency request, your trip and intake steps will appear here." />
      ) : null}

      {active.map((item) => {
        const traveling = item.donorStage === "en_route";
        const arrived = item.donorStage === "arrived";
        return (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.groupBadge}><Text style={styles.group}>{item.bloodGroup}</Text></View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.patient}>Patient: {item.patientName}</Text>
                <Text style={styles.hospital}>{item.hospital}{item.district ? ` · ${item.district}` : ""}</Text>
              </View>
              <View style={[styles.status, arrived ? styles.arrived : traveling ? styles.traveling : styles.accepted]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{arrived ? "ARRIVED" : traveling ? "EN ROUTE" : "ACCEPTED"}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.detail}><Feather name="droplet" size={14} color={Blood.primary} /><Text style={styles.detailText}>{item.units} {item.units === 1 ? "unit" : "units"}</Text></View>
              <View style={styles.detail}><Feather name="alert-circle" size={14} color={Surface.textMuted} /><Text style={styles.detailText}>{item.urgency} priority</Text></View>
            </View>

            <View style={styles.steps}>
              <JourneyStep label="Accepted" done />
              <JourneyStep label="En route" done={traveling || arrived} active={!traveling && !arrived} />
              <JourneyStep label="Hospital intake" done={arrived} active={arrived} last />
            </View>

            {arrived ? (
              <View style={styles.arrivalNote}><Feather name="check-circle" size={16} color={Surface.online} /><Text style={styles.arrivalText}>Hospital intake confirmed. Please follow the clinical staff’s instructions.</Text></View>
            ) : (
              <View style={styles.actions}>
                {!traveling ? (
                  <Pressable disabled={workingId === item.id} onPress={() => void startTravel(item)} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                    {workingId === item.id ? <ActivityIndicator color="white" /> : <Feather name="navigation" size={16} color="white" />}
                    <Text style={styles.primaryText}>Start transit</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={() => router.push(ROUTES.donorIntake)} style={styles.primaryButton}>
                    <Feather name="grid" size={16} color="white" /><Text style={styles.primaryText}>Open intake QR</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => openMap(item)} style={styles.secondaryButton}>
                  <Feather name="map-pin" size={16} color={Blood.primary} /><Text style={styles.secondaryText}>Directions</Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      {completed.length > 0 ? (
        <View style={styles.completedPanel}>
          <Text style={styles.completedTitle}>Recently completed</Text>
          {completed.slice(0, 3).map((item) => <Text key={item.id} style={styles.completedText}>✓  {item.patientName} · {item.hospital}</Text>)}
        </View>
      ) : null}

      {responses.length > 0 ? (
        <View style={styles.completedPanel}>
          <Text style={styles.completedTitle}>Emergency response status</Text>
          {responses.map((item) => (
            <View key={item.request.id} style={styles.responseRow}>
              <View style={styles.responseCopy}>
                <Text style={styles.responsePatient} numberOfLines={1}>{item.request.patientName}</Text>
                <Text style={styles.completedText}>{item.request.hospital} · {item.request.bloodGroup}</Text>
              </View>
              <View style={[styles.responseBadge, item.response === "accepted" ? styles.responseAccepted : styles.responseDeclined]}>
                <Text style={styles.responseBadgeText}>{item.response === "accepted" ? "ACCEPTED" : "DECLINED"}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

function JourneyStep({ label, done, active = false, last = false }: { label: string; done: boolean; active?: boolean; last?: boolean }) {
  return (
    <View style={styles.step}>
      <View style={[styles.stepCircle, done && styles.stepDone, active && styles.stepActive]}>
        <Feather name={done ? "check" : active ? "clock" : "circle"} size={12} color={done ? "white" : active ? Blood.primary : Surface.textMuted} />
      </View>
      {!last ? <View style={[styles.stepLine, done && styles.stepLineDone]} /> : null}
      <Text style={[styles.stepLabel, (done || active) && styles.stepLabelActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 19, backgroundColor: Surface.softBlue },
  heroIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "white" },
  heroCopy: { flex: 1, gap: 2 },
  eyebrow: { ...Typography.micro, color: Surface.textMuted, letterSpacing: 0.7 },
  heroTitle: { fontSize: 17, fontWeight: "800", color: Surface.text },
  heroText: { ...Typography.small, color: Surface.textSecondary },
  refresh: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "white" },
  card: { padding: 14, gap: 14, borderRadius: Radius.card, borderWidth: 1, borderColor: Surface.border, backgroundColor: Surface.card },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  groupBadge: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: Surface.softRed },
  group: { fontSize: 16, fontWeight: "800", color: Blood.primary },
  cardTitleWrap: { flex: 1, gap: 2 },
  patient: { ...Typography.cardTitle, color: Surface.text },
  hospital: { ...Typography.small, color: Surface.textSecondary },
  status: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 15 },
  accepted: { backgroundColor: Surface.softBlue },
  traveling: { backgroundColor: Surface.softRed },
  arrived: { backgroundColor: Surface.softGreen },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Blood.primary },
  statusText: { fontSize: 9, fontWeight: "800", color: Surface.textSecondary },
  detailsRow: { flexDirection: "row", gap: 16 },
  detail: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailText: { ...Typography.small, color: Surface.textSecondary, textTransform: "capitalize" },
  steps: { flexDirection: "row", justifyContent: "space-between", paddingTop: 3 },
  step: { flex: 1, alignItems: "center", position: "relative", gap: 6 },
  stepCircle: { width: 25, height: 25, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: Surface.iconWash, zIndex: 1 },
  stepDone: { backgroundColor: Surface.online },
  stepActive: { borderWidth: 1.5, borderColor: Blood.primary, backgroundColor: "white" },
  stepLine: { position: "absolute", left: "58%", top: 12, width: "84%", height: 2, backgroundColor: Surface.border },
  stepLineDone: { backgroundColor: Surface.softGreenBorder },
  stepLabel: { ...Typography.micro, color: Surface.textMuted, textAlign: "center" },
  stepLabelActive: { color: Surface.textSecondary, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  primaryButton: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, backgroundColor: Blood.primary },
  primaryText: { ...Typography.small, color: "white", fontWeight: "800" },
  secondaryButton: { minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: Surface.softRedBorder },
  secondaryText: { ...Typography.small, color: Blood.primary, fontWeight: "700" },
  arrivalNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, backgroundColor: Surface.softGreen },
  arrivalText: { flex: 1, ...Typography.small, color: Surface.textSecondary },
  completedPanel: { gap: 9, padding: 14, borderRadius: 16, backgroundColor: Surface.card, borderWidth: 1, borderColor: Surface.border },
  completedTitle: { ...Typography.cardTitle, color: Surface.text },
  completedText: { ...Typography.small, color: Surface.textSecondary },
  responseRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  responseCopy: { flex: 1, gap: 2 },
  responsePatient: { ...Typography.small, color: Surface.text, fontWeight: "700" },
  responseBadge: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 12 },
  responseAccepted: { backgroundColor: Surface.softGreen },
  responseDeclined: { backgroundColor: Surface.iconWash },
  responseBadgeText: { fontSize: 9, fontWeight: "800", color: Surface.textSecondary },
  error: { color: Surface.danger, ...Typography.small },
  pressed: { opacity: 0.78 },
});
