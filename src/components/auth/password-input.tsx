import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { forwardRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

import { FieldError } from "./field-error";

const PLACEHOLDER = "Enter your secure password";

type PasswordInputProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  /** Rendered at the right of the label row — the screen owns this, since
      only it knows where "Forgot Password?" navigates. */
  labelRight?: ReactNode;
  onSubmitEditing?: () => void;
};

/**
 * Password field with a leading lock icon and a visibility toggle.
 *
 * Visibility state is internal — it is presentation only and has no business
 * in the screen's form state.
 */
export const PasswordInput = forwardRef<RNTextInput, PasswordInputProps>(
  function PasswordInput(
    {
      label = "Password",
      value,
      onChangeText,
      error = null,
      onFocus,
      onBlur,
      editable = true,
      labelRight,
      onSubmitEditing,
    },
    ref,
  ) {
    const [isVisible, setIsVisible] = useState(false);
    const hasError = error !== null;

    return (
      <View>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>

          {labelRight}
        </View>

        <View style={[styles.field, hasError && styles.fieldError]}>
          <Feather name="lock" size={16} color={Surface.textMuted} />

          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            placeholder={PLACEHOLDER}
            placeholderTextColor={Surface.textMuted}
            style={styles.input}
            secureTextEntry={!isVisible}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            accessibilityLabel={label}
            accessibilityHint="Enter your password"
            selectionColor={Blood.primary}
          />

          <Pressable
            onPress={() => setIsVisible((previous) => !previous)}
            accessibilityRole="button"
            accessibilityState={{ selected: isVisible }}
            accessibilityLabel={isVisible ? "Hide password" : "Show password"}
            // The visual box is small, so the touch target is grown to 44x44.
            hitSlop={10}
            style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
          >
            <Feather
              name={isVisible ? "eye" : "eye-off"}
              size={17}
              color={isVisible ? Blood.primary : Surface.textMuted}
            />
          </Pressable>
        </View>

        <FieldError message={error} />
      </View>
    );
  },
);

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
    paddingLeft: 14,
    paddingRight: 6,
    gap: 10,
    backgroundColor: Surface.card,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  fieldError: {
    borderColor: Surface.danger,
  },

  input: {
    ...Typography.input,
    flex: 1,
    color: Surface.text,
    paddingVertical: 0,
  },

  toggle: {
    width: ControlHeight.iconButton,
    height: ControlHeight.iconButton,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  togglePressed: {
    backgroundColor: Surface.iconWash,
  },
});