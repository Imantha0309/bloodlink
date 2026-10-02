import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { RoleCard } from "@/components/auth/role-card";
import { StepIndicator } from "@/components/auth/step-indicator";
import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_CARDS, ROLE_LABEL, type SelfRegisterRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Step 1 of the sign-up flow: choose how you join the network.
 *
 * The selection is passed to registration as a route param, since Expo Router
 * navigates by URL rather than by prop. `SELF_REGISTER_ROLES` in
 * `@/constants/roles` is the single source of truth for what is offered here.
 */
export default function RoleSelectScreen() {
  const router = useRouter();
  const handleBack = useAuthBack(ROUTES.login);

  // Deliberately no default: the user must choose, so the continue button's
  // disabled state is reachable.
  const [selectedRole, setSelectedRole] = useState<SelfRegisterRole | null>(null);

  function handleContinue() {
    if (selectedRole === null) {
      return;
    }

    router.push({ pathname: ROUTES.register, params: { role: selectedRole } });
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <AuthHeader gap={14} onBack={handleBack} right={<StepIndicator badge="3" label="STEP 1 OF 3 • PROFILE SETUP" />} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title} accessibilityRole="header">
            Choose Your Role
          </Text>

          <Text style={styles.subtitle}>Select how you will participate in the blood network</Text>

          {/* Informational only — deliberately not pressable. */}
          <View style={styles.notice} accessible accessibilityRole="summary">
            <View style={styles.noticeIcon}>
              <Feather name="shield" size={14} color={Surface.textSecondary} />
            </View>

            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>Universal Emergency Protocol</Text>

              <Text style={styles.noticeText}>
                Roles are verified for expedited dispatch during critical situations.
              </Text>
            </View>
          </View>

          {ROLE_CARDS.map((meta) => (
            <RoleCard
              key={meta.role}
              meta={meta}
              selected={selectedRole === meta.role}
              onPress={() => setSelectedRole(meta.role)}
            />
          ))}

          <PrimaryAuthButton
            label={selectedRole === null ? "Continue" : `Continue as ${ROLE_LABEL[selectedRole]}`}
            trailingIcon="arrow-right"
            disabled={selectedRole === null}
            onPress={handleContinue}
          />

          <View style={styles.security} accessible accessibilityLabel="Secured with end-to-end medical encryption">
            <Feather name="lock" size={11} color={Surface.textMuted} />

            <Text style={styles.securityText}>Secured with end-to-end medical encryption</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  safeArea: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.body,
    marginTop: -6,
    marginBottom: 2,
    color: Surface.textSecondary,
  },

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
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  noticeBody: {
    flex: 1,
    gap: 2,
  },

  noticeTitle: {
    ...Typography.label,
    color: Surface.text,
  },

  noticeText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  security: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingTop: 2,
  },

  securityText: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },
});