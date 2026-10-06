import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { EmptyNote } from "@/components/dashboard/empty-note";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { TextField } from "@/components/ui/text-field";
import { SelectField } from "@/components/ui/select-field";
import { OptionChips } from "@/components/ui/option-chips";
import { BLOOD_GROUPS, isBloodGroup } from "@/constants/blood-groups";
import { Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { ApiError, apiErrorMessage } from "@/services/auth";

export default function DonorProfileScreen() {
  return (
    <DashboardShell title="Donor Profile" bottomNavigation={<DonorTabBar active="profile" />}>
      {() => <ProfileContent />}
    </DashboardShell>
  );
}

function ProfileContent() {
  const { session, updateDonorProfile } = useAuth();
  const user = session?.user;
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");
  const [district, setDistrict] = useState(user?.district ?? null);
  const [bloodGroup, setBloodGroup] = useState(isBloodGroup(user?.bloodGroup) ? user.bloodGroup : null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (user?.role !== "donor") {
    return <EmptyNote title="Donor profile only" message="This profile page is available to donor accounts." />;
  }

  async function save() {
    const nextErrors: Record<string, string> = {};
    if (fullName.trim().length < 2) nextErrors.fullName = "Please enter your full name.";
    if (!email.trim() && !mobile.trim()) nextErrors.mobile = "Provide an email address or mobile number.";
    if (district === null) nextErrors.district = "Select your district.";
    if (bloodGroup === null) nextErrors.bloodGroup = "Select your blood group.";
    setErrors(nextErrors);
    setNotice(null);
    if (Object.keys(nextErrors).length > 0 || district === null || bloodGroup === null) return;

    setIsSaving(true);
    try {
      await updateDonorProfile({
        fullName: fullName.trim(),
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        district,
        bloodGroup,
      });
      setNotice("Your donor profile has been updated.");
      setErrors({});
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields) setErrors(caught.fields);
      setNotice(apiErrorMessage(caught));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.content}>
      <View style={styles.intro}>
        <Text style={styles.title}>Your donor details</Text>
        <Text style={styles.subtitle}>Keep your contact and blood group current so emergency requests can be matched correctly.</Text>
      </View>

      <View style={styles.form}>
        <TextField label="Full name" value={fullName} onChangeText={setFullName} error={errors.fullName} autoComplete="name" />
        <TextField label="Mobile number" value={mobile} onChangeText={setMobile} placeholder="07XXXXXXXX" keyboardType="phone-pad" autoCapitalize="none" error={errors.mobile} hint="Enter a Sri Lankan mobile number." />
        <TextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" error={errors.email} />
        <SelectField label="District" value={district} options={DISTRICTS} onChange={setDistrict} placeholder="Select your district" error={errors.district} />
        <OptionChips label="Blood group" options={BLOOD_GROUPS} value={bloodGroup} onChange={setBloodGroup} error={errors.bloodGroup} />

        {notice ? <Text style={[styles.notice, errors.email || errors.mobile ? styles.noticeError : null]}>{notice}</Text> : null}
        <PrimaryAuthButton label="Save donor profile" onPress={() => void save()} loading={isSaving} loadingLabel="Saving profile…" icon="save" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18 },
  intro: { gap: 5 },
  title: { ...Typography.screenTitle, color: Surface.text },
  subtitle: { ...Typography.small, color: Surface.textSecondary, lineHeight: 19 },
  form: { gap: 17, padding: 16, borderRadius: 20, backgroundColor: Surface.card, borderWidth: 1, borderColor: Surface.border },
  notice: { ...Typography.small, color: Surface.online, fontWeight: "700" },
  noticeError: { color: Surface.danger },
});
