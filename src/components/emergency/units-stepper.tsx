import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { FieldError } from "@/components/auth/field-error";
import { Surface } from "@/constants/colors";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { ML_PER_UNIT } from "@/utils/validation";

/** Mirrors the server's 1–20 bound, so the buttons can never request the invalid value. */
export const UNITS_MIN = 1;
export const UNITS_MAX = 20;

type UnitsStepperProps = {
  /** Current quantity. */
  units: number;
  onChange: (units: number) => void;
  error?: string | null;
};

function formatUnits(units: number): string {
  return `${units} Unit${units === 1 ? "" : "s"}`;
}

/**
 * Total volume for a quantity.
 *
 * No thousands separator: the design shows `1350 ml Total`, not `1,350 ml`, and
 * the cap of 20 units keeps the number four digits at most.
 */
function formatMl(ml: number): string {
  return String(ml);
}

/**
 * Quantity stepper for whole-blood units, with the total volume kept live.
 *
 * Just the note and the pale-blue selector — the card's heading, and the
 * "Critical Need" badge that sits on that heading's line, belong to the caller so
 * the heading row spans the full card width.
 *
 * The two buttons clamp rather than disable at the bounds: a greyed button is
 * clearer about *why* nothing happens when you keep tapping, and the disabled
 * state still has to be announced. Callers own the bounds via `UNITS_MIN`/`UNITS_MAX`.
 */
export function UnitsStepper({ units, onChange, error = null }: UnitsStepperProps) {
  const atMin = units <= UNITS_MIN;
  const atMax = units >= UNITS_MAX;

  function step(delta: number) {
    const next = units + delta;

    if (next < UNITS_MIN || next > UNITS_MAX) {
      return;
    }

    onChange(next);
  }

  return (
    <View>
      <Text style={styles.unitNote}>
        1 Unit = {ML_PER_UNIT} ml Whole Blood
      </Text>

      <View style={[styles.card, error !== null && styles.cardError]}>
        <Pressable
          onPress={() => step(-1)}
          disabled={atMin}
          accessibilityRole="button"
          accessibilityLabel="Decrease units"
          accessibilityState={{ disabled: atMin }}
          hitSlop={HIT_SLOP_MIN / 2}
          style={({ pressed }) => [
            styles.stepper,
            atMin && styles.stepperDisabled,
            pressed && !atMin && styles.stepperPressed,
          ]}
        >
          <Feather
            name="minus"
            size={15}
            color={atMin ? Surface.textMuted : Surface.text}
          />
        </Pressable>

        <View style={styles.total}>
          <Text style={styles.quantity} accessibilityRole="text">
            {formatUnits(units)}
          </Text>

          <Text style={styles.volume}>{formatMl(units * ML_PER_UNIT)} ml Total</Text>
        </View>

        <Pressable
          onPress={() => step(1)}
          disabled={atMax}
          accessibilityRole="button"
          accessibilityLabel="Increase units"
          accessibilityState={{ disabled: atMax }}
          hitSlop={HIT_SLOP_MIN / 2}
          style={({ pressed }) => [
            styles.stepper,
            atMax && styles.stepperDisabled,
            pressed && !atMax && styles.stepperPressed,
          ]}
        >
          <Feather
            name="plus"
            size={15}
            color={atMax ? Surface.textMuted : Surface.text}
          />
        </Pressable>
      </View>

      <FieldError message={error} reserveSpace={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  unitNote: {
    ...Typography.micro,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 7,
    borderRadius: Radius.sm,
    padding: 10,
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  cardError: {
    borderColor: Surface.danger,
  },

  stepper: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  stepperPressed: {
    backgroundColor: Surface.border,
  },

  stepperDisabled: {
    opacity: 0.55,
  },

  total: {
    flex: 1,
    alignItems: "center",
    gap: 1,
  },

  quantity: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Surface.text,
  },

  volume: {
    ...Typography.micro,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});