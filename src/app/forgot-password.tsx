import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

import { AuthIntroCard } from "@/components/auth/auth-intro-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneEmailInput } from "@/components/auth/phone-email-input";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepIndicator } from "@/components/auth/step-indicator";
import { TextField } from "@/components/ui/text-field";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { apiErrorMessage, authService } from "@/services/auth";
import {
  validateContact,
  validateNewPassword,
  validateOtpCode,
} from "@/utils/validation";

/** What the step header shows. */
const STEP_META = [
  { badge: "1", label: "STEP 1 OF 3 • IDENTIFY" },
  { badge: "2", label: "STEP 2 OF 3 • VERIFY" },
  { badge: "3", label: "STEP 3 OF 3 • NEW PASSWORD" },
] as const;

/**
 * Password recovery: request a code, verify it, set a new password.
 *
 * Stays inside the unauthenticated guard group it was declared in, since a
 * signed-out user is the only one who needs it. All three steps live in this
 * one route — they share state and are not independently linkable.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = useAuthBack(ROUTES.login);

  const [step, setStep] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  /** Single-use, handed out only after the code verifies. */
  const [resetToken, setResetToken] = useState<string | null>(null);
  /** Only ever populated by the local backend, which has no SMS to send to. */
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const meta = STEP_META[step] ?? STEP_META[0];

  function goBack() {
    if (step > 0 && !isDone) {
      setStep(step - 1);
      setFieldError(null);
      setFormError(null);
      return;
    }

    handleBack();
  }

  async function handleRequestCode() {
    if (isSubmitting) {
      return;
    }

    const error = validateContact(identifier);

    if (error !== null) {
      setFieldError(error);
      return;
    }

    setIsSubmitting(true);
    setFieldError(null);
    setFormError(null);

    try {
      const challenge = await authService.requestPasswordReset(identifier.trim());

      setResetId(challenge.resetId);
      setDevCode(challenge.devCode ?? null);
      setStep(1);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode() {
    if (isSubmitting || resetId === null) {
      return;
    }

    const error = validateOtpCode(code);

    if (error !== null) {
      setFieldError(error);
      return;
    }

    setIsSubmitting(true);
    setFieldError(null);
    setFormError(null);

    try {
      // Exchanges the code for a single-use token. The code itself is consumed
      // by this call, so the token has to be kept for the final step.
      const token = await authService.verifyPasswordResetCode(resetId, code.trim());

      setResetToken(token);
      setStep(2);
    } catch (error) {
      setFieldError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (isSubmitting || resetToken === null) {
      return;
    }

    const error = validateNewPassword(newPassword);

    if (error !== null) {
      setFieldError(error);
      return;
    }

    if (newPassword !== confirmPassword) {
      setFieldError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setFieldError(null);
    setFormError(null);

    try {
      await authService.resetPassword(resetToken, newPassword);
      setIsDone(true);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader
          gap={14}
          title="Reset Password"
          onBack={goBack}
          backAccessibilityLabel={isDone ? "Back" : "Go back"}
          {...(isDone ? {} : { right: <StepIndicator badge={meta.badge} label={meta.label} /> })}
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
            {isDone ? (
              <View style={styles.doneCard}>
                <View style={styles.doneBadge}>
                  <Feather name="check" size={24} color={Surface.onPrimary} />
                </View>

                <Text style={styles.doneTitle} accessibilityRole="header">
                  Password updated
                </Text>

                <Text style={styles.doneText}>
                  You can now sign in with your new password. Any other devices have been
                  signed out.
                </Text>

                <PrimaryAuthButton
                  label="Back to Sign In"
                  loading={false}
                  onPress={() => router.replace(ROUTES.login)}
                />
              </View>
            ) : (
              <>
                <AuthIntroCard
                  title={
                    step === 0
                      ? "Find your account"
                      : step === 1
                        ? "Enter your code"
                        : "Choose a new password"
                  }
                  description={
                    step === 0
                      ? "We will send a one-time code to the mobile number or email on your account."
                      : step === 1
                        ? "Enter the 6-digit code we sent to confirm it is you."
                        : "Pick something you have not used before."
                  }
                />

                {step === 0 ? (
                  <PhoneEmailInput
                    value={identifier}
                    onChangeText={(value) => {
                      setIdentifier(value);
                      setFieldError(null);
                      setFormError(null);
                    }}
                    error={fieldError}
                    onSubmitEditing={() => {
                      void handleRequestCode();
                    }}
                  />
                ) : null}

                {step === 1 ? (
                  <View style={styles.form}>
                    {devCode !== null ? (
                      <View style={styles.devBanner}>
                        <Feather name="terminal" size={13} color={Blood.dark} />

                        <Text style={styles.devText}>
                          Dev mode — no SMS provider is configured. Your code is{" "}
                          <Text style={styles.devCode}>{devCode}</Text>.
                        </Text>
                      </View>
                    ) : null}

                    <TextField
                      label="6-Digit Code"
                      value={code}
                      onChangeText={(value) => {
                        // Digits only, so a pasted code with spaces still works.
                        setCode(value.replace(/\D/g, "").slice(0, 6));
                        setFieldError(null);
                        setFormError(null);
                      }}
                      placeholder="000000"
                      error={fieldError}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                      maxLength={6}
                      returnKeyType="go"
                      onSubmitEditing={() => {
                        void handleVerifyCode();
                      }}
                    />
                  </View>
                ) : null}

                {step === 2 ? (
                  <View style={styles.form}>
                    <PasswordInput
                      label="New Password"
                      value={newPassword}
                      onChangeText={(value) => {
                        setNewPassword(value);
                        setFieldError(null);
                        setFormError(null);
                      }}
                      error={fieldError}
                    />

                    <PasswordInput
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChangeText={(value) => {
                        setConfirmPassword(value);
                        setFieldError(null);
                        setFormError(null);
                      }}
                      error={null}
                    />

                    <Text style={styles.hint}>
                      At least 8 characters, with an uppercase letter, a lowercase letter and a
                      number.
                    </Text>
                  </View>
                ) : null}

                <FormAlert message={formError} />

                <PrimaryAuthButton
                  label={step === 0 ? "Send Code" : step === 1 ? "Verify Code" : "Reset Password"}
                  loadingLabel={step === 0 ? "Sending..." : step === 1 ? "Verifying..." : "Saving..."}
                  loading={isSubmitting}
                  onPress={() => {
                    if (step === 0) {
                      void handleRequestCode();
                    } else if (step === 1) {
                      void handleVerifyCode();
                    } else {
                      void handleResetPassword();
                    }
                  }}
                />

                {step === 1 && resetId !== null ? (
                  <Pressable
                    onPress={() => {
                      setStep(0);
                      setCode("");
                      setFieldError(null);
                      setFormError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Use a different account"
                    style={styles.link}
                  >
                    <Text style={styles.linkText}>Use a different account</Text>
                  </Pressable>
                ) : null}
              </>
            )}
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
    gap: 20,
  },

  form: {
    gap: 18,
  },

  devBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  devText: {
    ...Typography.small,
    color: Blood.dark,
    flex: 1,
  },

  devCode: {
    fontWeight: "800",
    letterSpacing: 1,
  },

  hint: {
    ...Typography.small,
    color: Surface.textMuted,
    marginTop: -6,
  },

  link: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  linkText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  doneCard: {
    marginTop: 8,
    padding: 24,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    alignItems: "center",
    gap: 10,
  },

  doneBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.online,
    marginBottom: 4,
  },

  doneTitle: {
    ...Typography.title,
    color: Surface.text,
    textAlign: "center",
  },

  doneText: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
});
