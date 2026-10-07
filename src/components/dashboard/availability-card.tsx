import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import {
  deleteDonorAvailability,
  setDonorAvailability,
  type DonorAvailability,
} from "@/services/dashboard/dashboard";

type AvailabilityCardProps = {
  availability: DonorAvailability;
  /**
   * Called with the value the server confirmed. The dashboard stores it, so the
   * switch reflects server state rather than a local copy that could drift.
   */
  onSaved: (next: DonorAvailability) => void;
};

/**
 * The donor's self-service availability switch.
 *
 * Fully controlled: the displayed value always comes from `availability`.
 */
export function AvailabilityCard({ availability, onSaved }: AvailabilityCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAvailable = availability.isAvailable;

  async function handleToggle(next: boolean) {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      onSaved(await setDonorAvailability(next));
    } catch (caught) {
      // Nothing to roll back — the switch never left the server's value.
      setError(apiErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  function confirmRemove() {
    Alert.alert(
      "Remove availability record?",
      "You will be paused and hidden from available-donor totals. You can set your availability again at any time.",
      [
        { text: "Keep record", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => void handleRemove(),
        },
      ],
    );
  }

  async function handleRemove() {
    if (isSaving) return;
    setIsSaving(true);
    setError(null);
    try {
      onSaved(await deleteDonorAvailability());
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={[styles.card, isAvailable ? styles.cardActive : styles.cardPaused]}>
      <View style={styles.topRow}>
        <View style={[styles.statusBadge, isAvailable ? styles.badgeActive : styles.badgePaused]}>
          <Feather
            name={isAvailable ? "radio" : "pause"}
            size={18}
            color={isAvailable ? Surface.online : Surface.textMuted}
          />
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {!availability.recordExists
                ? "Availability Record Removed"
                : isAvailable
                ? "Available & Receiving Alerts"
                : "Standby / Paused"}
            </Text>
            {isAvailable ? (
              <View style={styles.onlinePill}>
                <View style={styles.pulsingDot} />
                <Text style={styles.onlinePillText}>ONLINE</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.subtitle}>
            {!availability.recordExists
              ? "You are hidden from hospital dispatch. Turn switch on to participate."
              : isAvailable
              ? "Hospitals can see your active donor status for matching emergencies."
              : "Emergency alerts are paused. Flip the switch whenever you're ready to donate."}
          </Text>

          {availability.lastDonationAt !== null ? (
            <View style={styles.lastDonationPill}>
              <Feather name="calendar" size={11} color={Surface.textSecondary} />
              <Text style={styles.meta}>Last donation: {availability.lastDonationAt}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.switchWrap}>
          {isSaving ? (
            <ActivityIndicator size="small" color={Blood.primary} />
          ) : (
            <Switch
              value={isAvailable}
              onValueChange={(next) => {
                void handleToggle(next);
              }}
              accessibilityLabel="Available to donate"
              trackColor={{ false: Surface.borderStrong, true: Surface.softGreenBorder }}
              thumbColor={isAvailable ? Surface.online : Surface.card}
              ios_backgroundColor={Surface.borderStrong}
            />
          )}
        </View>
      </View>

      {availability.recordExists ? (
        <View style={styles.footerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Remove availability record"
            disabled={isSaving}
            onPress={confirmRemove}
            style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
          >
            <Feather name="trash-2" size={12} color={Surface.danger} />
            <Text style={styles.removeText}>Remove availability record</Text>
          </Pressable>
        </View>
      ) : null}

      {error !== null ? (
        <View style={styles.error}>
          <Feather name="alert-circle" size={12} color={Surface.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 15,
    gap: 10,
    borderRadius: Radius.card,
    borderWidth: 1,
    backgroundColor: Surface.card,
    ...Elevation.card,
  },

  cardActive: {
    borderColor: Surface.softGreenBorder,
    backgroundColor: "#F6FEF9",
  },

  cardPaused: {
    borderColor: Surface.border,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  statusBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeActive: {
    backgroundColor: Surface.softGreen,
  },

  badgePaused: {
    backgroundColor: Surface.iconWash,
  },

  contentWrap: {
    flex: 1,
    gap: 4,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },

  title: {
    ...Typography.cardTitle,
    fontSize: 14.5,
    color: Surface.text,
  },

  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    backgroundColor: Surface.softGreen,
  },

  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Surface.online,
  },

  onlinePillText: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "800",
    color: Surface.online,
    letterSpacing: 0.5,
  },

  subtitle: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
    lineHeight: 16,
  },

  lastDonationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  meta: {
    ...Typography.micro,
    fontSize: 11,
    color: Surface.textSecondary,
  },

  switchWrap: {
    paddingTop: 4,
  },

  footerRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
    paddingTop: 8,
  },

  removeButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
  },

  removePressed: {
    opacity: 0.65,
  },

  removeText: {
    ...Typography.micro,
    fontSize: 11,
    color: Surface.danger,
    fontWeight: "600",
  },

  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
  },

  errorText: {
    ...Typography.small,
    color: Surface.danger,
    flex: 1,
  },
});
