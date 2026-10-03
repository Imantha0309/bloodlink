import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function RequestDetailScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Request Details"
      description="The full request timeline, matched donors and status updates will appear here."
      icon="file-text"
      onBack={onBack}
    />
  );
}