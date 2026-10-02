import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { FieldError } from "@/components/auth/field-error";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneEmailInput } from "@/components/auth/phone-email-input";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepIndicator } from "@/components/auth/step-indicator";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUP_NOTES, BLOOD_GROUPS } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Radius } from "@/constants/radius";
import { isSelfRegisterRole, ROLE_LABEL, type SelfRegisterRole } from "@/constants/roles";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  asBloodGroup,
  hasRegisterErrors,
  validateRegisterForm,
  type RegisterFormErrors,
} from "@/utils/validation";

const NO_ERRORS: RegisterFormErrors = {
  fullName: null,
  identifier: null,
  district: null,
  bloodGroup: null,
  password: null,
  confirmPassword: null,
  acceptedTerms: null,
};

/** Total steps in the sign-up journey including role selection. */
const TOTAL_STEPS = 4;

/**
 * Step 2-4 of sign-up: create the account.
 *
 * `role-select` is step 1 and passes the chosen role through as a route param.
 * Reaching this screen without one is not an error — the user is simply sent
 * back to choose, rather than being shown a form that cannot be submitted.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();
  const params = useLocalSearchParams<{ role?: string | string[] }>();

  // Repeated params collapse to the first, matching router behaviour. Anything
  // unrecognised is treated as "not chosen yet" — a URL param is untrusted input.
  const raw = Array.isArray(params.role) ? params.role[0] : params.role;
  const role = isSelfRegisterRole(raw) ? raw : null;

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [lastDonationAt, setLastDonationAt] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [errors, setErrors] = useState<RegisterFormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // No role -> send them to pick one. Replaces rather than pushes so back does
  // not return to an unusable form.
  useEffect(() => {
    if (role === null) {
      router.replace(ROUTES.roleSelect);
    }
  }, [role, router]);

  if (role === null) {
    return null;
  }

  // Function declarations are hoisted, so the `role === null` guard above does
  // not narrow it inside `currentErrors`/`handleSubmit`. A fresh const does.
  const selectedRole: SelfRegisterRole = role;

  const isDonor = selectedRole === "donor";
  const isHospital = selectedRole === "hospital";

  /** Clears a field's error as soon as the user starts fixing it. */
  function clearError(field: keyof RegisterFormErrors) {
    setFormError(null);
    setErrors((current) =>
      current[field] === null ? current : { ...current, [field]: null },
    );
  }

  function currentErrors(): RegisterFormErrors {
    return validateRegisterForm(
      {
        fullName,
        identifier,
        district: district ?? "",
        bloodGroup: bloodGroup ?? "",
        password,
        confirmPassword,
        acceptedTerms,
      },
      selectedRole,
    );
  }

  /** Only the fields on the visible step are allowed to block "Continue". */
  function stepHasError(all: RegisterFormErrors, target: number): boolean {
    if (target === 1) {
      return all.fullName !== null || all.identifier !== null || all.district !== null;
    }

    if (target === 2) {
      return all.bloodGroup !== null;
    }

    return hasRegisterErrors(all);
  }

  function handleContinue() {
    if (isSubmitting) {
      return;
    }

    const all = currentErrors();
    setErrors(all);

    if (stepHasError(all, step)) {
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    void handleSubmit();
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setFormError(null);

    try {
      // Goes through the provider so the dashboard guard is already open by the
      // time `router.replace` runs.
      const session = await signUp({
        role: selectedRole,
        fullName: fullName.trim(),
        identifier: identifier.trim(),
        password,
        district,
        bloodGroup: asBloodGroup(bloodGroup ?? ""),
        lastDonationAt: isDonor && lastDonationAt.trim() !== "" ? lastDonationAt.trim() : null,
        registrationNumber: isHospital ? registrationNumber.trim() : null,
      });

      router.replace(ROLE_HOME[session.user.role]);
    } catch (error) {
      setFormError(apiErrorMessage(error));
      // A server-side conflict or validation failure belongs on step 1, where
      // the offending fields live.
      setStep(1);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep(step - 1);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(ROUTES.roleSelect);
    }
  }

  const stepTitles = [
    { badge: "2", label: "STEP 2 OF 4 • YOUR DETAILS" },
    { badge: "3", label: `STEP 3 OF 4 • ${isHospital ? "HOSPITAL" : "BLOOD PROFILE"}` },
    { badge: "4", label: "STEP 4 OF 4 • SECURITY" },
  ] as const;

  const indicator = stepTitles[step - 1] ?? stepTitles[0];

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader
          gap={14}
          onBack={handleBack}
          right={<StepIndicator badge={indicator.badge} label={indicator.label} />}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title} accessibilityRole="header">
              {step === 1 ? "Create your account" : step === 2 ? "Your blood profile" : "Secure it"}
            </Text>

            <Text style={styles.subtitle}>
              Registering as a {ROLE_LABEL[role]} · Step {step + 1} of {TOTAL_STEPS}
            </Text>

            {step === 1 ? (
              <View style={styles.form}>
                <TextField
                  label="Full Name"
                  value={fullName}
                  onChangeText={(value) => {
                    setFullName(value);
                    clearError("fullName");
                  }}
                  placeholder="e.g. Nimal Perera"
                  error={errors.fullName}
                  autoCapitalize="words"
                  autoComplete="name"
                  icon="user"
                />

                <PhoneEmailInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    clearError("identifier");
                  }}
                  error={errors.identifier}
                />

                <SelectField
                  label="District"
                  value={district}
                  options={DISTRICTS}
                  onChange={(value) => {
                    setDistrict(value);
                    clearError("district");
                  }}
                  placeholder="Select your district"
                  error={errors.district}
                />
              </View>
            ) : null}

            {step === 2 && isHospital ? (
              <View style={styles.form}>
                <TextField
                  label="Hospital Registration Number"
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="e.g. MOH/2024/0193"
                  autoCapitalize="characters"
                  icon="file-text"
                  hint="Used by an administrator to verify your facility."
                />

                <View style={styles.notice}>
                  <Feather name="info" size={14} color={Surface.textSecondary} />

                  <Text style={styles.noticeText}>
                    Hospital accounts are reviewed before they can verify requests.
                    You can sign in immediately.
                  </Text>
                </View>
              </View>
            ) : null}

            {step === 2 && !isHospital ? (
              <View style={styles.form}>
                <OptionChips
                  label="Blood Group"
                  options={BLOOD_GROUPS}
                  value={asBloodGroup(bloodGroup ?? "")}
                  onChange={(value) => {
                    setBloodGroup(value);
                    clearError("bloodGroup");
                  }}
                  error={errors.bloodGroup}
                  captionFor={(value) => BLOOD_GROUP_NOTES[value]}
                />

                {isDonor ? (
                  <TextField
                    label="Last Donation (optional)"
                    value={lastDonationAt}
                    onChangeText={setLastDonationAt}
                    placeholder="YYYY-MM-DD"
                    autoCapitalize="none"
                    icon="calendar"
                    hint="Leave blank if you have never donated."
                  />
                ) : null}
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.form}>
                <PasswordInput
                  label="Password"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError("password");
                  }}
                  error={errors.password}
                />

                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearError("confirmPassword");
                  }}
                  error={errors.confirmPassword}
                />

                <Pressable
                  onPress={() => {
                    setAcceptedTerms((previous) => !previous);
                    clearError("acceptedTerms");
                  }}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: acceptedTerms }}
                  accessibilityLabel="I accept the terms of service and privacy policy"
                  style={styles.termsRow}
                >
                  <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                    {acceptedTerms ? (
                      <Feather name="check" size={13} color={Surface.onPrimary} />
                    ) : null}
                  </View>

                  <Text style={styles.termsText}>
                    I agree to the BloodLink terms of service and consent to my blood group
                    being shared with verified hospitals.
                  </Text>
                </Pressable>

                {errors.acceptedTerms !== null ? (
                  <FieldError message={errors.acceptedTerms} />
                ) : null}
              </View>
            ) : null}

            <FormAlert message={formError} />

            <PrimaryAuthButton
              label={step < 3 ? "Continue" : "Create Account"}
              loadingLabel="Creating account..."
              trailingIcon={step < 3 ? "arrow-right" : undefined}
              loading={isSubmitting}
              onPress={handleContinue}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  safeArea: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 12,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.body,
    marginTop: -6,
    color: Surface.textSecondary,
  },

  form: {
    gap: 18,
    marginTop: 6,
  },

  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  noticeText: {
    ...Typography.small,
    color: Surface.textSecondary,
    flex: 1,
  },

  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 44,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm - 3,
    borderWidth: 1.5,
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  termsText: {
    ...Typography.small,
    color: Surface.textSecondary,
    flex: 1,
  },
});
