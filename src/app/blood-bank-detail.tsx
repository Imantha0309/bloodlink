import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DashboardTabBar, type DashboardTabKey } from "@/components/dashboard/dashboard-tab-bar";
import { StepHeader } from "@/components/emergency/step-header";
import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { BLOOD_GROUPS, type BloodGroup } from "@/constants/blood-groups";
import { Blood, Surface } from "@/constants/colors";
import { ControlHeight, Radius } from "@/constants/radius";
import { DASHBOARD_TABS, ROLE_HOME } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import { getBloodBank, listBloodBanks, type BloodBank, type BloodBankDetail } from "@/services/blood-banks";

/**
 * Blood Bank Detail — facility + live stock.
 *
 * Opened with `?id=` from the recipient directory; when no id arrives (the
 * profile links do not carry one) the screen falls back to the facility
 * directory so a bank can be picked first. Everything shown — contact details,
 * verification state, unit counts — is served by the API.
 */

export default function BloodBankDetailScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const onBack = useAuthBack(ROLE_HOME[session?.user.role ?? "recipient"]);
  const { id: idParam } = useLocalSearchParams<{ id?: string }>();

  const bankId = typeof idParam === "string" && idParam !== "" ? idParam : null;

  const [bank, setBank] = useState<BloodBankDetail | null>(null);
  const [banks, setBanks] = useState<BloodBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const request = bankId === null ? listBloodBanks() : getBloodBank(bankId);

    request
      .then((result) => {
        if (cancelled) {
          return;
        }

        if (bankId === null) {
          setBanks(result as BloodBank[]);
        } else {
          setBank(result as BloodBankDetail);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(apiErrorMessage(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bankId]);

  /** Sums every component's units the facility holds for one group. */
  function groupTotal(group: BloodGroup): number {
    if (bank === null) {
      return 0;
    }

    return bank.inventory
      .filter((item) => item.bloodGroup === group)
      .reduce((sum, item) => sum + item.units, 0);
  }

  function openTheBank(id: string) {
    router.push({ pathname: "/blood-bank-detail", params: { id } });
  }

  function goTab(key: DashboardTabKey) {
    if (key === "home") {
      return;
    }

    router.push(DASHBOARD_TABS[key]);
  }

  const isEmptyDirectory = bankId === null && banks.length === 0;

  return (
    <View style={styles.screen}>
      <StepHeader title={bankId !== null ? "Blood Bank" : "Choose a Blood Bank"} onBack={onBack} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          {bankId !== null
            ? "Live stock levels, contact details and opening hours."
            : "Pick a facility to see its live stock and details."}
        </Text>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={isEmptyDirectory}
          emptyTitle="No blood banks yet"
          emptyMessage="Facilities will appear here once one is registered and verified."
          skeleton={
            <>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </>
          }
          onRetry={() => {
            setError(null);
            if (bankId === null) {
              void listBloodBanks()
                .then(setBanks)
                .catch((caught: unknown) => setError(apiErrorMessage(caught)));
            } else {
              void getBloodBank(bankId)
                .then(setBank)
                .catch((caught: unknown) => setError(apiErrorMessage(caught)));
            }
          }}
        >
          {/* ------------------------------------------------- detail mode */}
          {bank !== null ? (
            <>
              <View style={styles.card}>
                <View style={styles.head}>
                  <View style={styles.headCopy}>
                    <Text style={styles.name}>{bank.name}</Text>

                    {bank.isVerified ? (
                      <View style={styles.verifiedBadge}>
                        <Feather name="check-circle" size={10} color={Surface.successText} />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    ) : (
                      <View style={styles.unverifiedBadge}>
                        <Feather name="alert-circle" size={10} color={Surface.textMuted} />
                        <Text style={styles.unverifiedText}>Unverified</Text>
                      </View>
                    )}
                  </View>
                </View>

                {bank.note !== null && bank.note !== "" ? (
                  <Text style={styles.note}>{bank.note}</Text>
                ) : null}

                <View style={styles.facts}>
                  <FactRow icon="map-pin" label="District" value={bank.district} />
                  <FactRow icon="home" label="Address" value={bank.address ?? "Not published"} />
                  <FactRow icon="clock" label="Hours" value={bank.hours ?? "Not published"} />
                </View>

                {bank.phone !== null && bank.phone !== "" ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${bank.phone}`}
                    onPress={() => {
                      void Linking.openURL(`tel:${bank.phone}`);
                    }}
                    style={({ pressed }) => [styles.callButton, pressed && styles.pressed]}
                  >
                    <Feather name="phone" size={12} color={Surface.onPrimary} />
                    <Text style={styles.callButtonText}>
                      {bank.isVerified ? "Call blood bank" : "Call to confirm stock"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Stock on Hand</Text>
                <Text style={styles.sectionSub}>
                  Total units of every component, per blood group.
                </Text>

                <View style={styles.stockGrid}>
                  {BLOOD_GROUPS.map((group) => {
                    const total = groupTotal(group);
                    const low = total < 5;

                    return (
                      <View key={group} style={styles.stockCell}>
                        <Text style={[styles.stockGroup, low && styles.stockGroupLow]}>{group}</Text>
                        <Text style={[styles.stockCount, low && styles.stockCountLow]}>
                          {total} {total === 1 ? "unit" : "units"}
                        </Text>
                        {low ? <Text style={styles.stockLowHint}>Low supply</Text> : null}
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          ) : (
            /* ------------------------------------------------- directory mode */
            <View style={styles.directory}>
              {banks.map((candidate) => {
                return (
                  <Pressable
                    key={candidate.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${candidate.name}`}
                    onPress={() => openTheBank(candidate.id)}
                    style={({ pressed }) => [styles.directoryRow, pressed && styles.pressed]}
                  >
                    <View style={styles.directoryBadge}>
                      <Feather name="map-pin" size={13} color={Blood.primary} />
                    </View>

                    <View style={styles.directoryCopy}>
                      <Text style={styles.directoryName}>{candidate.name}</Text>
                      <Text style={styles.directoryMeta} numberOfLines={1}>
                        {candidate.district}
                        {candidate.totalUnits !== undefined
                          ? ` • ${candidate.totalUnits} units on hand`
                          : ""}
                      </Text>
                    </View>

                    <Feather name="chevron-right" size={14} color={Surface.textMuted} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </AsyncState>
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
    </View>
  );
}

function FactRow({ icon, label, value }: { icon: "map-pin" | "home" | "clock"; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={12} color={Surface.accentBlue} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  pressed: {
    opacity: 0.7,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 10,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  card: {
    padding: 12,
    gap: 10,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  head: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headCopy: {
    flex: 1,
    gap: 4,
  },

  name: {
    ...Typography.screenTitle,
    fontSize: 17,
    color: Surface.text,
  },

  verifiedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.softGreen,
  },

  verifiedText: {
    ...Typography.micro,
    color: Surface.successText,
  },

  unverifiedBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.iconWash,
  },

  unverifiedText: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  note: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
    lineHeight: 16,
  },

  facts: {
    gap: 6,
  },

  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  factLabel: {
    ...Typography.small,
    fontSize: 12,
    width: 54,
    color: Surface.textMuted,
  },

  factValue: {
    ...Typography.small,
    fontSize: 12,
    flex: 1,
    color: Surface.text,
  },

  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: ControlHeight.button,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },

  callButtonText: {
    ...Typography.label,
    fontSize: 13,
    color: Surface.onPrimary,
  },

  sectionTitle: {
    ...Typography.cardTitle,
    fontSize: 13,
    color: Surface.text,
  },

  sectionSub: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
  },

  stockGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  stockCell: {
    minWidth: 72,
    flexGrow: 1,
    gap: 2,
    padding: 10,
    borderRadius: Radius.field,
    backgroundColor: Surface.softBlue,
  },

  stockGroup: {
    ...Typography.label,
    fontWeight: "700",
    color: Surface.accentBlue,
  },

  stockGroupLow: {
    color: Blood.primary,
  },

  stockCount: {
    ...Typography.cardTitle,
    fontSize: 13,
    color: Surface.text,
  },

  stockCountLow: {
    color: Blood.primary,
  },

  stockLowHint: {
    ...Typography.micro,
    color: Blood.primary,
  },

  directory: {
    gap: 8,
  },

  directoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  directoryBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
  },

  directoryCopy: {
    flex: 1,
    gap: 1,
  },

  directoryName: {
    ...Typography.label,
    fontSize: 13,
    color: Surface.text,
  },

  directoryMeta: {
    ...Typography.small,
    fontSize: 12,
    color: Surface.textSecondary,
  },
});