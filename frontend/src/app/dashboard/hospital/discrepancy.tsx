import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FormAlert } from "@/components/auth/form-alert";
import { PrimaryAuthButton } from "@/components/auth/primary-auth-button";
import { StepHeader } from "@/components/emergency/step-header";
import { AsyncState } from "@/components/ui/async-state";
import { OptionChips } from "@/components/ui/option-chips";
import { SkeletonCard } from "@/components/ui/skeleton";
import { TextField } from "@/components/ui/text-field";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";
import { useHomeBack } from "@/hooks/use-home-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/api/errors";
import {
  createDiscrepancyReport,
  listDiscrepancyReports,
  resolveDiscrepancyReport,
  DISCREPANCY_SEVERITIES,
  DISCREPANCY_TYPES,
  type DiscrepancyReport,
  type DiscrepancySeverity,
  type DiscrepancyType,
} from "@/services/hospital/discrepancies";
import { timeAgo } from "@/utils/time";

const TYPE_LABELS: Record<DiscrepancyType, string> = {
  labeling: "Labeling",
  volume: "Volume",
  hemolysis: "Hemolysis",
  transport: "Transport",
  other: "Other",
};

const SEVERITY_LABELS: Record<DiscrepancySeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/** Only critical and high read as urgent; the rest stay neutral. */
function isUrgent(severity: DiscrepancySeverity): boolean {
  return severity === "critical" || severity === "high";
}

/**
 * Discrepancy reporting — bag labeling, volume, hemolysis and transport errors.
 *
 * Reports are append-only and never deleted: resolving one records who dealt
 * with it, because a transfusion incident log that can be quietly tidied away is
 * not an audit trail. The list defaults to open reports; the toggle brings the
 * closed ones back so the history is still reachable.
 */
export default function HospitalDiscrepancyScreen() {
  const insets = useSafeAreaInsets();
  const onBack = useHomeBack();
  const { session } = useAuth();

  const [includeResolved, setIncludeResolved] = useState(false);
  const [reports, setReports] = useState<DiscrepancyReport[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [type, setType] = useState<DiscrepancyType>("labeling");
  const [severity, setSeverity] = useState<DiscrepancySeverity>("medium");
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initial load: state only changes inside the promise callbacks, so the effect
  // body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    listDiscrepancyReports(includeResolved)
      .then((data) => {
        if (!cancelled) {
          setReports(data);
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
  }, [includeResolved]);

  /** Retry — invoked from event handlers only. */
  async function reload(next: boolean) {
    setIsLoading(true);
    setError(null);

    try {
      setReports(await listDiscrepancyReports(next));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const filed = await createDiscrepancyReport({
        type,
        severity,
        detail: detail.trim(),
      });

      // Only splice it in when the open-only filter would hide it anyway.
      setReports((current) => {
        const rest = (current ?? []).filter((report) => report.id !== filed.id);

        return includeResolved || !filed.resolved ? [filed, ...rest] : rest;
      });
      setDetail("");
    } catch (caught) {
      setFormError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResolve(id: string) {
    if (busyId !== null) {
      return;
    }

    setBusyId(id);

    try {
      await resolveDiscrepancyReport(id);

      // Mark locally rather than refetching: the report was on screen a moment
      // ago, and the open-only view should drop it without a round trip.
      setReports((current) =>
        (current ?? [])
          .map((report) => (report.id === id ? { ...report, resolved: true } : report))
          .filter((report) => includeResolved || !report.resolved),
      );
    } catch (caught) {
      setFormError(apiErrorMessage(caught));
    } finally {
      setBusyId(null);
    }
  }

  const district = session?.user.district ?? null;
  const openCount = (reports ?? []).filter((report) => !report.resolved).length;

  return (
    <KeyboardDismissView style={styles.root}>
      <StepHeader title="Report Discrepancy" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          {district !== null ? `${district} District` : "Your station"} — filed to the national
          incident log. Near misses are worth reporting too.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>File a report</Text>

          <OptionChips
            label="What went wrong"
            options={DISCREPANCY_TYPES}
            value={type}
            onChange={(value) => {
              setType(value);
              setFormError(null);
            }}
            labelFor={(value) => TYPE_LABELS[value]}
          />

          <OptionChips
            label="Severity"
            options={DISCREPANCY_SEVERITIES}
            value={severity}
            onChange={(value) => {
              setSeverity(value);
              setFormError(null);
            }}
            labelFor={(value) => SEVERITY_LABELS[value]}
          />

          <TextField
            label="What happened"
            value={detail}
            onChangeText={(value) => {
              setDetail(value);
              setFormError(null);
            }}
            placeholder="Unit number, what was observed, and what was done."
            multiline
          />

          {formError !== null ? <FormAlert message={formError} /> : null}

          <PrimaryAuthButton
            label={isSubmitting ? "Filing…" : "File report"}
            icon="check"
            disabled={isSubmitting || detail.trim() === ""}
            onPress={() => void handleSubmit()}
          />
        </View>

        <View style={styles.listHead}>
          <Text style={styles.listHeading}>{openCount} open</Text>

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: includeResolved }}
            accessibilityLabel="Show resolved reports"
            onPress={() => {
              const next = !includeResolved;
              setIncludeResolved(next);
              void reload(next);
            }}
            style={({ pressed }) => [styles.toggle, includeResolved && styles.toggleOn, pressed && styles.pressed]}
          >
            <Text style={[styles.toggleText, includeResolved && styles.toggleTextOn]}>
              {includeResolved ? "Showing resolved" : "Show resolved"}
            </Text>
          </Pressable>
        </View>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={(reports ?? []).length === 0}
          emptyTitle={includeResolved ? "No reports on file" : "Nothing outstanding"}
          emptyMessage={
            includeResolved
              ? "No discrepancies have been reported for your district."
              : "No open discrepancy reports. Every incident on file has been dealt with."
          }
          skeleton={
            <View style={styles.list}>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          }
          onRetry={() => {
            void reload(includeResolved);
          }}
        >
          <View style={styles.list}>
            {(reports ?? []).map((report) => (
              <View
                key={report.id}
                style={[styles.entry, report.resolved && styles.entryResolved]}
              >
                <View style={styles.entryTop}>
                  <View
                    style={[
                      styles.severityMark,
                      isUrgent(report.severity) && styles.severityMarkUrgent,
                    ]}
                  >
                    <Text
                      style={[
                        styles.severityText,
                        isUrgent(report.severity) && styles.severityTextUrgent,
                      ]}
                    >
                      {SEVERITY_LABELS[report.severity]}
                    </Text>
                  </View>

                  <View style={styles.entryText}>
                    <Text style={styles.entryType}>{TYPE_LABELS[report.type]}</Text>
                    <Text style={styles.entryAuthor} numberOfLines={1}>
                      {report.reporterName} · {timeAgo(report.createdAt)}
                    </Text>
                  </View>
                </View>

                <Text style={styles.entryDetail}>{report.detail}</Text>

                {report.resolved ? (
                  <View style={styles.resolvedNote}>
                    <Feather name="check-circle" size={13} color={Surface.textSecondary} />
                    <Text style={styles.resolvedText}>
                      Resolved {report.resolvedAt === null ? "" : timeAgo(report.resolvedAt)}
                    </Text>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Mark the ${TYPE_LABELS[report.type]} report resolved`}
                    disabled={busyId !== null}
                    onPress={() => void handleResolve(report.id)}
                    style={({ pressed }) => [styles.resolve, pressed && styles.pressed]}
                  >
                    <Text style={styles.resolveText}>
                      {busyId === report.id ? "Resolving…" : "Mark resolved"}
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </AsyncState>
      </ScrollView>
    </KeyboardDismissView>
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
    gap: 14,
  },

  subtitle: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  formCard: {
    gap: 12,
    padding: 14,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  formTitle: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  listHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  listHeading: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  toggle: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: Surface.iconWash,
    borderWidth: 1,
    borderColor: Surface.border,
  },

  toggleOn: {
    backgroundColor: Surface.softRed,
    borderColor: Surface.softRedBorder,
  },

  toggleText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },

  toggleTextOn: {
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.7,
  },

  list: {
    gap: 10,
  },

  entry: {
    gap: 9,
    padding: 13,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  entryResolved: {
    opacity: 0.65,
  },

  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  severityMark: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.iconWash,
  },

  severityMarkUrgent: {
    backgroundColor: Surface.softRed,
  },

  severityText: {
    ...Typography.micro,
    fontSize: 9.5,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },

  severityTextUrgent: {
    color: Blood.primary,
  },

  entryText: {
    flex: 1,
    gap: 1,
  },

  entryType: {
    ...Typography.label,
    fontSize: 12.5,
    color: Surface.text,
  },

  entryAuthor: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  entryDetail: {
    ...Typography.small,
    fontSize: 12,
    lineHeight: 17,
    color: Surface.text,
  },

  resolve: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  resolveText: {
    ...Typography.micro,
    fontSize: 10,
    color: Blood.primary,
  },

  resolvedNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  resolvedText: {
    ...Typography.micro,
    fontSize: 10,
    letterSpacing: 0.1,
    color: Surface.textSecondary,
  },
});
