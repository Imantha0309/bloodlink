import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { forwardRef } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInput as RNTextInput,
} from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { looksLikeEmail } from "@/utils/contact";

import { FieldError } from "./field-error";
import { LkFlag } from "./lk-flag";

const COUNTRY_CODE = "+94";

const PLACEHOLDER = "077 123 4567 or name@mail.com";

/**
 * Strips a country code the user typed or pasted, so it is not duplicated next
 * to the visible `+94` prefix. Requires a digit after the code, which keeps an
 * in-progress `9` -> `94` from being swallowed mid-keystroke.
 */
const LEADING_COUNTRY_CODE = /^\s*\+?94(?=\d)/;

function stripDuplicateCountryCode(value: string): string {
  return LEADING_COUNTRY_CODE.test(value) ? `0${value.replace(LEADING_COUNTRY_CODE, "")}` : value;
}

type PhoneEmailInputProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  /**
   * Rendered at the right of the label row. Defaults to the "Verified
   * Network" pill; pass `null` to hide it.
   */
  labelRight?: ReactNode;
  /** Forwarded so the screen can chain focus, e.g. submit on return. */
  onSubmitEditing?: () => void;
};

/**
 * One unified contact field that accepts either a Sri Lankan mobile number or
 * an email address.
 *
 * The `+94` prefix is presentational: it is dropped as soon as the value
 * cannot be a mobile number (typing a letter or `@`), and the real payload is
 * normalised in `@/utils/contact` rather than assembled from the prefix here.
 */
export const PhoneEmailInput = forwardRef<RNTextInput, PhoneEmailInputProps>(
  function PhoneEmailInput(
    {
      label = "Email or Mobile Number",
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
    const isEmailMode = looksLikeEmail(value);
    const hasError = error !== null;

    return (
      <View>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>

          {labelRight === undefined ? <VerifiedNetworkBadge /> : labelRight}
        </View>

        <View
          style={[
            styles.field,
            isEmailMode && styles.fieldEmailMode,
            hasError && styles.fieldError,
          ]}
        >
          {isEmailMode ? null : (
            <>
              <View style={styles.prefix}>
                <LkFlag width={24} decorative />

                <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>

                {/* Country codes are fixed for now, so the chevron is
                    decorative rather than a dead menu. */}
                <Feather
                  name="chevron-down"
                  size={13}
                  color={Surface.textMuted}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                />
              </View>

              <View style={styles.divider} />
            </>
          )}

          <TextInput
            ref={ref}
            value={value}
            onChangeText={(next) => onChangeText(stripDuplicateCountryCode(next))}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            placeholder={PLACEHOLDER}
            placeholderTextColor={Surface.textMuted}
            style={styles.input}
            keyboardType={isEmailMode ? "email-address" : "phone-pad"}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            returnKeyType="next"
            accessibilityLabel={label}
            accessibilityHint="Enter your email address or mobile number"
            selectionColor={Blood.primary}
          />
        </View>

        <FieldError message={error} />
      </View>
    );
  },
);

/** Small reassurance pill at the right of the contact label. */
function VerifiedNetworkBadge() {
  return (
    <View style={styles.badge} accessible accessibilityLabel="Verified network">
      <Feather name="shield" size={11} color={Blood.dark} />

      <Text style={styles.badgeText}>Verified Network</Text>
    </View>
  );
}

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

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.2,
    color: Blood.dark,
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

  /** Email values need the full width, so the prefix row is not reserved. */
  fieldEmailMode: {
    paddingLeft: 14,
  },

  fieldError: {
    borderColor: Surface.danger,
  },

  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  countryCode: {
    ...Typography.input,
    color: Surface.text,
  },

  divider: {
    width: 1,
    height: 22,
    backgroundColor: Surface.border,
  },

  input: {
    ...Typography.input,
    flex: 1,
    color: Surface.text,
    // Android adds its own vertical padding that breaks the fixed height.
    paddingVertical: 0,
  },
});