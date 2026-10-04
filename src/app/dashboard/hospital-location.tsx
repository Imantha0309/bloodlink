import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for hospital/location selection step.
 *
 * In the full implementation, this screen will allow recipients
 * to select or enter the hospital where blood is needed.
 */
export default function HospitalLocationScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Hospital Location"
      description="Enter the hospital or medical facility where the blood is needed. This helps us find nearby donors."
      icon="map-pin"
      onBack={onBack}
    />
  );
}