import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for request status / live tracking screen.
 *
 * In the full implementation, this screen will show real-time
 * status updates on the blood request including donor responses,
 * ETA, and delivery status.
 */
export default function RequestStatusScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Request Status"
      description="Track your emergency request in real-time. View donor responses, estimated arrival times, and delivery status."
      icon="activity"
      onBack={onBack}
    />
  );
}