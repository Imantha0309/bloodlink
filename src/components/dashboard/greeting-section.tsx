import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type GreetingSectionProps = {
  /** Full name from the session; only the first word is used. */
  fullName: string;
  /** District from the session, shown in the location pill. */
  district: string | null;
  /** Unread count badge on the location pill. */
  notificationCount?: string;
  onLocationPress: () => void;
};

function firstName(fullName: string): string {
  const trimmed = fullName.trim();

  return trimmed === "" ? "there" : (trimmed.split(/\s+/)[0] ?? "there");
}

/**
 * "Hello, <name>" greeting with the location pill on the trailing edge.
 *
 * The greeting copy stays on two lines so the pill and the text baseline block
 * heights line up on narrow screens.
 */
export function GreetingSection({
  fullName,
  district,
  notificationCount,
  onLocationPress,
}: GreetingSectionProps) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.hello} numberOfLines={1}>
          Hello, {firstName(fullName)} 👋
        </Text>

        <Text style={styles.subtitle} numberOfLines={2}>
          Ready to assist or connect you with{"\n"}
          urgent donors.
        </Text>
      </View>

      <Pressable
        onPress={onLocationPress}
        accessibilityRole="button"
        accessibilityLabel={`Location: ${district ?? "not set"}. Tap to change.`}
        hitSlop={HIT_SLOP_MIN / 2}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
      >
        <View style={styles.pillRow}>
          <Feather name="map-pin" size={11} color={Surface.textSecondary} />

          <Text style={styles.pillText} numberOfLines={1}>
            {district ?? "Set location"}
          </Text>
        </View>

        {notificationCount !== undefined ? (
          <View style={styles.count}>
            <Text style={styles.countText}>{notificationCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  copy: {
    flex: 1,
    gap: 3,
  },

  hello: {
    fontSize: 16.5,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: -0.3,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 11,
    lineHeight: 15,
    color: Surface.textSecondary,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 8,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  pillPressed: {
    backgroundColor: Surface.iconWash,
  },

  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  pillText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },

  count: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  countText: {
    ...Typography.micro,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0,
    color: Surface.onPrimary,
  },
});