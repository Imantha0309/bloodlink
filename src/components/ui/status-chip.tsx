/**
 * The pill that renders any status meta (request status, urgency, donation
 * stage, alert type).
 *
 * Screens pass the metadata object from the shared constants maps instead of
 * restyling a pill per screen, so an identical state never looks different
 * twice.
 */

import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type ChipMeta = {
  label: string;
  icon: ComponentProps<typeof Feather>["name"];
  background: string;
  border: string;
  color: string;
};

type StatusChipProps = {
  meta: ChipMeta;
  /** `sm` matches the 9.5pt micro-pills on triage cards. */
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
};

export function StatusChip({ meta, size = "md", style }: StatusChipProps) {
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: meta.background, borderColor: meta.border },
        size === "sm" && styles.chipSm,
        style,
      ]}
    >
      <Feather name={meta.icon} size={size === "sm" ? 10 : 12} color={meta.color} />
      <Text style={[styles.label, size === "sm" && styles.labelSm, { color: meta.color }]}>
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },

  chipSm: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },

  label: {
    ...Typography.label,
    fontWeight: "700",
  },

  labelSm: {
    ...Typography.micro,
    fontSize: 9.5,
  },
});
