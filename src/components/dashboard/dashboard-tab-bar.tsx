import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type TabIconName = ComponentProps<typeof Feather>["name"];

export type DashboardTabKey = "home" | "requests" | "alerts" | "profile";

export type DashboardTab = {
  key: DashboardTabKey;
  label: string;
  icon: TabIconName;
  /** Optional badge count; omit when there is nothing to report. */
  badge?: string;
};

type DashboardTabBarProps = {
  tabs: DashboardTab[];
  activeKey: DashboardTabKey;
  onSelect: (key: DashboardTabKey) => void;
};

/**
 * Fixed bottom navigation for the dashboard.
 *
 * Rendered outside the scroll area by `DashboardShell`, so it stays pinned. Each
 * tab's icon and label stack vertically and the whole tab is one press target —
 * the visual box is ~44px tall, so the tap area already meets the 44px
 * accessibility minimum without extra hit slop.
 */
export function DashboardTabBar({ tabs, activeKey, onSelect }: DashboardTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;

        return (
          <Pressable
            key={tab.key}
            onPress={() => {
              onSelect(tab.key);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={styles.tab}
          >
            <View style={styles.iconWrap}>
              <Feather
                name={tab.icon}
                size={17}
                color={isActive ? Blood.primary : Surface.textMuted}
              />

              {tab.badge !== undefined ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>

            <Text
              style={[styles.label, isActive && styles.labelActive]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingTop: 8,
    backgroundColor: Surface.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 44,
  },

  iconWrap: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    position: "absolute",
    top: -4,
    right: -9,
    minWidth: 13,
    height: 13,
    paddingHorizontal: 3,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 7.5,
    lineHeight: 10,
    letterSpacing: 0,
    color: Surface.onPrimary,
  },

  label: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  labelActive: {
    fontWeight: "700",
    color: Blood.primary,
  },
});