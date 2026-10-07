import { useLocalSearchParams } from "expo-router";

import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

export default function DonorsScreen() {
  const { session } = useAuth();
  // Fall back to the signed-in user's own home, not always the recipient one.
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);
  // Set by Compatibility Chart so the search starts on the checked group.
  const { bloodGroup } = useLocalSearchParams<{ bloodGroup?: string }>();

  const groupNote =
    typeof bloodGroup === "string" && bloodGroup.length > 0
      ? `Showing donors compatible with ${bloodGroup}. `
      : "";

  return (
    <PlaceholderScreen
      title="Find Donors"
      description={`${groupNote}Search compatible donors by blood group, area and availability will appear here.`}
      icon="users"
      onBack={onBack}
    />
  );
}
