import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type EmergencyAlertCardProps = {
  onPress: () => void;
};

/**
 * The screen's primary call to action: one high-contrast red card that drives
 * the blood-request flow.
 *
 * A muted decorative glyph sits in the trailing corner for depth. It is
 * low-contrast and non-interactive so it reads as texture rather than as a
 * second, competing action.
 */
export function EmergencyAlertCard({ onPress }: EmergencyAlertCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.pill}>
          <View style={styles.dot} />

          <Text style={styles.pillText} numberOfLines={1}>
            CRITICAL RESPONSE
          </Text>
        </View>

        <Feather name="radio" size={54} color={Surface.card} style={styles.decorative} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          Are you in an emergency?
        </Text>

        <Text style={styles.body}>
          Request blood urgently and notify nearby matching donors within minutes.
        </Text>
      </View>

      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Request Blood Now"
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
      >
        <Text style={styles.ctaText}>Request Blood Now</Text>

        <Feather name="arrow-right" size={13} color={Blood.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.field,
    padding: 16,
    backgroundColor: Blood.primary,
    ...Elevation.card,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Blood.primary,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.7,
    color: Blood.primary,
  },

  /** Faint texture behind the pill; never interactive. */
  decorative: {
    opacity: 0.16,
  },

  copy: {
    gap: 5,
    marginTop: 12,
    marginBottom: 14,
  },

  title: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: Surface.onPrimary,
  },

  body: {
    ...Typography.small,
    fontSize: 11,
    lineHeight: 16,
    color: Surface.onPrimary,
    opacity: 0.85,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: Radius.sm,
    backgroundColor: Surface.card,
  },

  ctaPressed: {
    opacity: 0.85,
  },

  ctaText: {
    ...Typography.small,
    fontSize: 12.5,
    letterSpacing: 0.1,
    fontWeight: "700",
    color: Blood.primary,
  },
});