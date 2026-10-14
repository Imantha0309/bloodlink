import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthIntroCard } from "@/components/auth/auth-intro-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { FormAlert } from "@/components/auth/form-alert";
import { PhoneEmailInput } from "@/components/auth/phone-email-input";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepIndicator } from "@/components/auth/step-indicator";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { apiErrorMessage, authService } from "@/services/auth";
import { validateContact } from "@/utils/validation";

/**
 * Password recovery: identify the account, then send a reset link by email.
 *
 * The link is handled by the API, so there is no code to type here. All steps
 * live in one route — they share state and are not independently linkable.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const handleBack = useAuthBack(ROUTES.login);

  const [step, setStep] = useState(0);
  const [identifier, setIdentifier] = useState("");

  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const meta = step === 0 ? { badge: "1", label: "STEP 1 OF 2 • IDENTIFY" } : { badge: "2", label: "STEP 2 OF 2 • EMAIL SENT" };

  function goBack() {
    if (step > 0 && !isDone) {
      setStep(step - 1);
      setFieldError(null);
      setFormError(null);
      return;
    }

    handleBack();
  }

  async function handleSendLink() {
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
      // Always resolves — the API does not confirm whether the account exists.
      await authService.requestPasswordReset(identifier.trim());
      setIsDone(true);
      setStep(1);
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
                  <Feather name="mail" size={24} color={Surface.onPrimary} />
                </View>

                <Text style={styles.doneTitle} accessibilityRole="header">
                  Check your email
                </Text>

                <Text style={styles.doneText}>
                  If an account exists for that address, we sent a link to reset its password.
                  Open it on this device to choose a new one.
                </Text>

                {__DEV__ ? (
                  <Text style={styles.devNote}>
                    Demo build — the API prints the reset link to its own console rather than
                    sending mail. Check the server output for the link.
                  </Text>
                ) : null}

                <PrimaryAuthButton
                  label="Back to Sign In"
                  loading={false}
                  onPress={() => router.replace(ROUTES.login)}
                />
              </View>
            ) : (
              <>
                <AuthIntroCard
                  title="Find your account"
                  description="Enter the mobile number or email on your account and we will send a reset link."
                />

                <PhoneEmailInput
                  value={identifier}
                  onChangeText={(value) => {
                    setIdentifier(value);
                    setFieldError(null);
                    setFormError(null);
                  }}
                  error={fieldError}
                  onSubmitEditing={() => {
                    void handleSendLink();
                  }}
                />

                <FormAlert message={formError} />

                <PrimaryAuthButton
                  label="Send Reset Link"
                  loadingLabel="Sending..."
                  loading={isSubmitting}
                  onPress={() => {
                    void handleSendLink();
                  }}
                />
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

  devNote: {
    ...Typography.micro,
    color: Blood.dark,
    textAlign: "center",
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },
});