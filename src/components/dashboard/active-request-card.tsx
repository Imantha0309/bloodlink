import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type ActiveRequest = {
  /** Reference code without the leading hash, e.g. "BL-8924". */
  reference: string;
  /** Blood group label, e.g. "B+". */
  bloodGroup: string;
  /** Headline describing the need. */
  title: string;
  /** Requesting facility. */
  facilityName: string;
  /** Requesting area. */
  district: string;
  /** How many donors have already responded. */
  respondedCount: number;
  /** Humanised arrival estimate, e.g. "12 min". */
  etaLabel: string;
};

type ActiveRequestCardProps = {
  request: ActiveRequest;
  onPress: () => void;
};

/**
 * The recipient's in-flight request: reference, live donor-response count and
 * arrival estimate.
 *
 * Only the newest request is surfaced on the home screen — the full history
 * lives behind the Requests tab.
 */
export function ActiveRequestCard({ request, onPress }: ActiveRequestCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Active request ${request.reference}, ${request.bloodGroup}, ${request.respondedCount} donors responded`}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.refRow}>
          <Text style={styles.refHash}>#</Text>

          <Text style={styles.ref} numberOfLines={1}>
            BL
          </Text>

          <View style={styles.refDivider} />

          <Text style={styles.ref} numberOfLines={1}>
            {request.reference}
          </Text>
        </View>

        <View style={styles.responded}>
          <Feather name="users" size={9} color={Surface.successText} />

          <Text style={styles.respondedText} numberOfLines={1}>
            {request.respondedCount} Responded
          </Text>
        </View>
      </View>

      <Text style={styles.label}>Active Request</Text>

      <View style={styles.needRow}>
        <View style={styles.groupBadge}>
          <Text style={styles.groupText}>{request.bloodGroup}</Text>
        </View>

        <View style={styles.needCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {request.title}
          </Text>

          <View style={styles.metaRow}>
            <Feather name="map-pin" size={9} color={Surface.textMuted} />

            <Text style={styles.meta} numberOfLines={1}>
              {request.facilityName} · {request.district}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Estimated arrival</Text>

        <Text style={styles.eta} numberOfLines={1}>
          {request.etaLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
    borderRadius: Radius.field,
    padding: 14,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  cardPressed: {
    backgroundColor: Surface.iconWash,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  refRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
  },

  refHash: {
    ...Typography.micro,
    fontSize: 8.5,
    letterSpacing: 0.3,
    color: Surface.textMuted,
  },

  ref: {
    ...Typography.micro,
    fontSize: 8.5,
    letterSpacing: 0.3,
    fontWeight: "700",
    color: Surface.textSecondary,
  },

  refDivider: {
    width: StyleSheet.hairlineWidth,
    height: 9,
    backgroundColor: Surface.borderStrong,
  },

  responded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
  },

  respondedText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Surface.successText,
  },

  label: {
    ...Typography.micro,
    fontSize: 8.5,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: Surface.textMuted,
  },

  needRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  groupBadge: {
    minWidth: 34,
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    alignItems: "center",
    backgroundColor: Surface.softRed,
  },

  groupText: {
    ...Typography.small,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: Surface.danger,
  },

  needCopy: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.body,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  meta: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    flexShrink: 1,
    color: Surface.textMuted,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  footerLabel: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  eta: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    fontWeight: "700",
    color: Surface.successText,
  },
});