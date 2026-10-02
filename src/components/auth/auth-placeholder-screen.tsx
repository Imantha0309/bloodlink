import { Feather } from "@expo/vector-icons";
import type { Href } from "expo-router";
import type { ComponentProps, ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";

type AuthPlaceholderScreenProps = {
  title: string;
  icon: ComponentProps<typeof Feather>["name"];
  /** What this screen will eventually do. Rendered as the visible TODO. */
  description: string;
  /** Optional extra content, e.g. an emergency warning banner. */
  children?: ReactNode;
  /**
   * Where back goes when there is nothing to pop (cold start / deep link).
   * Defaults to the login screen; pass a role home where the screen is also
   * reachable while signed in.
   */
  backFallback?: Href;
};

/**
 * Shared shell for screens that are reachable but not implemented yet.
 *
 * Every destination the login screen links to has a placeholder so no link is
 * a dead end. Each one states plainly what still has to be built.
 */
export function AuthPlaceholderScreen({
  title,
  icon,
  description,
  children,
  backFallback = ROUTES.login,
}: AuthPlaceholderScreenProps) {
  const insets = useSafeAreaInsets();
  const handleBack = useAuthBack(backFallback);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader title={title} onBack={handleBack} />

        <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.card}>
            <View style={styles.badge}>
              <Feather name={icon} size={22} color={Blood.primary} />
            </View>

            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>

            <Text style={styles.description}>{description}</Text>

            <View style={styles.todo}>
              <Feather name="alert-circle" size={13} color={Blood.dark} />

              <Text style={styles.todoText}>Placeholder — not implemented yet.</Text>
            </View>

            {children}
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
    gap: 10,
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

  title: {
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
});