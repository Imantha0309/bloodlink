import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Surface } from "@/constants/colors";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";

export type DonorTab = "home" | "requests" | "transit" | "intake" | "profile";

const TABS: { id: DonorTab; label: string; icon: React.ComponentProps<typeof Feather>["name"]; route: string }[] = [
  { id: "home", label: "Home", icon: "home", route: ROUTES.donorHome },
  { id: "requests", label: "Requests", icon: "droplet", route: ROUTES.donorRequests },
  { id: "transit", label: "In Transit", icon: "navigation", route: ROUTES.donorTransit },
  { id: "intake", label: "Intake QR", icon: "grid", route: ROUTES.donorIntake },
  { id: "profile", label: "Profile", icon: "user", route: ROUTES.donorProfile },
];

export function DonorTabBar({ active }: { active: DonorTab }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
            onPress={() => router.replace(tab.route as never)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, selected && styles.selectedIconWrap]}>
              <Feather name={tab.icon} size={19} color={selected ? Blood.primary : Surface.textMuted} />
            </View>
            <Text style={[styles.label, selected && styles.selectedLabel]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 8,
    backgroundColor: Surface.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },
  tab: { flex: 1, alignItems: "center", justifyContent: "center", gap: 2, minHeight: 52 },
  iconWrap: { width: 34, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  selectedIconWrap: { backgroundColor: Surface.softRed },
  label: { ...Typography.micro, color: Surface.textMuted, fontSize: 10 },
  selectedLabel: { color: Blood.primary, fontWeight: "700" },
  pressed: { opacity: 0.72 },
});
