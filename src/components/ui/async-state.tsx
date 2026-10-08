import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

import { EmptyState, type EmptyStateAction } from "./empty-state";

type AsyncStateProps = {
  isLoading: boolean;
  error: string | null;
  /** Renders the empty message in place of `children`. */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  /** Optional call to action inside the empty state. */
  emptyAction?: EmptyStateAction;
  /** Shape-matched placeholder rendered instead of the plain spinner. */
  skeleton?: ReactNode;
  onRetry?: () => void;
  children: ReactNode;
};

/**
 * Loading / error / empty wrapper for anything fed by the API.
 *
 * Centralises the three non-happy states so every dashboard and list handles
 * them the same way — and so a failed fetch never renders as a blank screen.
 */
export function AsyncState({
  isLoading,
  error,
  isEmpty = false,
  emptyTitle = "Nothing here yet",
  emptyMessage = "There is nothing to show right now.",
  emptyAction,
  skeleton,
  onRetry,
  children,
}: AsyncStateProps) {
  if (isLoading) {
    if (skeleton !== undefined) {
      return <>{skeleton}</>;
    }

    return (
      <View style={styles.centered} accessibilityRole="progressbar" accessibilityLabel="Loading">
        <ActivityIndicator size="large" color={Blood.primary} />
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  if (error !== null) {
    return (
      <View style={styles.centered}>
        <View style={styles.iconBadge}>
          <Feather name="wifi-off" size={20} color={Blood.primary} />
        </View>

        <Text style={styles.title} accessibilityRole="alert">
          Could not load
        </Text>

        <Text style={styles.message}>{error}</Text>

        {onRetry !== undefined ? (
          <Pressable
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [styles.retry, pressed && styles.retryPressed]}
          >
            <Feather name="refresh-cw" size={14} color={Blood.primary} />
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },

  loadingText: {
    ...Typography.small,
    color: Surface.textSecondary,
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

  retry: {
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

  retryPressed: {
    opacity: 0.7,
  },

  retryText: {
    ...Typography.label,
    color: Blood.primary,
  },
});
