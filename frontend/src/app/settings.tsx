import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActionSheetIOS,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedAvatar } from "@/components/common/animated-avatar";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { useConfirm } from "@/components/ui/confirm-provider";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";
import { BLOOD_GROUPS, isBloodGroup } from "@/constants/blood-groups";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  pickAvatarFromLibrary,
  takeAvatarWithCamera,
} from "@/services/avatar/avatar-service";
import { haptics } from "@/utils/haptics";

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, updateProfile, uploadAvatar, signOut } = useAuth();
  const { confirm, alert: notify, choose } = useConfirm();
  const user = session?.user;

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");
  const [district, setDistrict] = useState<string | null>(user?.district ?? null);
  const [bloodGroup, setBloodGroup] = useState<string | null>(user?.bloodGroup ?? null);

  const [smsAlerts, setSmsAlerts] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const role = user?.role ?? "recipient";
  const isDonor = role === "donor";
  const isAdmin = role === "admin";

  async function promptChangeAvatar() {
    if (isUploadingAvatar) return;

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Choose from Photo Library", "Take Photo with Camera"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            void handleSelectPhoto();
          } else if (buttonIndex === 2) {
            void handleTakePhoto();
          }
        },
      );
      return;
    }

    // Android and the web share one sheet. `Alert.alert` used to cover Android
    // but is a no-op on the web, so the avatar picker was simply absent there.
    const picked = await choose({
      title: "Change Profile Photo",
      message: "Choose an option",
      icon: "camera",
      cancelLabel: "Cancel",
      choices: [
        { label: "Photo Library" },
        { label: "Take Photo" },
      ],
    });

    if (picked === "Photo Library") {
      await handleSelectPhoto();
    } else if (picked === "Take Photo") {
      await handleTakePhoto();
    }
  }

  async function handleSelectPhoto() {
    try {
      const uri = await pickAvatarFromLibrary();
      if (uri) {
        await doUploadAvatar(uri);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not open photo library.";
      await notify({ title: "Photo Selection", message, icon: "image", destructive: true });
    }
  }

  async function handleTakePhoto() {
    try {
      const uri = await takeAvatarWithCamera();
      if (uri) {
        await doUploadAvatar(uri);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not access camera.";
      await notify({ title: "Camera Error", message, icon: "camera", destructive: true });
    }
  }

  async function doUploadAvatar(uri: string) {
    setIsUploadingAvatar(true);
    setFeedback(null);
    try {
      await uploadAvatar(uri);
      haptics.notification();
      setFeedback({ type: "success", message: "Profile photo updated successfully!" });
    } catch (err) {
      setFeedback({ type: "error", message: apiErrorMessage(err) });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleSaveProfile() {
    if (isAdmin) {
      await notify({
        title: "Admin Profile",
        message: "Administrator profiles are managed by system provisioning.",
        icon: "info",
      });
      return;
    }

    const nextErrors: Record<string, string> = {};
    if (fullName.trim().length < 2) {
      nextErrors.fullName = "Please enter your full name.";
    }
    if (!email.trim() && !mobile.trim()) {
      nextErrors.mobile = "Provide at least an email or mobile number.";
    }

    setErrors(nextErrors);
    setFeedback(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        district: district ?? null,
        bloodGroup: isDonor ? bloodGroup : undefined,
      });

      haptics.notification();
      setFeedback({ type: "success", message: "Your profile changes have been saved." });
      setErrors({});
    } catch (err) {
      setFeedback({ type: "error", message: apiErrorMessage(err) });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSignOut() {
    const approved = await confirm({
      title: "Sign Out",
      message: "Are you sure you want to sign out of BloodLink?",
      confirmLabel: "Sign Out",
      icon: "log-out",
      destructive: true,
    });

    if (!approved) {
      return;
    }

    await signOut();
    router.replace(ROUTES.login);
  }

  return (
    <KeyboardDismissView style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          >
            <Feather name="arrow-left" size={20} color={Surface.text} />
          </Pressable>

          <Text style={styles.headerTitle}>Settings</Text>

          <View style={styles.headerRightPlaceholder} />
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Feedback notification */}
            {feedback ? (
              <View
                style={[
                  styles.feedbackBanner,
                  feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError,
                ]}
              >
                <Feather
                  name={feedback.type === "success" ? "check-circle" : "alert-circle"}
                  size={16}
                  color={feedback.type === "success" ? "#16834A" : Blood.primary}
                />
                <Text
                  style={[
                    styles.feedbackText,
                    feedback.type === "success"
                      ? styles.feedbackTextSuccess
                      : styles.feedbackTextError,
                  ]}
                >
                  {feedback.message}
                </Text>
              </View>
            ) : null}

            {/* Profile Picture Card */}
            <View style={styles.card}>
              <View style={styles.avatarSection}>
                <AnimatedAvatar
                  url={user?.avatarUrl}
                  name={user?.fullName}
                  size={90}
                  animated={isUploadingAvatar}
                  pulseColor={Blood.primary}
                  showEditBadge
                  isUploading={isUploadingAvatar}
                  onPress={() => {
                    void promptChangeAvatar();
                  }}
                />

                <View style={styles.avatarInfo}>
                  <Text style={styles.avatarName}>{user?.fullName ?? "User"}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {role.toUpperCase()} ACCOUNT
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      void promptChangeAvatar();
                    }}
                    style={({ pressed }) => [styles.changePhotoBtn, pressed && styles.pressed]}
                  >
                    <Feather name="camera" size={13} color={Blood.primary} />
                    <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Editable Profile Information */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Feather name="user" size={16} color={Blood.primary} />
                <Text style={styles.sectionTitle}>Account Details</Text>
              </View>

              <View style={styles.formGroup}>
                <TextField
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter full name"
                  error={errors.fullName}
                  editable={!isAdmin}
                />

                <TextField
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@domain.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                  editable={!isAdmin}
                />

                <TextField
                  label="Mobile Number"
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="077 123 4567"
                  keyboardType="phone-pad"
                  error={errors.mobile}
                  editable={!isAdmin}
                />

                <SelectField
                  label="District"
                  value={district}
                  options={DISTRICTS}
                  onChange={setDistrict}
                  placeholder="Select district"
                  error={errors.district}
                />

                {isDonor ? (
                  <SelectField
                    label="Blood Group"
                    value={bloodGroup}
                    options={BLOOD_GROUPS}
                    onChange={(val) => {
                      if (val && isBloodGroup(val)) setBloodGroup(val);
                    }}
                    placeholder="Select blood group"
                    error={errors.bloodGroup}
                  />
                ) : null}

                {user?.station ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Assigned Desk / Station:</Text>
                    <Text style={styles.metaValue}>{user.station} {user.wardLabel ? `(${user.wardLabel})` : ""}</Text>
                  </View>
                ) : null}
              </View>

              {!isAdmin ? (
                <View style={styles.buttonWrap}>
                  <PrimaryAuthButton
                    label="Save Changes"
                    loadingLabel="Saving..."
                    loading={isSaving}
                    onPress={() => void handleSaveProfile()}
                    icon="check"
                  />
                </View>
              ) : null}
            </View>

            {/* Notification & App Preferences */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Feather name="bell" size={16} color={Blood.primary} />
                <Text style={styles.sectionTitle}>Preferences</Text>
              </View>

              <View style={styles.prefRow}>
                <View style={styles.prefCopy}>
                  <Text style={styles.prefTitle}>SMS Notifications</Text>
                  <Text style={styles.prefDesc}>Emergency requests & alert updates via SMS</Text>
                </View>
                <Switch
                  value={smsAlerts}
                  onValueChange={setSmsAlerts}
                  trackColor={{ false: "#E2E8F0", true: Blood.primary }}
                />
              </View>

              <View style={styles.divider} />

              <View style={styles.prefRow}>
                <View style={styles.prefCopy}>
                  <Text style={styles.prefTitle}>Haptic Feedback</Text>
                  <Text style={styles.prefDesc}>Tactile vibration for interactions & gestures</Text>
                </View>
                <Switch
                  value={hapticFeedback}
                  onValueChange={setHapticFeedback}
                  trackColor={{ false: "#E2E8F0", true: Blood.primary }}
                />
              </View>
            </View>

            {/* Support & Helpline */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Feather name="phone-call" size={16} color={Blood.primary} />
                <Text style={styles.sectionTitle}>National Blood Bank Helpline</Text>
              </View>

              <Text style={styles.helplineDesc}>
                For immediate medical assistance or rare blood group mobilization:
              </Text>

              <View style={styles.helplineList}>
                <View style={styles.helplineItem}>
                  <Text style={styles.helplineLabel}>Suwa Seriya Ambulance</Text>
                  <Text style={styles.helplineNumber}>1990</Text>
                </View>
                <View style={styles.helplineItem}>
                  <Text style={styles.helplineLabel}>NBTS Colombo Headquarters</Text>
                  <Text style={styles.helplineNumber}>011 269 1111</Text>
                </View>
              </View>
            </View>

            {/* Sign Out */}
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                void handleSignOut();
              }}
              style={({ pressed }) => [styles.signOutBtn, pressed && styles.pressed]}
            >
              <Feather name="log-out" size={16} color={Blood.primary} />
              <Text style={styles.signOutText}>Sign Out of BloodLink</Text>
            </Pressable>

            <Text style={styles.versionText}>
              BloodLink v1.0.0 · Sri Lanka National Blood Transfusion Service
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </KeyboardDismissView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
    backgroundColor: Surface.card,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
  },
  headerTitle: {
    ...Typography.screenTitle,
    fontSize: 18,
    color: Surface.text,
  },
  headerRightPlaceholder: {
    width: 36,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Surface.card,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    padding: 16,
    gap: 14,
    ...Elevation.card,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: Radius.field,
    gap: 10,
  },
  feedbackSuccess: {
    backgroundColor: "#EAF8EF",
    borderColor: "#A3E6BA",
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: Surface.softRed,
    borderColor: "#FCA5A5",
    borderWidth: 1,
  },
  feedbackText: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  feedbackTextSuccess: {
    color: "#16834A",
  },
  feedbackTextError: {
    color: Blood.primary,
  },
  avatarSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarInfo: {
    flex: 1,
    gap: 6,
  },
  avatarName: {
    fontSize: 17,
    fontWeight: "700",
    color: Surface.text,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: Surface.softRed,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Blood.primary,
    letterSpacing: 0.5,
  },
  changePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: "600",
    color: Blood.primary,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Surface.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: Surface.text,
  },
  formGroup: {
    gap: 12,
  },
  buttonWrap: {
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    borderRadius: Radius.field,
  },
  metaLabel: {
    fontSize: 12,
    color: Surface.textMuted,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: "600",
    color: Surface.text,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  prefCopy: {
    flex: 1,
    paddingRight: 12,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Surface.text,
  },
  prefDesc: {
    fontSize: 12,
    color: Surface.textMuted,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Surface.border,
  },
  helplineDesc: {
    fontSize: 13,
    color: Surface.textSecondary,
    lineHeight: 18,
  },
  helplineList: {
    gap: 8,
  },
  helplineItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 10,
    borderRadius: Radius.field,
  },
  helplineLabel: {
    fontSize: 13,
    color: Surface.text,
    fontWeight: "500",
  },
  helplineNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: Blood.primary,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Surface.softRed,
    paddingVertical: 14,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "600",
    color: Blood.primary,
  },
  versionText: {
    textAlign: "center",
    fontSize: 11,
    color: Surface.textMuted,
    marginTop: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
