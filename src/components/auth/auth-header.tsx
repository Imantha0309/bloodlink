import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Radius } from "@/constants/radius";
import { Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type AuthHeaderProps = {
  title: string;
  onBack: () => void;
  backAccessibilityLabel?: string;
  /** Bottom breathing room under the header, before the first card. */
  gap?: number;
};

/**
 * Top bar shared by every screen in the authentication flow: a circular back
 * target on the left, an optically centred title, and safe-area padding for
 * the status bar and notch.
 */
export function AuthHeader({
  title,
  onBack,
  backAccessibilityLabel = "Go back",
  gap = 18,
}: AuthHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8, marginBottom: gap }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
        hitSlop={6}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      >
        <Feather name="arrow-left" size={20} color={Surface.text} />
      </Pressable>

      {/* Absolute centring keeps the title visually centred regardless of the
          back button's width. */}
      <View pointerEvents="none" style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  backButtonPressed: {
    backgroundColor: Surface.border,
  },

  titleWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 56,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
    textAlign: "center",
  },
});