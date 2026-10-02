import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type StepProgressProps = {
  /** Short segment labels, e.g. `["Identity", "Medical", "Security"]`. */
  steps: readonly string[];
  /** 1-based index of the step currently on screen. */
  activeStep: number;
};

/**
 * Three-segment progress rail for the join flow.
 *
 * Distinct from `StepIndicator`, which is a single "N • STEP X OF Y" badge
 * sized for the header slot. This is a full-width rail because the reference
 * puts it under the title, where it can show every segment at once.
 */
export function StepProgress({ steps, activeStep }: StepProgressProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${activeStep} of ${steps.length}`}
      accessibilityValue={{ min: 1, max: steps.length, now: activeStep }}
    >
      {steps.map((label, index) => {
        const position = index + 1;
        const isActive = position === activeStep;
        const isDone = position < activeStep;

        return (
          <View key={label} style={styles.segment}>
            <View
              style={[
                styles.track,
                (isActive || isDone) && styles.trackFilled,
                isActive && styles.trackActive,
              ]}
            />

            <Text
              style={[styles.label, (isActive || isDone) && styles.labelFilled, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
  },

  segment: {
    flex: 1,
    gap: 5,
  },

  track: {
    height: 3,
    borderRadius: Radius.full,
    backgroundColor: Surface.border,
  },

  trackFilled: {
    backgroundColor: Surface.softRedBorder,
  },

  trackActive: {
    backgroundColor: Blood.primary,
  },

  label: {
    ...Typography.micro,
    fontSize: 8.5,
    letterSpacing: 0.2,
    color: Surface.textMuted,
  },

  labelFilled: {
    color: Surface.textSecondary,
  },

  labelActive: {
    color: Blood.primary,
  },
});