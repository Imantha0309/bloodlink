import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
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
 * Fully controlled: the displayed value always comes from `availability`. This
 * is the one control on any dashboard that writes, so it owns the in-flight and
 * error states rather than pushing them up — a failed toggle should surface
 * next to the switch, not replace the whole screen.
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
      <View style={styles.row}>
        <View style={[styles.badge, isAvailable ? styles.badgeActive : styles.badgePaused]}>
          <Feather
            name={isAvailable ? "radio" : "pause"}
            size={18}
            color={isAvailable ? Surface.online : Surface.textMuted}
          />
        </View>

        <View style={styles.text}>
          <Text style={styles.title}>
            {!availability.recordExists
              ? "Availability record removed"
              : isAvailable
                ? "You are available"
                : "You are paused"}
          </Text>

          <Text style={styles.subtitle}>
            {!availability.recordExists
              ? "You are hidden from dispatch. Set availability again whenever you are ready."
              : isAvailable
              ? "You are counted in the available-donor totals hospitals see."
              : "You are left out of the available-donor totals until you switch back on."}
          </Text>

          {availability.lastDonationAt !== null ? (
            <Text style={styles.meta}>Last donation: {availability.lastDonationAt}</Text>
          ) : null}
        </View>

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

      {availability.recordExists ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove availability record"
          disabled={isSaving}
          onPress={confirmRemove}
          style={({ pressed }) => [styles.removeButton, pressed && styles.removePressed]}
        >
          <Feather name="trash-2" size={13} color={Surface.danger} />
          <Text style={styles.removeText}>Remove availability record</Text>
        </Pressable>
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
    padding: 14,
    gap: 10,
    borderRadius: Radius.card,
    borderWidth: 1,
    backgroundColor: Surface.card,
  },

  cardActive: {
    borderColor: Surface.softGreenBorder,
    backgroundColor: "#F6FEF9",
  },

  cardPaused: {
    borderColor: Surface.border,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  badge: {
    width: 40,
    height: 40,
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

  text: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  meta: {
    ...Typography.micro,
    fontSize: 10,
    color: Surface.textMuted,
    marginTop: 2,
  },

  error: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  errorText: {
    ...Typography.small,
    color: Surface.danger,
    flex: 1,
  },

  removeButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
  },

  removePressed: {
    opacity: 0.65,
  },

  removeText: {
    ...Typography.micro,
    color: Surface.danger,
    fontWeight: "700",
  },
});
