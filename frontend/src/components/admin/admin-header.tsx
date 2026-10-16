import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimatedAvatar } from "@/components/common/animated-avatar";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";

type AdminHeaderProps = {
  /** Line under the brand, e.g. "National Blood Registry". */
  subtitle: string;
  /** Full name of the signed-in administrator; falls back to "Admin". */
  fullName?: string | null;
  /**
   * Opens the administrator's own profile.
   *
   * Optional so the admin profile screen, which is already inside it, can render
   * the header without a link back to itself.
   */
  onOpenProfile?: () => void;
  /** Optional avatar URL */
  avatarUrl?: string | null;
};

/**
 * Brand header for the administrator area.
 *
 * Mirrors `HospitalHeader`. The avatar used to be presentational because an
 * admin had no profile screen to open; now that one exists, callers pass
 * `onOpenProfile` and the monogram goes where every other role's does.
 */
export function AdminHeader({
  subtitle,
  fullName,
  onOpenProfile,
  avatarUrl,
}: AdminHeaderProps) {
  const router = useRouter();
  const { session } = useAuth();
  const name = fullName ?? session?.user.fullName ?? "Admin";
  const effectiveAvatar = avatarUrl ?? session?.user.avatarUrl;

  return (
    <View style={styles.row}>
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Feather name="shield" size={18} color={Surface.onPrimary} />
        </View>

        <View style={styles.brandText}>
          <Text style={styles.brandName}>BloodLink</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={6}
          onPress={() => router.push(ROUTES.settings)}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Feather name="settings" size={18} color={Surface.textSecondary} />
        </Pressable>

        {onOpenProfile === undefined ? (
          <AnimatedAvatar
            url={effectiveAvatar}
            name={name}
            size={38}
            showHalo={false}
            role="admin"
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            accessibilityHint="Shows your identity pass"
            hitSlop={8}
            onPress={onOpenProfile}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <AnimatedAvatar
              url={effectiveAvatar}
              name={name}
              size={38}
              showHalo={false}
              role="admin"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  brand: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  brandText: {
    flex: 1,
    gap: 1,
  },

  brandName: {
    ...Typography.cardTitle,
    color: Blood.primary,
    letterSpacing: -0.4,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  pressed: {
    opacity: 0.7,
  },
});
