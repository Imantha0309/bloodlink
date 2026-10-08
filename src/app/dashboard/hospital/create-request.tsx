import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContactCard } from "@/components/emergency/contact-card";
import { TextField } from "@/components/ui/text-field";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import { URGENCY_OPTIONS, type UrgencyLevel } from "@/constants/emergency";
import {
  CREATE_REQUEST,
  DEFAULT_REQUEST,
  REQUEST_COMPONENTS,
  VERIFICATION_ITEMS,
  type RequestComponent,
  type VerificationTone,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import { createEmergencyRequest } from "@/services/requests/emergency-requests";
import { haptics } from "@/utils/haptics";
import { initialsOf } from "@/utils/initials";

/** The ABO/Rh picker renders two rows of four, in the catalogue's order. */
const GROUP_ROWS = [BLOOD_GROUPS.slice(0, 4), BLOOD_GROUPS.slice(4, 8)];

const VERIFICATION_TONE = {
  positive: Surface.online,
  neutral: Surface.textMuted,
} as const;

/**
 * Hospital requisition form.
 *
 * Controls are live (group, component, units, sign-off checkboxes) and the
 * broadcast action submits through `createEmergencyRequest` — the same
 * zero-login endpoint the public form uses — then hands the created id to the
 * transmission progress screen, which tracks the real candidates.
 */
export default function HospitalCreateRequestScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(DEFAULT_REQUEST.bloodGroup);
  const [component, setComponent] = useState<RequestComponent>(DEFAULT_REQUEST.component);
  const [units, setUnits] = useState<number>(DEFAULT_REQUEST.units);
  const [patientName, setPatientName] = useState("");
  const [urgency, setUrgency] = useState<UrgencyLevel>("critical");
  const [contactName, setContactName] = useState(session?.user.fullName ?? "");
  const [contactMobile, setContactMobile] = useState(session?.user.mobile ?? "");
  const [patientError, setPatientError] = useState<string | null>(null);
  const [contactNameError, setContactNameError] = useState<string | null>(null);
  const [contactMobileError, setContactMobileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(VERIFICATION_ITEMS.map((item) => [item.id, item.confirmed])),
  );

  const volume = units * CREATE_REQUEST.mlPerUnit;
  const showAlert = units > CREATE_REQUEST.unitsAlertThreshold;

  function adjustUnits(delta: number) {
    haptics.light();
    setUnits((current) => Math.min(20, Math.max(1, current + delta)));
  }

  function toggleCheck(id: string) {
    setChecks((current) => ({ ...current, [id]: !current[id] }));
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    // Opened directly (deep link / cold start) — the Home tab is the parent.
    router.replace(ROLE_HOME.hospital);
  }

  /**
   * Submits the requisition, then hands the payload and the created id to the
   * progress screen, which owns the broadcast animation.
   */
  async function handleBroadcast() {
    const trimmedPatient = patientName.trim();
    const trimmedName = contactName.trim();
    const trimmedMobile = contactMobile.trim();

    setPatientError(null);
    setContactNameError(null);
    setContactMobileError(null);
    setSubmitError(null);

    if (trimmedPatient === "") {
      setPatientError("Enter the patient or ward this requisition is for.");
      return;
    }

    if (trimmedName === "") {
      setContactNameError("Who should donors call back?");
      return;
    }

    if (trimmedMobile === "") {
      setContactMobileError("A callback number is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await createEmergencyRequest({
        patientName: trimmedPatient,
        bloodGroup,
        units,
        hospital: session?.user.fullName ?? "Hospital",
        district: session?.user.district ?? null,
        contactName: trimmedName,
        contactMobile: trimmedMobile,
        urgency,
        notes: `Component: ${component}`,
      });

      haptics.success();

      router.push({
        pathname: ROUTES.hospitalTransmission,
        params: {
          requestId: created.id,
          bloodGroup,
          component,
          units: String(units),
          volume: String(volume),
        },
      });
    } catch (caught) {
      haptics.error();
      setSubmitError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ================= HEADER ================= */}

        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={6}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          >
            <Feather name="arrow-left" size={20} color={Surface.text} />
          </Pressable>

          <Text style={styles.title} numberOfLines={1}>
            {CREATE_REQUEST.title}
          </Text>

          <Pressable
            onPress={() => router.push(ROUTES.hospitalProfile)}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            hitSlop={6}
            style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initialsOf(session?.user.fullName)}</Text>
          </Pressable>
        </View>

        {/* ================= PHENOTYPE TARGET ================= */}

        <View style={styles.card}>
          <View style={styles.phenotypeHead}>
            <View style={styles.phenotypeIcon}>
              <Feather name="droplet" size={18} color={Blood.primary} />
            </View>

            <Text style={styles.phenotypeTitle}>{CREATE_REQUEST.phenotypeTitle}</Text>

            <Text style={styles.phenotypeNote}>{CREATE_REQUEST.phenotypeNote}</Text>
          </View>

          <Text style={styles.fieldLabel}>{CREATE_REQUEST.groupLabel}</Text>

          {GROUP_ROWS.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.groupRow}>
              {row.map((group) => {
                const selected = group === bloodGroup;

                return (
                  <Pressable
                    key={group}
                    onPress={() => {
                      haptics.light();
                      setBloodGroup(group);
                    }}
                    accessibilityRole="radio"
                    accessibilityLabel={group}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.groupChip,
                      pressed && styles.pressed,
                      selected && styles.groupChipActive,
                    ]}
                  >
                    <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>
                      {group}
                    </Text>

                    {selected ? (
                      <View style={styles.groupCheck} pointerEvents="none">
                        <Feather name="check" size={11} color={Surface.onPrimary} />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}

          <Text style={styles.fieldLabel}>{CREATE_REQUEST.componentLabel}</Text>

          <View style={styles.componentWrap}>
            {REQUEST_COMPONENTS.map((item) => {
              const selected = item === component;

              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    haptics.light();
                    setComponent(item);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={item}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.componentChip,
                    pressed && styles.pressed,
                    selected && styles.componentChipActive,
                  ]}
                >
                  <Text
                    style={[styles.componentChipText, selected && styles.componentChipTextActive]}
                  >
                    {item}
                  </Text>

                  {selected ? <Feather name="check" size={12} color={Surface.onPrimary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ================= PATIENT & URGENCY ================= */}

        <View style={styles.card}>
          <TextField
            label="Patient or ward reference"
            value={patientName}
            onChangeText={(value) => {
              setPatientName(value);
              setPatientError(null);
            }}
            placeholder="e.g. ICU Ward 14 — R. M. Silva"
            icon="user"
            error={patientError}
            size="dense"
            autoCapitalize="words"
          />

          <Text style={styles.fieldLabel}>Urgency</Text>

          <View style={styles.componentWrap}>
            {URGENCY_OPTIONS.map((option) => {
              const selected = option.level === urgency;

              return (
                <Pressable
                  key={option.level}
                  onPress={() => {
                    haptics.light();
                    setUrgency(option.level);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected }}
                  style={({ pressed }) => [
                    styles.componentChip,
                    pressed && styles.pressed,
                    selected && styles.componentChipActive,
                  ]}
                >
                  <Feather
                    name={option.icon}
                    size={12}
                    color={selected ? Surface.onPrimary : Surface.textSecondary}
                  />
                  <Text
                    style={[styles.componentChipText, selected && styles.componentChipTextActive]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Reporting contact</Text>

          <ContactCard
            name={contactName}
            onChangeName={(value) => {
              setContactName(value);
              setContactNameError(null);
            }}
            mobile={contactMobile}
            onChangeMobile={(value) => {
              setContactMobile(value);
              setContactMobileError(null);
            }}
            nameError={contactNameError}
            mobileError={contactMobileError}
            caption="Called back if donors need to confirm details before arriving."
          />
        </View>

        {/* ================= UNITS ================= */}

        <View style={styles.unitsCard}>
          <Text style={styles.unitsTitle}>{CREATE_REQUEST.unitsLabel}</Text>

          <View style={styles.unitsRow}>
            <Text style={styles.unitsVolume} numberOfLines={2}>
              Vol {volume.toLocaleString("en-US")} mL total transfusate
            </Text>

            <View style={styles.stepper}>
              <Pressable
                onPress={() => {
                  adjustUnits(-1);
                }}
                disabled={units <= 1}
                accessibilityRole="button"
                accessibilityLabel="Remove one unit"
                accessibilityState={{ disabled: units <= 1 }}
                style={({ pressed }) => [
                  styles.stepButton,
                  pressed && styles.stepButtonPressed,
                  units <= 1 && styles.stepButtonDisabled,
                ]}
              >
                <Feather name="minus" size={16} color={Surface.text} />
              </Pressable>

              <Text style={styles.unitsValue} accessibilityLiveRegion="polite">
                {units}
              </Text>

              <Pressable
                onPress={() => {
                  adjustUnits(1);
                }}
                accessibilityRole="button"
                accessibilityLabel="Add one unit"
                style={({ pressed }) => [styles.stepButton, pressed && styles.stepButtonPressed]}
              >
                <Feather name="plus" size={16} color={Surface.text} />
              </Pressable>
            </View>
          </View>

          {showAlert ? (
            <View style={styles.alert}>
              <Feather name="alert-triangle" size={14} color={Blood.primary} />

              <Text style={styles.alertText}>{CREATE_REQUEST.unitsAlert}</Text>
            </View>
          ) : null}
        </View>

        {/* ================= VERIFICATION ================= */}

        <View style={styles.card}>
          <View style={styles.verificationHead}>
            <Feather name="shield" size={16} color={Surface.online} />

            <Text style={styles.verificationTitle}>{CREATE_REQUEST.verificationTitle}</Text>
          </View>

          {VERIFICATION_ITEMS.map((item) => {
            const checked = checks[item.id] ?? false;

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  toggleCheck(item.id);
                }}
                accessibilityRole="checkbox"
                accessibilityLabel={item.label}
                accessibilityState={{ checked }}
                style={styles.checkItem}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked ? <Feather name="check" size={13} color={Surface.onPrimary} /> : null}
                </View>

                <View style={styles.checkText}>
                  <Text style={styles.checkLabel}>{item.label}</Text>

                  {item.detail !== null ? (
                    <Text style={styles.checkDetail}>{item.detail}</Text>
                  ) : null}
                </View>

                <Feather
                  name={item.icon}
                  size={15}
                  color={VERIFICATION_TONE[item.iconTone as VerificationTone]}
                />
              </Pressable>
            );
          })}

          <View style={styles.compliance}>
            <Feather name="lock" size={13} color={Surface.textSecondary} />

            <View style={styles.complianceText}>
              <Text style={styles.complianceHeadline}>{CREATE_REQUEST.complianceHeadline}</Text>

              <Text style={styles.complianceNote}>{CREATE_REQUEST.complianceNote}</Text>

              <Text style={styles.complianceRef}>{CREATE_REQUEST.complianceReference}</Text>
            </View>
          </View>
        </View>

        {/* ================= SUBMIT ================= */}

        {submitError !== null ? (
          <View style={styles.submitError}>
            <Feather name="alert-circle" size={14} color={Blood.primary} />
            <Text style={styles.submitErrorText}>{submitError}</Text>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={CREATE_REQUEST.ctaLabel}
          accessibilityHint="Opens the broadcast transmission progress"
          accessibilityState={{ disabled: isSubmitting }}
          disabled={isSubmitting}
          onPress={() => {
            void handleBroadcast();
          }}
          style={({ pressed }) => [
            styles.cta,
            pressed && styles.pressed,
            isSubmitting && styles.ctaDisabled,
          ]}
        >
          <Feather
            name={isSubmitting ? "loader" : "radio"}
            size={17}
            color={Surface.onPrimary}
          />

          <Text style={styles.ctaText} numberOfLines={1}>
            {isSubmitting ? "Broadcasting…" : CREATE_REQUEST.ctaLabel}
          </Text>

          {!isSubmitting ? (
            <Feather name="arrow-right" size={16} color={Surface.onPrimary} />
          ) : null}
        </Pressable>
      </ScrollView>
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
    paddingHorizontal: 20,
    gap: 14,
  },

  /* ================= HEADER ================= */

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  backButtonPressed: {
    backgroundColor: Surface.border,
  },

  title: {
    flex: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  avatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  /* ================= CARDS ================= */

  card: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  pressed: {
    opacity: 0.75,
  },

  /* ================= PHENOTYPE ================= */

  phenotypeHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  phenotypeIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  phenotypeTitle: {
    flex: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  phenotypeNote: {
    flexShrink: 0,
    maxWidth: 72,
    textAlign: "right",
    ...Typography.micro,
    fontSize: 10,
    color: Blood.primary,
  },

  fieldLabel: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textMuted,
  },

  groupRow: {
    flexDirection: "row",
    gap: 8,
  },

  groupChip: {
    flex: 1,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  groupChipActive: {
    borderColor: Blood.primary,
    backgroundColor: Blood.primary,
  },

  groupChipText: {
    ...Typography.label,
    color: Surface.text,
  },

  groupChipTextActive: {
    color: Surface.onPrimary,
  },

  groupCheck: {
    position: "absolute",
    top: 3,
    right: 4,
  },

  componentWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  componentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  componentChipActive: {
    borderColor: Blood.primary,
    backgroundColor: Blood.primary,
  },

  componentChipText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.textSecondary,
  },

  componentChipTextActive: {
    color: Surface.onPrimary,
  },

  /* ================= UNITS ================= */

  unitsCard: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  unitsTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  unitsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  unitsVolume: {
    flex: 1,
    ...Typography.small,
    color: Surface.textSecondary,
  },

  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  stepButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  stepButtonPressed: {
    backgroundColor: Surface.iconWash,
  },

  stepButtonDisabled: {
    opacity: 0.4,
  },

  unitsValue: {
    minWidth: 26,
    textAlign: "center",
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: Blood.primary,
  },

  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  alertText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  /* ================= VERIFICATION ================= */

  verificationHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  verificationTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  checkItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 44,
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radius.sm - 3,
    borderWidth: 1.5,
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxChecked: {
    backgroundColor: Blood.primary,
    borderColor: Blood.primary,
  },

  checkText: {
    flex: 1,
    gap: 2,
  },

  checkLabel: {
    ...Typography.label,
    color: Surface.text,
  },

  checkDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  compliance: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  complianceText: {
    flex: 1,
    gap: 2,
  },

  complianceHeadline: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  complianceNote: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  complianceRef: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  /* ================= SUBMIT ================= */

  submitError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  submitErrorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  ctaDisabled: {
    opacity: 0.6,
  },

  ctaText: {
    flexShrink: 1,
    ...Typography.button,
    color: Surface.onPrimary,
  },
});
