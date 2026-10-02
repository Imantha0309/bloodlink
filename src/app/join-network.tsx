import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandHeader } from "@/components/auth/brand-header";
import { NumberedSection } from "@/components/auth/numbered-section";
import { PhoneEmailInput } from "@/components/auth/phone-email-input";
import { RoleCard } from "@/components/auth/role-card";
import { StepProgress } from "@/components/auth/step-progress";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUP_NOTES, BLOOD_GROUPS } from "@/constants/blood-groups";
import { Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { ROLE_CARDS, type SelfRegisterRole } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { asBloodGroup } from "@/utils/validation";

const STEPS = ["Identity", "Medical", "Security"] as const;

/**
 * Step 1 of the three-step "Join the Life-Saving Network" flow.
 *
 * Collects the role and the identity / medical baseline on one page. There is
 * no submit action yet: the account needs a password and terms acceptance,
 * which belong to the Security step, and `signUp` cannot be called without
 * them. The CTA arrives with that step rather than being faked here.
 */
export default function JoinNetworkScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [role, setRole] = useState<SelfRegisterRole | null>(null);
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [district, setDistrict] = useState<string | null>(null);
  const [bloodGroup, setBloodGroup] = useState<string | null>(null);
  const [lastDonationAt, setLastDonationAt] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");

  const isDonor = role === "donor";
  const isHospital = role === "hospital";

  // Hospitals manage stock per request rather than per account, so they have no
  // blood group to declare — same rule `validateRegisterForm` applies.
  const showBloodGroup = !isHospital;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <BrandHeader onProfilePress={() => router.push(ROUTES.login)} />

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
            <Text style={styles.title} accessibilityRole="header">
              Join the Life-Saving Network
            </Text>

            <Text style={styles.subtitle}>
              Create your BloodLink profile and get matched with verified donors and hospitals
              across Sri Lanka.
            </Text>

            <StepProgress steps={STEPS} activeStep={1} />

            <Text style={styles.roleLabel}>SELECT YOUR ROLE</Text>

            {ROLE_CARDS.map((meta) => (
              <RoleCard
                key={meta.role}
                meta={meta}
                selected={role === meta.role}
                onPress={() => setRole(meta.role)}
              />
            ))}

            <NumberedSection
              step={1}
              title="Personal & Identity Details"
              hint="How we identify you and reach you when it matters."
            />

            <View style={styles.form}>
              <TextField
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Nimal Perera"
                autoComplete="name"
                icon="user"
              />

              <PhoneEmailInput
                label="Email or Mobile Number"
                value={identifier}
                onChangeText={setIdentifier}
              />

              <SelectField
                label="District"
                value={district}
                options={DISTRICTS}
                onChange={setDistrict}
                placeholder="Select your district"
              />
            </View>

            <NumberedSection
              step={2}
              title="Blood Group & Medical Baseline"
              hint="Used to match you with compatible requests."
            />

            <View style={styles.form}>
              {showBloodGroup ? (
                <OptionChips
                  label="Blood Group"
                  options={BLOOD_GROUPS}
                  value={asBloodGroup(bloodGroup ?? "")}
                  onChange={setBloodGroup}
                  captionFor={(value) => BLOOD_GROUP_NOTES[value]}
                />
              ) : (
                <TextField
                  label="Hospital Registration Number"
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  placeholder="e.g. MOH/2024/0193"
                  autoCapitalize="characters"
                  icon="file-text"
                  hint="Used by an administrator to verify your facility."
                />
              )}

              {isDonor ? (
                <TextField
                  label="Last Donation (optional)"
                  value={lastDonationAt}
                  onChangeText={setLastDonationAt}
                  placeholder="YYYY-MM-DD"
                  autoCapitalize="none"
                  icon="calendar"
                  hint="Leave blank if you have never donated."
                />
              ) : null}
            </View>
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
    paddingTop: 2,
    gap: 12,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.body,
    marginTop: -4,
    marginBottom: 2,
    color: Surface.textSecondary,
  },

  roleLabel: {
    ...Typography.micro,
    marginTop: 4,
    marginBottom: -2,
    color: Surface.textMuted,
  },

  form: {
    gap: 18,
    marginTop: 6,
  },
});