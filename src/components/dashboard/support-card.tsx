import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

/**
 * Non-interactive reassurance card that closes the home screen.
 *
 * Informational only, so it carries no press target — a tappable-looking card
 * that does nothing is worse than plain text.
 */
export function SupportCard() {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Feather name="heart" size={14} color={Surface.accentBlue} />
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>Need help?</Text>

        <Text style={styles.body}>
          Our support team is here for you 24/7.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.field,
    padding: 12,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  copy: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.small,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  body: {
    ...Typography.micro,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});