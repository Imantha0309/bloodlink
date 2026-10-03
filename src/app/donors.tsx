import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

export default function DonorsScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Find Donors"
      description="Search compatible donors by blood group, area and availability will appear here."
      icon="users"
      onBack={onBack}
    />
  );
}