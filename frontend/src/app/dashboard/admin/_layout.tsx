import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

/**
 * Queue / Banks / Users tabs for the administrator area.
 *
 * The admin role used to be a single read-only screen with no way to reach
 * stock or accounts. These three tabs are the minimum surface that makes the
 * role useful: work waiting in the queue, blood banks and their reserves, and
 * the accounts behind them.
 *
 * Nested inside the root stack's protected `dashboard/admin` screen, so the
 * guard that admits admin accounts still applies to everything here.
 */
export default function AdminTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Blood.primary,
        tabBarInactiveTintColor: Surface.textMuted,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
        tabBarItemStyle: styles.item,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Queue",
          tabBarIcon: ({ color, size }) => <Feather name="inbox" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="banks"
        options={{
          title: "Banks",
          tabBarIcon: ({ color, size }) => <Feather name="droplet" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Surface.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  label: {
    ...Typography.micro,
    fontSize: 11,
    letterSpacing: 0,
  },

  item: {
    paddingTop: 4,
  },
});
