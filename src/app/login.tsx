import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ActiveDonorsCard } from "@/components/auth/active-donors-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthIntroCard } from "@/components/auth/auth-intro-card";
import { DevCredentialsHint } from "@/components/auth/dev-credentials-hint";
import { EmergencyRequestCard } from "@/components/auth/emergency-request-card";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { PhoneEmailInput } from "@/components/auth/phone-email-input";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { Blood, Surface } from "@/constants/colors";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import { hasErrors, validateLoginForm, type LoginFormErrors } from "@/utils/validation";

const NO_ERRORS: LoginFormErrors = { identifier: null, password: null };

/**
 * Sign-in screen.
 *
 * Owns form state and the submission lifecycle only — every visual element is
 * a component under `@/components/auth`, and every data concern lives in
 * `@/services`.
 */
export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<RNTextInput>(null);
  const { signIn } = useAuth();
  const handleBack = useAuthBack();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<LoginFormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Clears a field's error as soon as the user starts fixing it. */
  function updateIdentifier(value: string) {
    setIdentifier(value);
    setFormError(null);
    setErrors((current) => (current.identifier === null ? current : { ...current, identifier: null }));
  }

  function updatePassword(value: string) {
    setPassword(value);
    setFormError(null);
    setErrors((current) => (current.password === null ? current : { ...current, password: null }));
  }

  async function handleSubmit() {
    // Second tap while a request is in flight.
    if (isSubmitting) {
      return;
    }

    const nextErrors = validateLoginForm({ identifier, password });

    setErrors(nextErrors);
    setFormError(null);

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Goes through the provider so the dashboard guard is already open by
      // the time `router.replace` runs.
      const session = await signIn({ identifier: identifier.trim(), password });

      router.replace(ROLE_HOME[session.user.role]);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Top inset is owned by AuthHeader and the bottom by the scroll
          container's padding, so only the horizontal edges are handled here. */}
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader title="Welcome Back" onBack={handleBack} backAccessibilityLabel="Go back" />

        <KeyboardAvoidingView
          style={styles.flex}
          // iOS needs the view lifted; Android already resizes via
          // `adjustResize`, and forcing a height here double-shrinks it.
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[
              styles.content,
              { paddingBottom: insets.bottom + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <AuthIntroCard
              title="Sign In to BloodLink"
              description="Access emergency blood requests and donor notifications"
            />

            <View style={styles.form}>
              <PhoneEmailInput
                value={identifier}
                onChangeText={updateIdentifier}
                error={errors.identifier}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />

              <PasswordInput
                ref={passwordRef}
                value={password}
                onChangeText={updatePassword}
                error={errors.password}
                labelRight={
                  <Pressable
                    onPress={() => router.push(ROUTES.forgotPassword)}
                    accessibilityRole="link"
                    accessibilityLabel="Forgot Password?"
                    hitSlop={10}
                    style={({ pressed }) => [styles.forgotLink, pressed && styles.pressed]}
                  >
                    <Text style={styles.forgotLinkText}>Forgot Password?</Text>
                  </Pressable>
                }
                onSubmitEditing={() => {
                  void handleSubmit();
                }}
              />

              <PrimaryAuthButton
                label="Sign In"
                loadingLabel="Signing in..."
                icon="log-in"
                loading={isSubmitting}
                onPress={() => {
                  void handleSubmit();
                }}
              />

              <FormAlert message={formError} />

              <DevCredentialsHint
                onPick={(nextIdentifier, nextPassword) => {
                  updateIdentifier(nextIdentifier);
                  updatePassword(nextPassword);
                }}
              />

              <ActiveDonorsCard />

              <EmergencyRequestCard
                onPress={() => router.push(ROUTES.emergencyRequest)}
              />
            </View>

            {/* Pushes the footer to the bottom on tall screens while still
                letting it sit directly under the content when short. */}
            <View style={styles.spacer} />

            <View style={styles.footer}>
              <Text style={styles.footerPrompt}>Don&apos;t have an account?</Text>

              <Pressable
                onPress={() => router.push(ROUTES.joinNetwork)}
                accessibilityRole="link"
                accessibilityLabel="Register"
                hitSlop={10}
                style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}
              >
                <Text style={styles.footerLinkText}>Register</Text>
              </Pressable>
            </View>
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 20,
  },

  form: {
    gap: 18,
  },

  forgotLink: {
    minHeight: 24,
    justifyContent: "center",
  },

  forgotLinkText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.55,
  },

  spacer: {
    flexGrow: 1,
    minHeight: 8,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  footerPrompt: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  footerLink: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 2,
  },

  footerLinkText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },
});