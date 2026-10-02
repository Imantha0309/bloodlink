import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type BrandHeaderProps = {
  /** Wordmark under the mark, defaults to the product name. */
  name?: string;
  /** Optional pill beside the wordmark, e.g. "PRO". */
  badge?: string;
  /** Tapping the trailing profile icon navigates here. */
  onProfilePress: () => void;
};

/**
 * BloodLink identity bar: the red drop mark, the wordmark and a profile icon.
 *
 * `AuthHeader` is the back-button bar for the rest of the auth flow, so this is
 * a separate component rather than a mode on that one — the mark is what makes
 * this bar recognisable.
 */
export function BrandHeader({ name = "BloodLink", badge = "PRO", onProfilePress }: BrandHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.identity}>
        <View style={styles.mark}>
          <View style={styles.drop} />
        </View>

        <View style={styles.copy}>
          <View style={styles.wordmarkRow}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>

            {badge === null ? null : (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            )}
          </View>

          <Text style={styles.tagline} numberOfLines={1}>
            National Blood Transfusion Service • LK
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onProfilePress}
        accessibilityRole="button"
        accessibilityLabel="Sign in to your account"
        hitSlop={6}
        style={({ pressed }) => [styles.profile, pressed && styles.profilePressed]}
      >
        <Feather name="user" size={17} color={Surface.text} />
      </Pressable>
    </View>
  );
}

const MARK_SIZE = 38;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexShrink: 1,
  },

  mark: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: Radius.sm + 2,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  /** Rotated teardrop, matching the mark on the splash screen. */
  drop: {
    width: 17,
    height: 22,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 3,
    backgroundColor: Surface.onPrimary,
    transform: [{ rotate: "45deg" }],
  },

  copy: {
    flexShrink: 1,
  },

  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.4,
    color: Surface.text,
  },

  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    backgroundColor: Surface.softRed,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 7,
    lineHeight: 11,
    letterSpacing: 0.3,
    color: Blood.primary,
  },

  tagline: {
    ...Typography.micro,
    fontSize: 8,
    lineHeight: 12,
    letterSpacing: 0,
    fontWeight: "500",
    color: Surface.textMuted,
  },

  profile: {
    width: ControlHeight.iconButton,
    height: ControlHeight.iconButton,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  profilePressed: {
    backgroundColor: Surface.border,
  },
});