import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Radius } from "@/constants/radius";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type FieldErrorProps = {
  /** Null renders nothing — the reserved space keeps the layout from jumping. */
  message: string | null;
};

/**
 * Inline validation message. Always renders its row so showing or clearing an
 * error never reflows the form, and is announced by screen readers when it
 * appears.
 */
export function FieldError({ message }: FieldErrorProps) {
  const hasError = message !== null;

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      {hasError ? (
        <>
          <Feather name="alert-circle" size={13} color={Surface.danger} />

          <Text style={styles.text} accessibilityRole="alert" selectable={false}>
            {message}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    minHeight: 16,
  },

  text: {
    ...Typography.small,
    color: Surface.danger,
    flexShrink: 1,
    borderRadius: Radius.sm,
  },
});