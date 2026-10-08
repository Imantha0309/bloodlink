import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandMark } from "@/components/dashboard/brand-mark";
import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { REQUEST_STATUS_META, URGENCY_OPTIONS } from "@/constants/emergency";
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
import { useAuth } from "@/providers/auth-provider";
import {
  listEmergencyRequests,
  type EmergencyRequest,
} from "@/services/requests/emergency-requests";
import { isRequestLive } from "@/utils/request-timeline";
import { referenceFor } from "@/utils/reference";
import { timeAgo } from "@/utils/time";

/**
 * Recipient Profile — compact healthcare profile dashboard.
 *
 * Screen-specific palette: the spec's exact values differ from `Surface`/`Blood`
 * by a unit or two (border, background), so the tokens this screen needs live
 * locally. Everything else follows the established dashboard recipe: header
 * with `insets.top`, ScrollView, `DashboardTabBar` pinned below the scroll.
 */

const C = {
  primary: "#C8102E",
  dark: "#B51224",
  bg: "#F6F8FC",
  card: "#FFFFFF",
  border: "#E5E9EE",
  text: "#17212B",
  sub: "#687586",
  muted: "#929AA6",
  paleRed: "#FFF0F1",
  paleBlue: "#EEF4FF",
  paleGreen: "#EAF8EF",
  green: "#16834A",
  blue: "#4D73B8",
  shadow: "#0F172A",
} as const;

const REQUEST_STATUS_ROUTE = ROUTES.requestStatus;

type InfoSheet = {
  title: string;
  lines: string[];
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();

  const [smsFallback, setSmsFallback] = useState(true);
  const [info, setInfo] = useState<InfoSheet | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [requests, setRequests] = useState<EmergencyRequest[] | null>(null);
  const [requestsFailed, setRequestsFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listEmergencyRequests()
      .then((data) => {
        if (!cancelled) {
          setRequests(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequestsFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const userName = session?.user.fullName ?? "Recipient";
  const mobile = session?.user.mobile ?? null;
  const district = session?.user.district ?? null;

  // Newest live request (the list is newest-first); history lives in Requests.
  const liveRequest = (requests ?? []).find((request) => isRequestLive(request.status)) ?? null;
  const history = (requests ?? []).filter((request) => !isRequestLive(request.status));
  const fulfilledCount = history.filter((request) => request.status === "fulfilled").length;
  const liveUrgency =
    liveRequest === null
      ? undefined
      : URGENCY_OPTIONS.find((option) => option.level === liveRequest.urgency);
  const liveStatus =
    liveRequest === null ? undefined : REQUEST_STATUS_META[liveRequest.status];
  const liveWard =
    liveRequest === null
      ? null
      : ((liveRequest.notes ?? "")
          .split("\n")
          .map((line) => line.trim())
          .find((line) => /^ward\b/i.test(line)) ?? null);

  function openInfo(title: string, lines: string[]) {
    setInfo({ title, lines });
  }

  function goTab(key: DashboardTabKey) {
    if (key === "profile") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  function confirmSignOut() {
    Alert.alert(
      "Sign out",
      "You will need to sign in again to access BloodLink.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: () => {
            void handleSignOut();
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace(ROUTES.login);
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerLeft}>
          <BrandMark size={20} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Security centre"
            hitSlop={6}
            onPress={() => {
              openInfo("Security Centre", [
                "Account security, device sessions and login alerts will appear here.",
              ]);
            }}
            style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
          >
            <Feather name="shield" size={14} color={C.sub} />
          </Pressable>

          <View style={styles.headerAvatar}>
            <Image
              source={require("../../../assets/images/donoravatars.png")}
              style={styles.headerAvatarImage}
              resizeMode="cover"
            />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------------------------------------------------- ① identity */}
        <View style={styles.card}>
          <View style={styles.identityRow}>
            <View style={styles.identityAvatar}>
              <Image
                source={require("../../../assets/images/donoravatars.png")}
                style={styles.identityAvatarImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.identityCopy}>
              <Text style={styles.identityName} numberOfLines={1}>
                {userName}
              </Text>

              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>Recipient / Family Caregiver</Text>
              </View>

              <View style={styles.inlineRow}>
                <Feather
                  name={mobile !== null ? "check-circle" : "smartphone"}
                  size={11}
                  color={mobile !== null ? C.green : C.muted}
                />
                <Text style={styles.phoneText}>{mobile ?? "No mobile on file"}</Text>
                {mobile !== null ? (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>On file</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.inlineRow}>
                <Feather name="map-pin" size={10} color={C.muted} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {district !== null ? `${district} District` : "District not set"}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              hitSlop={6}
              onPress={() => {
                openInfo("Edit Profile", [
                  "Update your photo, phone number, blood group and district.",
                  "Changes are reviewed before your Recipient badge is re-issued.",
                ]);
              }}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
            >
              <Feather name="edit-2" size={12} color={C.sub} />
            </Pressable>
          </View>
        </View>

        {/* -------------------------------------------- ② active request */}
        {liveRequest === null || liveStatus === undefined ? (
          <View style={[styles.card, styles.criticalCard]}>
            <View style={styles.criticalHeader}>
              <View style={styles.criticalHeaderLeft}>
                <View style={[styles.liveDot, { backgroundColor: C.muted }]} />
                <Text style={[styles.criticalCaseLabel, { color: C.muted }]}>
                  NO ACTIVE REQUEST
                </Text>
              </View>
            </View>

            <Text style={styles.emptyRequestNote}>
              {requestsFailed
                ? "Your requests could not be loaded right now."
                : requests === null
                  ? "Loading your requests…"
                  : "You have no open emergency request. Raise one and track it here."}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(ROUTES.emergencyRequest)}
              style={({ pressed }) => [styles.trackerButton, pressed && styles.trackerButtonPressed]}
            >
              <Text style={styles.trackerButtonText}>Raise an Emergency Request →</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open request status"
            onPress={() =>
              router.push({
                pathname: REQUEST_STATUS_ROUTE,
                params: { id: liveRequest.id },
              })
            }
            style={({ pressed }) => [styles.card, styles.criticalCard, pressed && styles.pressed]}
          >
            <View style={styles.criticalHeader}>
              <View style={styles.criticalHeaderLeft}>
                <View style={styles.liveDot} />
                <Text style={styles.criticalCaseLabel}>
                  {(liveUrgency?.label ?? "Active").toUpperCase()} REQUEST #
                  {referenceFor(liveRequest.id)}
                </Text>
              </View>

              {liveWard !== null ? (
                <View style={styles.wardBadge}>
                  <Text style={styles.wardBadgeText}>{liveWard}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.criticalMainRow}>
              <View style={styles.criticalMainCopy}>
                <Text style={styles.criticalUnits}>
                  {liveRequest.units} Unit{liveRequest.units === 1 ? "" : "s"}{" "}
                  {liveRequest.bloodGroup} Requested
                </Text>
                <Text style={styles.criticalHospital} numberOfLines={2}>
                  {liveRequest.hospital}
                </Text>
              </View>

              <View style={styles.bloodBadge}>
                <Text style={styles.bloodBadgeText}>{liveRequest.bloodGroup}</Text>
              </View>
            </View>

            <View
              style={[
                styles.transitBlock,
                { backgroundColor: liveStatus.background, borderColor: liveStatus.border },
              ]}
            >
              <View style={styles.transitCopy}>
                <View style={styles.inlineRow}>
                  <Feather name={liveStatus.icon} size={12} color={liveStatus.color} />
                  <Text style={[styles.transitTitle, { color: liveStatus.color }]}>
                    {liveStatus.label}
                  </Text>
                </View>
                <Text style={styles.transitEta}>
                  Raised {timeAgo(liveRequest.createdAt)} · updated{" "}
                  {timeAgo(liveRequest.updatedAt)}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: REQUEST_STATUS_ROUTE,
                  params: { id: liveRequest.id },
                })
              }
              style={({ pressed }) => [styles.trackerButton, pressed && styles.trackerButtonPressed]}
            >
              <Text style={styles.trackerButtonText}>Track Request →</Text>
            </Pressable>
          </Pressable>
        )}

        {/* ------------------------------------------ ③ family registry */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Feather name="users" size={13} color={C.primary} />
              <Text style={styles.sectionTitle}>Family Blood Registry</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              hitSlop={6}
              onPress={() => {
                openInfo("Add Family Member", [
                  "Register a relative with their blood group to keep the family pool ready for a match.",
                  "Verified members can be matched to open requests in seconds.",
                ]);
              }}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.addMemberText}>Add Member +</Text>
            </Pressable>
          </View>

          <View style={styles.familyList}>
            <View style={styles.familyRow}>
              <View style={styles.familyAvatar}>
                <Feather name="user-plus" size={12} color={C.sub} />
              </View>

              <View style={styles.familyCopy}>
                <Text style={styles.familyName}>No relatives registered yet</Text>
                <Text style={styles.familyRelation} numberOfLines={2}>
                  Add family members so the pool is ready when a match opens.
                </Text>
              </View>
            </View>
          </View>

          {/* Live requisition token — nested inside the registry card. */}
          {liveRequest === null ? null : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open active request"
              onPress={() =>
                router.push({
                  pathname: REQUEST_STATUS_ROUTE,
                  params: { id: liveRequest.id },
                })
              }
              style={({ pressed }) => [styles.fastPass, pressed && styles.pressed]}
            >
              <View style={styles.fastPassRow}>
                <Text style={styles.fastPassLabel}>Active Requisition Token</Text>
                <Text style={styles.fastPassToken}>#REQ-{referenceFor(liveRequest.id)}</Text>
              </View>

              <View style={styles.fastPassRow}>
                <Text style={styles.fastPassCoordinator} numberOfLines={1}>
                  {liveRequest.hospital}
                </Text>
                <View style={styles.fastPassContact}>
                  <Feather name="navigation" size={9} color={C.blue} />
                  <Text style={styles.fastPassContactText} numberOfLines={1}>
                    {liveStatus?.label ?? "Open"}
                  </Text>
                </View>
              </View>
            </Pressable>
          )}
        </View>

        {/* ---------------------------------------- ④ records & hotlines */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Records & Hotlines</Text>
            <Text style={styles.sectionMeta}>{`${history.length} Lifetime`}</Text>
          </View>

          <RecordRow
            tone="green"
            icon="check-circle"
            title={
              history.length === 0
                ? "No Past Emergency Broadcasts"
                : `${history.length} Past Emergency Broadcast${history.length === 1 ? "" : "s"}`
            }
            subtitle={
              history.length === 0
                ? "Raise a request to start your record"
                : `${fulfilledCount} of ${history.length} fulfilled`
            }
            onPress={() => router.push(DASHBOARD_TABS.alerts)}
          />
          <RecordRow
            tone="blue"
            icon="file-text"
            title="Clearance & Cross-match Slips"
            subtitle="No laboratory records on file"
            separator
            onPress={() => {
              openInfo("Clearance & Cross-match Slips", [
                "No laboratory records on file.",
                "Laboratory integration ships in a later release.",
              ]);
            }}
          />
          <RecordRow
            tone="red"
            icon="droplet"
            title="Saved Blood Banks & Hotlines"
            subtitle="Facility directory & district numbers"
            separator
            onPress={() => router.push(ROUTES.bloodBankDetail)}
          />
        </View>

        {/* ------------------------------------- ⑤ safety & assistance */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Safety & Assistance</Text>
          </View>

          <View style={styles.safetyRow}>
            <View style={[styles.safetyIcon, styles.safetyIconRed]}>
              <Feather name="alert-triangle" size={13} color={C.primary} />
            </View>

            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>Emergency SMS Fallback</Text>
              <Text style={styles.safetySubtitle} numberOfLines={2}>
                Alert dispatchers when data network drops
              </Text>
            </View>

            <Switch
              value={smsFallback}
              onValueChange={setSmsFallback}
              accessibilityLabel="Emergency SMS Fallback"
              trackColor={{ false: "#D0D5DD", true: "#ABEFC6" }}
              thumbColor={smsFallback ? "#12B76A" : "#FFFFFF"}
              ios_backgroundColor="#D0D5DD"
              style={styles.switch}
            />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => {
              openInfo("Verified Medical Identity", [
                "National Identity Card (NIC) verification is not enabled yet.",
                "The profile shown here is what dispatchers will see.",
              ]);
            }}
            style={({ pressed }) => [styles.safetyRow, styles.safetyRowBorder, pressed && styles.pressed]}
          >
            <View style={[styles.safetyIcon, styles.safetyIconBlue]}>
              <Feather name="shield" size={13} color={C.blue} />
            </View>

            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>Verified Medical Identity</Text>
              <Text style={styles.safetySubtitle} numberOfLines={2}>
                NIC verification ships in a later release
              </Text>
            </View>

            <Feather name="chevron-right" size={14} color={C.muted} />
          </Pressable>

          <View style={[styles.safetyRow, styles.safetyRowBorder]}>
            <View style={[styles.safetyIcon, styles.safetyIconRed]}>
              <Feather name="droplet" size={13} color={C.primary} />
            </View>

            <View style={styles.safetyCopy}>
              <Text style={styles.safetyTitle}>Blood Bank Liaison</Text>
              <Text style={styles.safetySubtitle} numberOfLines={2}>
                {district !== null ? `${district} District Blood Bank Desk` : "District blood bank desk"}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open facility directory"
              onPress={() => {
                router.push(ROUTES.bloodBankDetail);
              }}
              style={({ pressed }) => [styles.directLine, pressed && styles.pressed]}
            >
              <Feather name="phone" size={9} color={C.blue} />
              <Text style={styles.directLineText}>Directory</Text>
            </Pressable>
          </View>
        </View>

        {/* --------------------------------------------------- ⑥ sign out */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          disabled={isSigningOut}
          onPress={confirmSignOut}
          style={({ pressed }) => [
            styles.signOut,
            pressed && styles.pressed,
            isSigningOut && styles.signOutDisabled,
          ]}
        >
          <Text style={styles.signOutText}>
            {isSigningOut ? "Signing out…" : "♙ Sign out"}
          </Text>
        </Pressable>
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="profile"
        onSelect={goTab}
      />

      {/* Shared info sheet for destinations without a dedicated screen. */}
      <Modal
        visible={info !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfo(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setInfo(null)}>
          <Pressable style={styles.modalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {info?.title ?? ""}
              </Text>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={6}
                onPress={() => setInfo(null)}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              >
                <Feather name="x" size={14} color={C.sub} />
              </Pressable>
            </View>

            {(info?.lines ?? []).map((line, index) => (
              <Text key={`${index}-${line}`} style={styles.modalLine}>
                {line}
              </Text>
            ))}

            <Pressable
              accessibilityRole="button"
              onPress={() => setInfo(null)}
              style={({ pressed }) => [styles.modalButton, pressed && styles.pressed]}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

type RecordRowProps = {
  tone: "green" | "blue" | "red";
  icon: "check-circle" | "file-text" | "droplet";
  title: string;
  subtitle: string;
  separator?: boolean;
  onPress: () => void;
};

function RecordRow({ tone, icon, title, subtitle, separator, onPress }: RecordRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.recordRow,
        separator && styles.recordRowBorder,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.recordIcon, styles[`recordIcon_${tone}`]]}>
        <Feather
          name={icon}
          size={13}
          color={tone === "green" ? C.green : tone === "blue" ? C.blue : C.primary}
        />
      </View>

      <View style={styles.recordCopy}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text style={styles.recordSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <Feather name="chevron-right" size={14} color={C.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },

  pressed: {
    opacity: 0.7,
  },

  /* ------------------------------------------------------------ header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 7,
    backgroundColor: C.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.border,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F9",
  },

  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#F1F3F9",
    borderWidth: 1,
    borderColor: C.border,
  },

  headerAvatarImage: {
    width: "100%",
    height: "100%",
  },

  /* ------------------------------------------------------------- scroll */
  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    padding: 11,
    marginBottom: 10,
    shadowColor: C.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 0,
  },

  /* ----------------------------------------------------------- identity */
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  identityAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#F1F3F9",
    borderWidth: 1,
    borderColor: C.border,
  },

  identityAvatarImage: {
    width: "100%",
    height: "100%",
  },

  identityCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },

  identityName: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
  },

  rolePill: {
    alignSelf: "flex-start",
    backgroundColor: C.paleBlue,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },

  rolePillText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: C.blue,
  },

  phoneText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "600",
    color: C.text,
  },

  verifiedBadge: {
    backgroundColor: C.paleGreen,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginLeft: 2,
  },

  verifiedBadgeText: {
    fontSize: 7,
    lineHeight: 9,
    fontWeight: "700",
    color: C.green,
  },

  locationText: {
    fontSize: 8.5,
    lineHeight: 11,
    color: C.sub,
    flexShrink: 1,
  },

  editButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F9",
    borderWidth: 1,
    borderColor: C.border,
  },

  /* -------------------------------------------------- critical request */
  criticalCard: {
    borderColor: "#F6D2D7",
    shadowOpacity: 0.05,
  },

  criticalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 7,
  },

  criticalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.primary,
  },

  criticalCaseLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: C.primary,
    flexShrink: 1,
  },

  wardBadge: {
    backgroundColor: C.paleRed,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F6D2D7",
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  wardBadgeText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "700",
    color: C.dark,
  },

  criticalMainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  criticalMainCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },

  criticalUnits: {
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: C.text,
  },

  criticalHospital: {
    fontSize: 9,
    lineHeight: 12,
    color: C.sub,
  },

  bloodBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
  },

  bloodBadgeText: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  transitBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    backgroundColor: C.paleGreen,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C9EEDB",
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 8,
  },

  transitCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },

  transitTitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.green,
  },

  transitEta: {
    fontSize: 8.5,
    lineHeight: 11,
    color: "#3D8F63",
  },

  emptyRequestNote: {
    fontSize: 9.5,
    lineHeight: 14,
    color: C.sub,
  },

  trackerButton: {
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    marginTop: 9,
  },

  trackerButtonPressed: {
    backgroundColor: C.dark,
    opacity: 1,
  },

  trackerButtonText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "#FFFFFF",
  },

  /* -------------------------------------------------- family registry */
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },

  sectionTitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: C.text,
    flexShrink: 1,
  },

  sectionMeta: {
    fontSize: 8.5,
    lineHeight: 11,
    color: C.muted,
  },

  addMemberText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: C.primary,
  },

  familyList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },

  familyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
  },

  familyRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },

  familyAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F9",
  },

  familyCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },

  familyName: {
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: "600",
    color: C.text,
  },

  familyRelation: {
    fontSize: 8.5,
    lineHeight: 11,
    color: C.muted,
  },

  bloodPill: {
    minWidth: 30,
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },

  bloodPill_red: {
    backgroundColor: C.paleRed,
    borderColor: "#F6D2D7",
  },

  bloodPill_green: {
    backgroundColor: C.paleGreen,
    borderColor: "#C9EEDB",
  },

  bloodPill_blue: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  bloodPillText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
  },

  bloodPillText_red: {
    color: C.primary,
  },

  bloodPillText_green: {
    color: C.green,
  },

  bloodPillText_blue: {
    color: C.blue,
  },

  fastPass: {
    backgroundColor: C.paleBlue,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 8,
    gap: 3,
  },

  fastPassRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  fastPassLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: C.text,
    flexShrink: 1,
  },

  fastPassToken: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: C.primary,
  },

  fastPassCoordinator: {
    fontSize: 8.5,
    lineHeight: 11,
    color: C.sub,
    flexShrink: 1,
  },

  fastPassContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  fastPassContactText: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "600",
    color: C.blue,
  },

  /* --------------------------------------------------- records & lines */
  recordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
  },

  recordRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },

  recordIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  recordIcon_green: {
    backgroundColor: C.paleGreen,
  },

  recordIcon_blue: {
    backgroundColor: C.paleBlue,
  },

  recordIcon_red: {
    backgroundColor: C.paleRed,
  },

  recordCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },

  recordTitle: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "600",
    color: C.text,
  },

  recordSubtitle: {
    fontSize: 8,
    lineHeight: 11,
    color: C.muted,
  },

  /* -------------------------------------------------------- safety */
  safetyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 7,
  },

  safetyRowBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
  },

  safetyIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  safetyIconRed: {
    backgroundColor: C.paleRed,
  },

  safetyIconBlue: {
    backgroundColor: C.paleBlue,
  },

  safetyCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },

  safetyTitle: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "600",
    color: C.text,
  },

  safetySubtitle: {
    fontSize: 8,
    lineHeight: 11,
    color: C.muted,
  },

  switch: {
    transform: [{ scaleX: 0.72 }, { scaleY: 0.72 }],
  },

  directLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: C.paleBlue,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  directLineText: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "600",
    color: C.blue,
  },

  /* --------------------------------------------------------- sign out */
  signOut: {
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.paleBlue,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    marginTop: 2,
  },

  signOutDisabled: {
    opacity: 0.6,
  },

  signOutText: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "600",
    letterSpacing: 0.1,
    color: C.text,
  },

  /* ------------------------------------------------------------ modal */
  modalBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    paddingHorizontal: 32,
  },

  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
    gap: 7,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  modalTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
    color: C.text,
    flexShrink: 1,
  },

  modalClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F3F9",
  },

  modalLine: {
    fontSize: 10,
    lineHeight: 15,
    color: C.sub,
  },

  modalButton: {
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.paleBlue,
    marginTop: 3,
  },

  modalButtonText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    color: C.text,
  },
});
