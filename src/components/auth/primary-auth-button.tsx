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
import { Typography } from "@/constants/typography";

type PrimaryAuthButtonProps = {
  label: string;
  onPress: () => void;
  /** Replaces the label with a spinner plus `loadingLabel`. */
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  icon?: ComponentProps<typeof Feather>["name"];
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
}: PrimaryAuthButtonProps) {
  const isInactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isInactive}
      accessibilityRole="button"
      accessibilityLabel={loading ? loadingLabel ?? label : label}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        isInactive && styles.buttonDisabled,
        pressed && !isInactive && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="small" color={Surface.onPrimary} />

          <Text style={styles.label}>{loadingLabel ?? label}</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {icon ? <Feather name={icon} size={17} color={Surface.onPrimary} /> : null}

          <Text style={styles.label}>{label}</Text>
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

  label: {
    ...Typography.button,
    color: Surface.onPrimary,
  },
});