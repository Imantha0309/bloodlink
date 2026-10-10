import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/dashboard/brand-mark";
import { EmptyState } from "@/components/ui/empty-state";
import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";

/**
 * Catch-all for any path expo-router cannot match.
 *
 * The usual arrival is a stale or mistyped QR payload — `pass-details` takes a
 * ticket string, and a truncated scan should land somewhere honest rather than
 * on a screen that renders made-up donor details.
 *
 * Deliberately outside the auth guards in `_layout.tsx`: an unknown link has to
 * resolve whether or not anyone is signed in, so the recovery action branches on
 * the session instead of the router dropping the navigation.
 */
export default function NotFoundScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, session } = useAuth();

  const home = status === "authenticated" ? ROLE_HOME[session!.user.role] : ROUTES.login;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <BrandMark size={30} />
        <Text style={styles.wordmark}>BloodLink</Text>
      </View>

      <View style={styles.body}>
        <EmptyState
          icon="alert-triangle"
          title="That link doesn't work"
          message="The page may have been renamed, or the code in the QR you scanned was cut short. Check the code and try again."
          action={{
            label: "Back to safety",
            onPress: () => {
              router.replace(home);
            },
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
  },

  wordmark: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: Radius.field,
  },
});
