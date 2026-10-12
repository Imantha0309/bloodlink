import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { FontSize, Typography } from "@/constants/typography";

type PrimaryAuthButtonProps = {
  label: string;
  onPress: () => void;
  /** Replaces the label with a spinner plus `loadingLabel`. */
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  icon?: ComponentProps<typeof Feather>["name"];
  /** Rendered at the far right instead of beside the label, e.g. "arrow-right". */
  trailingIcon?: ComponentProps<typeof Feather>["name"];
  /**
   * `compact` trims the height and label size for information-dense screens
   * whose values sit at 9-11px, where the 54px/15px default reads oversized.
   */
  size?: "default" | "compact";
};

/**
 * Full-width primary action for the authentication flow. Owns its own pressed,
 * disabled and loading visuals so every screen gets identical feedback.
 *
 * `loading` also disables the button, which is what stops a second sign-in
 * request being fired while one is in flight.
 */
export function PrimaryAuthButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  loadingLabel,
  icon,
  trailingIcon,
  size = "default",
}: PrimaryAuthButtonProps) {
  const isInactive = disabled || loading;
  const isCompact = size === "compact";
  const iconSize = isCompact ? 14 : 17;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={loading ? loadingLabel ?? label : label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isCompact && styles.buttonCompact,
        isInactive && styles.buttonDisabled,
        pressed && !isInactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="small" color={Surface.onPrimary} />

          <Text style={[styles.label, isCompact && styles.labelCompact]}>
            {loadingLabel ?? label}
          </Text>
        </View>
      ) : (
        <View style={[styles.content, trailingIcon !== undefined && styles.contentTrailing]}>
          {icon ? <Feather name={icon} size={iconSize} color={Surface.onPrimary} /> : null}

          <Text style={[styles.label, isCompact && styles.labelCompact]}>{label}</Text>

          {/* Pinned to the trailing edge so the label stays optically centred
              regardless of how long it is. */}
          {trailingIcon ? (
            <View style={styles.trailing}>
              <Feather name={trailingIcon} size={iconSize} color={Surface.onPrimary} />
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    minHeight: ControlHeight.button,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    ...Elevation.button,
  },

  buttonPressed: {
    backgroundColor: Blood.dark,
    transform: [{ scale: 0.985 }],
  },

  buttonCompact: {
    minHeight: 44,
    borderRadius: Radius.sm,
    paddingHorizontal: 16,
  },

  buttonDisabled: {
    backgroundColor: Surface.borderStrong,
    shadowOpacity: 0,
    elevation: 0,
  },

  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  /** Fills the button so the label centres against the full width. */
  contentTrailing: {
    width: "100%",
  },

  trailing: {
    position: "absolute",
    right: 20,
  },

  label: {
    ...Typography.button,
    color: Surface.onPrimary,
  },

  labelCompact: {
    fontSize: FontSize.small,
    letterSpacing: 0,
  },
});