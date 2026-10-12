import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

import { FieldError } from "../auth/field-error";

type OptionChipsProps<T extends string> = {
  label: string;
  options: readonly T[];
  value: T | null;
  onChange: (value: T) => void;
  error?: string | null;
  /** Display text when it differs from the raw value, e.g. "Critical". */
  labelFor?: (value: T) => string;
  /** Optional per-option caption, e.g. "Universal donor". */
  captionFor?: (value: T) => string | undefined;
  /** Rendered at the trailing edge of the label row, e.g. a "Push Alerts" note. */
  labelRight?: ReactNode;
};

/**
 * Compact single-select chip row.
 *
 * Suits small option sets where seeing every choice at once is an advantage —
 * blood groups and urgency levels. A long list (districts) wants `SelectField`
 * instead.
 */
export function OptionChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error = null,
  labelFor,
  captionFor,
  labelRight,
}: OptionChipsProps<T>) {
  const caption = value !== null ? captionFor?.(value) : undefined;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {labelRight}
      </View>

      <View style={styles.row}>
        {options.map((option) => {
          const isSelected = option === value;

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={labelFor?.(option) ?? option}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && !isSelected && styles.chipPressed,
              ]}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {labelFor?.(option) ?? option}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {caption !== undefined ? <Text style={styles.caption}>{caption}</Text> : null}

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

  label: {
    ...Typography.label,
    color: Surface.text,
    flexShrink: 1,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    minWidth: 56,
    minHeight: 44,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.field,
    borderWidth: 1.5,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  chipSelected: {
    borderColor: Blood.primary,
    backgroundColor: Surface.softRed,
  },

  chipPressed: {
    borderColor: Surface.borderStrong,
  },

  chipText: {
    ...Typography.label,
    color: Surface.text,
  },

  chipTextSelected: {
    color: Blood.primary,
  },

  caption: {
    ...Typography.small,
    color: Surface.textMuted,
    marginTop: 6,
  },
});
