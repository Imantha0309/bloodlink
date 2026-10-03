import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function LocationScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Choose Location"
      description="Selecting your area will improve nearby bank and donor matching."
      icon="map-pin"
      onBack={onBack}
    />
  );
}