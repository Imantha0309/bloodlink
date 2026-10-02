import { AuthPlaceholderScreen } from "@/components/auth/auth-placeholder-screen";

/**
 * Password recovery is not implemented yet.
 *
 * TODO: OTP-based reset — request a code to the registered mobile or email,
 * verify it, then force a new password.
 */
export default function ForgotPasswordScreen() {
  return (
    <AuthPlaceholderScreen
      title="Forgot Password"
      icon="key"
      description="We will send a one-time code to the mobile number or email on your account."
    />
  );
}