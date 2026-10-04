import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { ROLE_HOME } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * Placeholder for donor profile screen.
 *
 * In the full implementation, this screen will show detailed
 * information about a specific donor who responded to the request.
 */
export default function DonorProfileScreen() {
  const onBack = useAuthBack(ROLE_HOME.recipient);

  return (
    <PlaceholderScreen
      title="Donor Profile"
      description="View donor details including contact information, blood group, and donation history."
      icon="user"
      onBack={onBack}
    />
  );
}