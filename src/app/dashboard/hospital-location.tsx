import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Placeholder for hospital/location selection step.
 *
 * In the full implementation, this screen will allow recipients
 * to select or enter the hospital where blood is needed.
 */
export default function HospitalLocationScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Hospital Location"
      description="Enter the hospital or medical facility where the blood is needed. This helps us find nearby donors."
      icon="map-pin"
      onBack={onBack}
    />
  );
}