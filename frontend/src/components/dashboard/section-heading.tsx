import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type SectionHeadingProps = {
  label: string;
  /** Trailing note, e.g. a count or a caveat. */
  trailing?: ReactNode;
};

/** Small uppercase heading that separates dashboard blocks. */
export function SectionHeading({ label, trailing }: SectionHeadingProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>

      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  label: {
    ...Typography.micro,
    color: Surface.textMuted,
  },
});
