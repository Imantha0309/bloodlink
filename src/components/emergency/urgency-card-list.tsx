import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { URGENCY_OPTIONS, type UrgencyLevel } from "@/constants/emergency";
import { Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

/**
 * Copy for the request wizard.
 *
 * `URGENCY_OPTIONS` already carries the colour treatment and the canonical
 * level names, and the dashboard's request card renders those — so the wording
 * the wizard shows is kept here rather than overwriting the shared constant.
 * `emergency.ts` stays the single source of truth for which levels exist and how
 * each one is coloured.
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
 * Chips cannot carry the two-line title-plus-subtitle plus a badge at this
 * density, so the wizard gets cards instead. Selection is exclusive by
 * construction — `onChange` replaces the value rather than toggling.
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
            <View style={styles.top}>
              <View style={styles.heading}>
                <Text
                  style={[styles.title, isSelected && styles.titleSelected]}
                  numberOfLines={1}
                >
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

              <Feather
                name={isSelected ? "radio" : "circle"}
                size={16}
                color={isSelected ? Surface.danger : Surface.textMuted}
              />
            </View>

            <Text style={styles.subtitle} numberOfLines={2}>
              {copy.subtitle}
            </Text>

            {/* A red spine reinforces the selected state without adding another
                full border, which would fight the tinted fill. */}
            {isSelected ? <View style={styles.spine} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },

  card: {
    position: "relative",
    gap: 4,
    overflow: "hidden",
    borderRadius: Radius.field,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: Surface.card,
    borderWidth: 1.5,
    borderColor: Surface.border,
    ...Elevation.card,
  },

  cardSelected: {
    borderColor: Surface.danger,
    backgroundColor: Surface.softRed,
  },

  cardPressed: {
    borderColor: Surface.borderStrong,
  },

  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexShrink: 1,
  },

  title: {
    ...Typography.body,
    fontSize: 12.5,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
    flexShrink: 1,
  },

  titleSelected: {
    color: Surface.danger,
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    backgroundColor: Surface.danger,
  },

  badgeText: {
    ...Typography.micro,
    fontSize: 7,
    letterSpacing: 0.4,
    fontWeight: "700",
    color: Surface.onPrimary,
  },

  subtitle: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "500",
    lineHeight: 13,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },

  spine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 3,
    backgroundColor: Surface.danger,
  },
});