import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type { DashboardStat } from "@/services/dashboard/dashboard";

type StatGridProps = {
  stats: readonly DashboardStat[];
};

const STAT_ICONS: Record<
  string,
  {
    icon: ComponentProps<typeof Feather>["name"];
    color: string;
    bg: string;
  }
> = {
  availability: {
    icon: "radio",
    color: Surface.online,
    bg: Surface.softGreen,
  },
  matching: {
    icon: "droplet",
    color: Blood.primary,
    bg: Surface.softRed,
  },
  open: {
    icon: "globe",
    color: "#175CD3",
    bg: Surface.softBlue,
  },
  critical: {
    icon: "alert-octagon",
    color: Blood.primary,
    bg: Surface.softRed,
  },
  total: {
    icon: "bar-chart-2",
    color: "#7A5AF8",
    bg: "#F4F3FF",
  },
};

/**
 * The KPI row at the top of a dashboard.
 *
 * Enhanced with subtle category icons and clean responsive card layout.
 */
export function StatGrid({ stats }: StatGridProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {stats.map((stat) => {
        const meta = STAT_ICONS[stat.key];

        return (
          <View
            key={stat.key}
            style={styles.card}
            accessible
            accessibilityLabel={`${stat.label}: ${stat.value}`}
          >
            <View style={styles.cardTop}>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {stat.value}
              </Text>

              {meta ? (
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Feather name={meta.icon} size={13} color={meta.color} />
                </View>
              ) : null}
            </View>

            <Text style={styles.label} numberOfLines={2}>
              {stat.label}
            </Text>

            {stat.hint !== null ? (
              <Text style={styles.hint} numberOfLines={2}>
                {stat.hint}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  card: {
    flexGrow: 1,
    flexBasis: 98,
    minWidth: 98,
    padding: 12,
    gap: 3,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    ...Elevation.card,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },

  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  value: {
    ...Typography.title,
    fontSize: 21,
    color: Surface.text,
  },

  label: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.textSecondary,
    fontSize: 12,
  },

  hint: {
    ...Typography.micro,
    fontSize: 10.5,
    color: Surface.textMuted,
    lineHeight: 13,
  },
});
