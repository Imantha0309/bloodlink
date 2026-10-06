import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { DashboardShell, type DashboardHelpers } from "@/components/dashboard/dashboard-shell";
import { DonorTabBar } from "@/components/dashboard/donor-tab-bar";
import { EmptyNote } from "@/components/dashboard/empty-note";
import { OptionChips } from "@/components/ui/option-chips";
import { SelectField } from "@/components/ui/select-field";
import { TextField } from "@/components/ui/text-field";
import { BLOOD_GROUPS, BLOOD_GROUP_NOTES, CAN_DONATE_TO, isBloodGroup } from "@/constants/blood-groups";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { DISTRICTS } from "@/constants/districts";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { ApiError, apiErrorMessage } from "@/services/auth";
import type { DashboardSummary } from "@/services/dashboard/dashboard";

export default function DonorProfileScreen() {
  return (
    <DashboardShell title="Donor Profile" bottomNavigation={<DonorTabBar active="profile" />}>
      {(summary, helpers) => <ProfileContent summary={summary} helpers={helpers} />}
    </DashboardShell>
  );
}

function getInitials(name?: string | null): string {
  if (!name) return "BD";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ProfileContent({
  summary,
  helpers,
}: {
  summary: DashboardSummary;
  helpers: DashboardHelpers;
}) {
  const router = useRouter();
  const { session, updateDonorProfile, signOut } = useAuth();
  const user = session?.user;

  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");
  const [district, setDistrict] = useState(user?.district ?? null);
  const [bloodGroup, setBloodGroup] = useState(isBloodGroup(user?.bloodGroup) ? user.bloodGroup : null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (user?.role !== "donor") {
    return (
      <EmptyNote
        title="Donor profile only"
        message="This profile page is reserved for verified donor accounts."
        icon="user"
      />
    );
  }

  const userBloodGroup = isBloodGroup(user.bloodGroup) ? user.bloodGroup : null;
  const currentBloodGroup = bloodGroup ?? userBloodGroup;
  const compatibleRecipients = currentBloodGroup ? CAN_DONATE_TO[currentBloodGroup] : null;
  const bloodGroupNote = currentBloodGroup ? BLOOD_GROUP_NOTES[currentBloodGroup] : null;
  const initials = getInitials(user.fullName);
  const isAvailable = summary.availability?.isAvailable ?? false;

  async function handleSave() {
    const nextErrors: Record<string, string> = {};
    if (fullName.trim().length < 2) nextErrors.fullName = "Please enter your full name.";
    if (!email.trim() && !mobile.trim()) nextErrors.mobile = "Provide an email address or mobile number.";
    if (district === null) nextErrors.district = "Select your district.";
    if (bloodGroup === null) nextErrors.bloodGroup = "Select your blood group.";

    setErrors(nextErrors);
    setFeedback(null);

    if (Object.keys(nextErrors).length > 0 || district === null || bloodGroup === null) {
      return;
    }

    setIsSaving(true);
    try {
      await updateDonorProfile({
        fullName: fullName.trim(),
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        district,
        bloodGroup,
      });
      helpers.reload();
      setFeedback({
        type: "success",
        message: "Your donor profile has been successfully updated.",
      });
      setErrors({});
    } catch (caught) {
      if (caught instanceof ApiError && caught.fields) {
        setErrors(caught.fields);
      }
      setFeedback({
        type: "error",
        message: apiErrorMessage(caught),
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmLogout() {
    setIsLoggingOut(true);
    try {
      await signOut();
      setShowLogoutModal(false);
      router.replace(ROUTES.login);
    } catch (caught) {
      setFeedback({
        type: "error",
        message: apiErrorMessage(caught),
      });
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  }

  return (
    <View style={styles.content}>
      {/* 1. Donor Profile Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={[styles.avatarStatusBadge, isAvailable ? styles.avatarOnline : styles.avatarPaused]}>
              <Feather name={isAvailable ? "radio" : "pause"} size={10} color="white" />
            </View>
          </View>

          <View style={styles.heroDetails}>
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedBadge}>
                <Feather name="shield" size={11} color={Surface.online} />
                <Text style={styles.verifiedText}>VERIFIED DONOR</Text>
              </View>
              {summary.availability ? (
                <View style={[styles.availBadge, isAvailable ? styles.availActive : styles.availInactive]}>
                  <Text style={[styles.availText, isAvailable ? styles.availTextActive : styles.availTextInactive]}>
                    {isAvailable ? "AVAILABLE" : "PAUSED"}
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.donorName} numberOfLines={1}>
              {user.fullName}
            </Text>

            <Text style={styles.donorMeta}>
              ID: #{user.id.slice(-6).toUpperCase()} · Sri Lanka Registry
            </Text>
          </View>
        </View>

        <View style={styles.heroPillRow}>
          <View style={styles.heroPill}>
            <Feather name="droplet" size={13} color={Blood.primary} />
            <Text style={styles.heroPillText}>
              Blood Group: <Text style={styles.heroPillHighlight}>{userBloodGroup ?? "Not Set"}</Text>
            </Text>
          </View>

          <View style={styles.heroPill}>
            <Feather name="map-pin" size={13} color={Surface.textSecondary} />
            <Text style={styles.heroPillText}>{user.district ?? "District Unset"}</Text>
          </View>
        </View>

        {(user.mobile || user.email) && (
          <View style={styles.contactRow}>
            {user.mobile ? (
              <View style={styles.contactItem}>
                <Feather name="phone" size={12} color={Surface.textMuted} />
                <Text style={styles.contactText}>{user.mobile}</Text>
              </View>
            ) : null}
            {user.email ? (
              <View style={styles.contactItem}>
                <Feather name="mail" size={12} color={Surface.textMuted} />
                <Text style={styles.contactText} numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* 2. Blood Impact & Compatibility Card */}
      <View style={styles.impactCard}>
        <View style={styles.impactHeader}>
          <View style={styles.impactIcon}>
            <Feather name="heart" size={16} color={Blood.primary} />
          </View>
          <View style={styles.impactTitleWrap}>
            <Text style={styles.impactTitle}>Blood Type Impact</Text>
            <Text style={styles.impactSubtitle}>
              {currentBloodGroup
                ? `Compatibility guide for ${currentBloodGroup} donors`
                : "Select your blood group to view matching recipients"}
            </Text>
          </View>
          {currentBloodGroup ? (
            <View style={styles.largeBloodBadge}>
              <Text style={styles.largeBloodText}>{currentBloodGroup}</Text>
            </View>
          ) : null}
        </View>

        {compatibleRecipients && compatibleRecipients.length > 0 ? (
          <View style={styles.compatibilityWrap}>
            <Text style={styles.compatibilityLabel}>You can give blood to:</Text>
            <View style={styles.compatibleChipsRow}>
              {compatibleRecipients.map((target) => (
                <View key={target} style={styles.compatibleChip}>
                  <Text style={styles.compatibleChipText}>{target}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {bloodGroupNote ? (
          <View style={styles.noteBox}>
            <Feather name="info" size={13} color={Blood.primary} />
            <Text style={styles.noteText}>{bloodGroupNote}</Text>
          </View>
        ) : null}
      </View>

      {/* 3. Edit Donor Information Form Card */}
      <View style={styles.formCard}>
        <View style={styles.formCardHeader}>
          <View style={styles.sectionIcon}>
            <Feather name="user-check" size={16} color={Surface.text} />
          </View>
          <View style={styles.formCardTitleWrap}>
            <Text style={styles.formCardTitle}>Personal Information</Text>
            <Text style={styles.formCardSubtitle}>
              Update your contact details and blood type for automated emergency dispatch.
            </Text>
          </View>
        </View>

        <View style={styles.formFields}>
          <TextField
            label="Full name"
            value={fullName}
            onChangeText={(val) => {
              setFullName(val);
              setFeedback(null);
            }}
            error={errors.fullName}
            autoComplete="name"
            icon="user"
            placeholder="E.g. Shanika Perera"
          />

          <TextField
            label="Mobile number"
            value={mobile}
            onChangeText={(val) => {
              setMobile(val);
              setFeedback(null);
            }}
            placeholder="07XXXXXXXX"
            keyboardType="phone-pad"
            autoCapitalize="none"
            error={errors.mobile}
            icon="phone"
            hint="Active Sri Lankan mobile for SMS and dispatch calls."
          />

          <TextField
            label="Email address"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setFeedback(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
            icon="mail"
          />

          <SelectField
            label="District"
            value={district}
            options={DISTRICTS}
            onChange={(val) => {
              setDistrict(val);
              setFeedback(null);
            }}
            placeholder="Select your residential district"
            error={errors.district}
          />

          <OptionChips
            label="Blood group"
            options={BLOOD_GROUPS}
            value={bloodGroup}
            onChange={(val) => {
              setBloodGroup(val);
              setFeedback(null);
            }}
            captionFor={(group) => BLOOD_GROUP_NOTES[group]}
            error={errors.bloodGroup}
          />

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
                color={feedback.type === "success" ? Surface.online : Surface.danger}
              />
              <Text
                style={[
                  styles.feedbackText,
                  feedback.type === "success" ? styles.feedbackTextSuccess : styles.feedbackTextError,
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <PrimaryAuthButton
            label="Save profile changes"
            onPress={() => void handleSave()}
            loading={isSaving}
            loadingLabel="Saving changes…"
            icon="check"
          />
        </View>
      </View>

      {/* 4. Account Settings & Logout Card */}
      <View style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <View style={styles.settingsIcon}>
            <Feather name="settings" size={16} color={Surface.text} />
          </View>
          <View style={styles.formCardTitleWrap}>
            <Text style={styles.formCardTitle}>Account & Session</Text>
            <Text style={styles.formCardSubtitle}>Manage your donor login session on this device.</Text>
          </View>
        </View>

        <View style={styles.settingsMeta}>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Account Type</Text>
            <Text style={styles.settingsValue}>Registered Blood Donor</Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Emergency Status</Text>
            <Text style={[styles.settingsValue, { color: isAvailable ? Surface.online : Surface.textMuted }]}>
              {isAvailable ? "Active in Dispatch" : "Paused"}
            </Text>
          </View>
          <View style={styles.settingsRow}>
            <Text style={styles.settingsLabel}>Member ID</Text>
            <Text style={styles.settingsValue}>#{user.id.slice(-8).toUpperCase()}</Text>
          </View>
        </View>

        {/* Prominent Logout Trigger Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out of BloodLink"
          onPress={() => setShowLogoutModal(true)}
          style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
        >
          <View style={styles.logoutIconBadge}>
            <Feather name="log-out" size={18} color={Surface.danger} />
          </View>
          <View style={styles.logoutCopy}>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutSubtitle}>Sign out of your donor account on this device</Text>
          </View>
          <Feather name="chevron-right" size={18} color={Surface.danger} />
        </Pressable>
      </View>

      {/* 5. Helpline and Support Footer */}
      <View style={styles.footer}>
        <View style={styles.footerHelpline}>
          <Feather name="phone-call" size={14} color={Blood.primary} />
          <Text style={styles.footerHelplineText}>
            Emergency Dispatch: <Text style={styles.footerHelplineBold}>1990 (Suwa Seriya)</Text> · NBTS Sri Lanka
          </Text>
        </View>
        <Text style={styles.footerCopy}>BloodLink Emergency Network · v1.0.0</Text>
      </View>

      {/* 6. Custom Confirmation Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isLoggingOut) setShowLogoutModal(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalIconWrap}>
              <Feather name="log-out" size={26} color={Surface.danger} />
            </View>

            <Text style={styles.modalTitle}>Log Out of BloodLink?</Text>
            <Text style={styles.modalBody}>
              Are you sure you want to sign out? You will stop receiving emergency donor dispatch alerts until you sign
              back in.
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                disabled={isLoggingOut}
                onPress={() => setShowLogoutModal(false)}
                style={({ pressed }) => [styles.modalCancelButton, pressed && styles.modalButtonPressed]}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                disabled={isLoggingOut}
                onPress={() => void handleConfirmLogout()}
                style={({ pressed }) => [
                  styles.modalConfirmButton,
                  pressed && styles.modalButtonPressed,
                  isLoggingOut && styles.modalButtonDisabled,
                ]}
              >
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="log-out" size={15} color="white" />
                    <Text style={styles.modalConfirmText}>Yes, Log Out</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
  },

  /* Hero Profile Card */
  heroCard: {
    padding: 16,
    gap: 14,
    borderRadius: Radius.card,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Surface.softRedBorder,
  },
  avatarInitials: {
    fontSize: 22,
    fontWeight: "800",
    color: Blood.primary,
  },
  avatarStatusBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Surface.card,
  },
  avatarOnline: {
    backgroundColor: Surface.online,
  },
  avatarPaused: {
    backgroundColor: Surface.textMuted,
  },
  heroDetails: {
    flex: 1,
    gap: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Surface.softGreen,
  },
  verifiedText: {
    ...Typography.micro,
    color: Surface.online,
    fontWeight: "800",
  },
  availBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  availActive: {
    backgroundColor: "#E6F4EA",
  },
  availInactive: {
    backgroundColor: Surface.iconWash,
  },
  availText: {
    fontSize: 9,
    fontWeight: "800",
  },
  availTextActive: {
    color: Surface.online,
  },
  availTextInactive: {
    color: Surface.textMuted,
  },
  donorName: {
    ...Typography.screenTitle,
    fontSize: 20,
    color: Surface.text,
  },
  donorMeta: {
    ...Typography.small,
    color: Surface.textMuted,
  },
  heroPillRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  heroPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: Surface.background,
    borderWidth: 1,
    borderColor: Surface.border,
  },
  heroPillText: {
    ...Typography.small,
    color: Surface.textSecondary,
    fontWeight: "600",
  },
  heroPillHighlight: {
    color: Blood.primary,
    fontWeight: "800",
  },
  contactRow: {
    flexDirection: "row",
    gap: 14,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
    flexWrap: "wrap",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  contactText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  /* Blood Impact Card */
  impactCard: {
    padding: 16,
    gap: 12,
    borderRadius: Radius.card,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },
  impactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  impactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },
  impactTitleWrap: {
    flex: 1,
    gap: 2,
  },
  impactTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },
  impactSubtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },
  largeBloodBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },
  largeBloodText: {
    fontSize: 16,
    fontWeight: "900",
    color: Blood.primary,
  },
  compatibilityWrap: {
    gap: 8,
    paddingTop: 4,
  },
  compatibilityLabel: {
    ...Typography.micro,
    color: Surface.textMuted,
    fontWeight: "700",
  },
  compatibleChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  compatibleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "#FDF2F4",
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },
  compatibleChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: Blood.primary,
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: Surface.softRed,
  },
  noteText: {
    flex: 1,
    ...Typography.small,
    color: Blood.dark,
    fontWeight: "600",
  },

  /* Form Card */
  formCard: {
    padding: 16,
    gap: 16,
    borderRadius: Radius.card,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Surface.iconWash,
    alignItems: "center",
    justifyContent: "center",
  },
  formCardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  formCardTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },
  formCardSubtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },
  formFields: {
    gap: 16,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: Radius.field,
  },
  feedbackSuccess: {
    backgroundColor: Surface.softGreen,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },
  feedbackError: {
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },
  feedbackText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "700",
  },
  feedbackTextSuccess: {
    color: Surface.online,
  },
  feedbackTextError: {
    color: Surface.danger,
  },

  /* Settings & Session Card */
  settingsCard: {
    padding: 16,
    gap: 16,
    borderRadius: Radius.card,
    backgroundColor: Surface.card,
    borderWidth: 1,
    borderColor: Surface.border,
    ...Elevation.card,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Surface.iconWash,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsMeta: {
    gap: 9,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.background,
    borderWidth: 1,
    borderColor: Surface.border,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingsLabel: {
    ...Typography.small,
    color: Surface.textMuted,
  },
  settingsValue: {
    ...Typography.small,
    color: Surface.text,
    fontWeight: "700",
  },

  /* Prominent Logout Button */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: Radius.field,
    backgroundColor: "#FFF5F5",
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },
  logoutButtonPressed: {
    backgroundColor: Surface.softRed,
    transform: [{ scale: 0.99 }],
  },
  logoutIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutCopy: {
    flex: 1,
    gap: 2,
  },
  logoutTitle: {
    ...Typography.label,
    color: Surface.danger,
    fontWeight: "800",
  },
  logoutSubtitle: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },

  /* Footer */
  footer: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  footerHelpline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerHelplineText: {
    ...Typography.micro,
    color: Surface.textSecondary,
  },
  footerHelplineBold: {
    color: Blood.primary,
    fontWeight: "800",
  },
  footerCopy: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  /* Modal Dialog */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 24, 38, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalDialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Surface.card,
    borderRadius: 22,
    padding: 22,
    alignItems: "center",
    gap: 14,
    ...Elevation.card,
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: {
    ...Typography.cardTitle,
    fontSize: 18,
    color: Surface.text,
    textAlign: "center",
  },
  modalBody: {
    ...Typography.small,
    color: Surface.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.background,
  },
  modalCancelText: {
    ...Typography.button,
    fontSize: 14,
    color: Surface.text,
  },
  modalConfirmButton: {
    flex: 1.2,
    height: 48,
    borderRadius: Radius.field,
    backgroundColor: Surface.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  modalConfirmText: {
    ...Typography.button,
    fontSize: 14,
    color: "white",
  },
  modalButtonPressed: {
    opacity: 0.8,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
});

