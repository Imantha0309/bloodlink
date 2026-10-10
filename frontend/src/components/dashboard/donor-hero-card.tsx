import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BLOOD_GROUP_NOTES, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";

function getInitials(name?: string | null): string {
  if (!name) return "BD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type DonorHeroCardProps = {
  fullName: string;
  bloodGroup: BloodGroup | null;
  district: string | null;
  isAvailable: boolean;
};

export function DonorHeroCard({
  fullName,
  bloodGroup,
  district,
  isAvailable,
}: DonorHeroCardProps) {
  const router = useRouter();
  const firstName = fullName.trim().split(/\s+/)[0] || "Donor";
  const initials = getInitials(fullName);
  const note = bloodGroup ? BLOOD_GROUP_NOTES[bloodGroup] : null;

  return (
    <View style={styles.card}>
      {/* Top row: Greeting + Avatar */}
      <View style={styles.topRow}>
        <View style={styles.greetingBlock}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, isAvailable ? styles.statusDotActive : styles.statusDotPaused]} />
            <Text style={[styles.statusLabel, isAvailable ? styles.statusLabelActive : styles.statusLabelPaused]}>
              {isAvailable ? "DISPATCH READY" : "STANDBY"}
            </Text>
          </View>

          <Text style={styles.greeting} numberOfLines={1}>
            Hello, {firstName} 👋
          </Text>
          <Text style={styles.subtitle}>
            {isAvailable
              ? "You are actively matched to emergency hospital requests."
              : "Turn on availability when you're ready to receive alerts."}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open donor profile"
          onPress={() => router.push(ROUTES.donorProfile)}
          style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      {/* Badges row: Blood Group & District */}
      <View style={styles.metaRow}>
        {bloodGroup ? (
          <View style={styles.bloodBadge}>
            <Feather name="droplet" size={13} color={Blood.primary} />
            <Text style={styles.bloodGroupText}>{bloodGroup}</Text>
            <Text style={styles.bloodTag}>Donor</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set blood group in profile"
            onPress={() => router.push(ROUTES.donorProfile)}
            style={({ pressed }) => [styles.missingBadge, pressed && styles.pressed]}
          >
            <Feather name="plus-circle" size={12} color={Blood.primary} />
            <Text style={styles.missingBadgeText}>Set blood group</Text>
          </Pressable>
        )}

        {district ? (
          <View style={styles.districtBadge}>
            <Feather name="map-pin" size={12} color={Surface.textSecondary} />
            <Text style={styles.districtText}>{district}</Text>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Set district in profile"
            onPress={() => router.push(ROUTES.donorProfile)}
            style={({ pressed }) => [styles.missingBadge, pressed && styles.pressed]}
          >
            <Feather name="map-pin" size={12} color={Surface.textMuted} />
            <Text style={styles.missingBadgeText}>Add district</Text>
          </Pressable>
        )}

        {note ? (
          <View style={styles.noteBadge}>
            <Feather name="award" size={12} color="#B54708" />
            <Text style={styles.noteText} numberOfLines={1}>
              {bloodGroup === "O-" ? "Universal Donor" : bloodGroup === "AB+" ? "Universal Recipient" : "Compatible"}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },

  greetingBlock: {
    flex: 1,
    gap: 4,
  },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },

  statusDotActive: {
    backgroundColor: Surface.online,
  },

  statusDotPaused: {
    backgroundColor: Surface.textMuted,
  },

  statusLabel: {
    ...Typography.micro,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  statusLabelActive: {
    color: Surface.online,
  },

  statusLabelPaused: {
    color: Surface.textMuted,
  },

  greeting: {
    ...Typography.screenTitle,
    fontSize: 21,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
    lineHeight: 16,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Surface.softRed,
    borderWidth: 1.5,
    borderColor: Surface.softRedBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPressed: {
    opacity: 0.8,
  },

  avatarText: {
    ...Typography.label,
    fontWeight: "700",
    color: Blood.primary,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  bloodBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  bloodGroupText: {
    ...Typography.label,
    fontWeight: "800",
    color: Blood.primary,
  },

  bloodTag: {
    ...Typography.micro,
    color: Blood.primary,
    fontWeight: "600",
  },

  districtBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  districtText: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontWeight: "600",
  },

  noteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: "#FEF0C7",
    borderWidth: 1,
    borderColor: "#FEDF89",
  },

  noteText: {
    ...Typography.micro,
    fontWeight: "700",
    color: "#B54708",
  },

  missingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: Surface.background,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Surface.borderStrong,
  },

  missingBadgeText: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontWeight: "600",
  },

  pressed: {
    opacity: 0.7,
  },
});
