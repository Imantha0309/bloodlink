import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import type { Requisition } from "@/utils/requisition";

const AVATAR_SIZE = 26;

/**
 * One emergency requisition on the hospital board.
 *
 * The two states differ only in what sits on the right of the status panel —
 * overlapping donor avatars while donors are moving, an urgency flag while the
 * broadcast is still unanswered — so both share one card.
 */
export function RequisitionCard({
  item,
  onManage,
}: {
  item: Requisition;
  /** Opens this requisition's desk; falls back to the generic verify screen. */
  onManage?: () => void;
}) {
  const router = useRouter();
  const isTransit = item.status === "in-transit";

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.topText}>
          <Text style={styles.reference} numberOfLines={1}>
            {item.reference}
          </Text>

          <Text style={styles.ward} numberOfLines={1}>
            • {item.ward}
          </Text>
        </View>

        <View style={styles.groupPill}>
          <Text style={styles.groupText}>
            {`${item.bloodGroup} (${item.units} ${item.units === 1 ? "Unit" : "Units"})`}
          </Text>
        </View>
      </View>

      <Text style={styles.subtitle} numberOfLines={1}>
        {item.subtitle}
      </Text>

      <View style={[styles.panel, isTransit ? styles.panelTransit : styles.panelBroadcast]}>
        <View style={styles.panelBadge}>
          <Feather name={isTransit ? "navigation" : "radio"} size={13} color={Surface.online} />
        </View>

        <View style={styles.panelText}>
          <Text style={styles.panelTitle} numberOfLines={1}>
            {item.statusTitle}
          </Text>

          <Text style={styles.panelDetail} numberOfLines={1}>
            {item.statusDetail}
          </Text>
        </View>

        {isTransit ? (
          <View style={styles.avatars}>
            {item.donorInitials.slice(0, 3).map((initials, index) => (
              <View
                key={initials}
                style={[styles.avatar, index > 0 && styles.avatarOverlap]}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            ))}
          </View>
        ) : item.urgency !== null ? (
          <View style={styles.urgency}>
            <Text style={styles.urgencyText}>{item.urgency}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.meta}>
          <Feather name="clock" size={12} color={Surface.textMuted} />
          <Text style={styles.metaText}>{item.createdAt}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Manage requisition ${item.reference}`}
          accessibilityHint="Opens the donor arrival desk"
          hitSlop={8}
          style={({ pressed }) => [styles.manage, pressed && styles.pressed]}
          onPress={() => {
            if (onManage !== undefined) {
              onManage();
              return;
            }

            router.push(ROUTES.hospitalVerifyDonor);
          }}
        >
          <Text style={styles.manageText}>Manage Requisition</Text>
          <Feather name="arrow-right" size={13} color={Blood.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  topText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  reference: {
    flexShrink: 0,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  ward: {
    flexShrink: 1,
    ...Typography.small,
    color: Surface.textSecondary,
  },

  groupPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  groupText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.onPrimary,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  panel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },

  panelTransit: {
    backgroundColor: Surface.softGreen,
    borderColor: Surface.softGreenBorder,
  },

  panelBroadcast: {
    backgroundColor: Surface.softBlue,
    borderColor: Surface.softBlueBorder,
  },

  panelBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softGreen,
  },

  panelText: {
    flex: 1,
    gap: 2,
  },

  panelTitle: {
    ...Typography.label,
    color: Surface.online,
  },

  panelDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },

  avatarOverlap: {
    marginLeft: -8,
  },

  avatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: Surface.text,
  },

  urgency: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  urgencyText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  manage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minHeight: 24,
  },

  manageText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.55,
  },
});
