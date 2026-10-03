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
      <Feather name={icon} size={14} color={Surface.accentBlue} />

      <Text style={styles.text}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: Radius.field,
    padding: 11,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  text: {
    ...Typography.micro,
    flex: 1,
    fontSize: 8.5,
    fontWeight: "500",
    lineHeight: 13,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});