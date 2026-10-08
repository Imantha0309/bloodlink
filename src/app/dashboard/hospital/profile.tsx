import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { type ComponentProps, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { EmptyNote } from "@/components/dashboard/empty-note";
import { Skeleton } from "@/components/ui/skeleton";
import { type BloodGroup, BLOOD_GROUPS } from "@/constants/blood-groups";
import { Blood, Elevation, Surface } from "@/constants/colors";
import {
  AUTO_DISPATCH,
  BARCODE_BARS,
  CLINICAL_ROLES,
  COLD_STORAGE,
  HOSPITAL_PROFILE,
  PROFILE_MENU,
  type ProfileMenuItem,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  type DashboardStat,
  type DashboardSummary,
  getDashboardSummary,
} from "@/services/dashboard/dashboard";
import { type HospitalInventoryBank, type InventoryItem } from "@/services/blood-banks";
import { getHospitalInventory } from "@/services/hospital";
import { initialsOf } from "@/utils/initials";

/* ================= CREDENTIAL ARTWORK ================= */

const QR_SIZE = 66;

const COMPONENT_ORDER = ["whole_blood", "prbc", "plasma", "platelets"] as const;

const COMPONENT_LABELS: Record<(typeof COMPONENT_ORDER)[number], string> = {
  whole_blood: "Whole Blood",
  prbc: "PRBC Red Cells",
  plasma: "FFP Plasma",
  platelets: "Platelets",
};

/** Units held for one blood group across every component. */
function unitsOf(inventory: InventoryItem[], group: BloodGroup) {
  return inventory
    .filter((item) => item.bloodGroup === group)
    .reduce((sum, item) => sum + item.units, 0);
}

type ProfileStat = {
  key: string;
  icon: ComponentProps<typeof Feather>["name"];
  value: string;
  label: string;
  note: string;
  noteTone: "positive" | "critical";
  valueCritical?: boolean;
  badgeTone: "red" | "blue";
};

const STAT_ICONS: Record<string, ComponentProps<typeof Feather>["name"]> = {
  pending: "clock",
  critical: "alert-circle",
  alerts: "bell",
  donors: "users",
};

/** Server stat → KPI tile; the critical row keeps the red treatment. */
function toProfileStat(stat: DashboardStat): ProfileStat {
  const critical = stat.key === "critical" || stat.key === "alerts";

  return {
    key: stat.key,
    icon: STAT_ICONS[stat.key] ?? "bar-chart-2",
    value: stat.value,
    label: stat.label,
    note: stat.hint ?? (critical ? "Needs review" : "Updated live"),
    noteTone: critical ? "critical" : "positive",
    valueCritical: critical,
    badgeTone: critical ? "red" : "blue",
  };
}

const SPARK_WIDTH = 92;
const SPARK_HEIGHT = 34;
const SPARK_THICKNESS = 2.5;

/** Temperature trend drawn as rotated segments — the palette has no charts. */
function Sparkline({ points }: { points: readonly number[] }) {
  const stepX = SPARK_WIDTH / (points.length - 1);

  return (
    <View style={styles.spark} pointerEvents="none">
      {points.slice(0, -1).map((value, index) => {
        const next = points[index + 1];
        const x1 = index * stepX;
        const y1 = SPARK_HEIGHT - value * SPARK_HEIGHT;
        const x2 = (index + 1) * stepX;
        const y2 = SPARK_HEIGHT - next * SPARK_HEIGHT;
        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

        return (
          <View
            key={index}
            style={[
              styles.sparkSegment,
              {
                left: (x1 + x2) / 2 - (length + SPARK_THICKNESS) / 2,
                top: (y1 + y2) / 2 - SPARK_THICKNESS / 2,
                width: length + SPARK_THICKNESS,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

/* ================= SCREEN ================= */

/**
 * Staff profile: duty state, blood-bank credential, station telemetry and the
 * account actions.
 *
 * Identity comes from the session; the KPI strip and the cold-storage card
 * are live (dashboard summary + hospital inventory). The duty shift, clinical
 * roles and plant telemetry are copy the API does not carry.
 */
export default function HospitalProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [autoDispatch, setAutoDispatch] = useState(true);

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [banks, setBanks] = useState<HospitalInventoryBank[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial load: every state change happens inside the promise callbacks, so
  // the effect body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    void Promise.allSettled([getDashboardSummary(), getHospitalInventory()]).then(
      ([summaryResult, inventoryResult]) => {
        if (cancelled) {
          return;
        }

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value);
        } else {
          setStatsError(apiErrorMessage(summaryResult.reason));
        }

        if (inventoryResult.status === "fulfilled") {
          setBanks(inventoryResult.value.banks);
        } else {
          setStorageError(apiErrorMessage(inventoryResult.reason));
        }

        setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  /** Retry both sections — invoked from event handlers only. */
  async function load() {
    setIsLoading(true);
    setStatsError(null);
    setStorageError(null);

    const [summaryResult, inventoryResult] = await Promise.allSettled([
      getDashboardSummary(),
      getHospitalInventory(),
    ]);

    if (summaryResult.status === "fulfilled") {
      setSummary(summaryResult.value);
    } else {
      setStatsError(apiErrorMessage(summaryResult.reason));
    }

    if (inventoryResult.status === "fulfilled") {
      setBanks(inventoryResult.value.banks);
    } else {
      setStorageError(apiErrorMessage(inventoryResult.reason));
    }

    setIsLoading(false);
  }

  const user = session?.user;
  const name = user?.fullName ?? "Hospital Staff";
  const district = user?.district ?? null;
  const roleLine =
    user === undefined
      ? "Hospital // Sri Lanka"
      : `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} // ${
          district !== null ? `${district} District` : "Sri Lanka"
        }`;
  const facility = district !== null ? `${district} District Blood Bank` : "Regional Blood Bank";
  const idBankLine = district !== null ? `${district} Regional Blood Center` : "Regional Blood Center";
  const identifier = user?.mobile ?? user?.email ?? user?.id ?? "—";
  const credentialValue = `bloodlink:user:${user?.id ?? ""}`;

  const credentialFields = [
    { label: "Role", value: user === undefined ? "—" : "Hospital" },
    { label: "Email", value: user?.email ?? "Not set" },
    { label: "Auth", value: "Password" },
  ];

  const stats = (summary?.stats ?? []).slice(0, 3).map(toProfileStat);

  const bank = banks[0] ?? null;
  const inventory = bank?.inventory ?? [];
  const totalUnits = inventory.reduce((sum, item) => sum + item.units, 0);
  const stockedLines = inventory.filter((item) => item.units > 0).length;
  const stockLines = inventory.length;
  const storageLines = COMPONENT_ORDER.map((component) => ({
    label: COMPONENT_LABELS[component],
    units: inventory
      .filter((item) => item.component === component)
      .reduce((sum, item) => sum + item.units, 0),
  }))
    .sort((a, b) => b.units - a.units)
    .slice(0, 2)
    .map((entry) => `${entry.label}: ${entry.units} units`);
  const groupMax = Math.max(1, ...BLOOD_GROUPS.map((group) => unitsOf(inventory, group)));
  const trend = BLOOD_GROUPS.map((group) => unitsOf(inventory, group) / groupMax);

  const storageTitle = bank !== null ? bank.name : "Cold Storage";
  const storageDetail =
    bank !== null
      ? `${stockedLines}/${stockLines} lines stocked • ${totalUnits} units • ${bank.district} District`
      : "No stock data";

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      // The session has to be gone before navigating: `/login` is guarded off
      // while authenticated, so navigating first would bounce back here.
      await signOut();
      router.replace(ROUTES.login);
    } finally {
      setIsSigningOut(false);
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
      >
        {/* ================= TOP BAR ================= */}

        <View style={styles.topBar}>
          <View style={styles.logo}>
            <Feather name="droplet" size={18} color={Surface.onPrimary} />
          </View>

          <Text style={styles.topTitle} accessibilityRole="header">
            {HOSPITAL_PROFILE.title}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan credential code"
            hitSlop={6}
            style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}
          >
            <Feather name="maximize" size={20} color={Surface.text} />
          </Pressable>

          <View style={styles.topAvatar}>
            <Text style={styles.topAvatarText}>{initialsOf(name)}</Text>
          </View>
        </View>

        {/* ================= DUTY ================= */}

        <View style={styles.dutyRow}>
          <View style={styles.dutyPill}>
            <View style={styles.dutyDot} pointerEvents="none" />
            <Text style={styles.dutyText}>{HOSPITAL_PROFILE.dutyLabel}</Text>
          </View>

          <Text style={styles.shiftText}>{HOSPITAL_PROFILE.shiftLabel}</Text>
        </View>

        {/* ================= IDENTITY ================= */}

        <View style={styles.card}>
          <View style={styles.identityRow}>
            <View style={styles.identityAvatar}>
              <Text style={styles.identityInitials}>{initialsOf(name)}</Text>

              <View style={styles.verifiedBadge} pointerEvents="none">
                <Feather name="check" size={10} color={Surface.onPrimary} />
              </View>
            </View>

            <View style={styles.identityText}>
              <Text style={styles.identityName} numberOfLines={1}>
                {name}
              </Text>

              <Text style={styles.identityRole}>{roleLine}</Text>

              <Text style={styles.identityFacility}>{facility}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={HOSPITAL_PROFILE.idActionLabel}
              hitSlop={6}
              style={({ pressed }) => [styles.identityAction, pressed && styles.pressed]}
            >
              <Feather name="external-link" size={18} color={Surface.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* ================= CREDENTIAL ================= */}

        <View style={styles.idCard}>
          <View style={styles.idHead}>
            <View style={styles.idBankIcon}>
              <Feather name="droplet" size={14} color={Surface.onPrimary} />
            </View>

            <Text style={styles.idBank}>{idBankLine}</Text>

            <View style={styles.tierPill}>
              <Feather name="award" size={11} color={Blood.primary} />
              <Text style={styles.tierText}>{HOSPITAL_PROFILE.idTier}</Text>
            </View>
          </View>

          <View style={styles.identifierRow}>
            <View style={styles.identifierText}>
              <Text style={styles.identifierLabel}>Registered Contact</Text>

              <Text style={styles.identifierValue} selectable>
                {identifier}
              </Text>
            </View>

            <View style={styles.groupBox}>
              <Text
                style={styles.groupValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {district ?? "LK"}
              </Text>
              <Text style={styles.groupLabel}>District</Text>
            </View>
          </View>

          <View style={styles.scanPanel}>
            <View style={styles.barcodeBlock}>
              <View style={styles.barcode} pointerEvents="none">
                {BARCODE_BARS.map((weight, index) => (
                  <View key={index} style={[styles.barcodeBar, { flexGrow: weight }]} />
                ))}
              </View>

              <Text style={styles.barcodeCaption}>
                {HOSPITAL_PROFILE.idBarcodeCaption}
              </Text>
            </View>

            <View
              style={styles.qr}
              accessible
              accessibilityLabel="Credential QR code"
            >
              <QRCode
                value={credentialValue}
                size={QR_SIZE}
                color={Surface.text}
                backgroundColor={Surface.card}
                ecl="M"
              />
            </View>
          </View>

          <View style={styles.idFields}>
            {credentialFields.map((field) => (
              <View key={field.label} style={styles.idField}>
                <Text style={styles.idFieldLabel}>{field.label}</Text>
                <Text style={styles.idFieldValue} numberOfLines={1} ellipsizeMode="tail">
                  {field.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================= STATS ================= */}

        {isLoading ? (
          <View style={styles.statRow}>
            <Skeleton height={104} radius={Radius.field} />
            <Skeleton height={104} radius={Radius.field} />
            <Skeleton height={104} radius={Radius.field} />
          </View>
        ) : statsError !== null ? (
          <SectionNote
            message={statsError}
            onRetry={() => {
              void load();
            }}
          />
        ) : stats.length > 0 ? (
          <View style={styles.statRow}>
            {stats.map((stat) => (
              <StatCard key={stat.key} stat={stat} />
            ))}
          </View>
        ) : null}

        {/* ================= COLD STORAGE ================= */}

        {isLoading ? (
          <Skeleton height={148} radius={Radius.card} />
        ) : storageError !== null ? (
          <SectionNote
            message={storageError}
            onRetry={() => {
              void load();
            }}
          />
        ) : bank === null ? (
          <EmptyNote
            title="No storage assigned"
            message="This account has no blood bank in its district yet."
            icon="cloud-snow"
          />
        ) : (
          <View style={styles.card}>
            <View style={styles.storageHead}>
              <View style={styles.storageIcon}>
                <Feather name="cloud-snow" size={17} color={Blood.primary} />
              </View>

              <View style={styles.storageText}>
                <Text style={styles.storageTitle} numberOfLines={1}>
                  {storageTitle}
                </Text>
                <Text style={styles.storageDetail} numberOfLines={2}>
                  {storageDetail}
                </Text>
              </View>

              <View style={styles.tempPill}>
                <View style={styles.tempDot} pointerEvents="none" />

                <View style={styles.tempText}>
                  <Text style={styles.tempValue}>{COLD_STORAGE.temperature}</Text>
                  <Text style={styles.tempStatus}>{COLD_STORAGE.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.storagePanel}>
              <View style={styles.storageLines}>
                {storageLines.map((line) => (
                  <Text key={line} style={styles.storageLine}>
                    {line}
                  </Text>
                ))}
              </View>

              <Sparkline points={trend} />
            </View>
          </View>
        )}

        {/* ================= CLINICAL ROLES ================= */}

        <View style={styles.card}>
          <View style={styles.rolesHead}>
            <View style={styles.rolesTitleRow}>
              <Feather name="shield" size={17} color={Blood.primary} />
              <Text style={styles.rolesTitle}>{CLINICAL_ROLES.title}</Text>
            </View>

            <Text style={styles.rolesLevel}>{CLINICAL_ROLES.level}</Text>
          </View>

          <View style={styles.roleChips}>
            {CLINICAL_ROLES.items.map((role) => (
              <View key={role.id} style={styles.roleChip}>
                <Feather name={role.icon} size={13} color={Blood.primary} />
                <Text style={styles.roleChipText}>{role.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================= AUTO DISPATCH ================= */}

        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.menuTitle}>{AUTO_DISPATCH.title}</Text>
              <Text style={styles.menuDetail}>{AUTO_DISPATCH.detail}</Text>
            </View>

            <Switch
              value={autoDispatch}
              onValueChange={setAutoDispatch}
              accessibilityLabel={AUTO_DISPATCH.title}
              trackColor={{ false: Surface.borderStrong, true: Blood.primary }}
              thumbColor={Surface.onPrimary}
              ios_backgroundColor={Surface.borderStrong}
            />
          </View>
        </View>

        {/* ================= MENU ================= */}

        <View style={styles.card}>
          {PROFILE_MENU.map((item, index) => (
            <MenuRow key={item.id} item={item} first={index === 0} />
          ))}
        </View>

        {/* ================= SIGN OUT ================= */}

        <Pressable
          onPress={() => {
            void handleSignOut();
          }}
          disabled={isSigningOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          accessibilityState={{ disabled: isSigningOut }}
          style={({ pressed }) => [
            styles.signOut,
            pressed && styles.pressed,
            isSigningOut && styles.signOutDisabled,
          ]}
        >
          {isSigningOut ? (
            <ActivityIndicator size="small" color={Surface.onPrimary} />
          ) : (
            <Feather name="log-out" size={17} color={Surface.onPrimary} />
          )}

          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

        <Text style={styles.footer}>{HOSPITAL_PROFILE.footer}</Text>
      </ScrollView>
    </View>
  );
}

/** One KPI tile; the alert tile turns its figure red. */
function StatCard({ stat }: { stat: ProfileStat }) {
  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.statBadge,
          stat.badgeTone === "red" && styles.statBadgeRed,
        ]}
      >
        <Feather
          name={stat.icon}
          size={15}
          color={stat.badgeTone === "red" ? Blood.primary : Surface.text}
        />
      </View>

      <Text style={[styles.statValue, stat.valueCritical === true && styles.statValueCritical]}>
        {stat.value}
      </Text>

      <Text style={styles.statLabel} numberOfLines={1}>
        {stat.label}
      </Text>

      <Text
        style={[
          styles.statNote,
          stat.noteTone === "critical" ? styles.statNoteCritical : styles.statNotePositive,
        ]}
        numberOfLines={1}
      >
        {stat.note}
      </Text>
    </View>
  );
}

/** One row of the settings list. */
function MenuRow({ item, first }: { item: ProfileMenuItem; first: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.title}
      style={({ pressed }) => [
        styles.menuRow,
        !first && styles.menuRowDivider,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.menuIcon,
          item.iconTone === "red" && styles.menuIconRed,
        ]}
      >
        <Feather
          name={item.icon}
          size={16}
          color={item.iconTone === "red" ? Blood.primary : Surface.text}
        />
      </View>

      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDetail}>{item.detail}</Text>
      </View>

      <Feather name="chevron-right" size={18} color={Surface.textSecondary} />
    </Pressable>
  );
}

/** Inline fetch failure with a retry, used by the live sections. */
function SectionNote({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.sectionError}>
      <Feather name="alert-circle" size={15} color={Blood.primary} />

      <Text style={styles.sectionErrorText} numberOfLines={2}>
        {message}
      </Text>

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading"
        hitSlop={6}
        style={({ pressed }) => [styles.sectionRetry, pressed && styles.pressed]}
      >
        <Feather name="refresh-cw" size={13} color={Blood.primary} />
        <Text style={styles.sectionRetryText}>Retry</Text>
      </Pressable>
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

  pressed: {
    opacity: 0.7,
  },

  /* ================= TOP BAR ================= */

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  topTitle: {
    flex: 1,
    ...Typography.screenTitle,
    color: Surface.text,
  },

  topAction: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  topAvatar: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  topAvatarText: {
    ...Typography.micro,
    color: Surface.text,
  },

  /* ================= DUTY ================= */

  dutyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  dutyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flexShrink: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.field,
    backgroundColor: Surface.softGreen,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softGreenBorder,
  },

  dutyDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
  },

  dutyText: {
    flex: 1,
    ...Typography.micro,
    textTransform: "uppercase",
    color: Surface.text,
  },

  shiftText: {
    flex: 1,
    ...Typography.small,
    color: Surface.textSecondary,
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

  /* ================= IDENTITY ================= */

  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  identityAvatar: {
    width: 62,
    height: 62,
    borderRadius: Radius.field,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  identityInitials: {
    fontSize: 20,
    fontWeight: "800",
    color: Blood.primary,
  },

  verifiedBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.online,
    borderWidth: 2,
    borderColor: Surface.card,
  },

  identityText: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },

  identityName: {
    ...Typography.title,
    color: Surface.text,
  },

  identityRole: {
    ...Typography.label,
    color: Blood.primary,
  },

  identityFacility: {
    ...Typography.small,
    lineHeight: 17,
    color: Surface.textSecondary,
  },

  identityAction: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  /* ================= CREDENTIAL ================= */

  idCard: {
    gap: 14,
    padding: 16,
    borderRadius: Radius.card,
    backgroundColor: Surface.text,
  },

  idHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  idBankIcon: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm - 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  idBank: {
    flex: 1,
    ...Typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: Surface.onPrimary,
  },

  tierPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
  },

  tierText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.text,
  },

  identifierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  identifierText: {
    flex: 1,
    gap: 4,
  },

  identifierLabel: {
    ...Typography.micro,
    fontSize: 9.5,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: Surface.textMuted,
  },

  identifierValue: {
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: Surface.onPrimary,
  },

  groupBox: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Surface.card,
    gap: 1,
  },

  groupValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: Surface.text,
  },

  groupLabel: {
    ...Typography.micro,
    fontSize: 8.5,
    textTransform: "uppercase",
    color: Surface.textMuted,
  },

  scanPanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
  },

  barcodeBlock: {
    flex: 1,
    gap: 8,
  },

  barcode: {
    flexDirection: "row",
    alignItems: "stretch",
    height: 46,
    gap: 2,
    overflow: "hidden",
  },

  barcodeBar: {
    flexBasis: 0,
    height: "100%",
    backgroundColor: Surface.text,
    borderRadius: 0.5,
  },

  barcodeCaption: {
    ...Typography.micro,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: Surface.textMuted,
  },

  qr: {
    width: QR_SIZE,
    height: QR_SIZE,
    borderRadius: Radius.sm - 4,
    backgroundColor: Surface.card,
    overflow: "hidden",
  },

  idFields: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.textSecondary,
  },

  idField: {
    flex: 1,
    gap: 3,
  },

  idFieldLabel: {
    ...Typography.micro,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: Surface.textMuted,
  },

  idFieldValue: {
    ...Typography.label,
    color: Surface.onPrimary,
  },

  /* ================= STATS ================= */

  statRow: {
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    gap: 5,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  statBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
    marginBottom: 3,
  },

  statBadgeRed: {
    backgroundColor: Surface.softRed,
  },

  statValue: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    color: Surface.text,
  },

  statValueCritical: {
    color: Blood.primary,
  },

  statLabel: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  statNote: {
    ...Typography.small,
    fontSize: 10.5,
    fontWeight: "700",
  },

  statNotePositive: {
    color: Surface.online,
  },

  statNoteCritical: {
    color: Blood.primary,
  },

  /* ================= COLD STORAGE ================= */

  storageHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  storageIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
  },

  storageText: {
    flex: 1,
    gap: 2,
  },

  storageTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  storageDetail: {
    ...Typography.small,
    lineHeight: 16,
    color: Surface.textSecondary,
  },

  tempPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softGreen,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softGreenBorder,
  },

  tempDot: {
    width: 7,
    height: 7,
    borderRadius: Radius.full,
    backgroundColor: Surface.online,
  },

  tempText: {
    gap: 0,
  },

  tempValue: {
    ...Typography.label,
    color: Surface.text,
  },

  tempStatus: {
    ...Typography.micro,
    fontSize: 9,
    color: Surface.online,
  },

  storagePanel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softBlue,
  },

  storageLines: {
    flex: 1,
    gap: 4,
  },

  storageLine: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  spark: {
    width: SPARK_WIDTH,
    height: SPARK_HEIGHT,
  },

  sparkSegment: {
    position: "absolute",
    height: SPARK_THICKNESS,
    borderRadius: SPARK_THICKNESS,
    backgroundColor: Surface.online,
  },

  /* ================= CLINICAL ROLES ================= */

  rolesHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  rolesTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  rolesTitle: {
    ...Typography.title,
    fontSize: 17,
    color: Surface.text,
  },

  rolesLevel: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  roleChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  roleChipText: {
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  /* ================= TOGGLE ================= */

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  toggleText: {
    flex: 1,
    gap: 2,
  },

  /* ================= MENU ================= */

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },

  menuRowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Surface.border,
    paddingTop: 14,
  },

  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm - 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  menuIconRed: {
    backgroundColor: Surface.softRed,
    borderColor: Surface.softRedBorder,
  },

  menuText: {
    flex: 1,
    gap: 2,
  },

  menuTitle: {
    ...Typography.label,
    fontSize: 14,
    color: Surface.text,
  },

  menuDetail: {
    ...Typography.small,
    lineHeight: 16,
    color: Surface.textSecondary,
  },

  /* ================= SECTION ERROR ================= */

  sectionError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  sectionErrorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  sectionRetry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  sectionRetryText: {
    ...Typography.micro,
    fontSize: 10,
    color: Blood.primary,
  },

  /* ================= SIGN OUT ================= */

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  signOutText: {
    ...Typography.button,
    color: Surface.onPrimary,
  },

  signOutDisabled: {
    opacity: 0.6,
  },

  footer: {
    ...Typography.small,
    textAlign: "center",
    color: Surface.textMuted,
  },
});
