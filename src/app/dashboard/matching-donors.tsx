import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for matching donors screen.
 *
 * In the full implementation, this screen will show donors
 * who have responded to the emergency blood request.
 */
export default function MatchingDonorsScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Matching Donors"
      description="View donors who have responded to your emergency request and their estimated arrival times."
      icon="users"
      onBack={onBack}
    />
  );
}