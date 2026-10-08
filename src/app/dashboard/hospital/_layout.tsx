import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

/**
 * Home / Requests / Profile tabs for the hospital area.
 *
 * Nested inside the root stack's protected `dashboard/hospital` screen, so the
 * guard that admits hospital accounts still applies to everything here.
 */
export default function HospitalTabsLayout() {
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
          title: "Home",
          tabBarIcon: ({ color, size }) => <Feather name="activity" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="requests"
        options={{
          title: "Requests",
          tabBarIcon: ({ color, size }) => <Feather name="inbox" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
        }}
      />

      {/* Reachable by navigation only — the storage monitor is pushed from the
          Home tab's storage card, not a tab of its own. */}
      <Tabs.Screen name="storage" options={{ href: null }} />

      {/* Same for the requisition form, pushed from Home and from storage. */}
      <Tabs.Screen name="create-request" options={{ href: null }} />

      {/* And for the broadcast progress, pushed from the form's submit. */}
      <Tabs.Screen name="transmission" options={{ href: null }} />

      {/* Same for the donor arrival desk, pushed from a requisition card. */}
      <Tabs.Screen name="verify-donor" options={{ href: null }} />

      {/* And for the collection telemetry, pushed from the arrival desk.
          It owns the full screen — no tab bar while it runs. */}
      <Tabs.Screen
        name="extraction-session"
        options={{ href: null, tabBarStyle: { display: "none" } }}
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
