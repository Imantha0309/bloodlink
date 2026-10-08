import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepHeader } from "@/components/emergency/step-header";
import { SelectField } from "@/components/ui/select-field";
import { Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Radius } from "@/constants/radius";
import { ROLE_HOME } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";

/**
 * Choose Location — re-points the signed-in recipient's district.
 *
 * The server offers recipients exactly this self-service surface (its `/me`
 * PATCH accepts a district-only payload), and the choice feeds local bank and
 * donor suggestions. Donors edit their full profile elsewhere; anyone else
 * sees their district read-only, because this screen is recipient-scoped.
 */

export default function LocationScreen() {
  const router = useRouter();
  const { session, updateRecipientDistrict } = useAuth();
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);

  const isRecipient = session?.user.role === "recipient";
  const initialDistrict = session?.user.district ?? null;

  const [district, setDistrict] = useState<string>(initialDistrict ?? "");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (saving || district === "" || district === initialDistrict) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      await updateRecipientDistrict(district);
      router.back();
    } catch (caught) {
      setSaveError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  if (!isRecipient) {
    return (
      <View style={styles.screen}>
        <StepHeader title="Choose Location" onBack={onBack} />

        <View style={styles.readonlyWrap}>
          <View style={styles.readonlyCard}>
            <View style={styles.readonlyIcon}>
              <Feather name="map-pin" size={16} color={Surface.accentBlue} />
            </View>

            <Text style={styles.readonlyTitle}>
              {initialDistrict !== null ? `${initialDistrict} District` : "No district set"}
            </Text>

            <Text style={styles.readonlyBody}>
              District editing is available to recipient accounts on this screen. Donors manage
              their details from the donor profile.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StepHeader title="Choose Location" onBack={onBack} />

      <View style={styles.wrap}>
        <Text style={styles.subtitle}>
          Your district drives local blood bank and donor suggestions across the app.
        </Text>

        <SelectField
          label="District"
          value={district}
          options={DISTRICTS}
          onChange={(value) => {
            setDistrict(value);
            setSaveError(null);
          }}
          placeholder="Select your district"
          icon="map-pin"
          caption={district === "" ? undefined : "Shown as your area on requests and alerts"}
        />

        {saveError !== null ? <Text style={styles.error}>{saveError}</Text> : null}

        <PrimaryAuthButton
          label={saving ? "Saving…" : "Save Location"}
          icon="check"
          disabled={saving || district === "" || district === initialDistrict}
          onPress={() => void handleSave()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  wrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 12,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  error: {
    ...Typography.small,
    fontSize: 12,
    color: "#C8102E",
  },

  readonlyWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  readonlyCard: {
    alignItems: "center",
    gap: 8,
    padding: 18,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  readonlyIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
  },

  readonlyTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  readonlyBody: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
    textAlign: "center",
    lineHeight: 17,
  },
});