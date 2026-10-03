import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormAlert } from "@/components/auth/form-alert";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { ContactCard } from "@/components/emergency/contact-card";
import { CoverageCard } from "@/components/emergency/coverage-card";
import { MapPreview } from "@/components/emergency/map-preview";
import { PrivacyNotice } from "@/components/emergency/privacy-notice";
import { StepHeader } from "@/components/emergency/step-header";
import { StepProgress } from "@/components/emergency/step-progress";
import { UnitsStepper } from "@/components/emergency/units-stepper";
import {
  UrgencyCardList,
  urgencyTitle,
} from "@/components/emergency/urgency-card-list";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUP_NOTES, BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import type { UrgencyLevel } from "@/constants/emergency";
import { HOSPITAL_NAMES, findHospitalByName } from "@/constants/hospitals";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  createEmergencyRequest,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import {
  asBloodGroup,
  validateEmergencyForm,
  type EmergencyFormErrors,
  type EmergencyFormValues,
} from "@/utils/validation";

/** Steps are 1-based in the copy and 0-based in state. */
const TOTAL_STEPS = 3;

const STEP_TITLES = [
  "Patient & Blood Group",
  "Location & Hospital Details",
  "Review Request",
] as const;

const DEFAULT_UNITS = 2;

/** The design opens on the most urgent level, so it starts selected. */
const DEFAULT_URGENCY: UrgencyLevel = "critical";

/**
 * Coverage figures shown before a coverage endpoint exists.
 *
 * Both are placeholders. Replace with the real radius and donor count once the
 * API can answer for the selected district.
 */
const SAMPLE_RADIUS_KM = 8.5;
const SAMPLE_ONLINE_DONORS = 42;

/**
 * Folds the ward and room into the request's free-text notes.
 *
 * The service has no ward column, so this is a stopgap: the ward is captured and
 * validated, but it reaches the server inside `notes`. Replace with a real field
 * once the schema carries one.
 */
function composeNotes(ward: string, notes: string): string | null {
  const wardLine = `Ward: ${ward.trim()}`;
  const rest = notes.trim();

  return rest === "" ? wardLine : `${wardLine}\n${rest}`;
}

export default function EmergencyRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [step, setStep] = useState(0);

  // Step 1
  const [patientName, setPatientName] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);

  // Step 2
  const [hospital, setHospital] = useState<string | null>(null);
  const [ward, setWard] = useState("");
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [urgency, setUrgency] = useState<UrgencyLevel | null>(DEFAULT_URGENCY);
  const [contactName, setContactName] = useState("");
  const [contactMobile, setContactMobile] = useState("");

  // Step 3
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Partial<EmergencyFormErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<EmergencyRequest | null>(null);

  // A signed-in user would be bounced off /login, so back has to respect the guard.
  const backFallback = session ? ROLE_HOME[session.user.role] : ROUTES.login;

  /** Resolves the chosen facility, or `null` while nothing valid is selected. */
  const selectedHospital = findHospitalByName(hospital);

  /** Clears one field's error as soon as the user edits it. */
  const clearError = useCallback((field: keyof EmergencyFormErrors) => {
    setFormError(null);
    setErrors((current) =>
      current[field] === undefined ? current : { ...current, [field]: undefined },
    );
  }, []);

  /**
   * Validates every field, then reports only the ones on the visible step.
   *
   * Returns whether the step can be left, so callers do not have to run the
   * validator themselves.
   */
  const validateStep = useCallback(
    (target: number): boolean => {
      const all: EmergencyFormValues = {
        patientName,
        bloodGroup: bloodGroup ?? "",
        units: String(units),
        hospital: hospital ?? "",
        ward,
        district: selectedHospital?.district ?? "",
        contactName,
        contactMobile,
        urgency: urgency ?? "standard",
        notes,
      };

      const next = validateEmergencyForm(all);

      // Step 1 is patient identity, step 2 the facility and urgency details, and
      // step 3 review — so notes are the only field that only matters at the end.
      const visible =
        target === 0
          ? { patientName: next.patientName, bloodGroup: next.bloodGroup }
          : target === 1
            ? {
                hospital: next.hospital,
                ward: next.ward,
                district: next.district,
                units: next.units,
                contactName: next.contactName,
                contactMobile: next.contactMobile,
              }
            : { notes: next.notes };

      setErrors(visible);
      setFormError(null);

      return !Object.values(visible).some((message) => message !== null);
    },
    [
      patientName,
      bloodGroup,
      units,
      hospital,
      ward,
      contactName,
      contactMobile,
      urgency,
      notes,
      selectedHospital,
    ],
  );

  const handleBack = useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(backFallback);
    }
  }, [step, router, backFallback]);

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      setCreated(
        await createEmergencyRequest({
          patientName: patientName.trim(),
          bloodGroup: asBloodGroup(bloodGroup ?? "") ?? "O+",
          units,
          hospital: (hospital ?? "").trim(),
          district: selectedHospital?.district ?? null,
          contactName: contactName.trim(),
          contactMobile: contactMobile.trim(),
          urgency: urgency ?? "standard",
          notes: composeNotes(ward, notes),
        }),
      );
    } catch (error) {
      setFormError(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    if (isSubmitting) {
      return;
    }

    if (!validateStep(step)) {
      return;
    }

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      return;
    }

    void handleSubmit();
  }

  // ---------------------------------------------------------------- step 1

  function renderStepOne() {
    return (
      <>
        <TextField
          label="Patient Name"
          value={patientName}
          onChangeText={(value) => {
            setPatientName(value);
            clearError("patientName");
          }}
          placeholder="Full name of the patient"
          icon="user"
          autoComplete="name"
          autoCapitalize="words"
          error={errors.patientName}
        />

        <OptionChips
          label="Blood Group Required"
          options={BLOOD_GROUPS}
          value={bloodGroup}
          onChange={(value) => {
            setBloodGroup(value);
            clearError("bloodGroup");
          }}
          labelFor={(value) => value}
          captionFor={(value) => BLOOD_GROUP_NOTES[value]}
          error={errors.bloodGroup}
        />
      </>
    );
  }

  // ---------------------------------------------------------------- step 2

  function renderStepTwo() {
    const area = selectedHospital?.district ?? "Colombo";

    return (
      <>
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Where is the patient admitted?</Text>

          <Text style={styles.sectionBody}>
            Enter hospital information to notify nearby{"\n"}donors within emergency
            radius.
          </Text>

          <MapPreview area={area} areaDetail="Emergency coverage" />

          <CoverageCard radiusKm={SAMPLE_RADIUS_KM} onlineDonors={SAMPLE_ONLINE_DONORS} />
        </View>

        <View style={styles.sectionTight}>
          <SelectField
            label="Hospital Name"
            value={hospital}
            options={HOSPITAL_NAMES}
            onChange={(value) => {
              setHospital(value);
              clearError("hospital");
              clearError("district");
            }}
            placeholder="Select the admitting hospital"
            icon="map-pin"
            trailingIcon={selectedHospital?.verified === true ? "check-circle" : undefined}
            caption={selectedHospital?.note}
            error={errors.hospital}
          />

          <TextField
            label="Ward & Room Details"
            value={ward}
            onChangeText={(value) => {
              setWard(value);
              clearError("ward");
            }}
            placeholder="e.g. Ward 14, Intensive Care Unit"
            icon="home"
            autoCapitalize="sentences"
            error={errors.ward}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Units Required</Text>

          <UnitsStepper
            units={units}
            onChange={(value) => {
              setUnits(value);
              clearError("units");
            }}
            badge="Critical Need"
            error={errors.units}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.urgencyHeading}>
            <Text style={styles.sectionHeading}>Emergency Urgency Level</Text>

            <View style={styles.pushAlerts}>
              <Feather name="zap" size={10} color={Blood.primary} />

              <Text style={styles.pushAlertsText}>Push Alerts</Text>
            </View>
          </View>

          <UrgencyCardList value={urgency} onChange={setUrgency} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Patient Contact Person</Text>

          <ContactCard
            name={contactName}
            onChangeName={(value) => {
              setContactName(value);
              clearError("contactName");
            }}
            mobile={contactMobile}
            onChangeMobile={(value) => {
              setContactMobile(value);
              clearError("contactMobile");
            }}
            nameError={errors.contactName}
            mobileError={errors.contactMobile}
            caption="Donors will see this verified contact number once they accept."
          />
        </View>

        <PrivacyNotice>
          Donor coordinates and health records are auto-filtered against NHSL blood bank
          requirements to reduce screening delays.
        </PrivacyNotice>
      </>
    );
  }

  // ---------------------------------------------------------------- step 3

  function renderStepThree() {
    return (
      <>
        <View style={styles.summaryCard}>
          <SummaryRow label="Patient" value={patientName} />
          <SummaryRow label="Blood Group" value={bloodGroup ?? "—"} />
          <SummaryRow label="Hospital" value={hospital ?? "—"} />
          <SummaryRow label="Ward" value={ward} />
          <SummaryRow label="Units" value={`${units} Units`} />
          <SummaryRow label="Urgency" value={urgencyTitle(urgency)} />
          <SummaryRow label="Contact" value={contactLabel(contactName, contactMobile)} last />
        </View>

        <TextField
          label="Notes for Donors (optional)"
          value={notes}
          onChangeText={(value) => {
            setNotes(value);
            clearError("notes");
          }}
          placeholder="Anything else the responding donors should know"
          multiline
          maxLength={500}
          returnKeyType="done"
          error={errors.notes}
        />
      </>
    );
  }

  // ---------------------------------------------------------------- success

  if (created !== null) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ScrollView contentContainerStyle={styles.successWrap}>
          <View style={styles.successCard}>
            <View style={styles.successBadge}>
              <Feather name="check" size={24} color={Surface.onPrimary} />
            </View>

            <Text style={styles.successTitle} accessibilityRole="header">
              Request submitted
            </Text>

            <Text style={styles.successBody}>
              Nearby verified donors are being notified now. Keep the contact number reachable.
            </Text>

            <View style={styles.reference}>
              <Text style={styles.referenceLabel}>Reference</Text>

              <Text style={styles.referenceValue} selectable>
                {created.id}
              </Text>
            </View>

            <PrimaryAuthButton
              label={session ? "Back to Dashboard" : "Back to Sign In"}
              onPress={() => {
                router.replace(backFallback);
              }}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------- screen

  const isLastStep = step === TOTAL_STEPS - 1;
  const stepTitle = STEP_TITLES[step] ?? STEP_TITLES[0];

  return (
    <View style={styles.root}>
      <StepHeader
        title={`Request Step ${step + 1}`}
        onBack={handleBack}
      />

      <StepProgress current={step + 1} total={TOTAL_STEPS} label={stepTitle} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 ? renderStepOne() : null}
        {step === 1 ? renderStepTwo() : null}
        {step === 2 ? renderStepThree() : null}
      </ScrollView>

      {/* Outside the ScrollView so the action stays reachable at any scroll depth. */}
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* In the footer rather than the scroll area: a rejected submission is
            the one error the user must not have to scroll to find. */}
        <FormAlert message={formError} />

        <PrimaryAuthButton
          label={isLastStep ? "Submit Request" : "Continue"}
          loadingLabel="Submitting..."
          trailingIcon={isLastStep ? undefined : "arrow-right"}
          loading={isSubmitting}
          onPress={handleContinue}
        />

        {isLastStep ? null : (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back a step"
            hitSlop={8}
            style={styles.backLink}
          >
            <Feather name="arrow-left" size={11} color={Surface.textMuted} />

            <Text style={styles.backLinkText}>
              Back to {step === 0 ? "start" : STEP_TITLES[step - 1]}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  /** Drops the hairline under the final row. */
  last?: boolean;
};

function SummaryRow({ label, value, last = false }: SummaryRowProps) {
  return (
    <View style={[styles.summaryRow, last && styles.summaryRowLast]}>
      <Text style={styles.summaryLabel} numberOfLines={1}>
        {label}
      </Text>

      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

function contactLabel(name: string, mobile: string): string {
  if (name.trim() === "" && mobile.trim() === "") {
    return "—";
  }

  return mobile.trim() === "" ? name.trim() : `${name.trim()} (${mobile.trim()})`;
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
    gap: 18,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },

  section: {
    gap: 10,
  },

  sectionTight: {
    gap: 14,
  },

  sectionHeading: {
    ...Typography.label,
    fontSize: 12,
    letterSpacing: -0.1,
    color: Surface.text,
  },

  sectionBody: {
    ...Typography.small,
    fontSize: 9.5,
    fontWeight: "500",
    lineHeight: 13,
    letterSpacing: 0.1,
    color: Surface.textMuted,
    marginTop: -4,
  },

  urgencyHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  pushAlerts: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  pushAlertsText: {
    ...Typography.micro,
    fontSize: 8,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Blood.primary,
  },

  actions: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: Surface.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 28,
  },

  backLinkText: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  summaryCard: {
    borderRadius: Radius.field,
    paddingHorizontal: 13,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
  },

  summaryRowLast: {
    borderBottomWidth: 0,
  },

  summaryLabel: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
    flexShrink: 0,
  },

  summaryValue: {
    ...Typography.small,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
    color: Surface.text,
    flex: 1,
    textAlign: "right",
  },

  successWrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  successCard: {
    alignItems: "center",
    gap: 10,
    borderRadius: Radius.card,
    padding: 24,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  successBadge: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.online,
  },

  successTitle: {
    ...Typography.body,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: Surface.text,
  },

  successBody: {
    ...Typography.small,
    fontSize: 12,
    lineHeight: 18,
    color: Surface.textSecondary,
    textAlign: "center",
  },

  reference: {
    width: "100%",
    gap: 2,
    marginTop: 2,
    marginBottom: 6,
    borderRadius: Radius.field,
    padding: 12,
    backgroundColor: Surface.background,
  },

  referenceLabel: {
    ...Typography.micro,
    fontSize: 8.5,
    letterSpacing: 0.3,
    color: Surface.textMuted,
  },

  referenceValue: {
    ...Typography.input,
    fontSize: 12,
    color: Surface.text,
  },
});