/**
 * The shared screen header: back affordance, title (and optional subtitle),
 * and a right slot for actions.
 *
 * Screens previously hand-rolled three slightly different versions of this;
 * going through one component keeps the back button geometry, hit target and
 * title typography identical everywhere.
 */

import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Omit to hide the back button (root tabs). */
  onBack?: () => void;
  /** Extra content on the trailing edge — an icon button, a badge, a count. */
  right?: ReactNode;
};

export function ScreenHeader({ title, subtitle, onBack, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack !== undefined ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={HIT_SLOP_MIN - 36}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Feather name="chevron-left" size={20} color={Surface.text} />
        </Pressable>
      ) : null}

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle !== undefined ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right !== undefined ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 44,
  },

  back: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  backPressed: {
    opacity: 0.7,
  },

  titleBlock: {
    flex: 1,
    gap: 1,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
