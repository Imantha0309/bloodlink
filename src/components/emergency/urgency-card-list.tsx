import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { URGENCY_OPTIONS, type UrgencyLevel } from "@/constants/emergency";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

/**
 * Copy for the request wizard.
 *
 * `URGENCY_OPTIONS` already carries the level names and the per-level icon, and
 * the dashboard's request card renders those — so only the wizard's own wording
 * and its badge live here rather than overwriting the shared constant.
 * `emergency.ts` stays the single source of truth for which levels exist.
 */
const WIZARD_COPY: Record<
  UrgencyLevel,
  { title: string; subtitle: string; badge?: string }
> = {
  critical: {
    title: "Immediate",
    subtitle: "Required within next 2 hours",
    badge: "EMERGENCY",
  },
  urgent: {
    title: "Within 6 Hours",
    subtitle: "Scheduled surgery or transfusion",
  },
  standard: {
    title: "Within 24 Hours",
    subtitle: "Routine replacement or standby reserve",
  },
};

/**
 * Wizard-facing name for a level, e.g. for the review summary.
 *
 * Exported so the review step labels urgency exactly as the cards do, rather
 * than restating the wording.
 */
export function urgencyTitle(level: UrgencyLevel | null): string {
  return level === null ? "—" : WIZARD_COPY[level].title;
}

type UrgencyCardListProps = {
  value: UrgencyLevel | null;
  onChange: (level: UrgencyLevel) => void;
};

/**
 * Single-select urgency choice, rendered as full-width cards.
 *
 * Chips cannot carry the icon, the two-line title-plus-subtitle and a badge at
 * this density, so the wizard gets cards instead. Each card is one row — icon,
 * copy, radio — so all three keep the same height whether or not they carry a
 * badge, and selection changes only the border, the icon and the radio.
 *
 * Selection is exclusive by construction: `onChange` replaces the value rather
 * than toggling.
 */
export function UrgencyCardList({ value, onChange }: UrgencyCardListProps) {
  return (
    <View style={styles.list}>
      {URGENCY_OPTIONS.map((option) => {
        const isSelected = option.level === value;
        const copy = WIZARD_COPY[option.level];

        return (
          <Pressable
            key={option.level}
            onPress={() => onChange(option.level)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${copy.title}. ${copy.subtitle}`}
            style={({ pressed }) => [
              styles.card,
              isSelected && styles.cardSelected,
              pressed && !isSelected && styles.cardPressed,
            ]}
          >
            <View style={[styles.icon, isSelected && styles.iconSelected]}>
              <Feather
                name={option.icon}
                size={13}
                color={isSelected ? Surface.onPrimary : Surface.textSecondary}
              />
            </View>

            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={styles.title} numberOfLines={1}>
                  {copy.title}
                </Text>

                {copy.badge !== undefined ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText} numberOfLines={1}>
                      {copy.badge}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.subtitle} numberOfLines={2}>
                {copy.subtitle}
              </Text>
            </View>

            <Feather
              name={isSelected ? "radio" : "circle"}
              size={14}
              color={isSelected ? Blood.primary : Surface.textMuted}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 6,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: Radius.field,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  /** White fill with a red border — the fill stays neutral so the red reads. */
  cardSelected: {
    borderColor: Blood.primary,
    borderWidth: 1.5,
  },

  cardPressed: {
    borderColor: Surface.borderStrong,
  },

  icon: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  iconSelected: {
    backgroundColor: Blood.primary,
  },

  copy: {
    flex: 1,
    gap: 2,
    flexShrink: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  title: {
    ...Typography.body,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: Surface.text,
    flexShrink: 1,
  },

  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    backgroundColor: Blood.primary,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 6.5,
    lineHeight: 9,
    letterSpacing: 0.4,
    fontWeight: "700",
    color: Surface.onPrimary,
  },

  subtitle: {
    ...Typography.micro,
    fontSize: 8.5,
    lineHeight: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});