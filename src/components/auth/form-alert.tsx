import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type FormAlertProps = {
  /** Null renders an empty box so nothing shifts when the alert appears. */
  message: string | null;
};

/**
 * Form-level failure, e.g. wrong credentials or no connectivity.
 *
 * Distinct from `FieldError` because it is about the submission as a whole,
 * not one input. Copy arrives pre-sanitised from `apiErrorMessage`.
 */
export function FormAlert({ message }: FormAlertProps) {
  const hasMessage = message !== null;

  return (
    <View style={styles.container} accessibilityLiveRegion="assertive">
      {hasMessage ? (
        <View style={styles.alert}>
          <Feather name="alert-circle" size={15} color={Surface.danger} />

          <Text style={styles.text} accessibilityRole="alert">
            {message}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 0,
  },

  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 13,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  text: {
    ...Typography.small,
    color: Blood.dark,
    flexShrink: 1,
  },
});