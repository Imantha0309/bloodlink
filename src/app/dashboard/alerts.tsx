import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function AlertsScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Alerts"
      description="Blood request alerts, donor matches and confirmations will appear here."
      icon="bell"
      onBack={onBack}
    />
  );
}