import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { FontSize, Typography } from "@/constants/typography";

type NumberedSectionProps = {
  /** 1-based position, shown in the red badge. */
  step: number;
  title: string;
  /** Optional line under the title, e.g. what the fields are used for. */
  hint?: string;
};

/**
 * Heading for one numbered block of the join flow.
 *
 * Distinct from the dashboard's `SectionHeading`, which is an unnumbered
 * uppercase micro-label — these blocks are numbered and carry a title, so they
 * need the badge and the extra type weight.
 */
export function NumberedSection({ step, title, hint }: NumberedSectionProps) {
  return (
    <View style={styles.container} accessibilityRole="header">
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{step}</Text>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {hint === undefined ? null : <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  badge: {
    width: 18,
    height: 18,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 9,
    lineHeight: 12,
    color: Surface.onPrimary,
  },

  title: {
    ...Typography.label,
    fontSize: FontSize.cardTitle,
    color: Surface.text,
    flexShrink: 1,
  },

  hint: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },
});