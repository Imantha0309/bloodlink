import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type BloodBankSummary = {
  id: string;
  name: string;
  /** Short area or distance label, e.g. "Colombo 07 · 2.4 km". */
  meta: string;
  /** Availability text shown in the trailing pill. */
  availability: string;
  /** Whether the availability pill reads as positive. */
  isOpen: boolean;
};

type NearbyBloodBanksProps = {
  banks: BloodBankSummary[];
  onBankPress: (id: string) => void;
};

/**
 * Nearby bank rows with an availability pill and a chevron.
 *
 * Inventory is not yet exposed by the API, so the rows take their content from
 * the caller until that endpoint lands.
 */
export function NearbyBloodBanks({ banks, onBankPress }: NearbyBloodBanksProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        Nearby Blood Banks
      </Text>

      <View style={styles.list}>
        {banks.map((bank, index) => (
          <Pressable
            key={bank.id}
            onPress={() => {
              onBankPress(bank.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={`${bank.name}, ${bank.meta}, ${bank.availability}`}
            style={({ pressed }) => [
              styles.row,
              index > 0 && styles.rowDivided,
              pressed && styles.rowPressed,
            ]}
          >
            <View style={styles.iconBadge}>
              <Feather name="map-pin" size={13} color={Surface.accentBlue} />
            </View>

            <View style={styles.copy}>
              <Text style={styles.name} numberOfLines={1}>
                {bank.name}
              </Text>

              <Text style={styles.meta} numberOfLines={1}>
                {bank.meta}
              </Text>
            </View>

            <View
              style={[styles.pill, bank.isOpen ? styles.pillOpen : styles.pillClosed]}
            >
              <Text
                style={[styles.pillText, bank.isOpen ? styles.pillTextOpen : styles.pillTextClosed]}
                numberOfLines={1}
              >
                {bank.availability}
              </Text>
            </View>

            <Feather name="chevron-right" size={14} color={Surface.textMuted} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 9,
  },

  heading: {
    ...Typography.body,
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
  },

  list: {
    borderRadius: Radius.field,
    paddingHorizontal: 12,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 11,
  },

  /** Hairline between rows, inset past the leading icon. */
  rowDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  rowPressed: {
    opacity: 0.6,
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

  name: {
    ...Typography.small,
    fontSize: 11.5,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Surface.text,
  },

  meta: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  pill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },

  pillOpen: {
    backgroundColor: Surface.softGreen,
  },

  pillClosed: {
    backgroundColor: Surface.iconWash,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.2,
    fontWeight: "700",
  },

  pillTextOpen: {
    color: Surface.successText,
  },

  pillTextClosed: {
    color: Surface.textMuted,
  },
});