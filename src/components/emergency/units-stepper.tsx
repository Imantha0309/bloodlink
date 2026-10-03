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
  /** Badges the urgency, e.g. a red "Critical Need" chip. */
  badge?: string;
  error?: string | null;
};

function formatUnits(units: number): string {
  return `${units} Unit${units === 1 ? "" : "s"}`;
}

/** Thousands separator, so 3 units reads "1,350 ml" rather than "1350 ml". */
function formatMl(ml: number): string {
  return ml.toLocaleString("en-US");
}

/**
 * Quantity stepper for whole-blood units, with the total volume kept live.
 *
 * The two buttons clamp rather than disable at the bounds: a greyed button is
 * clearer about *why* nothing happens when you keep tapping, and the disabled
 * state still has to be announced. Callers own the bounds via `UNITS_MIN`/`UNITS_MAX`.
 */
export function UnitsStepper({ units, onChange, badge, error = null }: UnitsStepperProps) {
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
      <View style={styles.labelRow}>
        <Text style={styles.unitNote}>
          1 Unit = ~{ML_PER_UNIT} ml Whole Blood
        </Text>

        {badge !== undefined ? (
          <View style={styles.badge}>
            <View style={styles.badgeDot} />

            <Text style={styles.badgeText} numberOfLines={1}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>

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
            size={16}
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
            size={16}
            color={atMax ? Surface.textMuted : Surface.text}
          />
        </Pressable>
      </View>

      <FieldError message={error} />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },

  unitNote: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
    flexShrink: 1,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  badgeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Surface.danger,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Surface.danger,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: Radius.field,
    padding: 12,
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  cardError: {
    borderColor: Surface.danger,
  },

  stepper: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
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
    gap: 2,
  },

  quantity: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Surface.text,
  },

  volume: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});