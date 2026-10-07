import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { EXTRACTION } from "@/constants/hospital-demo";
import { Radius } from "@/constants/radius";
import { ROLE_HOME } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { initialsOf } from "@/utils/initials";

/* ================= COLLECTION RING ================= */

const RING_SIZE = 172;
const RING_THICKNESS = 16;

/**
 * The arc is drawn as tangential bars laid around the circle rather than one
 * stroke — React Native has no vector canvas, and overlapping bars keep the
 * ring smooth while staying in plain views.
 */
const RING_SEGMENTS = 90;
const RING_RADIUS = (RING_SIZE - RING_THICKNESS) / 2;
const SEGMENT_DEGREES = 360 / RING_SEGMENTS;
const SEGMENT_STEP = (Math.PI * RING_RADIUS * SEGMENT_DEGREES) / 180;
const SEGMENT_LENGTH = SEGMENT_STEP * 2;
const SEGMENT_RADIUS = Math.min(SEGMENT_LENGTH, RING_THICKNESS) / 2;

/**
 * Live collection dial for the phlebotomy session.
 *
 * `fraction` is the share of the unit already drawn; the remainder is the
 * light track. Everything else on the screen is fixture state.
 */
function CollectionRing({
  fraction,
  collectedMl,
  totalMl,
  eta,
}: {
  fraction: number;
  collectedMl: number;
  totalMl: number;
  eta: string;
}) {
  const filled = Math.round(fraction * RING_SEGMENTS);
  const percent = Math.round(fraction * 100);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Unit collection progress"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={styles.ring}
    >
      {Array.from({ length: RING_SEGMENTS }, (_, index) => {
        const angle = (index + 0.5) * SEGMENT_DEGREES;
        const radians = (angle * Math.PI) / 180;
        const offsetX = RING_RADIUS * Math.sin(radians);
        const offsetY = -RING_RADIUS * Math.cos(radians);

        return (
          <View
            key={index}
            pointerEvents="none"
            style={[
              styles.ringSegment,
              {
                left: RING_SIZE / 2 + offsetX - SEGMENT_LENGTH / 2,
                top: RING_SIZE / 2 + offsetY - RING_THICKNESS / 2,
                backgroundColor: index < filled ? Blood.primary : Surface.softBlue,
                transform: [{ rotate: `${angle}deg` }],
              },
            ]}
          />
        );
      })}

      <View style={styles.ringCenter} pointerEvents="none">
        <View style={styles.dropBadge}>
          <Feather name="droplet" size={15} color={Blood.primary} />
        </View>

        <View style={styles.amountRow}>
          <Text style={styles.amountValue}>{collectedMl}</Text>
          <Text style={styles.amountTotal}>{`/ ${totalMl} ml`}</Text>
        </View>

        <Text style={styles.amountPercent}>{`${percent}% Collected`}</Text>

        <View style={styles.etaPill}>
          <Text style={styles.etaText}>{eta}</Text>
        </View>
      </View>
    </View>
  );
}

/* ================= SCREEN ================= */

/**
 * Collection telemetry for the unit being drawn.
 *
 * The dial, the RFID line and the linked case are all fixture values — the
 * dashboard API reports none of it yet — and the two decisions at the bottom
 * are laid out but not submitted anywhere.
 */
export default function HospitalExtractionSessionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const fraction = EXTRACTION.collectedMl / EXTRACTION.totalMl;

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(ROLE_HOME.hospital);
  }

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 6, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ================= BACK ================= */}

        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Feather name="arrow-left" size={22} color={Surface.text} />
        </Pressable>

        {/* ================= SUITE ================= */}

        <View style={styles.suiteRow}>
          <Text style={styles.suiteText}>{EXTRACTION.suite}</Text>

          <View style={styles.protocolPill}>
            <Feather name="sun" size={11} color={Blood.primary} />
            <Text style={styles.protocolText}>{EXTRACTION.livePill}</Text>
          </View>
        </View>

        {/* ================= TELEMETRY ================= */}

        <View style={styles.card}>
          <View style={styles.telemetryHead}>
            <View style={styles.telemetryText}>
              <Text style={styles.eyebrow}>{EXTRACTION.telemetryLabel}</Text>

              <Text style={styles.unitTitle} accessibilityRole="header">
                {EXTRACTION.unitTitle}
              </Text>
            </View>

            <View style={styles.isoGroup}>
              <View style={styles.groupPill}>
                <Text style={styles.groupText}>{EXTRACTION.bloodGroup}</Text>
              </View>

              <Text style={styles.isoLabel}>{EXTRACTION.isoLabel}</Text>
            </View>
          </View>

          <View style={styles.ringWrap}>
            <CollectionRing
              fraction={fraction}
              collectedMl={EXTRACTION.collectedMl}
              totalMl={EXTRACTION.totalMl}
              eta={EXTRACTION.eta}
            />
          </View>

          <View style={styles.rfidRow}>
            <Feather name="grid" size={16} color={Surface.textSecondary} />

            <View style={styles.rfidText}>
              <Text style={styles.rfidCode} numberOfLines={1}>
                {EXTRACTION.rfidCode}
              </Text>

              <Text style={styles.rfidDetail}>{EXTRACTION.rfidDetail}</Text>
            </View>

            <Feather name="check-circle" size={18} color={Surface.online} />
          </View>
        </View>

        {/* ================= LINKED CASE ================= */}

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Text style={[styles.eyebrow, styles.eyebrowUpper]}>
              {EXTRACTION.caseLabel}
            </Text>

            <View style={styles.statPill}>
              <Text style={styles.statText}>{EXTRACTION.caseStat}</Text>
            </View>
          </View>

          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <Text style={styles.personInitials}>
                {initialsOf(EXTRACTION.patientName, "AP")}
              </Text>
            </View>

            <View style={styles.personText}>
              <View style={styles.nameRow}>
                <Text style={styles.personName} numberOfLines={1}>
                  {EXTRACTION.patientName}
                </Text>

                <Text style={styles.personMeta}>{EXTRACTION.patientMeta}</Text>
              </View>

              <Text style={styles.personWard}>{EXTRACTION.patientWard}</Text>
            </View>
          </View>

          <View style={styles.noteRow}>
            <Feather name="shuffle" size={13} color={Blood.primary} />

            <Text style={styles.noteText}>{EXTRACTION.patientNote}</Text>
          </View>
        </View>

        {/* ================= PHLEBOTOMIST ================= */}

        <View style={styles.card}>
          <View style={styles.personRow}>
            <View style={styles.personAvatar}>
              <Text style={styles.personInitials}>
                {initialsOf(EXTRACTION.phlebotomistName, "SP")}
              </Text>
            </View>

            <View style={styles.personText}>
              <View style={styles.nameRow}>
                <Text style={styles.personName} numberOfLines={1}>
                  {EXTRACTION.phlebotomistName}
                </Text>

                <Feather name="check-circle" size={14} color={Surface.online} />
              </View>

              <Text style={styles.personWard}>{EXTRACTION.phlebotomistMeta}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ring the ${EXTRACTION.buzzerLabel}`}
              hitSlop={4}
              style={({ pressed }) => [styles.buzzer, pressed && styles.pressed]}
            >
              <Feather name="bell" size={14} color={Blood.primary} />
              <Text style={styles.buzzerText}>{EXTRACTION.buzzerLabel}</Text>
            </Pressable>
          </View>
        </View>

        {/* ================= DECISIONS ================= */}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EXTRACTION.sealCta}
          style={({ pressed }) => [styles.seal, pressed && styles.pressed]}
        >
          <Feather name="lock" size={16} color={Surface.onPrimary} />

          <Text style={styles.sealText} numberOfLines={1}>
            {EXTRACTION.sealCta}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={EXTRACTION.haltCta}
          style={({ pressed }) => [styles.halt, pressed && styles.pressed]}
        >
          <Feather name="alert-circle" size={16} color={Blood.primary} />

          <Text style={styles.haltText} numberOfLines={1}>
            {EXTRACTION.haltCta}
          </Text>
        </Pressable>
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

  pressed: {
    opacity: 0.75,
  },

  /* ================= BACK & SUITE ================= */

  backButton: {
    alignSelf: "flex-start",
    padding: 4,
  },

  suiteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  suiteText: {
    flex: 1,
    ...Typography.micro,
    textTransform: "uppercase",
    color: Surface.textSecondary,
  },

  protocolPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  protocolText: {
    ...Typography.micro,
    fontSize: 9.5,
    textTransform: "uppercase",
    color: Blood.primary,
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

  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  eyebrow: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  eyebrowUpper: {
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "700",
    fontSize: 10,
  },

  /* ================= TELEMETRY ================= */

  telemetryHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  telemetryText: {
    flex: 1,
    gap: 3,
  },

  unitTitle: {
    ...Typography.title,
    color: Surface.text,
  },

  isoGroup: {
    alignItems: "flex-end",
    gap: 4,
  },

  groupPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  groupText: {
    ...Typography.label,
    color: Surface.onPrimary,
  },

  isoLabel: {
    ...Typography.small,
    fontSize: 10,
    color: Surface.textMuted,
  },

  ringWrap: {
    alignItems: "center",
    paddingVertical: 4,
  },

  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },

  ringSegment: {
    position: "absolute",
    width: SEGMENT_LENGTH,
    height: RING_THICKNESS,
    borderRadius: SEGMENT_RADIUS,
  },

  ringCenter: {
    alignItems: "center",
    gap: 6,
  },

  dropBadge: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5,
  },

  amountValue: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: "800",
    letterSpacing: -1,
    color: Surface.text,
  },

  amountTotal: {
    ...Typography.label,
    color: Surface.textMuted,
  },

  amountPercent: {
    ...Typography.label,
    color: Blood.primary,
  },

  etaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  etaText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Surface.text,
  },

  rfidRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.softBlueBorder,
    backgroundColor: Surface.softBlue,
  },

  rfidText: {
    flex: 1,
    gap: 2,
  },

  rfidCode: {
    ...Typography.label,
    letterSpacing: 0.5,
    color: Surface.text,
  },

  rfidDetail: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  /* ================= LINKED CASE ================= */

  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softRedBorder,
  },

  statText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  personAvatar: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  personInitials: {
    ...Typography.label,
    color: Surface.text,
  },

  personText: {
    flex: 1,
    gap: 3,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  personName: {
    flexShrink: 1,
    ...Typography.cardTitle,
    color: Surface.text,
  },

  personMeta: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  personWard: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  noteText: {
    flex: 1,
    ...Typography.small,
    lineHeight: 17,
    color: Blood.primary,
  },

  /* ================= BUZZER ================= */

  buzzer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softBlue,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.softBlueBorder,
  },

  buzzerText: {
    ...Typography.small,
    fontWeight: "700",
    color: Surface.text,
  },

  /* ================= DECISIONS ================= */

  seal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    ...Elevation.button,
  },

  sealText: {
    flexShrink: 1,
    ...Typography.button,
    color: Surface.onPrimary,
  },

  halt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  haltText: {
    ...Typography.button,
    fontSize: 14,
    color: Blood.primary,
  },
});
