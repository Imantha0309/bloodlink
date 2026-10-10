import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Radius } from "@/constants/radius";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { Typography } from "@/constants/typography";

type AuthIntroCardProps = {
  title: string;
  description: string;
};

/**
 * BloodLink identity card at the top of the sign-in flow. Presentation only —
 * the copy is supplied by the screen so this stays reusable across auth
 * screens.
 */
export function AuthIntroCard({ title, description }: AuthIntroCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Feather name="activity" size={20} color={Blood.primary} />
        </View>

        <View style={styles.copy}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          <Text style={styles.description}>{description}</Text>
        </View>
      </View>
    </View>
  );
}

const BADGE_SIZE = 44;

const styles = StyleSheet.create({
  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    ...Elevation.card,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  copy: {
    flex: 1,
    gap: 4,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  description: {
    ...Typography.small,
    color: Surface.textSecondary,
  },
});