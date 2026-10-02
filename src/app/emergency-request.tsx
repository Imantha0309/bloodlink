import { StyleSheet, Text, View } from "react-native";

import { AuthPlaceholderScreen } from "@/components/auth/auth-placeholder-screen";
import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";

/**
 * Zero-login emergency request is not implemented yet.
 *
 * No request is created by arriving here — nothing is submitted, stored or sent
 * to a backend. This route exists so the "Request Blood Instantly" entry point
 * on the login screen resolves instead of dead-ending.
 *
 * TODO: build the anonymous urgent-request form (patient, blood group, units,
 * hospital) and wire it to the triage queue.
 */
export default function EmergencyRequestScreen() {
  const { session } = useAuth();

  // Reachable with or without a session, so back must respect the guard
  // state: a signed-in user would be bounced off /login if sent there.
  const backFallback = session ? ROLE_HOME[session.user.role] : ROUTES.login;

  return (
    <AuthPlaceholderScreen
      title="Emergency Request"
      icon="alert-triangle"
      description="Urgent requests are verified by the triage team within 2 minutes, without an account."
      backFallback={backFallback}
    >
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          No request has been created. This screen is a placeholder until the
          emergency flow is built.
        </Text>
      </View>
    </AuthPlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  notice: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.field,
    backgroundColor: Surface.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  noticeText: {
    ...Typography.small,
    color: Surface.textSecondary,
    textAlign: "center",
  },
});