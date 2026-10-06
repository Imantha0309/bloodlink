import { Feather } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AvailabilityCard } from "@/components/dashboard/availability-card";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { RequestList } from "@/components/dashboard/request-list";
import { Blood, Surface } from "@/constants/colors";
import { useAuth } from "@/providers/auth-provider";
import type { DashboardSummary } from "@/services/dashboard/dashboard";
import { isBloodGroup } from "@/constants/blood-groups";
import { respondToEmergencyRequest } from "@/services/requests/emergency-requests";

export default function DonorRequestsScreen() {
  return (
    <DashboardShell title="Emergency Requests" bottomNavigation={<DonorTabBar active="requests" />}>
      {(summary, helpers) => <RequestsContent summary={summary} helpers={helpers} />}
    </DashboardShell>
  );
}

function RequestsContent({ summary, helpers }: { summary: DashboardSummary; helpers: DashboardHelpers }) {
  const { session } = useAuth();
  const donorGroup = isBloodGroup(session?.user.bloodGroup) ? session.user.bloodGroup : null;
  const open = useMemo(
    () => summary.requests.filter((item) => item.status === "pending" || item.status === "verified"),
    [summary.requests],
  );
  const newCount = open.filter((item) => item.donorResponse === null).length;

  return (
    <>
      <View style={styles.banner}>
        <View style={styles.bannerTop}>
          <View style={styles.liveDot} />
          <Text style={styles.live}>LIVE DONOR MATCHES</Text>
          <Text style={styles.matchCount}>{newCount} new</Text>
        </View>
        <Text style={styles.bannerTitle}>Your blood type can help today.</Text>
        <Text style={styles.bannerCopy}>
          Showing open requests compatible with {donorGroup ?? "your blood group"}. Accept only if you can travel to the hospital.
        </Text>
      </View>

      {summary.availability ? (
        <AvailabilityCard
          availability={summary.availability}
          onSaved={(next) => {
            helpers.applyAvailability(next);
            helpers.reload();
          }}
        />
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Matching now</Text>
        <View style={styles.counter}><Text style={styles.counterText}>{open.length}</Text></View>
      </View>

      {!summary.availability?.isAvailable ? (
        <View style={styles.pausedNote}>
          <Feather name="pause-circle" size={16} color={Surface.textSecondary} />
          <Text style={styles.pausedText}>You can review and decline requests while paused. Turn availability on to accept.</Text>
        </View>
      ) : null}

      <RequestList
        requests={open}
        donorGroup={donorGroup}
        canAccept={summary.availability?.isAvailable ?? false}
        onDonorResponse={async (id, response) => {
          const saved = await respondToEmergencyRequest(id, response);
          helpers.reload();
          return saved;
        }}
        emptyTitle={donorGroup ? "No matching requests" : "Add your blood group"}
        emptyMessage={donorGroup ? "We refresh this list automatically when a compatible request arrives." : "Set your blood group in your donor profile to receive matches."}
      />
    </>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 16, gap: 8, borderRadius: 20, backgroundColor: Blood.primary },
  bannerTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#75F0B1" },
  live: { flex: 1, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, color: "#FFE5E8" },
  matchCount: { fontSize: 11, fontWeight: "700", color: "white" },
  bannerTitle: { fontSize: 20, fontWeight: "800", color: "white" },
  bannerCopy: { fontSize: 12, lineHeight: 18, color: "#FFE5E8" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: -8 },
  sectionTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: Surface.text },
  counter: { minWidth: 26, height: 26, borderRadius: 13, backgroundColor: Surface.softRed, alignItems: "center", justifyContent: "center" },
  counterText: { fontSize: 12, fontWeight: "800", color: Blood.primary },
  pausedNote: { flexDirection: "row", alignItems: "center", gap: 9, padding: 12, borderRadius: 13, backgroundColor: Surface.iconWash },
  pausedText: { flex: 1, color: Surface.textSecondary, fontSize: 12, lineHeight: 17 },
});
