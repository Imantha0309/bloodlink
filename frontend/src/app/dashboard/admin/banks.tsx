import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminHeader } from "@/components/admin/admin-header";
import { AsyncState } from "@/components/ui/async-state";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import type { HospitalInventoryBank } from "@/services/blood-banks";
import { getHospitalInventory } from "@/services/hospital";

/**
 * Reserves below this are treated as short for the overview tone. Matches the
 * critical threshold the storage monitor uses when it colours a line.
 */
const SHORT_LINE = 8;

function bankTotal(bank: HospitalInventoryBank): number {
  return bank.inventory.reduce((sum, item) => sum + item.units, 0);
}

function bankShortLines(bank: HospitalInventoryBank): number {
  return bank.inventory.filter((item) => item.units < SHORT_LINE).length;
}

/** Loading placeholder for the reserve list. */
function BanksSkeleton() {
  return (
    <View style={styles.list}>
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
      <SkeletonCard lines={2} />
    </View>
  );
}

/**
 * Every blood bank and its reserve, for accounts that are not district-scoped.
 *
 * `GetHospitalInventory` already widens to all banks for admins, so this is the
 * same data the hospital storage monitor reads — shown here as an overview that
 * flags short lines, with the editor one tap away.
 */
export default function AdminBanksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const [banks, setBanks] = useState<HospitalInventoryBank[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial load: state only changes inside the promise callbacks, so the
  // effect body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    getHospitalInventory()
      .then((result) => {
        if (!cancelled) {
          setBanks(result.banks);
          setError(null);
        }
      })
      .catch((caught) => {
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
  }, []);

  /** Retry — invoked from event handlers only. */
  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      setBanks((await getHospitalInventory()).banks);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  const totalUnits = banks.reduce((sum, bank) => sum + bankTotal(bank), 0);

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
      >
        <AdminHeader
          subtitle="National Blood Registry"
          fullName={session?.user.fullName}
          onOpenProfile={() => router.push(ROUTES.adminProfile)}
        />

        <View style={styles.headingRow}>
          <View style={styles.headingText}>
            <Text style={styles.title} accessibilityRole="header">
              Blood Banks
            </Text>

            <Text style={styles.subtitle}>
              {banks.length} {banks.length === 1 ? "facility" : "facilities"} ·{" "}
              {totalUnits.toLocaleString()} units in reserve
            </Text>
          </View>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={banks.length === 0}
          emptyTitle="No blood banks"
          emptyMessage="No facilities are registered yet."
          skeleton={<BanksSkeleton />}
          onRetry={() => {
            void load();
          }}
        >
          <View style={styles.list}>
            {banks.map((bank) => {
              const total = bankTotal(bank);
              const short = bankShortLines(bank);

              return (
                <Pressable
                  key={bank.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Open reserve for ${bank.name}`}
                  onPress={() => {
                    router.push(ROUTES.hospitalStorage);
                  }}
                  style={({ pressed }) => [styles.bank, pressed && styles.pressed]}
                >
                  <View style={styles.bankTop}>
                    <View style={styles.bankMark}>
                      <Feather name="droplet" size={15} color={Surface.onPrimary} />
                    </View>

                    <View style={styles.bankText}>
                      <Text style={styles.bankName} numberOfLines={1}>
                        {bank.name}
                      </Text>
                      <Text style={styles.bankDistrict} numberOfLines={1}>
                        {bank.district} District
                      </Text>
                    </View>

                    <View style={styles.unitsPill}>
                      <Text style={styles.unitsText}>{total}</Text>
                    </View>
                  </View>

                  <View style={styles.bankFooter}>
                    <Text style={styles.lines}>{bank.inventory.length} stock lines</Text>

                    {short > 0 ? (
                      <View style={styles.shortPill}>
                        <Feather name="alert-triangle" size={10} color={Blood.primary} />
                        <Text style={styles.shortText}>
                          {short} below {SHORT_LINE}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.okText}>All lines stocked</Text>
                    )}

                    <Feather name="chevron-right" size={16} color={Surface.textSecondary} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </AsyncState>
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

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 4,
  },

  headingText: {
    flex: 1,
    gap: 2,
  },

  title: {
    ...Typography.title,
    color: Surface.text,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  list: {
    gap: 10,
  },

  bank: {
    gap: 10,
    padding: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  pressed: {
    opacity: 0.7,
  },

  bankTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  bankMark: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  bankText: {
    flex: 1,
    gap: 1,
  },

  bankName: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  bankDistrict: {
    ...Typography.small,
    fontSize: 11,
    color: Surface.textSecondary,
  },

  unitsPill: {
    minWidth: 38,
    paddingHorizontal: 9,
    paddingVertical: 4,
    alignItems: "center",
    borderRadius: Radius.pill,
    backgroundColor: Surface.iconWash,
  },

  unitsText: {
    ...Typography.label,
    fontSize: 12,
    color: Surface.text,
  },

  bankFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
  },

  lines: {
    ...Typography.micro,
    fontSize: 10,
    color: Surface.textMuted,
  },

  shortPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  shortText: {
    ...Typography.micro,
    fontSize: 9.5,
    fontWeight: "700",
    color: Blood.primary,
  },

  okText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.textMuted,
  },
});
