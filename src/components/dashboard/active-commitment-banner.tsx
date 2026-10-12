import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import {
  listDonorCommitments,
  startDonorTransit,
  type DonorCommitment,
} from "@/services/donors/donor-workflow";

type ActiveCommitmentBannerProps = {
  onCommitmentChange?: () => void;
};

export function ActiveCommitmentBanner({ onCommitmentChange }: ActiveCommitmentBannerProps) {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<DonorCommitment | null>(null);
  const [isStartingTransit, setIsStartingTransit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    void listDonorCommitments()
      .then((list) => {
        if (isActive) {
          const current = list.find((item) => item.donorStage !== "completed") ?? null;
          setActiveItem(current);
        }
      })
      .catch(() => {
        // Background poll failure is non-fatal
      });

    const interval = setInterval(() => {
      void listDonorCommitments()
        .then((list) => {
          if (isActive) {
            const current = list.find((item) => item.donorStage !== "completed") ?? null;
            setActiveItem(current);
          }
        })
        .catch(() => {
          // ignore
        });
    }, 10_000);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  if (!activeItem) {
    return null;
  }

  const stage = activeItem.donorStage;
  const isEnRoute = stage === "en_route";
  const isArrived = stage === "arrived";

  async function handleStartTransit() {
    if (!activeItem || isStartingTransit) return;
    setIsStartingTransit(true);
    setError(null);
    try {
      await startDonorTransit(activeItem.id);
      setActiveItem({ ...activeItem, donorStage: "en_route" });
      onCommitmentChange?.();
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsStartingTransit(false);
    }
  }

  function handleOpenMap() {
    if (!activeItem) return;
    const dest = [activeItem.hospital, activeItem.district].filter(Boolean).join(", ");
    void Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(dest)}`);
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgePulse}>
          <Feather
            name={isArrived ? "check-circle" : isEnRoute ? "navigation" : "clock"}
            size={14}
            color={Blood.primary}
          />
          <Text style={styles.badgeLabel}>
            {isArrived ? "ARRIVED AT HOSPITAL" : isEnRoute ? "EN ROUTE TO HOSPITAL" : "ACTIVE DONATION ACCEPTED"}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open donation journey"
          onPress={() => router.push(ROUTES.donorTransit)}
          style={({ pressed }) => [styles.viewLink, pressed && styles.pressed]}
        >
          <Text style={styles.viewLinkText}>View Journey</Text>
          <Feather name="chevron-right" size={13} color={Blood.primary} />
        </Pressable>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.groupBadge}>
          <Text style={styles.groupText}>{activeItem.bloodGroup}</Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName} numberOfLines={1}>
            Patient: {activeItem.patientName}
          </Text>
          <Text style={styles.hospitalLocation} numberOfLines={1}>
            {activeItem.hospital}
            {activeItem.district ? ` · ${activeItem.district}` : ""}
          </Text>
          <Text style={styles.unitsMeta}>
            {activeItem.units} {activeItem.units === 1 ? "unit" : "units"} needed · {activeItem.urgency} priority
          </Text>
        </View>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : null}

      <View style={styles.actionsRow}>
        {!isEnRoute && !isArrived ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start transit now"
            disabled={isStartingTransit}
            onPress={() => void handleStartTransit()}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            {isStartingTransit ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="navigation" size={15} color="#FFFFFF" />
                <Text style={styles.primaryButtonText}>Start Transit</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open Hospital Intake QR"
            onPress={() => router.push(ROUTES.donorIntake)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Feather name="grid" size={15} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Open Intake QR</Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Directions on Map"
          onPress={handleOpenMap}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Feather name="map" size={14} color={Surface.text} />
          <Text style={styles.secondaryButtonText}>Directions</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF5F5",
    borderRadius: Radius.card,
    padding: 15,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Surface.softRedBorder,
    ...Elevation.card,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badgePulse: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  badgeLabel: {
    ...Typography.micro,
    fontWeight: "800",
    color: Blood.primary,
    letterSpacing: 0.6,
  },

  viewLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  viewLinkText: {
    ...Typography.micro,
    fontWeight: "700",
    color: Blood.primary,
  },

  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  groupBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  groupText: {
    ...Typography.label,
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  patientInfo: {
    flex: 1,
    gap: 2,
  },

  patientName: {
    ...Typography.cardTitle,
    fontSize: 15,
    color: Surface.text,
  },

  hospitalLocation: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  unitsMeta: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  errorText: {
    ...Typography.small,
    color: Surface.danger,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },

  primaryButton: {
    flex: 1,
    height: 40,
    backgroundColor: Blood.primary,
    borderRadius: Radius.field,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  primaryButtonText: {
    ...Typography.button,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  secondaryButton: {
    height: 40,
    paddingHorizontal: 14,
    backgroundColor: Surface.card,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  secondaryButtonText: {
    ...Typography.button,
    fontSize: 13,
    fontWeight: "600",
    color: Surface.text,
  },

  pressed: {
    opacity: 0.75,
  },
});
