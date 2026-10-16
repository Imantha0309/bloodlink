import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormAlert } from "@/components/auth/form-alert";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepHeader } from "@/components/emergency/step-header";
import { TextField } from "@/components/ui/text-field";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { useHomeBack } from "@/hooks/use-home-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  readStationAssignment,
  setMyStation,
  STATION_CATALOGUE,
  type StaffStation,
} from "@/services/hospital/station";

/**
 * Station reassignment — which desk this staff member works.
 *
 * Self-declared rather than assigned by an administrator: a shift swap is a
 * fact about right now, not a permission. The server stores it on the user row
 * and rejects anyone who does not hold a hospital or admin role.
 */
export default function HospitalReassignmentScreen() {
  const insets = useSafeAreaInsets();
  const onBack = useHomeBack();
  const { session, applyStation } = useAuth();

  const saved = readStationAssignment(session?.user.station, session?.user.wardLabel);

  const [station, setStation] = useState<StaffStation>(saved?.station ?? "reception");
  const [wardLabel, setWardLabel] = useState(saved?.wardLabel ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isWard = station === "ward";
  const selected = STATION_CATALOGUE.find((meta) => meta.id === station) ?? null;
  const isUnchanged =
    saved !== null &&
    saved.station === station &&
    (saved.wardLabel ?? "") === wardLabel.trim();

  async function handleSave() {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const confirmed = await setMyStation({
        station,
        // Only meaningful for the ward station; cleared otherwise so a stale
        // label never rides along when the desk changes.
        wardLabel: isWard && wardLabel.trim() !== "" ? wardLabel.trim() : null,
      });

      // The header and the "Currently:" line below both read the station off the
      // session, so the confirmed value is folded back in before we leave.
      await applyStation(confirmed);

      onBack();
    } catch (caught) {
      setSaveError(apiErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <KeyboardDismissView style={styles.root}>
      <StepHeader title="Station Reassignment" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Tell the service which desk you are covering. This is what dispatch and the requisition
          board use to route work to you.
        </Text>

        <View style={styles.card}>
          {STATION_CATALOGUE.map((meta, index) => {
            const isSelected = meta.id === station;

            return (
              <Pressable
                key={meta.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={meta.label}
                onPress={() => {
                  setStation(meta.id);
                  setSaveError(null);
                }}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>

                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>
                    {meta.label}
                  </Text>
                  <Text style={styles.rowDetail}>{meta.detail}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {isWard ? (
          <TextField
            label="Ward or unit"
            value={wardLabel}
            onChangeText={(value) => {
              setWardLabel(value);
              setSaveError(null);
            }}
            placeholder="e.g. Surgical Ward 4B"
            icon="map-pin"
            hint="Shown on the handover log and on any requisition you raise."
          />
        ) : null}

        {saveError !== null ? <FormAlert message={saveError} /> : null}

        <PrimaryAuthButton
          label={isSaving ? "Saving…" : "Save station"}
          icon="check"
          disabled={isSaving || isUnchanged || (isWard && wardLabel.trim() === "")}
          onPress={() => void handleSave()}
        />

        <View style={styles.current}>
          <Feather name="info" size={13} color={Surface.textMuted} />

          <Text style={styles.currentText}>
            {saved === null
              ? "No station set yet. Saving one makes your desk visible to dispatch."
              : `Currently: ${selected?.label ?? saved.station}${
                  saved.wardLabel === null ? "" : ` · ${saved.wardLabel}`
                }.`}
          </Text>
        </View>
      </ScrollView>
    </KeyboardDismissView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  card: {
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  pressed: {
    opacity: 0.7,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Surface.borderStrong,
  },

  radioSelected: {
    borderColor: Blood.primary,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
  },

  rowText: {
    flex: 1,
    gap: 2,
  },

  rowLabel: {
    ...Typography.label,
    fontSize: 13,
    color: Surface.text,
  },

  rowLabelSelected: {
    color: Blood.primary,
  },

  rowDetail: {
    ...Typography.small,
    fontSize: 11,
    lineHeight: 16,
    color: Surface.textSecondary,
  },

  current: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 4,
  },

  currentText: {
    flex: 1,
    ...Typography.small,
    fontSize: 11,
    lineHeight: 16,
    color: Surface.textMuted,
  },
});
