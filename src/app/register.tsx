import { AuthPlaceholderScreen } from "@/components/auth/auth-placeholder-screen";

/**
 * Registration is not implemented yet.
 *
 * TODO: build the multi-step registration flow (role, identity, verification)
 * and have it hand off to the login screen.
 */
export default function RegisterScreen() {
  return (
    <AuthPlaceholderScreen
      title="Register"
      icon="user-plus"
      description="Create a BloodLink account to request blood, donate, or manage a hospital bank."
    />
  );
}