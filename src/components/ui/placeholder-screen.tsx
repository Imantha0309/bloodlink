import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AuthHeader } from "@/components/auth/auth-header";
import { Radius } from "@/constants/radius";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type PlaceholderScreenProps = {
  title: string;
  /** What this screen will do once built. */
  description: string;
  icon: ComponentProps<typeof Feather>["name"];
  onBack: () => void;
  /** Extra content below the message, e.g. a sign-out action. */
  footer?: ReactNode;
};

/**
 * Shared stand-in for destinations the home screen links to but that are not
 * built yet.
 *
 * Every unreachable target renders this rather than a dead press handler, so
 * navigation always resolves and the screen states why it is empty. Replace a
 * screen's body with real content and drop this usage.
 */
export function PlaceholderScreen({
  title,
  description,
  icon,
  onBack,
  footer,
}: PlaceholderScreenProps) {
  return (
    <View style={styles.screen}>
      <AuthHeader title={title} onBack={onBack} gap={20} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconBadge}>
            <Feather name={icon} size={22} color={Surface.accentBlue} />
          </View>

          <Text style={styles.heading} accessibilityRole="header">
            {title}
          </Text>

          <Text style={styles.description}>{description}</Text>
        </View>

        {footer}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  body: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  card: {
    alignItems: "center",
    gap: 8,
    borderRadius: Radius.field,
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
    marginBottom: 4,
  },

  heading: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
    textAlign: "center",
  },

  description: {
    ...Typography.small,
    fontSize: 12,
    lineHeight: 18,
    color: Surface.textSecondary,
    textAlign: "center",
  },
});