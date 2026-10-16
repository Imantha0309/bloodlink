import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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
  createShiftHandover,
  listShiftHandovers,
  type ShiftHandover,
} from "@/services/hospital/handovers";
import { timeAgo } from "@/utils/time";

/** Shift label as typed. The catalogue keeps the format consistent. */
const SHIFT_OPTIONS = [
  "Day shift · 08:00–20:00",
  "Night shift · 20:00–08:00",
  "Evening shift · 14:00–22:00",
  "Weekend cover",
] as const;

/**
 * Shift handover log.
 *
 * One district's desk at a time — the server scopes both the read and the write
 * to the caller's own verified row, so a hospital sees only its district and an
 * admin sees everything. Entries are never edited or deleted after filing: a
 * handover is a record of what the outgoing shift believed, not a status.
 */
export default function HospitalHandoverScreen() {
  const insets = useSafeAreaInsets();
  const onBack = useHomeBack();
  const { session } = useAuth();

  const [handovers, setHandovers] = useState<ShiftHandover[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [shiftLabel, setShiftLabel] = useState<string>(SHIFT_OPTIONS[0]);
  const [notes, setNotes] = useState("");
  const [pendingCrossMatches, setPendingCrossMatches] = useState("0");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Initial load: state only changes inside the promise callbacks, so the effect
  // body itself never triggers a cascading render.
  useEffect(() => {
    let cancelled = false;

    listShiftHandovers()
      .then((data) => {
        if (!cancelled) {
          setHandovers(data);
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
  async function reload() {
    setIsLoading(true);
    setError(null);

    try {
      setHandovers(await listShiftHandovers());
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
      const filed = await createShiftHandover({
        shiftLabel,
        notes: notes.trim(),
        pendingCrossMatches: Math.max(0, Number.parseInt(pendingCrossMatches, 10) || 0),
      });

      // Prepend rather than refetch — the endpoint returns the stored row, and
      // the list is ordered newest-first anyway.
      setHandovers((current) => [filed, ...(current ?? [])]);
      setNotes("");
      setPendingCrossMatches("0");
    } catch (caught) {
      setFormError(apiErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  }

  const district = session?.user.district ?? null;

  return (
    <KeyboardDismissView style={styles.root}>
      <StepHeader title="Shift Handover Log" onBack={onBack} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          {district !== null ? `${district} District` : "Your station"} — what the outgoing shift
          needs the next one to know.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>File a handover</Text>

          <OptionChips
            label="Shift"
            options={SHIFT_OPTIONS}
            value={shiftLabel}
            onChange={(value) => {
              setShiftLabel(value);
              setFormError(null);
            }}
            labelFor={(option) => option.split(" · ")[0]}
          />

          <TextField
            label="Notes for the incoming shift"
            value={notes}
            onChangeText={(value) => {
              setNotes(value);
              setFormError(null);
            }}
            placeholder="Pending cross-matches, stock shortfalls, follow-ups…"
            multiline
          />

          <TextField
            label="Pending cross-matches"
            value={pendingCrossMatches}
            onChangeText={(value) => {
              setPendingCrossMatches(value.replace(/[^0-9]/g, ""));
            }}
            placeholder="0"
            keyboardType="number-pad"
            hint="Left open by the outgoing shift"
          />

          {formError !== null ? <FormAlert message={formError} /> : null}

          <PrimaryAuthButton
            label={isSubmitting ? "Filing…" : "File handover"}
            icon="check"
            disabled={isSubmitting || notes.trim() === ""}
            onPress={() => void handleSubmit()}
          />
        </View>

        <Text style={styles.listHeading}>Recent handovers</Text>

        <AsyncState
          isLoading={isLoading}
          error={error}
          isEmpty={(handovers ?? []).length === 0}
          emptyTitle="No handovers yet"
          emptyMessage="The log is empty for your district. The first entry you file appears here."
          skeleton={
            <View style={styles.list}>
              <SkeletonCard lines={3} />
              <SkeletonCard lines={3} />
            </View>
          }
          onRetry={() => {
            void reload();
          }}
        >
          <View style={styles.list}>
            {(handovers ?? []).map((handover) => (
              <View key={handover.id} style={styles.entry}>
                <View style={styles.entryTop}>
                  <View style={styles.entryIcon}>
                    <Feather name="clipboard" size={14} color={Surface.text} />
                  </View>

                  <View style={styles.entryText}>
                    <Text style={styles.entryShift} numberOfLines={1}>
                      {handover.shiftLabel}
                    </Text>
                    <Text style={styles.entryAuthor} numberOfLines={1}>
                      {handover.authorName} · {timeAgo(handover.createdAt)}
                    </Text>
                  </View>

                  {handover.pendingCrossMatches > 0 ? (
                    <View style={styles.pendingPill}>
                      <Text style={styles.pendingText}>{handover.pendingCrossMatches} open</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.entryNotes}>{handover.notes}</Text>
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

  listHeading: {
    ...Typography.cardTitle,
    fontSize: 14,
    color: Surface.text,
  },

  list: {
    gap: 10,
  },

  entry: {
    gap: 8,
    padding: 13,
    borderRadius: Radius.field,
    backgroundColor: Surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  entryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  entryIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
  },

  entryText: {
    flex: 1,
    gap: 1,
  },

  entryShift: {
    ...Typography.label,
    fontSize: 12.5,
    color: Surface.text,
  },

  entryAuthor: {
    ...Typography.small,
    fontSize: 10.5,
    color: Surface.textSecondary,
  },

  pendingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
  },

  pendingText: {
    ...Typography.micro,
    fontSize: 9.5,
    color: Blood.primary,
  },

  entryNotes: {
    ...Typography.small,
    fontSize: 12,
    lineHeight: 17,
    color: Surface.text,
  },
});
