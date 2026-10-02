import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type EmergencyRequestCardProps = {
  onPress: () => void;
  title?: string;
  badge?: string;
  description?: string;
  actionLabel?: string;
};

/**
 * Account-free path into an urgent request.
 *
 * Visually adjacent to the emergency concept but deliberately quieter than the
 * sign-in button — the tinted panel and outlined action keep the normal login
 * as the primary action on the screen.
 */
export function EmergencyRequestCard({
  onPress,
  title = "In an active emergency?",
  badge = "Zero Login",
  description = "You can create an immediate urgent request without an account. Our rapid triage team verifies within 2 minutes.",
  actionLabel = "Request Blood Instantly",
}: EmergencyRequestCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBadge}>
            <Feather name="alert-triangle" size={14} color={Blood.dark} />
          </View>

          <Text style={styles.title}>{title}</Text>
        </View>

        <View style={styles.pill}>
          <Text style={styles.pillText}>{badge}</Text>
        </View>
      </View>

      <Text style={styles.description}>{description}</Text>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        accessibilityHint="Opens urgent blood request without signing in"
        hitSlop={4}
        style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
      >
        <Text style={styles.actionText}>{actionLabel}</Text>

        <Feather name="arrow-right" size={15} color={Blood.dark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Surface.softRed,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 10,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: Surface.card,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    ...Typography.label,
    color: Blood.dark,
    flexShrink: 1,
  },

  pill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: Blood.dark,
  },

  description: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    minHeight: 44,
    // Grows the touch target vertically without shifting the text.
    paddingVertical: 8,
    paddingRight: 10,
  },

  actionPressed: {
    opacity: 0.6,
  },

  actionText: {
    ...Typography.label,
    color: Blood.dark,
  },
});