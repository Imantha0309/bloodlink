import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/dashboard/brand-mark";
import { Blood, Surface } from "@/constants/colors";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type HomeHeaderProps = {
  /** Role label shown under the wordmark, e.g. "Recipient". */
  roleLabel: string;
  /** Current screen name, shown next to the role label. */
  screenLabel: string;
  onAlertsPress: () => void;
  onProfilePress: () => void;
};

/**
 * Compact dashboard header: mark, red wordmark, role + screen labels, then the
 * alert bell and avatar on the trailing edge.
 *
 * Deliberately shorter than `AuthHeader` — it replaces that bar on the home
 * screen rather than sitting beneath it.
 */
export function HomeHeader({
  roleLabel,
  screenLabel,
  onAlertsPress,
  onProfilePress,
}: HomeHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
      <View style={styles.identity}>
        <BrandMark size={26} />

        <View style={styles.copy}>
          <Text style={styles.wordmark} numberOfLines={1}>
            BloodLink
          </Text>

          <View style={styles.labels}>
            <Text style={styles.role}>{roleLabel}</Text>

            <View style={styles.dot} />

            <Text style={styles.screen}>{screenLabel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onAlertsPress}
          accessibilityRole="button"
          accessibilityLabel="Alerts"
          hitSlop={HIT_SLOP_MIN / 2}
          style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
        >
          <Feather name="bell" size={16} color={Surface.textSecondary} />
        </Pressable>

        <Pressable
          onPress={onProfilePress}
          accessibilityRole="button"
          accessibilityLabel="Profile"
          hitSlop={HIT_SLOP_MIN / 2}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
        >
          <Feather name="user" size={15} color={Blood.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },

  copy: {
    flexShrink: 1,
    gap: 1,
  },

  wordmark: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: Blood.primary,
  },

  labels: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  role: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.2,
    color: Surface.textMuted,
  },

  /** Separator between the role and screen labels. */
  dot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Surface.borderStrong,
  },

  screen: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.2,
    color: Surface.textSecondary,
  },

  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  iconButton: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  iconButtonPressed: {
    backgroundColor: Surface.iconWash,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  avatarPressed: {
    opacity: 0.7,
  },
});