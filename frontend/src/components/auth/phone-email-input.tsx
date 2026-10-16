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
import { looksLikeEmail } from "@/utils/contact";
import { haptics } from "@/utils/haptics";

import { FieldError } from "./field-error";
import { LkFlag } from "./lk-flag";

const COUNTRY_CODE = "+94";

const PHONE_PLACEHOLDER = "077 123 4567";
const EMAIL_PLACEHOLDER = "name@example.com";

const LEADING_COUNTRY_CODE = /^\s*\+?94(?=\d)/;

function stripDuplicateCountryCode(value: string): string {
  return LEADING_COUNTRY_CODE.test(value) ? `0${value.replace(LEADING_COUNTRY_CODE, "")}` : value;
}

type Mode = "phone" | "email";

type PhoneEmailInputProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  labelRight?: ReactNode;
  onSubmitEditing?: () => void;
};

export const PhoneEmailInput = forwardRef<RNTextInput, PhoneEmailInputProps>(
  function PhoneEmailInput(
    {
      label = "Sign In With",
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
    const isActuallyEmail = looksLikeEmail(value);
    const [selectedMode, setSelectedMode] = useState<Mode>(isActuallyEmail ? "email" : "phone");

    const effectiveMode: Mode = isActuallyEmail ? "email" : selectedMode;
    const isEmailMode = effectiveMode === "email";
    const hasError = error !== null;

    function handleSwitchMode(mode: Mode) {
      if (mode !== selectedMode) {
        haptics.selection();
        setSelectedMode(mode);
      }
    }

    return (
      <View>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {labelRight === undefined ? <VerifiedNetworkBadge /> : labelRight}
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.tabContainer}>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Mobile Number"
            accessibilityState={{ selected: !isEmailMode }}
            onPress={() => handleSwitchMode("phone")}
            style={[styles.tabButton, !isEmailMode && styles.tabButtonActive]}
          >
            <Feather
              name="phone"
              size={12}
              color={!isEmailMode ? Blood.primary : Surface.textMuted}
            />
            <Text style={[styles.tabText, !isEmailMode && styles.tabTextActive]}>
              Mobile Number
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="Email Address"
            accessibilityState={{ selected: isEmailMode }}
            onPress={() => handleSwitchMode("email")}
            style={[styles.tabButton, isEmailMode && styles.tabButtonActive]}
          >
            <Feather
              name="mail"
              size={12}
              color={isEmailMode ? Blood.primary : Surface.textMuted}
            />
            <Text style={[styles.tabText, isEmailMode && styles.tabTextActive]}>
              Email Address
            </Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.field,
            isEmailMode && styles.fieldEmailMode,
            hasError && styles.fieldError,
          ]}
        >
          {isEmailMode ? (
            <View style={styles.emailIconWrap}>
              <Feather name="mail" size={15} color={Surface.textMuted} />
            </View>
          ) : (
            <>
              <View style={styles.prefix}>
                <LkFlag width={24} decorative />
                <Text style={styles.countryCode}>{COUNTRY_CODE}</Text>
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
            onChangeText={(next) => onChangeText(isEmailMode ? next : stripDuplicateCountryCode(next))}
            onFocus={onFocus}
            onBlur={onBlur}
            onSubmitEditing={onSubmitEditing}
            editable={editable}
            placeholder={isEmailMode ? EMAIL_PLACEHOLDER : PHONE_PLACEHOLDER}
            placeholderTextColor={Surface.textMuted}
            style={styles.input}
            keyboardType={isEmailMode ? "email-address" : "phone-pad"}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isEmailMode ? "email" : "tel"}
            textContentType={isEmailMode ? "emailAddress" : "telephoneNumber"}
            returnKeyType="next"
            accessibilityLabel={isEmailMode ? "Email Address" : "Mobile Number"}
            accessibilityHint={isEmailMode ? "Enter your email address" : "Enter your mobile phone number"}
            selectionColor={Blood.primary}
          />
        </View>

        <FieldError message={error} />
      </View>
    );
  },
);

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
    marginBottom: 6,
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

  tabContainer: {
    flexDirection: "row",
    backgroundColor: Surface.border,
    borderRadius: Radius.field,
    padding: 3,
    marginBottom: 8,
    gap: 4,
  },

  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: Radius.field - 2,
    gap: 6,
  },

  tabButtonActive: {
    backgroundColor: Surface.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: Surface.textMuted,
  },

  tabTextActive: {
    color: Blood.primary,
    fontWeight: "600",
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

  fieldEmailMode: {
    paddingLeft: 12,
  },

  fieldError: {
    borderColor: Surface.danger,
  },

  emailIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
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
    paddingVertical: 0,
  },
});
