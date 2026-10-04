import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type SectionHeadingProps = {
  /** Section label, e.g. "Hospital Name". */
  label: string;
  /** Leading glyph. Drawn in the brand red, as in the reference design. */
  icon?: ComponentProps<typeof Feather>["name"];
  /** Trailing slot, e.g. a badge pill or the "Push Alerts" toggle. */
  right?: ReactNode;
};

/**
 * Section title for the request wizard: red glyph, label, optional trailing node.
 *
 * The wizard's sections are too dense for `Typography.label` at 13px, and they
 * all lead with a small red icon, so they share this row rather than each
 * restating it. Presentational only.
 */
export function SectionHeading({ label, icon, right }: SectionHeadingProps) {
  return (
    <View style={styles.row}>
      {icon !== undefined ? <Feather name={icon} size={11} color={Blood.primary} /> : null}

      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>

      {right !== undefined ? <View style={styles.trailing}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  label: {
    ...Typography.micro,
    flexShrink: 1,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  /** Holds the trailing slot so the label can shrink instead of pushing it off. */
  trailing: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
});