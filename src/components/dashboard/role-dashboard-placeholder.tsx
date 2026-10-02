import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { type ComponentProps } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import type { UserRole } from "@/services/auth";

const ROLE_ICON: Record<UserRole, ComponentProps<typeof Feather>["name"]> = {
  recipient: "heart",
  donor: "users",
  hospital: "home",
  admin: "shield",
};

const ROLE_LABEL: Record<UserRole, string> = {
  recipient: "Recipient",
  donor: "Donor",
  hospital: "Hospital",
  admin: "Admin",
};

type RoleDashboardPlaceholderProps = {
  role: UserRole;
};

/**
 * Stand-in for each role dashboard.
 *
 * It proves the sign-in handoff works end to end: the session written by the
 * auth adapter is read back here, and the resolved user is shown. The dashboard
 * content itself is out of scope.
 */
export function RoleDashboardPlaceholder({ role }: RoleDashboardPlaceholderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  // Reads the same session the guard admitted the user with, rather than
  // re-reading storage independently.
  const user = session?.user ?? null;

  async function handleSignOut() {
    // The session has to be cleared before navigating: the login screen is
    // guarded off while authenticated, so navigating first would bounce
    // straight back here.
    await signOut();
    router.replace(ROUTES.login);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader
          title={`${ROLE_LABEL[role]} Dashboard`}
          onBack={() => {
            void handleSignOut();
          }}
          backAccessibilityLabel="Sign out and return to login"
        />

        <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.card}>
            <View style={styles.badge}>
              <Feather name={ROLE_ICON[role]} size={22} color={Blood.primary} />
            </View>

            <Text style={styles.role} accessibilityRole="header">
              {ROLE_LABEL[role]} Dashboard
            </Text>

            <Text style={styles.description}>
              Signed in as {user?.fullName ?? "unknown user"}
              {user?.district ? ` · ${user.district}` : ""}
            </Text>

            <Text style={styles.description}>
              Session restored from storage: {session ? "yes" : "no"}
            </Text>

            <View style={styles.todo}>
              <Feather name="alert-circle" size={13} color={Blood.dark} />

              <Text style={styles.todoText}>Placeholder — dashboard not built yet.</Text>
            </View>

            <Pressable
              onPress={() => {
                void handleSignOut();
              }}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
            >
              <Text style={styles.signOutText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
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

  body: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },

  badge: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },

  role: {
    ...Typography.title,
    color: Surface.text,
    textAlign: "center",
  },

  description: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  todo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  todoText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: Blood.dark,
  },

  signOut: {
    marginTop: 14,
    minHeight: 44,
    paddingHorizontal: 24,
    justifyContent: "center",
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.iconWash,
  },

  signOutPressed: {
    backgroundColor: Surface.border,
  },

  signOutText: {
    ...Typography.button,
    color: Surface.text,
  },
});