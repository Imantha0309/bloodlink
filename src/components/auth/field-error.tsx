import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Radius } from "@/constants/radius";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type FieldErrorProps = {
  /** Null renders nothing — the reserved space keeps the layout from jumping. */
  message: string | null;
  /**
   * Whether to hold the row open when there is no message.
   *
   * Defaults to `true`, so a form does not reflow as errors clear. Dense screens
   * pass `false`: with five fields each reserving a row, the reserved gaps cost
   * more vertical space than the shifting is worth.
   */
  reserveSpace?: boolean;
};

/**
 * Inline validation message. By default always renders its row so showing or
 * clearing an error never reflows the form, and is announced by screen readers
 * when it appears.
 */
export function FieldError({ message, reserveSpace = true }: FieldErrorProps) {
  const hasError = message !== null;
  const placeholder = reserveSpace && !hasError;

  return (
    <View
      style={[styles.container, placeholder && styles.containerPlaceholder]}
      accessibilityLiveRegion="polite"
    >
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

  /** Collapsed: no top margin and no reserved height. */
  containerPlaceholder: {
    marginTop: 0,
    minHeight: 0,
  },

  text: {
    ...Typography.small,
    color: Surface.danger,
    flexShrink: 1,
    borderRadius: Radius.sm,
  },
});