import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

export default function AlertsScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  return (
    <PlaceholderScreen
      title="Alerts"
      description="Blood request alerts, donor matches and confirmations will appear here."
      icon="bell"
      onBack={onBack}
    />
  );
}