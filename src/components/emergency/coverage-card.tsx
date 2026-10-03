import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type CoverageCardProps = {
  /** Emergency radius in kilometres. */
  radiusKm: number;
  /** Verified donors currently reachable inside that radius. */
  onlineDonors: number;
};

/**
 * How far the request will reach, and how many donors are inside that radius.
 *
 * Both numbers come from the caller. There is no coverage endpoint today, so the
 * screen passes placeholders — treat the values as sample data until one exists.
 */
export function CoverageCard({ radiusKm, onlineDonors }: CoverageCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Feather name="radio" size={14} color={Surface.accentBlue} />
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
        <Feather name="navigation" size={9} color={Surface.successText} />

        <Text style={styles.pillText} numberOfLines={1}>
          GPS Active
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 8,
    borderRadius: Radius.field,
    padding: 11,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
  },

  copy: {
    flex: 1,
    gap: 2,
  },

  radius: {
    ...Typography.small,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  donors: {
    ...Typography.micro,
    fontSize: 8.5,
    fontWeight: "500",
    lineHeight: 12,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Surface.successText,
  },
});