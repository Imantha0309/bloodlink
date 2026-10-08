import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Placeholder for matching donors screen.
 *
 * In the full implementation, this screen will show donors
 * who have responded to the emergency blood request.
 */
export default function MatchingDonorsScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Matching Donors"
      description="View donors who have responded to your emergency request and their estimated arrival times."
      icon="users"
      onBack={onBack}
    />
  );
}