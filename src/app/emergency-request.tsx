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
import { RequestReview, type RequestReviewData } from "@/components/emergency/request-review";
import { SectionHeading } from "@/components/emergency/section-heading";
import { StepHeader } from "@/components/emergency/step-header";
import { StepProgress } from "@/components/emergency/step-progress";
import { UnitsStepper } from "@/components/emergency/units-stepper";
import { UrgencyCardList } from "@/components/emergency/urgency-card-list";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUP_NOTES, BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import type { UrgencyLevel } from "@/constants/emergency";
import { HOSPITAL_NAMES, findHospitalByName } from "@/constants/hospitals";
import { HIT_SLOP_MIN, Radius } from "@/constants/radius";
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
  ValidationMessages,
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

/**
 * Header titles differ from the step names: the final step is named rather than
 * numbered, because there is no step 4 to be "Step 3 of".
 */
const STEP_HEADER_TITLES = [
  "Request Step 1",
  "Request Step 2",
  "Request Review",
] as const;

/**
 * Labels for the footer's back link, which name the step being returned to.
 *
 * Deliberately shorter than `STEP_TITLES`: those read as headings on the progress
 * bar, while this sits in 9.5px grey under a button.
 */
const STEP_BACK_LABELS = ["Blood Group", "Blood Group"] as const;

/** Primary action per step. The last one submits; the others advance the wizard. */
const STEP_CTA_LABELS = ["Continue", "Review Request", "Send Emergency Request Now"] as const;

/**
 * Which step owns each field.
 *
 * Drives both the per-step inline errors and the jump-to-step behaviour when the
 * final send finds something missing, so a field can never be validated on a
 * step the user cannot see.
 */
const STEP_FIELDS: readonly (readonly (keyof EmergencyFormErrors)[])[] = [
  ["patientName", "bloodGroup"],
  ["hospital", "ward", "district", "units", "contactName", "contactMobile"],
  ["notes"],
];

/** Narrows a full error object down to the fields a single step renders. */
function pickFields(
  all: EmergencyFormErrors,
  fields: readonly (keyof EmergencyFormErrors)[],
): Partial<EmergencyFormErrors> {
  const picked: Partial<EmergencyFormErrors> = {};

  for (const field of fields) {
    picked[field] = all[field];
  }

  return picked;
}

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

/**
 * Red pill that sits on the "Units Required" heading line.
 *
 * Lives here rather than in `UnitsStepper` so it can span the heading row's full
 * width instead of the selector's.
 */
function CriticalNeedBadge() {
  return (
    <View style={styles.criticalBadge}>
      <View style={styles.criticalDot} />

      <Text style={styles.criticalText} numberOfLines={1}>
        Critical Need
      </Text>
    </View>
  );
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
  const [broadcastEnabled, setBroadcastEnabled] = useState(true);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);
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
   * The whole form in validator shape.
   *
   * `units` is a number in state because the stepper needs to clamp it, so it is
   * stringified here rather than changing the validator's contract.
   */
  const buildValues = useCallback(
    (): EmergencyFormValues => ({
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
    }),
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

  /**
   * Validates every field, then reports only the ones on the visible step.
   *
   * Returns whether the step can be left, so callers do not have to run the
   * validator themselves.
   */
  const validateStep = useCallback(
    (target: number): boolean => {
      const all = validateEmergencyForm(buildValues());
      const visible = pickFields(all, STEP_FIELDS[target] ?? []);

      setErrors(visible);
      setFormError(null);

      return !Object.values(visible).some((message) => message !== null);
    },
    [buildValues],
  );

  /**
   * Gate for the final send.
   *
   * Step 3 only renders `notes`, so validating the visible step alone would let a
   * request with no blood group or no ward reach the server. This runs the whole
   * validator and moves the user to the earliest step that owns an error, so
   * there is always somewhere they can go and fix it.
   */
  const validateAll = useCallback((): boolean => {
    const all = validateEmergencyForm(buildValues());

    setErrors(all);

    const errorStep = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => all[field] !== null),
    );

    if (errorStep === -1) {
      setFormError(null);
      return true;
    }

    setFormError(null);
    setStep(errorStep);

    return false;
  }, [buildValues]);

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

  /** Sends the user to the step that owns the row they tapped Edit on. */
  const handleEdit = useCallback((target: 0 | 1) => {
    setFormError(null);
    setStep(target);
  }, []);

  const handleEditAll = useCallback(() => {
    setErrors({});
    setFormError(null);
    setBroadcastError(null);
    setStep(0);
  }, []);

  function handleToggleBroadcast(next: boolean) {
    setBroadcastEnabled(next);

    if (next) {
      setBroadcastError(null);
    }
  }

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

    if (step < TOTAL_STEPS - 1) {
      if (validateStep(step)) {
        setStep(step + 1);
      }

      return;
    }

    // Final step: the whole form has to be sound, not just this step's notes.
    if (!broadcastEnabled) {
      setErrors({});
      setBroadcastError(ValidationMessages.broadcastDisabled);
      return;
    }

    setBroadcastError(null);

    if (!validateAll()) {
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
          <Text style={styles.pageTitle}>Where is the patient admitted?</Text>

          <Text style={styles.sectionBody}>
            Enter hospital information to notify nearby{"\n"}donors within emergency
            radius.
          </Text>

          {/* Map and coverage card share a wrapper so the card can overlap the
              map's lower edge; a gap between them here would cancel the pull-up. */}
          <View style={styles.mapGroup}>
            <MapPreview area={area} />

            <CoverageCard radiusKm={SAMPLE_RADIUS_KM} onlineDonors={SAMPLE_ONLINE_DONORS} />
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeading label="Hospital Name" icon="home" />

          <SelectField
            label="Hospital Name"
            hideLabel
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
            trailingTone="success"
            caption={selectedHospital?.note}
            error={errors.hospital}
            size="dense"
          />
        </View>

        <View style={styles.section}>
          <SectionHeading label="Ward & Room Details" icon="clipboard" />

          <TextField
            label="Ward & Room Details"
            hideLabel
            value={ward}
            onChangeText={(value) => {
              setWard(value);
              clearError("ward");
            }}
            placeholder="e.g. Ward 14, Intensive Care Unit"
            icon="home"
            autoCapitalize="sentences"
            error={errors.ward}
            size="dense"
          />
        </View>

        <View style={styles.unitsCard}>
          <SectionHeading label="Units Required" icon="droplet" right={<CriticalNeedBadge />} />

          <UnitsStepper
            units={units}
            onChange={(value) => {
              setUnits(value);
              clearError("units");
            }}
            error={errors.units}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.urgencyHeading}>
            <SectionHeading label="Emergency Urgency Level" icon="alert-octagon" />

            <View style={styles.pushAlerts}>
              <Feather name="zap" size={9} color={Blood.primary} />

              <Text style={styles.pushAlertsText}>Push Alerts</Text>
            </View>
          </View>

          <UrgencyCardList value={urgency} onChange={setUrgency} />
        </View>

        <View style={styles.section}>
          <SectionHeading label="Patient Contact Person" icon="user" />

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
    const review: RequestReviewData = {
      patientName,
      bloodGroup,
      units,
      hospital,
      district: selectedHospital?.district ?? null,
      ward,
      urgency,
      contactName,
      contactMobile,
    };

    return (
      <>
        <RequestReview
          data={review}
          broadcastEnabled={broadcastEnabled}
          onToggleBroadcast={handleToggleBroadcast}
          broadcastError={broadcastError}
          onEdit={handleEdit}
        />

        {/* Below the certification card rather than inside the summary: the
            review copy above it is fixed, this is the one free-text field. */}
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
              Emergency Request Broadcast
            </Text>

            <Text style={styles.successBody}>
              Your request has been sent to nearby verified donors. Keep the contact number
              reachable.
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
  const headerTitle = STEP_HEADER_TITLES[step] ?? STEP_HEADER_TITLES[0];

  // The final step reads as one sentence plus a percentage, because there is no
  // later step to name on the trailing edge.
  const progress =
    isLastStep
      ? { leading: `STEP ${TOTAL_STEPS} OF ${TOTAL_STEPS}: FINAL VERIFICATION`, trailing: "100%" }
      : { label: stepTitle };

  return (
    <View style={styles.root}>
      <StepHeader
        title={headerTitle}
        onBack={handleBack}
        right={
          <Pressable
            onPress={() => {
              if (session !== null) {
                router.push(ROLE_HOME[session.user.role]);
              }
            }}
            disabled={session === null}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={HIT_SLOP_MIN / 2}
            style={({ pressed }) => [styles.avatar, pressed && styles.avatarPressed]}
          >
            <Feather name="user" size={12} color={Blood.primary} />
          </Pressable>
        }
      />

      <StepProgress current={step + 1} total={TOTAL_STEPS} {...progress} />

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
      <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {/* In the footer rather than the scroll area: a rejected submission is
            the one error the user must not have to scroll to find. */}
        <FormAlert message={formError} />

        <PrimaryAuthButton
          label={STEP_CTA_LABELS[step] ?? STEP_CTA_LABELS[0]}
          loadingLabel={isLastStep ? "Broadcasting Emergency Request..." : "Submitting..."}
          icon={isLastStep ? "zap" : undefined}
          size="compact"
          trailingIcon={isLastStep ? undefined : "arrow-right"}
          loading={isSubmitting}
          onPress={handleContinue}
        />

        {isLastStep ? (
          <Pressable
            onPress={handleEditAll}
            accessibilityRole="button"
            accessibilityLabel="Edit all details and return to the first step"
            hitSlop={8}
            style={styles.backLink}
          >
            <Text style={styles.editAllText}>Edit All Details</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back a step"
            hitSlop={8}
            style={styles.backLink}
          >
            <Feather name="arrow-left" size={10} color={Surface.textMuted} />

            <Text style={styles.backLinkText}>
              Back to {step === 0 ? "start" : STEP_BACK_LABELS[step - 1]}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  section: {
    gap: 7,
  },

  /** Map plus the coverage card that overlaps it — no gap between them. */
  mapGroup: {
    marginTop: 2,
  },

  pageTitle: {
    ...Typography.cardTitle,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: Surface.text,
  },

  sectionBody: {
    ...Typography.small,
    fontSize: 9.5,
    lineHeight: 13,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  unitsCard: {
    gap: 7,
    borderRadius: Radius.field,
    padding: 10,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  criticalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  criticalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Blood.primary,
  },

  criticalText: {
    ...Typography.micro,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Blood.primary,
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
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  pushAlertsText: {
    ...Typography.micro,
    fontSize: 7.5,
    lineHeight: 11,
    letterSpacing: 0.2,
    fontWeight: "700",
    color: Blood.primary,
  },

  actions: {
    gap: 6,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: Surface.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 24,
  },

  backLinkText: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },

  editAllText: {
    ...Typography.micro,
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: Surface.textMuted,
    textAlign: "center",
  },

  /** Profile affordance in the header, present on every step. */
  avatar: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  avatarPressed: {
    backgroundColor: Surface.softRedBorder,
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