import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

import { FieldError } from "../auth/field-error";

type SelectFieldProps = {
  /**
   * The field's name. Still the accessible name when `hideLabel` is set, so a
   * screen reader always announces the field even when the visible heading is
   * rendered elsewhere.
   */
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  /** Suppresses the visible label row; the field keeps `label` as its a11y name. */
  hideLabel?: boolean;
  /** Leading glyph, e.g. a pin for a facility field. */
  icon?: ComponentProps<typeof Feather>["name"];
  /**
   * Replaces the chevron — a check mark once a verified value is chosen.
   *
   * Falls back to the chevron when omitted, so every existing caller keeps its
   * current affordance.
   */
  trailingIcon?: ComponentProps<typeof Feather>["name"];
  /**
   * Colour for `trailingIcon`.
   *
   * A check mark is an approval, not a brand accent, so it reads green rather
   * than taking the button red. Defaults to the brand colour.
   */
  trailingTone?: "brand" | "success";
  /** Supporting line under the field. Hidden while an error is showing. */
  caption?: string;
  /**
   * `dense` trims the label, field height, type and radius for information-dense
   * screens — the emergency wizard, whose values sit at 9-11px — where the
   * 52px/13.5px default reads oversized. It also stops reserving a gap for the
   * error row, at the cost of the form reflowing as errors clear. The option
   * list modal is unaffected.
   */
  size?: "default" | "dense";
};

/**
 * Single-select field that opens a full-screen list.
 *
 * Used where the option set is too long for chips — the 25 Sri Lankan
 * districts, and the curated facility list — so the choices stay legible and
 * scrollable on a phone.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  error = null,
  hideLabel = false,
  icon,
  trailingIcon,
  trailingTone = "brand",
  caption,
  size = "default",
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = error !== null;
  const hasCaption = caption !== undefined && caption !== "" && !hasError;
  const isDense = size === "dense";
  const trailingColor = trailingTone === "success" ? Surface.successText : Blood.primary;

  function handleSelect(option: string) {
    onChange(option);
    setIsOpen(false);
  }

  return (
    <View>
      {hideLabel ? null : (
        <Text style={[styles.label, isDense && styles.labelDense]}>{label}</Text>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ?? placeholder }}
        accessibilityHint="Opens a list of options"
        style={({ pressed }) => [
          styles.field,
          isDense && styles.fieldDense,
          hasError && styles.fieldError,
          pressed && styles.fieldPressed,
        ]}
      >
        {icon !== undefined ? (
          <Feather
            name={icon}
            size={isDense ? 12 : 15}
            color={Surface.textMuted}
          />
        ) : null}

        <Text
          style={[
            value === null ? styles.placeholder : styles.value,
            isDense && styles.valueDense,
          ]}
          numberOfLines={1}
        >
          {value ?? placeholder}
        </Text>

        <Feather
          name={trailingIcon ?? "chevron-down"}
          size={isDense ? 13 : 16}
          color={trailingIcon === undefined ? Surface.textMuted : trailingColor}
        />
      </Pressable>

      {hasCaption ? (
        <Text style={[styles.caption, isDense && styles.captionDense]}>{caption}</Text>
      ) : null}

      <FieldError message={error} reserveSpace={!isDense} />

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        transparent={false}
      >
        <SafeAreaView style={styles.modal} edges={["top", "left", "right", "bottom"]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} accessibilityRole="header">
              {label}
            </Text>

            <Pressable
              onPress={() => setIsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
              style={({ pressed }) => [styles.close, pressed && styles.closePressed]}
            >
              <Feather name="x" size={18} color={Surface.text} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(option) => option}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item === value;

              return (
                <Pressable
                  onPress={() => handleSelect(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={({ pressed }) => [
                    styles.option,
                    isSelected && styles.optionSelected,
                    pressed && !isSelected && styles.optionPressed,
                  ]}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {item}
                  </Text>

                  {isSelected ? (
                    <Feather name="check" size={16} color={Blood.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.label,
    color: Surface.text,
    marginBottom: 8,
  },

  labelDense: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: -0.05,
    marginBottom: 5,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: ControlHeight.input,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: Surface.card,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  fieldDense: {
    height: 40,
    paddingHorizontal: 11,
    gap: 7,
    borderRadius: Radius.sm,
  },

  fieldPressed: {
    borderColor: Surface.borderStrong,
  },

  fieldError: {
    borderColor: Surface.danger,
  },

  value: {
    ...Typography.input,
    color: Surface.text,
    flex: 1,
  },

  valueDense: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: -0.05,
  },

  placeholder: {
    ...Typography.input,
    color: Surface.textMuted,
    flex: 1,
  },

  caption: {
    ...Typography.small,
    fontSize: 10,
    color: Surface.textMuted,
    marginTop: 6,
  },

  captionDense: {
    fontSize: 7.5,
    lineHeight: 11,
    marginTop: 5,
  },

  modal: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },

  modalTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  close: {
    width: ControlHeight.iconButton,
    height: ControlHeight.iconButton,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  closePressed: {
    backgroundColor: Surface.border,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 8,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: ControlHeight.input,
    paddingHorizontal: 16,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  optionSelected: {
    borderColor: Blood.primary,
    backgroundColor: Surface.softRed,
  },

  optionPressed: {
    borderColor: Surface.borderStrong,
  },

  optionText: {
    ...Typography.input,
    color: Surface.text,
  },

  optionTextSelected: {
    color: Blood.primary,
    fontWeight: "700",
  },
});
