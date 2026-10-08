import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
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

import { Blood, Elevation, Surface } from "@/constants/colors";
import {
  AUTO_DISPATCH,
  BARCODE_BARS,
  CLINICAL_ROLES,
  COLD_STORAGE,
  HOSPITAL_PROFILE,
  ID_CARD_FIELDS,
  PROFILE_MENU,
  PROFILE_STATS,
  type ProfileMenuItem,
  type ProfileStat,
} from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuth } from "@/providers/auth-provider";
import { initialsOf } from "@/utils/initials";

/* ================= CREDENTIAL ARTWORK ================= */

const QR_SIZE = 66;
const QR_MODULES = 13;
const QR_CELL = QR_SIZE / QR_MODULES;
const QR_FINDERS = [
  [0, 0],
  [QR_MODULES - 5, 0],
  [0, QR_MODULES - 5],
] as const;

/** Decorative module scatter — deterministic so the code never re-shuffles. */
function qrModuleOn(row: number, column: number) {
  const inFinder = QR_FINDERS.some(
    ([originRow, originColumn]) =>
      row >= originRow &&
      row < originRow + 5 &&
      column >= originColumn &&
      column < originColumn + 5,
  );

  if (inFinder) {
    return false;
  }

  return (row * 5 + column * 3 + row * column) % 7 < 3;
}

/** Stand-in for the credential QR — no QR encoder ships with the app yet. */
function CredentialQr() {
  return (
    <View style={styles.qr} accessible accessibilityLabel="Credential QR code">
      {Array.from({ length: QR_MODULES }, (_, row) =>
        Array.from({ length: QR_MODULES }, (_, column) => {
          if (!qrModuleOn(row, column)) {
            return null;
          }

          return (
            <View
              key={`${row}-${column}`}
              pointerEvents="none"
              style={[
                styles.qrModule,
                { left: column * QR_CELL, top: row * QR_CELL },
              ]}
            />
          );
        }),
      )}

      {QR_FINDERS.map(([row, column]) => (
        <View
          key={`f-${row}-${column}`}
          pointerEvents="none"
          style={[styles.qrFinder, { left: column * QR_CELL, top: row * QR_CELL }]}
        >
          <View style={styles.qrFinderEye}>
            <View style={styles.qrFinderPupil} />
          </View>
        </View>
      ))}
    </View>
  );
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
 * Everything but the name, the auto-dispatch switch and sign-out is fixture
 * state — the dashboard API reports none of these fields yet.
 */
export default function HospitalProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [autoDispatch, setAutoDispatch] = useState(true);

  const name = session?.user.fullName ?? HOSPITAL_PROFILE.fallbackName;

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

              <Text style={styles.identityRole}>{HOSPITAL_PROFILE.role}</Text>

              <Text style={styles.identityFacility}>{HOSPITAL_PROFILE.facility}</Text>
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

            <Text style={styles.idBank}>{HOSPITAL_PROFILE.idBank}</Text>

            <View style={styles.tierPill}>
              <Feather name="award" size={11} color={Blood.primary} />
              <Text style={styles.tierText}>{HOSPITAL_PROFILE.idTier}</Text>
            </View>
          </View>

          <View style={styles.identifierRow}>
            <View style={styles.identifierText}>
              <Text style={styles.identifierLabel}>
                {HOSPITAL_PROFILE.idIdentifierLabel}
              </Text>

              <Text style={styles.identifierValue} selectable>
                {HOSPITAL_PROFILE.idIdentifier}
              </Text>
            </View>

            <View style={styles.groupBox}>
              <Text style={styles.groupValue}>{HOSPITAL_PROFILE.idGroup}</Text>
              <Text style={styles.groupLabel}>{HOSPITAL_PROFILE.idGroupLabel}</Text>
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

            <CredentialQr />
          </View>

          <View style={styles.idFields}>
            {ID_CARD_FIELDS.map((field) => (
              <View key={field.label} style={styles.idField}>
                <Text style={styles.idFieldLabel}>{field.label}</Text>
                <Text style={styles.idFieldValue}>{field.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ================= STATS ================= */}

        <View style={styles.statRow}>
          {PROFILE_STATS.map((stat) => (
            <StatCard key={stat.key} stat={stat} />
          ))}
        </View>

        {/* ================= COLD STORAGE ================= */}

        <View style={styles.card}>
          <View style={styles.storageHead}>
            <View style={styles.storageIcon}>
              <Feather name="cloud-snow" size={17} color={Blood.primary} />
            </View>

            <View style={styles.storageText}>
              <Text style={styles.storageTitle}>{COLD_STORAGE.title}</Text>
              <Text style={styles.storageDetail}>{COLD_STORAGE.detail}</Text>
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
              {COLD_STORAGE.lines.map((line) => (
                <Text key={line} style={styles.storageLine}>
                  {line}
                </Text>
              ))}
            </View>

            <Sparkline points={COLD_STORAGE.trend} />
          </View>
        </View>

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

  qrModule: {
    position: "absolute",
    width: QR_CELL,
    height: QR_CELL,
    backgroundColor: Surface.text,
  },

  qrFinder: {
    position: "absolute",
    width: QR_CELL * 5,
    height: QR_CELL * 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.text,
  },

  qrFinderEye: {
    width: QR_CELL * 3,
    height: QR_CELL * 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.card,
  },

  qrFinderPupil: {
    width: QR_CELL * 1.4,
    height: QR_CELL * 1.4,
    backgroundColor: Surface.text,
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
