/**
 * The one "nothing here" pattern for whole screens and sections.
 *
 * `AsyncState` uses it for its empty mode; screens with an empty list but
 * their own chrome render it directly, optionally with a call to action.
 */

import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type EmptyStateAction = {
  label: string;
  onPress: () => void;
};

type EmptyStateProps = {
  icon?: ComponentProps<typeof Feather>["name"];
  title: string;
  message?: string;
  action?: EmptyStateAction;
  /** Denser variant for one section inside a busy dashboard. */
  compact?: boolean;
};

export function EmptyState({
  icon = "inbox",
  title,
  message,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.centered, compact && styles.compact]}>
      <View style={styles.iconBadge}>
        <Feather name={icon} size={20} color={Surface.textMuted} />
      </View>

      <Text style={styles.title}>{title}</Text>

      {message !== undefined ? <Text style={styles.message}>{message}</Text> : null}

      {action !== undefined ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Feather name="plus" size={14} color={Blood.primary} />
          <Text style={styles.actionText}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },

  compact: {
    paddingVertical: 20,
  },

  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    marginBottom: 4,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
    textAlign: "center",
  },

  message: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: ControlHeight.iconButton,
    marginTop: 8,
    paddingHorizontal: 18,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  actionPressed: {
    opacity: 0.7,
  },

  actionText: {
    ...Typography.label,
    color: Blood.primary,
  },
});
