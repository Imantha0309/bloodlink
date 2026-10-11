import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import {
  URGENCY_LABEL,
  URGENCY_LEVELS,
  URGENCY_OPTIONS,
  type UrgencyLevel,
} from "@/constants/emergency";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  cancelEmergencyRequest,
  getEmergencyRequest,
  updateEmergencyRequest,
} from "@/services/requests/emergency-requests";
import {
  asBloodGroup,
  validateEmergencyForm,
  type EmergencyFormErrors,
} from "@/utils/validation";

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
 * Edit form for a request the signed-in recipient already raised.
 *
 * Reached from the "Manage" action on a request card with the request's id, so
 * it loads the live record, prefills every field, and PATCHes the changes back.
 * The server refuses edits to a closed (fulfilled/cancelled) request, which is
 * surfaced here as a form-level error rather than a dead end.
 */
export default function ManageRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestId = typeof params.id === "string" ? params.id : null;

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
  const [urgency, setUrgency] = useState<UrgencyLevel>("critical");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<EmergencyFormErrors>(NO_ERRORS);
  // A missing id is known up front, so it seeds the error rather than being
  // raised from an effect (which would setState synchronously on mount).
  const [formError, setFormError] = useState<string | null>(
    requestId === null ? "That request could not be found." : null,
  );
  const [isLoading, setIsLoading] = useState(requestId !== null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Hospital staff reach this screen from the requisition board and work the
   * whole queue; everyone else is a requester editing their own. Only the copy
   * and the return destination differ.
   */
  const isHospital = session?.user.role === "hospital";
  const title = isHospital ? "Manage Requisition" : "Manage Request";
  const backFallback = session !== null ? ROLE_HOME[session.user.role] : ROLE_HOME.recipient;

  // Loads the live request so every field opens pre-filled.
  useEffect(() => {
    if (requestId === null) {
      return;
    }

    let isActive = true;

    void getEmergencyRequest(requestId)
      .then((detail) => {
        if (!isActive) {
          return;
        }

        const request = detail.request;

        setPatientName(request.patientName);
        setBloodGroup(request.bloodGroup);
        setUnits(String(request.units));
        setHospital(request.hospital);
        setDistrict(request.district);
        setContactName(request.contactName);
        setContactMobile(request.contactMobile);
        setUrgency(request.urgency);
        setNotes(request.notes ?? "");
      })
      .catch((caught: unknown) => {
        if (isActive) {
          setFormError(apiErrorMessage(caught));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [requestId]);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(backFallback);
    }
  }

  /** Leaves the screen the way the user arrived, so a board refresh picks it up. */
  function handleDone() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(backFallback);
    }
  }

  function confirmDelete() {
    if (requestId === null) {
      return;
    }

    Alert.alert(
      isHospital ? "Delete this requisition?" : "Delete this request?",
      "It is withdrawn from the board and donors are no longer matched to it.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: isHospital ? "Delete Requisition" : "Delete Request",
          style: "destructive",
          onPress: () => {
            void handleDelete();
          },
        },
      ],
    );
  }

  async function handleDelete() {
    if (isDeleting || requestId === null) {
      return;
    }

    setIsDeleting(true);

    try {
      // A delete is a status flip on the server, so the request leaves the
      // board without erasing the triage trail.
      await cancelEmergencyRequest(requestId);
      handleDone();
    } catch (caught) {
      setFormError(apiErrorMessage(caught));
      setIsDeleting(false);
    }
  }

  function clearError(field: keyof EmergencyFormErrors) {
    setFormError(null);
    setErrors((current) => (current[field] === null ? current : { ...current, [field]: null }));
  }

  async function handleSave() {
    if (isSubmitting || requestId === null) {
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
      await updateEmergencyRequest(requestId, {
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

      setIsSaved(true);
    } catch (caught) {
      setFormError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <AuthHeader
          title={title}
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
            {isSaved ? (
              <View style={styles.successCard}>
                <View style={styles.successBadge}>
                  <Feather name="check" size={24} color={Surface.onPrimary} />
                </View>

                <Text style={styles.successTitle} accessibilityRole="header">
                  Request updated
                </Text>

                <Text style={styles.successText}>
                  Your changes are saved and the triage team has been re-notified.
                </Text>

                <PrimaryAuthButton
                  label="Back to Dashboard"
                  loading={false}
                  onPress={handleDone}
                />
              </View>
            ) : (
              <>
                <View style={styles.banner}>
                  <View style={styles.bannerIcon}>
                    <Feather name="edit-2" size={15} color={Blood.dark} />
                  </View>

                  <Text style={styles.bannerText}>
                    Update the details below. Changes re-alert the triage team, so keep them
                    accurate.
                  </Text>
                </View>

                {isLoading ? (
                  <View style={styles.loadingCard}>
                    <Feather name="loader" size={20} color={Surface.textMuted} />
                    <Text style={styles.loadingText}>Loading request…</Text>
                  </View>
                ) : (
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
                )}

                <FormAlert message={formError} />

                <PrimaryAuthButton
                  label="Save Changes"
                  loadingLabel="Saving..."
                  loading={isSubmitting}
                  icon="check"
                  onPress={() => {
                    void handleSave();
                  }}
                />

                {/* Donor intake stays reachable: the board's card used to open
                    it directly, and staff still need it per requisition. */}
                {isHospital ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open the donor arrival desk"
                    onPress={() => router.push(ROUTES.hospitalVerifyDonor)}
                    style={({ pressed }) => [styles.donorDesk, pressed && styles.pressed]}
                  >
                    <Feather name="user-check" size={16} color={Blood.primary} />
                    <Text style={styles.donorDeskText}>Open Donor Arrival Desk</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    isHospital ? "Delete this requisition" : "Delete this request"
                  }
                  accessibilityState={{ disabled: isDeleting }}
                  disabled={isDeleting}
                  onPress={confirmDelete}
                  style={({ pressed }) => [
                    styles.delete,
                    pressed && styles.pressed,
                    isDeleting && styles.deleteDisabled,
                  ]}
                >
                  <Feather name="trash-2" size={16} color={Blood.primary} />

                  <Text style={styles.deleteText}>
                    {isDeleting
                      ? "Deleting..."
                      : isHospital
                        ? "Delete Requisition"
                        : "Delete Request"}
                  </Text>
                </Pressable>
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

  loadingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  loadingText: {
    ...Typography.small,
    color: Surface.textSecondary,
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

  pressed: {
    opacity: 0.7,
  },

  donorDesk: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  donorDeskText: {
    ...Typography.button,
    color: Blood.primary,
  },

  delete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  deleteDisabled: {
    opacity: 0.5,
  },

  deleteText: {
    ...Typography.button,
    fontSize: 14,
    color: Blood.primary,
  },
});
