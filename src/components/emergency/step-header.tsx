import { Feather } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/dashboard/brand-mark";
import { Surface } from "@/constants/colors";
import { HIT_SLOP_MIN } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type StepHeaderProps = {
  /** e.g. "Request Step 2". */
  title: string;
  onBack: () => void;
  /** Optional trailing control. Left empty where the design has none. */
  right?: ReactNode;
};

/**
 * Compact header for the request wizard.
 *
 * Deliberately shorter than `AuthHeader`: that one centres a 22px title under a
 * 44px circular back target, which is too tall for a three-step flow where the
 * progress bar has to stay visible. Here the title sits on the leading edge
 * beside the mark and is sized to match the section headings around it.
 */
export function StepHeader({ title, onBack, right }: StepHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={HIT_SLOP_MIN / 2}
        style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
      >
        <Feather name="arrow-left" size={18} color={Surface.text} />
      </Pressable>

      <BrandMark size={22} />

      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>

      <View style={styles.trailing}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Surface.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
  },

  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  backButtonPressed: {
    backgroundColor: Surface.border,
  },

  title: {
    ...Typography.cardTitle,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: Surface.text,
    flexShrink: 1,
  },

  /** Holds the trailing slot so the title can flex without shifting it. */
  trailing: {
    marginLeft: "auto",
  },
});