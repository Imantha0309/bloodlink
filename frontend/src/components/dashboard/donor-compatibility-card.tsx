import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { CAN_DONATE_TO, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type DonorCompatibilityCardProps = {
  bloodGroup: BloodGroup | null;
};

export function DonorCompatibilityCard({ bloodGroup }: DonorCompatibilityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!bloodGroup) {
    return null;
  }

  const recipients = CAN_DONATE_TO[bloodGroup] || [];

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle blood compatibility information"
        onPress={() => setIsExpanded((prev) => !prev)}
        style={styles.headerRow}
      >
        <View style={styles.iconCircle}>
          <Feather name="heart" size={16} color={Blood.primary} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title}>Your Blood Compatibility ({bloodGroup})</Text>
          <Text style={styles.subtitle}>
            Can donate to {recipients.length} blood {recipients.length === 1 ? "group" : "groups"}
          </Text>
        </View>

        <Feather
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Surface.textSecondary}
        />
      </Pressable>

      {/* Recipient tags row (always visible preview) */}
      <View style={styles.chipsRow}>
        {recipients.map((grp) => (
          <View key={grp} style={styles.groupChip}>
            <Text style={styles.groupChipText}>{grp}</Text>
          </View>
        ))}
      </View>

      {/* Expanded section: Donation Readiness & Tips */}
      {isExpanded ? (
        <View style={styles.tipsSection}>
          <Text style={styles.tipsHeading}>Quick Donation Readiness Checklist</Text>

          <View style={styles.tipItem}>
            <Feather name="check" size={13} color="#027A48" />
            <Text style={styles.tipText}>
              <Text style={styles.bold}>Hydration:</Text> Drink at least 500ml of water before donation.
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Feather name="check" size={13} color="#027A48" />
            <Text style={styles.tipText}>
              <Text style={styles.bold}>Nutrition:</Text> Have a light, iron-rich meal 2–3 hours prior.
            </Text>
          </View>

          <View style={styles.tipItem}>
            <Feather name="check" size={13} color="#027A48" />
            <Text style={styles.tipText}>
              <Text style={styles.bold}>Identification:</Text> Bring your Sri Lankan NIC or driving license.
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  headerText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 2,
  },

  groupChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  groupChipText: {
    ...Typography.micro,
    fontWeight: "700",
    color: Surface.text,
  },

  tipsSection: {
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
    gap: 8,
  },

  tipsHeading: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.text,
  },

  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  tipText: {
    ...Typography.small,
    fontSize: 11.5,
    color: Surface.textSecondary,
    flex: 1,
    lineHeight: 16,
  },

  bold: {
    fontWeight: "700",
    color: Surface.text,
  },
});
