import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type CoverageCardProps = {
  /** Emergency radius in kilometres. */
  radiusKm: number;
  /** Verified donors currently reachable inside that radius. */
  onlineDonors: number;
  /**
   * How far to pull the card up over the map. Exposed so the wizard can set 0
   * where the card is not overlaying a map.
   */
  overlap?: number;
};

/**
 * How far the request will reach, and how many donors are inside that radius.
 *
 * Both numbers come from the caller. There is no coverage endpoint today, so the
 * screen passes placeholders — treat the values as sample data until one exists.
 *
 * Overlays the bottom of `MapPreview` by default, so it casts a shadow to read as
 * the layer in front.
 */
export function CoverageCard({ radiusKm, onlineDonors, overlap = -20 }: CoverageCardProps) {
  return (
    <View style={[styles.card, { marginTop: overlap }]}>
      <View style={styles.iconBadge}>
        <Feather name="radio" size={12} color={Surface.accentBlue} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.radius} numberOfLines={1}>
          Coverage Radius: {radiusKm} km
        </Text>

        <Text style={styles.donors} numberOfLines={2}>
          {onlineDonors} active verified donors currently online
        </Text>
      </View>

      <View style={styles.pill}>
        <Feather name="navigation" size={8} color={Surface.successText} />

        <Text style={styles.pillText} numberOfLines={1}>
          GPS Active
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /**
   * Pulled up over the map's lower edge rather than sitting below it, so the
   * coverage numbers attach to the area they describe. `overlap` sets how far;
   * the card's own height leaves the map's rounded bottom corners visible.
   */
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -20,
    borderRadius: Radius.field,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    ...Elevation.card,
  },

  iconBadge: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
  },

  copy: {
    flex: 1,
    gap: 1,
  },

  radius: {
    ...Typography.small,
    fontSize: 10.5,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  donors: {
    ...Typography.micro,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Surface.successText,
  },
});