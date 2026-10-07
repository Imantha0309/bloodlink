import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Placeholder for blood group selection step.
 *
 * In the full implementation, this screen will allow recipients
 * to select the required blood group for their emergency request.
 */
export default function BloodGroupScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Blood Group"
      description="Select the required blood group for your emergency request. This helps us find the most compatible donors nearby."
      icon="droplet"
      onBack={onBack}
    />
  );
}