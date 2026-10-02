import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

import { AuthPlaceholderScreen } from "@/components/auth/auth-placeholder-screen";
import { isSelfRegisterRole, ROLE_LABEL } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";

/**
 * Registration is not implemented yet.
 *
 * The role chosen on "Choose Your Role" arrives as a route param — Expo Router
 * navigates by URL, not by prop. Because a URL param is untrusted input, it is
 * validated against `SELF_REGISTER_ROLES`; a missing or unrecognised value
 * redirects back to role selection rather than guessing.
 *
 * TODO: build the multi-step registration form (identity, blood group,
 * medical baseline, security, terms) using the role resolved here.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string | string[] }>();

  // Repeated params collapse to the first, matching router behaviour.
  const raw = Array.isArray(params.role) ? params.role[0] : params.role;
  const role = isSelfRegisterRole(raw) ? raw : null;

  useEffect(() => {
    if (role === null) {
      router.replace(ROUTES.roleSelect);
    }
  }, [role, router]);

  // Reached directly at /register with no role — the redirect above is already
  // in flight, so render nothing rather than a role-less form.
  if (role === null) {
    return null;
  }

  return (
    <AuthPlaceholderScreen
      title="Register"
      icon="user-plus"
      backFallback={ROUTES.roleSelect}
      description={`You selected the ${ROLE_LABEL[role]} role. Create an account to request blood, donate, or coordinate a hospital bank.`}
    />
  );
}