import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Placeholder for review and confirm step.
 *
 * In the full implementation, this screen will show a summary
 * of the emergency request for recipient to review before sending.
 */
export default function ReviewRequestScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Review & Confirm"
      description="Review your emergency request details before broadcasting to nearby donors."
      icon="check-circle"
      onBack={onBack}
    />
  );
}