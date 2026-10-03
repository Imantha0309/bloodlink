import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PlaceholderScreen } from "@/components/ui/placeholder-screen";
import { Radius } from "@/constants/radius";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Profile tab.
 *
 * Sign-out lives here because the recipient home's compact header has no room
 * for it. The order matters: the session must be cleared before navigating,
 * because the login screen is guarded off while authenticated and would
 * otherwise bounce straight back here.
 */
export default function ProfileScreen() {
  const router = useRouter();
  const onBack = useAuthBack(ROLE_HOME.recipient);
  const { session, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user ?? null;

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace(ROUTES.login);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <PlaceholderScreen
      title="Profile"
      description="Your details, donation history and notification settings will appear here."
      icon="user"
      onBack={onBack}
      footer={
        <View style={styles.footer}>
          <View style={styles.identity}>
            <View style={styles.avatar}>
              <Feather name="user" size={18} color={Surface.accentBlue} />
            </View>

            <View style={styles.identityCopy}>
              <Text style={styles.name} numberOfLines={1}>
                {user?.fullName ?? "Signed in"}
              </Text>

              <Text style={styles.meta} numberOfLines={1}>
                {[user?.bloodGroup, user?.district].filter(Boolean).join(" · ") ||
                  "No details yet"}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              void handleSignOut();
            }}
            disabled={isSigningOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            accessibilityState={{ disabled: isSigningOut }}
            style={({ pressed }) => [
              styles.signOut,
              pressed && styles.signOutPressed,
              isSigningOut && styles.signOutDisabled,
            ]}
          >
            <Feather name="log-out" size={15} color={Surface.danger} />

            <Text style={styles.signOutText}>
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  footer: {
    gap: 12,
    marginTop: 16,
    borderRadius: Radius.field,
    padding: 14,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
  },

  identityCopy: {
    flex: 1,
    gap: 2,
  },

  name: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
  },

  meta: {
    ...Typography.micro,
    fontSize: 10,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  signOutPressed: {
    opacity: 0.8,
  },

  signOutDisabled: {
    opacity: 0.6,
  },

  signOutText: {
    ...Typography.small,
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: Surface.danger,
  },
});