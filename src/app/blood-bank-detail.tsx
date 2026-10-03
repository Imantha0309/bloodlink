import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function BloodBankDetailScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Blood Bank"
      description="Live stock levels by blood group, opening hours and directions will appear here."
      icon="map-pin"
      onBack={onBack}
    />
  );
}