import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StepHeader } from "@/components/emergency/step-header";
import { Blood, Surface } from "@/constants/colors";
import { GUIDELINE_SECTIONS, GUIDELINES_EDITION } from "@/constants/guidelines";
import { Radius } from "@/constants/radius";
import { ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useAuthBack } from "@/hooks/use-auth-back";

/**
 * NBTS transfusion guidelines, carried on the device.
 *
 * Read-only on purpose: this is published protocol, so there is nothing for a
 * clinician to edit and nothing to keep in sync server-side beyond the edition
 * number. Sections are collapsed by default because a clinician opening this is
 * usually looking for one specific rule.
 */
export default function HospitalGuidelinesScreen() {
  const insets = useSafeAreaInsets();
  const onBack = useAuthBack(ROUTES.hospitalProfile);

  const [openSection, setOpenSection] = useState<string | null>(GUIDELINE_SECTIONS[0]?.id ?? null);

  return (
    <View style={styles.root}>
      <StepHeader title="Transfusion Guidelines" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.editionRow}>
          <View style={styles.editionPill}>
            <Feather name="book" size={11} color={Blood.primary} />
            <Text style={styles.editionText}>NBTS EDITION {GUIDELINES_EDITION}</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Clinical protocol for the transfusion service. Tap a section to read it in full.
        </Text>

        {GUIDELINE_SECTIONS.map((section) => {
          const isOpen = openSection === section.id;

          return (
            <View key={section.id} style={styles.card}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
                accessibilityLabel={section.title}
                onPress={() => {
                  setOpenSection(isOpen ? null : section.id);
                }}
                style={({ pressed }) => [styles.cardHead, pressed && styles.pressed]}
              >
                <View style={styles.headText}>
                  <Text style={styles.cardTitle}>{section.title}</Text>
                  <Text style={styles.cardSummary}>{section.summary}</Text>
                </View>

                <Feather
                  name={isOpen ? "chevron-down" : "chevron-right"}
                  size={18}
                  color={Surface.textSecondary}
                />
              </Pressable>

              {isOpen ? (
                <View style={styles.cardBody}>
                  {section.points.map((point) => (
                    <View key={point} style={styles.pointRow}>
                      <View style={styles.bullet} />
                      <Text style={styles.point}>{point}</Text>
                    </View>
                  ))}

                  {section.caution !== undefined ? (
                    <View style={styles.caution}>
                      <Feather name="alert-triangle" size={13} color={Blood.primary} />
                      <Text style={styles.cautionText}>{section.caution}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          );
        })}

        <Text style={styles.footer}>
          This copy is bundled with the app. Verify against the current NBTS circular before
          relying on it in a live transfusion.
        </Text>
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
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
  },

  editionRow: {
    flexDirection: "row",
  },

  editionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  editionText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  intro: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  card: {
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    overflow: "hidden",
  },

  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },

  pressed: {
    opacity: 0.7,
  },

  headText: {
    flex: 1,
    gap: 3,
  },

  cardTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  cardSummary: {
    ...Typography.small,
    fontSize: 11.5,
    lineHeight: 16,
    color: Surface.textSecondary,
  },

  cardBody: {
    gap: 9,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  bullet: {
    width: 5,
    height: 5,
    marginTop: 7,
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
  },

  point: {
    flex: 1,
    ...Typography.small,
    fontSize: 12.5,
    lineHeight: 18,
    color: Surface.text,
  },

  caution: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 2,
    padding: 11,
    borderRadius: Radius.sm,
    backgroundColor: Surface.softRed,
  },

  cautionText: {
    flex: 1,
    ...Typography.small,
    fontSize: 11.5,
    lineHeight: 16,
    fontWeight: "600",
    color: Blood.primary,
  },

  footer: {
    ...Typography.small,
    fontSize: 11,
    lineHeight: 16,
    color: Surface.textMuted,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
