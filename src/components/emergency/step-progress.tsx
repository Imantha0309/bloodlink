import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type StepProgressProps = {
  /** 1-based position of the visible step. */
  current: number;
  total: number;
  /** Short name of the visible step, shown on the trailing edge. */
  label: string;
};

/**
 * Thin segmented progress bar with a step counter and the current step's name.
 *
 * `StepIndicator` covers the auth flows, but those are badge-plus-text; a
 * three-step request wizard needs the bar itself to show how much is left.
 * Segments are `flex: 1` so the bar spans any width without fixed pixel maths.
 */
export function StepProgress({ current, total, label }: StepProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <View style={styles.counter}>
          <View style={styles.dot} />

          <Text style={styles.counterText}>
            Step {current} of {total}
          </Text>
        </View>

        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>

      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: current }}
        accessibilityLabel={`Step ${current} of ${total}: ${label}`}
      >
        {Array.from({ length: total }, (_unused, index) => {
          const step = index + 1;
          const isDone = step < current;
          const isCurrent = step === current;

          return (
            <View
              key={step}
              style={[
                styles.segment,
                (isDone || isCurrent) && styles.segmentFilled,
                isCurrent && styles.segmentCurrent,
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: Surface.card,
  },

  labels: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Blood.primary,
  },

  counterText: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.2,
    color: Blood.primary,
  },

  label: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.2,
    fontWeight: "500",
    color: Surface.textSecondary,
    flexShrink: 1,
  },

  track: {
    flexDirection: "row",
    gap: 4,
  },

  segment: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Surface.border,
  },

  /** Completed and current segments share the fill; current is made taller. */
  segmentFilled: {
    backgroundColor: Blood.primary,
    opacity: 0.4,
  },

  segmentCurrent: {
    opacity: 1,
  },
});