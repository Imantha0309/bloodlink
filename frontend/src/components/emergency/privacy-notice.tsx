import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type PrivacyNoticeProps = {
  icon?: ComponentProps<typeof Feather>["name"];
  children: string;
};

/**
 * Pale-blue informational note, e.g. how donor data is filtered before dispatch.
 *
 * Informational only — no press target, since a tappable-looking card that does
 * nothing is worse than plain text.
 */
export function PrivacyNotice({ icon = "shield", children }: PrivacyNoticeProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBadge}>
        <Feather name={icon} size={11} color={Surface.accentBlue} />
      </View>

      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: Radius.field,
    padding: 9,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  /** White disc so the glyph separates from the tinted panel. */
  iconBadge: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  text: {
    ...Typography.micro,
    flex: 1,
    fontSize: 8,
    lineHeight: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});