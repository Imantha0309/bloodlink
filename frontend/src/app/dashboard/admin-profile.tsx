/**
 * Administrator profile.
 *
 * Admins were the one role with no profile at all — `AdminHeader` documents that
 * its monogram is presentational "rather than a navigation target" precisely
 * because there was nothing to navigate to. This screen is that something: an
 * identity pass like every other role has, the scanner every other role has, and
 * the sign-out that the admin area otherwise has no home for.
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHeader } from "@/components/admin/admin-header";
import { AnimatedAvatar } from "@/components/common/animated-avatar";
import { ScanSheet, type PassAction } from "@/components/qr/scan-sheet";
import { UserPassCard } from "@/components/qr/user-pass-card";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import type { ResolvedPass } from "@/services/auth/pass-service";
import { haptics } from "@/utils/haptics";

export default function AdminProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const { confirm, alert: notify } = useConfirm();

  const [isScanning, setIsScanning] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const user = session?.user;
  const subtitle = [user?.district, user?.station].filter(Boolean).join(" · ") || null;

  const actionsFor = useCallback(
    (resolved: ResolvedPass): PassAction[] => {
      if (resolved.isSelf) {
        return [];
      }

      return [
        {
          label: "Open accounts",
          icon: "users",
          onPress: () => {
            haptics.medium();
            setIsScanning(false);
            router.push(ROUTES.adminUsers);
          },
        },
      ];
    },
    [router],
  );

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    const approved = await confirm({
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign out",
      icon: "log-out",
      destructive: true,
    });

    if (!approved) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace(ROUTES.login);
    } catch (error) {
      console.error("Failed to sign out:", error);
      await notify({
        title: "Sign out failed",
        message: "There was an error signing out. Please try again.",
        icon: "alert-triangle",
        destructive: true,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AdminHeader
          subtitle="National Blood Registry"
          fullName={user?.fullName}
        />

        <View style={styles.backRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to the admin queue"
            hitSlop={6}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
                return;
              }

              router.replace(ROUTES.adminQueue);
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          >
            <Feather name="arrow-left" size={19} color={Surface.text} />
            <Text style={styles.backText}>Queue</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.identityRow}>
            <AnimatedAvatar
              url={user?.avatarUrl}
              name={user?.fullName ?? "Admin"}
              size={56}
              showHalo
              role="admin"
              badgeIcon="shield"
              onPress={() => {
                haptics.light();
                router.push(ROUTES.settings);
              }}
            />

            <View style={styles.identityText}>
              <Text style={styles.identityName} numberOfLines={1}>
                {user?.fullName ?? "Administrator"}
              </Text>
              <Text style={styles.identityRole}>National Blood Registry Staff</Text>
              <Text style={styles.identityStation}>{user?.email ?? user?.mobile ?? "Verified Authority"}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile in settings"
              hitSlop={6}
              onPress={() => {
                haptics.light();
                router.push(ROUTES.settings);
              }}
              style={({ pressed }) => [styles.identityAction, pressed && styles.pressed]}
            >
              <Feather name="settings" size={18} color={Surface.textSecondary} />
            </Pressable>
          </View>
        </View>

        <UserPassCard
          fullName={user?.fullName}
          role="admin"
          subtitle={subtitle}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan a pass"
          accessibilityHint="Opens the camera to identify a user"
          onPress={() => {
            haptics.light();
            setIsScanning(true);
          }}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        >
          <View style={styles.scanIcon}>
            <Feather name="maximize" size={16} color={Blood.primary} />
          </View>

          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Scan a pass</Text>
            <Text style={styles.scanSubtitle}>
              Confirm who someone is at the desk
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color={Surface.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Account settings"
          accessibilityHint="Manage your profile, email, phone and preferences"
          onPress={() => {
            haptics.light();
            router.push(ROUTES.settings);
          }}
          style={({ pressed }) => [styles.scanButton, pressed && styles.pressed]}
        >
          <View style={styles.scanIcon}>
            <Feather name="settings" size={16} color={Blood.primary} />
          </View>

          <View style={styles.scanText}>
            <Text style={styles.scanTitle}>Settings</Text>
            <Text style={styles.scanSubtitle}>
              Profile details, security & system preferences
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color={Surface.textMuted} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ disabled: isSigningOut }}
          disabled={isSigningOut}
          onPress={() => void handleSignOut()}
          style={({ pressed }) => [
            styles.signOut,
            pressed && styles.pressed,
            isSigningOut && styles.signOutDisabled,
          ]}
        >
          <Feather name="log-out" size={16} color={Blood.primary} />
          <Text style={styles.signOutText}>
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Text>
        </Pressable>
      </ScrollView>

      {isScanning ? (
        <ScanSheet
          visible
          onClose={() => setIsScanning(false)}
          actionsFor={actionsFor}
          title="Identify a user"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  content: {
    paddingHorizontal: 20,
    gap: 14,
  },

  backRow: {
    flexDirection: "row",
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingRight: 14,
  },

  backText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  scanIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  scanText: {
    flex: 1,
    gap: 2,
  },

  scanTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  scanSubtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  signOutDisabled: {
    opacity: 0.6,
  },

  signOutText: {
    ...Typography.button,
    fontWeight: "700",
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.75,
  },

  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  identityText: {
    flex: 1,
    gap: 3,
  },

  identityName: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  identityRole: {
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  identityStation: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  identityAction: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },
});
