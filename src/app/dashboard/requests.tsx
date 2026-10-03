import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function RequestsScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Requests"
      description="Your full request history, donor responses and progress tracking will appear here."
      icon="file-text"
      onBack={onBack}
    />
  );
}