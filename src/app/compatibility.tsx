import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function CompatibilityScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Compatibility Chart"
      description="Who can donate to whom, and who can receive from you, will appear here."
      icon="grid"
      onBack={onBack}
    />
  );
}