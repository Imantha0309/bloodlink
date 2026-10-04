import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for review and confirm step.
 *
 * In the full implementation, this screen will show a summary
 * of the emergency request for recipient to review before sending.
 */
export default function ReviewRequestScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Review & Confirm"
      description="Review your emergency request details before broadcasting to nearby donors."
      icon="check-circle"
      onBack={onBack}
    />
  );
}