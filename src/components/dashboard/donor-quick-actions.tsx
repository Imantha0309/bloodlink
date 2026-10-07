import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";

type DonorQuickActionsProps = {
  matchingCount: number;
  onOpenCompatibility?: () => void;
};

export function DonorQuickActions({
  matchingCount,
  onOpenCompatibility,
}: DonorQuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      id: "requests",
      label: "Live Requests",
      hint: matchingCount > 0 ? `${matchingCount} open matches` : "View requests",
      icon: "droplet" as const,
      iconColor: Blood.primary,
      iconBg: Surface.softRed,
      badge: matchingCount > 0 ? String(matchingCount) : null,
      onPress: () => router.push(ROUTES.donorRequests),
    },
    {
      id: "transit",
      label: "Donation Journey",
      hint: "Track hospital trip",
      icon: "navigation" as const,
      iconColor: "#175CD3",
      iconBg: Surface.softBlue,
      badge: null,
      onPress: () => router.push(ROUTES.donorTransit),
    },
    {
      id: "intake",
      label: "Hospital Pass",
      hint: "Intake QR ticket",
      icon: "grid" as const,
      iconColor: "#027A48",
      iconBg: Surface.softGreen,
      badge: null,
      onPress: () => router.push(ROUTES.donorIntake),
    },
    {
      id: "profile",
      label: "Donor Profile",
      hint: "Blood group & district",
      icon: "user" as const,
      iconColor: "#7A5AF8",
      iconBg: "#F4F3FF",
      badge: null,
      onPress: onOpenCompatibility ?? (() => router.push(ROUTES.donorProfile)),
    },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          accessibilityLabel={item.label}
          onPress={item.onPress}
          style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
              <Feather name={item.icon} size={18} color={item.iconColor} />
            </View>

            {item.badge !== null ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : (
              <Feather name="arrow-up-right" size={14} color={Surface.textMuted} />
            )}
          </View>

          <View style={styles.labelBlock}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.hint} numberOfLines={1}>
              {item.hint}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  actionCard: {
    flexGrow: 1,
    flexBasis: "47%",
    minWidth: 140,
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 10.5,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  labelBlock: {
    gap: 2,
  },

  label: {
    ...Typography.cardTitle,
    fontSize: 13.5,
    color: Surface.text,
  },

  hint: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
