import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AnimatedAvatar } from "@/components/common/animated-avatar";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";

type HospitalHeaderProps = {
  /** Line under the brand, e.g. "Hospital Staff Dashboard". */
  subtitle: string;
  /** Monogram shown in the avatar; falls back to the hospital initials. */
  initials: string;
  /** Unread-attention dot on the avatar; off by default. */
  alertDot?: boolean;
  /** Optional avatar image URL override. */
  avatarUrl?: string | null;
  /** Called when the user taps the back button. */
  onBack?: () => void;
};

/**
 * Brand header for the hospital area.
 *
 * Deliberately not `DashboardShell`'s header: the approved staff design puts
 * the BloodLink mark on the left and the station controls on the right, so the
 * hospital tabs own their chrome.
 */
export function HospitalHeader({
  subtitle,
  initials,
  alertDot = false,
  avatarUrl,
  onBack,
}: HospitalHeaderProps) {
  const router = useRouter();
  const { session } = useAuth();
  const effectiveAvatar = avatarUrl ?? session?.user.avatarUrl;

  return (
    <View style={styles.row}>
      {onBack && (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={6}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Feather name="arrow-left" size={20} color={Surface.text} />
        </Pressable>
      )}
      <View style={styles.brand}>
        <View style={styles.logo}>
          <Feather name="droplet" size={18} color={Surface.onPrimary} />
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
          onPress={() => router.push(ROUTES.settings)}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          accessibilityHint="Manage hospital profile & preferences"
          hitSlop={6}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.avatarPressed]}
        >
          <Feather name="settings" size={18} color={Surface.textSecondary} />
        </Pressable>

        <Pressable
          onPress={() => router.push(ROUTES.hospitalProfile)}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          accessibilityHint="Opens your staff profile"
          hitSlop={6}
          style={({ pressed }) => [pressed && styles.avatarPressed]}
        >
          <AnimatedAvatar
            url={effectiveAvatar}
            name={initials}
            size={38}
            showHalo={false}
            role="hospital"
          />

          {alertDot ? <View style={styles.alertDot} pointerEvents="none" /> : null}
        </Pressable>
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
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  weather: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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

  avatarPressed: {
    opacity: 0.6,
  },

  /** Back button displayed when the previous screen expects to return. */
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  /** Dim the back button when pressed. */
  backButtonPressed: {
    opacity: 0.6,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  alertDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
    borderWidth: 1.5,
    borderColor: Surface.background,
  },
});
