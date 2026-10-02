import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import type { DashboardStat } from "@/services/dashboard/dashboard";

type StatGridProps = {
  stats: readonly DashboardStat[];
};

/**
 * The KPI row at the top of a dashboard.
 *
 * Wraps rather than scrolls, so three or four stats still fit on a narrow
 * phone without horizontal scrolling.
 */
export function StatGrid({ stats }: StatGridProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <View style={styles.row}>
      {stats.map((stat) => (
        <View key={stat.key} style={styles.card} accessible accessibilityLabel={`${stat.label}: ${stat.value}`}>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {stat.value}
          </Text>

          <Text style={styles.label} numberOfLines={2}>
            {stat.label}
          </Text>

          {stat.hint !== null ? (
            <Text style={styles.hint} numberOfLines={2}>
              {stat.hint}
            </Text>
          ) : null}
        </View>
      ))}
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
    flexBasis: 96,
    minWidth: 96,
    padding: 12,
    gap: 2,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  value: {
    ...Typography.title,
    fontSize: 20,
    color: Surface.text,
  },

  label: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  hint: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textMuted,
  },
});
