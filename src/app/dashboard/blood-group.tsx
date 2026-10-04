import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for blood group selection step.
 *
 * In the full implementation, this screen will allow recipients
 * to select the required blood group for their emergency request.
 */
export default function BloodGroupScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Blood Group"
      description="Select the required blood group for your emergency request. This helps us find the most compatible donors nearby."
      icon="droplet"
      onBack={onBack}
    />
  );
}