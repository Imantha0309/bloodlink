import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Placeholder for donor profile screen.
 *
 * In the full implementation, this screen will show detailed
 * information about a specific donor who responded to the request.
 */
export default function DonorProfileScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Donor Profile"
      description="View donor details including contact information, blood group, and donation history."
      icon="user"
      onBack={onBack}
    />
  );
}