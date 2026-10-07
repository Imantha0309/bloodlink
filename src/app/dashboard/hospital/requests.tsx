import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HospitalHeader } from "@/components/hospital/hospital-header";
import { RequisitionCard } from "@/components/hospital/requisition-card";
import { Blood, Surface } from "@/constants/colors";
import { HOSPITAL_CENTER, REQUISITIONS, REQUISITION_TOTAL } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/** Full requisition board — everything Home summarises. */
export default function HospitalRequestsScreen() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

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
            <Text style={styles.countText}>{REQUISITION_TOTAL}</Text>
          </View>
        </View>

        <View style={styles.list}>
          {REQUISITIONS.map((item) => (
            <RequisitionCard key={item.reference} item={item} />
          ))}
        </View>
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
