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
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string | null;
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
  },
  ref,
) {
  const hasError = error !== null;

  return (
    <View>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>

        {labelRight}
      </View>

      <View style={[styles.field, multiline && styles.fieldMultiline, hasError && styles.fieldError]}>
        {icon ? <Feather name={icon} size={16} color={Surface.textMuted} /> : null}

        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          placeholder={placeholder}
          placeholderTextColor={Surface.textMuted}
          style={[styles.input, multiline && styles.inputMultiline]}
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

      {hint !== undefined && !hasError ? <Text style={styles.hint}>{hint}</Text> : null}

      <FieldError message={error} />
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

  label: {
    ...Typography.label,
    color: Surface.text,
    flexShrink: 1,
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

  inputMultiline: {
    height: undefined,
    textAlignVertical: "top",
  },

  hint: {
    ...Typography.small,
    color: Surface.textMuted,
    marginTop: 6,
  },
});
