import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { EmptyNote } from "@/components/dashboard/empty-note";
import { StepHeader } from "@/components/emergency/step-header";
import {
  BLOOD_GROUPS,
  CAN_DONATE_TO,
  type BloodGroup,
  isBloodGroup,
} from "@/constants/blood-groups";
import { DASHBOARD_TABS, ROUTES } from "@/constants/routes";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";

/**
 * Compatibility Chart — who can donate to the user, and who the user can
 * donate to, for red blood cell transfusion.
 *
 * Follows the same recipe as Request Status / Profile: `StepHeader` on top
 * (back + brand + trailing controls), one ScrollView holding every section,
 * `DashboardTabBar` pinned below. The top cards always describe the signed-in
 * user's own group (or honestly say it is missing); the selector further down
 * drives the "Compatibility for X" result so one tap answers "what about
 * another group?".
 */

const C = {
  primary: "#C8102E",
  dark: "#B51224",
  bg: "#F6F8FC",
  card: "#FFFFFF",
  border: "#E4E8ED",
  text: "#17212B",
  sub: "#687586",
  muted: "#929AA6",
  paleRed: "#FFF0F1",
  paleBlue: "#EEF4FF",
  paleGreen: "#EAF8EF",
  green: "#16834A",
  blue: "#4C73B8",
  wash: "#F1F3F9",
  shadow: "#0F172A",
} as const;

/** Every donor whose red cells the given group can receive. */
function receiveFrom(group: BloodGroup): BloodGroup[] {
  return BLOOD_GROUPS.filter((donor) => CAN_DONATE_TO[donor].includes(group));
}

function bloodTypeLabel(group: BloodGroup): string {
  return group.endsWith("+") ? "Positive Blood Type" : "Negative Blood Type";
}

type InfoSheet = {
  title: string;
  lines: string[];
};

export default function CompatibilityScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const onBack = useAuthBack(DASHBOARD_TABS.home);

  const rawProfileGroup = session?.user.bloodGroup;
  const profileGroup: BloodGroup | null = isBloodGroup(rawProfileGroup) ? rawProfileGroup : null;

  // The selector starts on the signed-in group when one is on file, otherwise
  // on the first group in the reference order — it is a lookup tool either way.
  const [selected, setSelected] = useState<BloodGroup>(profileGroup ?? BLOOD_GROUPS[0]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    [profileGroup ?? BLOOD_GROUPS[0]]: true,
  });
  const [info, setInfo] = useState<InfoSheet | null>(null);

  const profileReceive = profileGroup === null ? [] : receiveFrom(profileGroup);
  const profileDonate = profileGroup === null ? [] : CAN_DONATE_TO[profileGroup];
  const selectedReceive = receiveFrom(selected);
  const selectedDonate = CAN_DONATE_TO[selected];

  function goTab(key: DashboardTabKey) {
    if (key === "home") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  function toggleGroup(group: BloodGroup) {
    setExpanded((previous) => ({ ...previous, [group]: previous[group] !== true }));
  }

  return (
    <View style={styles.screen}>
      <StepHeader
        title="Compatibility Chart"
        onBack={onBack}
        right={
          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={6}
              onPress={() => {
                setInfo({
                  title: "Notifications",
                  lines: [
                    "Blood bank updates and donor responses for your requests appear here.",
                    "Compatibility guidance is educational — confirm with the hospital blood bank.",
                  ],
                });
              }}
              style={({ pressed }) => [styles.headerIconButton, pressed && styles.pressed]}
            >
              <Feather name="bell" size={14} color={C.sub} />
            </Pressable>

            <View style={styles.headerAvatar}>
              <Image
                source={require("../../assets/images/donoravatars.png")}
                style={styles.headerAvatarImage}
                resizeMode="cover"
              />
            </View>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        {/* ------------------------------------------ page introduction */}
        <Text style={styles.introTitle}>Compatibility Chart</Text>
        <Text style={styles.introDescription}>
          Who can donate to you, and who you can donate to, laid out group by group.
        </Text>

        {/* ----------------------------------------- your blood group */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Blood Group</Text>

          <View style={styles.groupHero}>
            <View style={styles.groupHeroBadge}>
              <Text style={styles.groupHeroBadgeText}>{profileGroup ?? "?"}</Text>
            </View>
            <Text style={styles.groupHeroType}>
              {profileGroup !== null ? bloodTypeLabel(profileGroup) : "No blood group on file"}
            </Text>
            <Text style={styles.groupHeroHelper}>
              {profileGroup !== null
                ? "Compatible donation information"
                : "Add it from your profile to see your matches"}
            </Text>
          </View>

          {profileGroup === null ? null : (
            <View style={styles.quickAnswers}>
              <View style={styles.quickAnswerRow}>
                <Feather name="arrow-left" size={10} color={C.green} />
                <Text style={styles.quickAnswerLabel}>Receive from:</Text>
                <Text style={styles.quickAnswerGroups} numberOfLines={1}>
                  {profileReceive.join(", ")}
                </Text>
              </View>

              <View style={styles.quickAnswerRow}>
                <Feather name="arrow-right" size={10} color={C.primary} />
                <Text style={styles.quickAnswerLabel}>Donate to:</Text>
                <Text style={styles.quickAnswerGroups} numberOfLines={1}>
                  {profileDonate.join(", ")}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ------------------------------------------------ receive from */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Who Can Donate To You?</Text>
          {profileGroup === null ? (
            <EmptyNote
              title="Blood group not set"
              message="Add your blood group from your profile and compatible donors will appear here."
            />
          ) : (
            <>
              <Text style={styles.sectionSub}>
                As a {profileGroup} recipient, you can receive from:
              </Text>

              <View style={styles.chipGrid}>
                {profileReceive.map((group) => (
                  <CompatibilityChip key={group} group={group} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* -------------------------------------------------- donate to */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Who Can Receive From You?</Text>
          {profileGroup === null ? (
            <EmptyNote
              title="Blood group not set"
              message="Add your blood group from your profile to see who you can donate to."
            />
          ) : (
            <>
              <Text style={styles.sectionSub}>
                As a {profileGroup} donor, you can donate to:
              </Text>

              <View style={styles.chipGrid}>
                {profileDonate.map((group) => (
                  <CompatibilityChip key={group} group={group} />
                ))}
              </View>
            </>
          )}
        </View>

        {/* --------------------------------------- compatibility summary */}
        {profileGroup === null ? null : (
          <View style={[styles.card, styles.summaryCard]}>
            <Text style={styles.sectionTitle}>{profileGroup} Compatibility</Text>

            <View style={styles.summaryBlock}>
              <View style={styles.summaryLabelRow}>
                <Feather name="arrow-left" size={11} color={C.blue} />
                <Text style={styles.summaryLabelText}>RECEIVE FROM</Text>
              </View>

              <View style={styles.pillRow}>
                {profileReceive.map((group) => (
                  <View key={group} style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{group}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.summaryBlock, styles.summaryBlockSpaced]}>
              <View style={styles.summaryLabelRow}>
                <Feather name="arrow-right" size={11} color={C.blue} />
                <Text style={styles.summaryLabelText}>DONATE TO</Text>
              </View>

              <View style={styles.pillRow}>
                {profileDonate.map((group) => (
                  <View key={group} style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{group}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
        {/* ------------------------------------------ group selector */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Check Another Blood Group</Text>

          <View style={styles.selectorGrid}>
            {BLOOD_GROUPS.map((group) => {
              const isSelected = group === selected;

              return (
                <Pressable
                  key={group}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Check compatibility for ${group}`}
                  onPress={() => setSelected(group)}
                  style={({ pressed }) => [
                    styles.selectorButton,
                    isSelected && styles.selectorButtonSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectorButtonText,
                      isSelected && styles.selectorButtonTextSelected,
                    ]}
                  >
                    {group}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ----------------------------------------- selected result */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Compatibility for {selected}</Text>
          {selected !== profileGroup ? (
            <Text style={styles.resultHint}>
              {profileGroup !== null
                ? `Your profile group is ${profileGroup}.`
                : "No blood group on file yet — add one from your profile."}
            </Text>
          ) : null}

          <View style={styles.resultBlock}>
            <View style={styles.resultLabelRow}>
              <View style={styles.summaryLabelRow}>
                <Feather name="arrow-left" size={11} color={C.green} />
                <Text style={styles.resultLabel}>Can receive from</Text>
              </View>
              <View style={styles.compatibleTag}>
                <Feather name="check" size={9} color={C.green} />
                <Text style={styles.compatibleTagText}>Compatible</Text>
              </View>
            </View>

            <View style={styles.pillRow}>
              {selectedReceive.map((group) => (
                <View key={group} style={styles.resultPill}>
                  <Feather name="check-circle" size={10} color={C.green} />
                  <Text style={styles.resultPillText}>{group}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.resultBlock, styles.resultBlockSpaced]}>
            <View style={styles.resultLabelRow}>
              <View style={styles.summaryLabelRow}>
                <Feather name="arrow-right" size={11} color={C.primary} />
                <Text style={styles.resultLabel}>Can donate to</Text>
              </View>
              <View style={styles.compatibleTag}>
                <Feather name="check" size={9} color={C.green} />
                <Text style={styles.compatibleTagText}>Compatible</Text>
              </View>
            </View>

            <View style={styles.pillRow}>
              {selectedDonate.map((group) => (
                <View key={group} style={styles.resultPill}>
                  <Feather name="check-circle" size={10} color={C.green} />
                  <Text style={styles.resultPillText}>{group}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* -------------------------------------- full reference list */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>All Blood Group Compatibility</Text>

          {BLOOD_GROUPS.map((group) => {
            const isOpen = expanded[group] === true;

            return (
              <View key={group} style={styles.refItem}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: isOpen }}
                  accessibilityLabel={`${group} compatibility, ${isOpen ? "expanded" : "collapsed"}`}
                  onPress={() => toggleGroup(group)}
                  style={({ pressed }) => [styles.refHeader, pressed && styles.pressed]}
                >
                  <View style={[styles.refBadge, isOpen && styles.refBadgeOpen]}>
                    <Feather name="droplet" size={11} color={isOpen ? "#FFFFFF" : C.primary} />
                  </View>

                  <Text style={styles.refTitle}>{group}</Text>

                  <Feather
                    name="chevron-down"
                    size={14}
                    color={C.muted}
                    style={isOpen ? styles.refChevronOpen : undefined}
                  />
                </Pressable>

                {isOpen ? (
                  <View style={styles.refBody}>
                    <View style={styles.refRow}>
                      <Feather name="arrow-left" size={10} color={C.sub} />
                      <Text style={styles.refRowLabel}>Receive:</Text>
                      <View style={styles.pillRow}>
                        {receiveFrom(group).map((donor) => (
                          <View key={donor} style={styles.refPill}>
                            <Text style={styles.refPillText}>{donor}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    <View style={styles.refRow}>
                      <Feather name="arrow-right" size={10} color={C.sub} />
                      <Text style={styles.refRowLabel}>Donate:</Text>
                      <View style={styles.pillRow}>
                        {CAN_DONATE_TO[group].map((target) => (
                          <View key={target} style={styles.refPill}>
                            <Text style={styles.refPillText}>{target}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* ---------------------------------------------- info card */}
        <View style={[styles.card, styles.infoCard]}>
          <View style={styles.infoHeader}>
            <View style={styles.infoIcon}>
              <Feather name="info" size={13} color={C.blue} />
            </View>
            <Text style={styles.sectionTitle}>About Blood Compatibility</Text>
          </View>

          <Text style={styles.infoText}>
            Blood compatibility depends on the blood group and type of donation. Always follow
            medical guidance and hospital blood-bank procedures.
          </Text>
          <Text style={styles.infoFootnote}>
            General red blood cell reference for education — not a medical diagnosis.
          </Text>
        </View>

        {/* ------------------------------------------------ actions */}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            router.push({ pathname: ROUTES.donors, params: { bloodGroup: selected } });
          }}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.primaryActionPressed]}
        >
          <Text style={styles.primaryActionText}>Find Compatible Donors →</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.emergencyRequest)}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.pressed]}
        >
          <Feather name="droplet" size={11} color={C.blue} />
          <Text style={styles.secondaryActionText}>Request Blood</Text>
        </Pressable>

        <Text style={styles.footnote}>
          Compatibility shown is for red blood cell transfusion and follows standard ABO/Rh
          rules.
        </Text>
      </ScrollView>

      <DashboardTabBar
        tabs={[
          { key: "home", label: "Home", icon: "home" },
          { key: "requests", label: "Requests", icon: "file-text" },
          { key: "alerts", label: "Alerts", icon: "bell" },
          { key: "profile", label: "Profile", icon: "user" },
        ]}
        activeKey="home"
        onSelect={goTab}
      />

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

/**
 * Compact green compatibility card: droplet badge, group name,
 * "Compatible" label and a check indicator.
 */
function CompatibilityChip({ group }: { group: BloodGroup }) {
  return (
    <View style={styles.chip}>
      <View style={styles.chipBadge}>
        <Feather name="droplet" size={12} color={C.green} />
      </View>

      <View style={styles.chipCopy}>
        <Text style={styles.chipName}>{group}</Text>
        <Text style={styles.chipLabel}>Compatible</Text>
      </View>

      <Feather name="check-circle" size={13} color={C.green} />
    </View>
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
    backgroundColor: C.wash,
  },

  headerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: C.wash,
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
    paddingBottom: 18,
  },

  introTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: C.text,
    marginBottom: 3,
  },

  introDescription: {
    fontSize: 10,
    lineHeight: 14,
    color: C.sub,
    marginBottom: 10,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.border,
    padding: 11,
    marginBottom: 9,
    shadowColor: C.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  sectionTitle: {
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: -0.1,
    color: C.text,
    flexShrink: 1,
  },

  sectionSub: {
    fontSize: 9,
    lineHeight: 12,
    color: C.sub,
    marginTop: 2,
    marginBottom: 8,
  },

  /* ------------------------------------------- your blood group */
  groupHero: {
    alignItems: "center",
    paddingVertical: 8,
    gap: 3,
  },

  groupHeroBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  groupHeroBadgeText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
    color: "#FFFFFF",
  },

  groupHeroType: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: C.text,
    marginTop: 3,
  },

  groupHeroHelper: {
    fontSize: 8.5,
    lineHeight: 12,
    color: C.muted,
  },

  quickAnswers: {
    gap: 5,
    backgroundColor: C.wash,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    marginTop: 4,
  },

  quickAnswerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  quickAnswerLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: C.text,
  },

  quickAnswerGroups: {
    fontSize: 9,
    lineHeight: 12,
    color: C.sub,
    flex: 1,
    textAlign: "right",
  },

  /* --------------------------------------------------- compatibility chips */
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    flexBasis: "46%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: "#C9EEDB",
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 44,
  },

  chipBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  chipCopy: {
    flex: 1,
    gap: 1,
    minWidth: 0,
  },

  chipName: {
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: "700",
    color: C.text,
  },

  chipLabel: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "600",
    color: C.green,
  },

  /* --------------------------------------------------------- summary */
  summaryCard: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  summaryBlock: {
    marginTop: 8,
  },

  summaryBlockSpaced: {
    marginTop: 10,
  },

  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },

  summaryLabelText: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: C.blue,
  },

  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  summaryPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E3FF",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },

  summaryPillText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.text,
  },

  /* -------------------------------------------------------- selector */
  selectorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },

  selectorButton: {
    flexBasis: "22%",
    flexGrow: 1,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },

  selectorButtonSelected: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.26,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },

  selectorButtonText: {
    fontSize: 11.5,
    lineHeight: 14,
    fontWeight: "700",
    color: C.text,
  },

  selectorButtonTextSelected: {
    color: "#FFFFFF",
  },

  /* ---------------------------------------------------- result block */
  resultHint: {
    fontSize: 8.5,
    lineHeight: 11,
    color: C.muted,
    marginTop: 2,
    marginBottom: 6,
  },

  resultBlock: {
    marginTop: 6,
  },

  resultBlockSpaced: {
    marginTop: 10,
  },

  resultLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 5,
  },

  resultLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.text,
  },

  compatibleTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  compatibleTagText: {
    fontSize: 7.5,
    lineHeight: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: C.green,
  },

  resultPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.paleGreen,
    borderWidth: 1,
    borderColor: "#C9EEDB",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  resultPillText: {
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: "700",
    color: C.text,
  },

  /* ------------------------------------------------ reference list */
  refItem: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.border,
    marginTop: 7,
    paddingTop: 2,
  },

  refHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },

  refBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.paleRed,
  },

  refBadgeOpen: {
    backgroundColor: C.primary,
  },

  refTitle: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: C.text,
  },

  refChevronOpen: {
    transform: [{ rotate: "180deg" }],
  },

  refBody: {
    gap: 6,
    backgroundColor: C.wash,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 8,
    marginBottom: 6,
  },

  refRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 5,
  },

  refRowLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    color: C.sub,
  },

  refPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },

  refPillText: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "700",
    color: C.text,
  },

  /* ------------------------------------------------------ info card */
  infoCard: {
    backgroundColor: C.paleBlue,
    borderColor: "#D6E3FF",
  },

  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 6,
  },

  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  infoText: {
    fontSize: 9,
    lineHeight: 13,
    color: C.sub,
  },

  infoFootnote: {
    fontSize: 7.5,
    lineHeight: 11,
    color: C.muted,
    marginTop: 4,
  },

  /* -------------------------------------------------------- actions */
  primaryAction: {
    height: 40,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.primary,
    marginTop: 3,
    marginBottom: 8,
  },

  primaryActionPressed: {
    backgroundColor: C.dark,
    opacity: 1,
  },

  primaryActionText: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "#FFFFFF",
  },

  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 36,
    borderRadius: 9,
    backgroundColor: C.paleBlue,
    borderWidth: 1,
    borderColor: "#D6E3FF",
    marginBottom: 10,
  },

  secondaryActionText: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    color: C.blue,
  },

  footnote: {
    fontSize: 7.5,
    lineHeight: 11,
    color: C.muted,
    textAlign: "center",
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
    backgroundColor: C.wash,
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
