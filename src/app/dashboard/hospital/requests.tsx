import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HospitalHeader } from "@/components/hospital/hospital-header";
import { RequisitionCard } from "@/components/hospital/requisition-card";
import { AsyncState } from "@/components/ui/async-state";
import { Blood, Surface } from "@/constants/colors";
import { HOSPITAL_CENTER } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useHospitalRequisitions, toRequisition } from "@/hooks/use-hospital-requisitions";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/**
 * Full requisition board — everything Home summarises.
 *
 * Fed by the live open queue rather than the fixtures, so every card here is a
 * real request the station can correct or withdraw through "Manage Requisition".
 */
export default function HospitalRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { requests, isLoading, error } = useHospitalRequisitions();

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
          subtitle="Hospital Staff Dashboard"
          initials={initialsOf(session?.user.fullName)}
        />

        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              Emergency Requisitions
            </Text>

            <Text style={styles.subtitle}>Active board at {HOSPITAL_CENTER}</Text>
          </View>

          <View style={styles.countPill}>
            <Text style={styles.countText}>{requests.length}</Text>
          </View>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={requests.length === 0}
          emptyTitle="No open requisitions"
          emptyMessage="Requests raised on the zero-login path land here for triage."
        >
          <View style={styles.list}>
            {requests.map((request, index) => (
              <RequisitionCard
                key={request.id}
                item={toRequisition(request, index)}
                onManage={() => {
                  router.push({
                    pathname: ROUTES.manageRequest,
                    params: { id: request.id },
                  });
                }}
              />
            ))}
          </View>
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

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },

  headingText: {
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

  countPill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  countText: {
    ...Typography.label,
    color: Blood.primary,
  },

  list: {
    gap: 10,
  },
});
