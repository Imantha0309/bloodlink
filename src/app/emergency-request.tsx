import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthHeader } from "@/components/auth/auth-header";
import { FormAlert } from "@/components/auth/form-alert";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUPS } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { URGENCY_LABEL, URGENCY_LEVELS, URGENCY_OPTIONS } from "@/constants/emergency";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  createEmergencyRequest,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { asBloodGroup, validateEmergencyForm, type EmergencyFormErrors } from "@/utils/validation";

const NO_ERRORS: EmergencyFormErrors = {
  patientName: null,
  bloodGroup: null,
  units: null,
  hospital: null,
  district: null,
  contactName: null,
  contactMobile: null,
  notes: null,
};

/**
 * The account-free urgent request path.
 *
 * Reachable whether or not anyone is signed in — that is the whole point — so
 * the back destination depends on the guard state.
 */
export default function EmergencyRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const hospitalRef = useRef<RNTextInput>(null);
  const contactNameRef = useRef<RNTextInput>(null);
  const contactMobileRef = useRef<RNTextInput>(null);

  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [units, setUnits] = useState("1");
  const [hospital, setHospital] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [contactMobile, setContactMobile] = useState("");
  const [urgency, setUrgency] = useState<"critical" | "urgent" | "standard">("critical");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<EmergencyFormErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<EmergencyRequest | null>(null);

  // A signed-in user would be bounced off /login, so back has to respect the
  // guard state.
  const backFallback = session ? ROLE_HOME[session.user.role] : ROUTES.login;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(backFallback);
    }
  }

  function clearError(field: keyof EmergencyFormErrors) {
    setFormError(null);
    setErrors((current) => (current[field] === null ? current : { ...current, [field]: null }));
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    const nextErrors = validateEmergencyForm({
      patientName,
      bloodGroup: bloodGroup ?? "",
      units,
      hospital,
      district: district ?? "",
      contactName,
      contactMobile,
      urgency,
      notes,
    });

    setErrors(nextErrors);
    setFormError(null);

    if (Object.values(nextErrors).some((message) => message !== null)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const request = await createEmergencyRequest({
        patientName: patientName.trim(),
        bloodGroup: asBloodGroup(bloodGroup ?? "") ?? "O+",
        units: Number.parseInt(units, 10),
        hospital: hospital.trim(),
        district,
        contactName: contactName.trim(),
        contactMobile: contactMobile.trim(),
        urgency,
        notes: notes.trim() === "" ? null : notes.trim(),
      });

      setCreated(request);
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader
          title="Emergency Request"
          onBack={handleBack}
          backAccessibilityLabel="Go back"
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {created !== null ? (
              <View style={styles.successCard}>
                <View style={styles.successBadge}>
                  <Feather name="check" size={24} color={Surface.onPrimary} />
                </View>

                <Text style={styles.successTitle} accessibilityRole="header">
                  Request submitted
                </Text>

                <Text style={styles.successText}>
                  The triage team has been alerted and matching donors are being notified. Keep
                  this reference handy.
                </Text>

                <View style={styles.reference}>
                  <Text style={styles.referenceLabel}>Reference</Text>
                  <Text style={styles.referenceValue} selectable>
                    {created.id}
                  </Text>
                </View>

                <PrimaryAuthButton
                  label={session ? "Back to Dashboard" : "Back to Sign In"}
                  loading={false}
                  onPress={() => router.replace(backFallback)}
                />
              </View>
            ) : (
              <>
                <View style={styles.banner}>
                  <View style={styles.bannerIcon}>
                    <Feather name="alert-triangle" size={15} color={Blood.dark} />
                  </View>

                  <Text style={styles.bannerText}>
                    This requests blood without an account. Triage verifies within 2 minutes.
                  </Text>
                </View>

                <View style={styles.form}>
                  <TextField
                    label="Patient Name"
                    value={patientName}
                    onChangeText={(value) => {
                      setPatientName(value);
                      clearError("patientName");
                    }}
                    placeholder="Name as it appears on records"
                    error={errors.patientName}
                    autoComplete="name"
                    icon="user"
                  />

                  <OptionChips
                    label="Blood Group Required"
                    options={BLOOD_GROUPS}
                    value={asBloodGroup(bloodGroup ?? "")}
                    onChange={(value) => {
                      setBloodGroup(value);
                      clearError("bloodGroup");
                    }}
                    error={errors.bloodGroup}
                  />

                  <TextField
                    label="Units Required"
                    value={units}
                    onChangeText={(value) => {
                      setUnits(value.replace(/\D/g, "").slice(0, 2));
                      clearError("units");
                    }}
                    placeholder="1"
                    error={errors.units}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    maxLength={2}
                    icon="droplet"
                  />

                  <TextField
                    ref={hospitalRef}
                    label="Hospital"
                    value={hospital}
                    onChangeText={(value) => {
                      setHospital(value);
                      clearError("hospital");
                    }}
                    placeholder="Where the patient is being treated"
                    error={errors.hospital}
                    autoCapitalize="words"
                    icon="home"
                    onSubmitEditing={() => contactNameRef.current?.focus()}
                  />

                  <SelectField
                    label="District"
                    value={district}
                    options={DISTRICTS}
                    onChange={(value) => {
                      setDistrict(value);
                      clearError("district");
                    }}
                    placeholder="Select the hospital's district"
                    error={errors.district}
                  />

                  <TextField
                    ref={contactNameRef}
                    label="Contact Person"
                    value={contactName}
                    onChangeText={(value) => {
                      setContactName(value);
                      clearError("contactName");
                    }}
                    placeholder="Who should we call?"
                    error={errors.contactName}
                    autoComplete="name"
                    icon="phone-call"
                    onSubmitEditing={() => contactMobileRef.current?.focus()}
                  />

                  <TextField
                    ref={contactMobileRef}
                    label="Contact Mobile"
                    value={contactMobile}
                    onChangeText={(value) => {
                      setContactMobile(value);
                      clearError("contactMobile");
                    }}
                    placeholder="077 123 4567"
                    error={errors.contactMobile}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    icon="smartphone"
                  />

                  <OptionChips
                    label="Urgency"
                    options={URGENCY_LEVELS}
                    value={urgency}
                    onChange={setUrgency}
                    labelFor={(value) => URGENCY_LABEL[value]}
                    captionFor={(value) =>
                      URGENCY_OPTIONS.find((option) => option.level === value)?.description
                    }
                  />

                  <TextField
                    label="Notes (optional)"
                    value={notes}
                    onChangeText={(value) => {
                      setNotes(value);
                      clearError("notes");
                    }}
                    placeholder="Diagnosis, theatre time, anything the donor team should know"
                    error={errors.notes}
                    autoCapitalize="sentences"
                    multiline
                    maxLength={500}
                    returnKeyType="done"
                  />
                </View>

                <FormAlert message={formError} />

                <PrimaryAuthButton
                  label="Submit Urgent Request"
                  loadingLabel="Submitting..."
                  loading={isSubmitting}
                  icon="alert-circle"
                  onPress={() => {
                    void handleSubmit();
                  }}
                />
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  safeArea: {
    flex: 1,
  },

  flex: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 4,
    gap: 16,
  },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  bannerIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  bannerText: {
    ...Typography.small,
    color: Blood.dark,
    flex: 1,
  },

  form: {
    gap: 18,
  },

  successCard: {
    padding: 24,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    alignItems: "center",
    gap: 10,
  },

  successBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.online,
    marginBottom: 4,
  },

  successTitle: {
    ...Typography.title,
    color: Surface.text,
    textAlign: "center",
  },

  successText: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  reference: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    gap: 2,
  },

  referenceLabel: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  referenceValue: {
    ...Typography.small,
    color: Surface.text,
    fontWeight: "700",
  },
});
