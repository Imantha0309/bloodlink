import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type { RoleCardMeta } from "@/constants/roles";

type RoleCardProps = {
  meta: RoleCardMeta;
  selected: boolean;
  onPress: () => void;
};

/**
 * One selectable role in the role-selection list.
 *
 * Presentation only — it holds no state of its own, so the screen stays the
 * single source of truth for which role is chosen.
 */
export function RoleCard({ meta, selected, onPress }: RoleCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Select ${meta.title} role`}
      accessibilityHint={meta.description}
      hitSlop={HIT_SLOP_MIN / 4}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && !selected && styles.cardPressed,
      ]}
    >
      {/* Top-right confirmation, pinned to the card corner. */}
      {selected ? (
        <View style={styles.check} accessibilityElementsHidden importantForAccessibility="no">
          <Feather name="check" size={11} color={Surface.onPrimary} />
        </View>
      ) : null}

      <View style={styles.top}>
        <View
          style={[styles.iconWrap, { backgroundColor: meta.accent.background, borderColor: meta.accent.border }]}
        >
          <Feather name={meta.icon} size={17} color={meta.accent.icon} />
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {meta.title}
          </Text>
        </View>

        <View style={styles.indicator}>
          <Feather
            name={selected ? "check-circle" : "circle"}
            size={selected ? 19 : 17}
            color={selected ? Blood.primary : Surface.softBlueBorder}
          />
        </View>
      </View>

      <View style={[styles.badge, { backgroundColor: meta.accent.background }]}>
        <Text style={[styles.badgeText, { color: meta.accent.icon }]} numberOfLines={1}>
          {meta.badge}
        </Text>
      </View>

      <Text style={styles.description}>{meta.description}</Text>

      <View style={styles.features}>
        {meta.features.map((feature) => (
          <View key={feature} style={styles.feature}>
            <Feather name="check" size={9} color={Surface.textMuted} />

            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: "relative",
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    gap: 8,
    ...Elevation.card,
  },

  cardSelected: {
    borderColor: Blood.primary,
    backgroundColor: Surface.background,
  },

  cardPressed: {
    borderColor: Surface.borderStrong,
  },

  check: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 22,
    height: 22,
    borderBottomLeftRadius: Radius.card,
    borderTopLeftRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    // Leaves room for the corner check badge.
    paddingRight: 18,
  },

  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm + 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  titleBlock: {
    flex: 1,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  indicator: {
    marginLeft: 2,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 9,
  },

  description: {
    ...Typography.small,
    lineHeight: 17,
    color: Surface.textSecondary,
  },

  features: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingTop: 2,
  },

  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  featureText: {
    ...Typography.micro,
    fontWeight: "500",
    letterSpacing: 0,
    color: Surface.textMuted,
  },
});