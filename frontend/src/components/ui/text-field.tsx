import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInput as RNTextInput,
  type TextInputProps,
} from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

import { FieldError } from "../auth/field-error";

type TextFieldProps = {
  /**
   * The field's name. Still the accessible name when `hideLabel` is set, so a
   * screen reader always announces the field even when the visible heading is
   * rendered elsewhere.
   */
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  /** Suppresses the visible label row; the field keeps `label` as its a11y name. */
  hideLabel?: boolean;
  /** Rendered at the right of the label row. */
  labelRight?: ReactNode;
  icon?: ComponentProps<typeof Feather>["name"];
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoComplete?: TextInputProps["autoComplete"];
  secureTextEntry?: boolean;
  maxLength?: number;
  multiline?: boolean;
  editable?: boolean;
  returnKeyType?: "done" | "go" | "next" | "search";
  onSubmitEditing?: () => void;
  hint?: string;
  /**
   * `dense` trims the label, field height, type and radius for information-dense
   * screens — the emergency wizard, whose values sit at 9-11px — where the
   * 52px/13.5px default reads oversized. It also stops reserving a gap for the
   * error row, at the cost of the form reflowing as errors clear.
   */
  size?: "default" | "dense";
};

/**
 * Plain labelled text input.
 *
 * `PhoneEmailInput` and `PasswordInput` each carry their own specialised
 * behaviour; this is the general case for the registration and emergency forms,
 * matching their visual treatment so new fields do not drift.
 */
export const TextField = forwardRef<RNTextInput, TextFieldProps>(function TextField(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error = null,
    hideLabel = false,
    labelRight,
    icon,
    keyboardType,
    autoCapitalize = "words",
    autoComplete,
    secureTextEntry = false,
    maxLength,
    multiline = false,
    editable = true,
    returnKeyType = "next",
    onSubmitEditing,
    hint,
    size = "default",
  },
  ref,
) {
  const hasError = error !== null;
  const isDense = size === "dense";

  return (
    <View>
      {hideLabel && labelRight === undefined ? null : (
        <View style={[styles.labelRow, hideLabel && styles.labelRowHidden]}>
          <Text style={[styles.label, isDense && styles.labelDense]}>{label}</Text>

          {labelRight}
        </View>
      )}

      <View
        style={[
          styles.field,
          isDense && styles.fieldDense,
          multiline && styles.fieldMultiline,
          hasError && styles.fieldError,
        ]}
      >
        {icon ? (
          <Feather name={icon} size={isDense ? 12 : 16} color={Surface.textMuted} />
        ) : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={Surface.textMuted}
          style={[styles.input, isDense && styles.inputDense, multiline && styles.inputMultiline]}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          autoComplete={autoComplete}
          secureTextEntry={secureTextEntry}
          maxLength={maxLength}
          multiline={multiline}
          returnKeyType={returnKeyType}
          accessibilityLabel={label}
          selectionColor={Blood.primary}
        />
      </View>

      {hint !== undefined && !hasError ? (
        <Text style={[styles.hint, isDense && styles.hintDense]}>{hint}</Text>
      ) : null}

      <FieldError message={error} reserveSpace={!isDense} />
    </View>
  );
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },

  /** Heading lives elsewhere, so the row contributes no space. */
  labelRowHidden: {
    marginBottom: 0,
  },

  label: {
    ...Typography.label,
    color: Surface.text,
    flexShrink: 1,
  },

  labelDense: {
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: -0.05,
  },

  field: {
    flexDirection: "row",
    alignItems: "center",
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

  fieldMultiline: {
    height: undefined,
    minHeight: 96,
    alignItems: "flex-start",
    paddingVertical: 12,
  },

  fieldError: {
    borderColor: Surface.danger,
  },

  input: {
    ...Typography.input,
    flex: 1,
    color: Surface.text,
    // Android adds its own vertical padding that breaks the fixed height.
    paddingVertical: 0,
  },

  inputDense: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: -0.05,
  },

  inputMultiline: {
    height: undefined,
    textAlignVertical: "top",
  },

  hint: {
    ...Typography.small,
    color: Surface.textMuted,
    marginTop: 6,
  },

  hintDense: {
    fontSize: 7.5,
    lineHeight: 11,
    marginTop: 5,
  },
});
