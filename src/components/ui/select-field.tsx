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
  label: string;
  value: string | null;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  /** Leading glyph, e.g. a pin for a facility field. */
  icon?: ComponentProps<typeof Feather>["name"];
  /**
   * Replaces the chevron — a check mark once a verified value is chosen.
   *
   * Falls back to the chevron when omitted, so every existing caller keeps its
   * current affordance.
   */
  trailingIcon?: ComponentProps<typeof Feather>["name"];
  /** Supporting line under the field. Hidden while an error is showing. */
  caption?: string;
};

/**
 * Single-select field that opens a full-screen list.
 *
 * Used where the option set is too long for chips — the 25 Sri Lankan
 * districts — so the choices stay legible and scrollable on a phone.
 */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  error = null,
  icon,
  trailingIcon,
  caption,
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = error !== null;
  const hasCaption = caption !== undefined && caption !== "" && !hasError;

  function handleSelect(option: string) {
    onChange(option);
    setIsOpen(false);
  }

  return (
    <View>
      <Text style={styles.label}>{label}</Text>

      <Pressable
        onPress={() => setIsOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value ?? placeholder }}
        accessibilityHint="Opens a list of options"
        style={({ pressed }) => [
          styles.field,
          hasError && styles.fieldError,
          pressed && styles.fieldPressed,
        ]}
      >
        {icon !== undefined ? <Feather name={icon} size={15} color={Surface.textMuted} /> : null}

        <Text style={value === null ? styles.placeholder : styles.value} numberOfLines={1}>
          {value ?? placeholder}
        </Text>

        <Feather
          name={trailingIcon ?? "chevron-down"}
          size={16}
          color={trailingIcon === undefined ? Surface.textMuted : Blood.primary}
        />
      </Pressable>

      {hasCaption ? <Text style={styles.caption}>{caption}</Text> : null}

      <FieldError message={error} />

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
