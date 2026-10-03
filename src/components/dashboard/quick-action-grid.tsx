import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type QuickActionIconName = ComponentProps<typeof Feather>["name"];

export type QuickAction = {
  key: string;
  title: string;
  icon: QuickActionIconName;
  onPress: () => void;
};

type QuickActionGridProps = {
  actions: QuickAction[];
};

/**
 * Two-up shortcut row below the active request.
 *
 * Children are `flex: 1` rather than fixed width, so the pair splits the row
 * evenly at any phone width instead of forcing horizontal scroll.
 */
export function QuickActionGrid({ actions }: QuickActionGridProps) {
  return (
    <View style={styles.grid}>
      {actions.map((action) => (
        <Pressable
          key={action.key}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.title}
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        >
          <View style={styles.iconBadge}>
            <Feather name={action.icon} size={15} color={Surface.accentBlue} />
          </View>

          <Text style={styles.title} numberOfLines={2}>
            {action.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 10,
  },

  card: {
    flex: 1,
    alignItems: "flex-start",
    gap: 9,
    borderRadius: Radius.field,
    padding: 12,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  cardPressed: {
    backgroundColor: Surface.iconWash,
  },

  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
  },

  title: {
    ...Typography.small,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Surface.text,
  },
});