import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type EmptyNoteProps = {
  title: string;
  message: string;
  icon?: ComponentProps<typeof Feather>["name"];
};

/**
 * In-place "nothing here" note for one section of a dashboard.
 *
 * Distinct from `AsyncState`'s empty mode, which replaces a whole screen: a
 * dashboard with an empty queue should still show its stats and its other
 * blocks.
 */
export function EmptyNote({ title, message, icon = "inbox" }: EmptyNoteProps) {
  return (
    <View style={styles.card}>
      <View style={styles.badge}>
        <Feather name={icon} size={16} color={Surface.textMuted} />
      </View>

      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderStyle: "dashed",
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
  },

  badge: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  text: {
    flex: 1,
    gap: 1,
  },

  title: {
    ...Typography.label,
    color: Surface.text,
  },

  message: {
    ...Typography.small,
    color: Surface.textSecondary,
  },
});
