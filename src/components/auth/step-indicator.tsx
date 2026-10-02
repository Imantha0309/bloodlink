import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type StepIndicatorProps = {
  /** The round step badge, e.g. the "3" in "3 · STEP 1 OF 3". */
  badge: string;
  /** Trailing meta text, e.g. "STEP 1 OF 3 • PROFILE SETUP". */
  label: string;
};

/**
 * Compact progress marker for the top of a multi-step flow.
 *
 * Lives in the header's right slot so it costs no vertical space of its own.
 */
export function StepIndicator({ badge, label }: StepIndicatorProps) {
  return (
    <View style={styles.container} accessible accessibilityLabel={label}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badge: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 9.5,
    lineHeight: 12,
    color: Surface.onPrimary,
  },

  label: {
    ...Typography.micro,
    fontSize: 9,
    color: Surface.textSecondary,
  },
});