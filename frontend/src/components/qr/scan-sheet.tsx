/**
 * The scan surface every role gets.
 *
 * Wraps the camera in the same shell every time: a live view, a torch toggle,
 * the resolved pass, and — once something has been read — the action the
 * *scanner's* role is allowed to take. That last part is the reason this is one
 * component rather than a screen per role: the gate logic lives next to the
 * camera it follows, so it cannot drift from what the camera actually read.
 *
 * Manual entry is a first-class path, not an apology. A desk in a windowless
 * store room, a cracked camera, or a colleague holding up a laptop screen all
 * need it, and it accepts exactly the same payload the camera does.
 */

import { Feather } from "@expo/vector-icons";
import { useCallback, useState, type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { QrCodeScanner } from "@/components/qr-code-scanner";
import { KeyboardDismissView } from "@/components/ui/keyboard-dismiss";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_NAME } from "@/constants/roles";
import { Typography } from "@/constants/typography";
import { apiErrorMessage } from "@/services/auth";
import { resolvePass, type ResolvedPass } from "@/services/auth/pass-service";
import { haptics } from "@/utils/haptics";
import { passSecretOf } from "@/utils/qr-payload";

/** What the person holding the scanner is allowed to do with what they read. */
export type PassAction = {
  label: string;
  icon: ComponentProps<typeof Feather>["name"];
  onPress: () => void;
};

/**
 * The camera.
 *
 * Deliberately thin — the shared `QrCodeScanner` owns permissions, the
 * debounce, the torch and the framing, so this only picks the hint and reports
 * reads upward. Resolution, errors and manual entry live in `ScanSheet`, which
 * means the camera has no idea a pass server exists and neither screen can
 * drift from the other. Web returns nothing from `QrCodeScanner` (no reliable
 * BarcodeDetector), so the manual-entry path below is the web fallback.
 */
function ScanPane({
  onScanned,
  onCancel,
  isBusy,
}: {
  onScanned: (raw: string) => void;
  onCancel: () => void;
  isBusy: boolean;
}) {
  const [torch, setTorch] = useState(false);

  return (
    <View style={styles.pane}>
      <QrCodeScanner
        hint="Point at the pass on their profile"
        onScanned={onScanned}
        onCancel={onCancel}
        cancelLabel="Close"
        torch={torch}
        onToggleTorch={() => {
          haptics.light();
          setTorch((current) => !current);
        }}
        isBusy={isBusy}
      />
    </View>
  );
}

type ScanSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Actions the scanner's role may take once a pass resolves. */
  actionsFor?: (resolved: ResolvedPass) => PassAction[];
  /**
   * Called with the resolved owner and the raw pass secret.
   *
   * The secret is handed over rather than kept here because a caller may need to
   * act *for* this donor — the on-behalf desk action re-presents the same pass so
   * the server can resolve the donor itself. It is deliberately never placed in a
   * route param: URLs end up in history and logs.
   */
  onResolved?: (resolved: ResolvedPass, secret: string) => void;
  /** Replaces the role label in the heading, e.g. "Intake desk". */
  title?: string;
};

export function ScanSheet({
  visible,
  onClose,
  actionsFor,
  onResolved,
  title = "Scan a pass",
}: ScanSheetProps) {
  const [resolved, setResolved] = useState<ResolvedPass | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState("");

  const reset = useCallback(() => {
    setResolved(null);
    setError(null);
    setManual("");
    setShowManual(false);
  }, []);

  // Reset lives on the close paths rather than in an effect: the caller mounts
  // this sheet only while it is open, so unmounting is the reset, and the
  // "Scan another" button clears it explicitly.
  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleResolved = useCallback(
    (value: ResolvedPass | null, secret: string | null) => {
      if (value === null || secret === null) {
        setError("That pass is invalid or has expired. Ask them to rotate it.");
        setResolved(null);
        return;
      }

      setError(null);
      setResolved(value);
      setIsResolving(false);
      onResolved?.(value, secret);
    },
    [onResolved],
  );

  /**
   * A camera read follows the same path as manual entry: share the resolve
   * call, so a scan that succeeds or fails means the same thing either way.
   * `isResolving` is set before the await because the shared scanner checks it
   * to stop a second frame from queueing a second request.
   */
  const handleCameraRead = useCallback(
    (raw: string) => {
      const secret = passSecretOf(raw);

      // An intake ticket is a real code, but it is not an identity.
      if (secret === null) {
        haptics.warning();
        setError("That is a BloodLink intake pass, not an identity pass.");
        setResolved(null);
        return;
      }

      setIsResolving(true);
      setError(null);
      setResolved(null);

      void resolvePass(secret)
        .then((value) => {
          haptics.success();
          handleResolved(value, secret);
        })
        .catch((caught: unknown) => {
          haptics.error();
          setIsResolving(false);
          setError(apiErrorMessage(caught));
        });
    },
    [handleResolved],
  );

  const handleManual = useCallback(async () => {
    const trimmed = manual.trim();

    if (trimmed.length === 0 || isResolving) {
      return;
    }

    setIsResolving(true);
    setError(null);
    setResolved(null);

    const secret = passSecretOf(trimmed);

    if (secret === null) {
      setIsResolving(false);
      setError("That is not a BloodLink pass code.");
      return;
    }

    try {
      handleResolved(await resolvePass(secret), secret);
    } catch (caught) {
      setIsResolving(false);
      setError(apiErrorMessage(caught));
    }
  }, [manual, isResolving, handleResolved]);

  const actions = resolved === null || actionsFor === undefined ? [] : actionsFor(resolved);

  if (!visible) {
    return null;
  }

  return (
    <KeyboardDismissView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {resolved === null ? "Confirm who you are meeting" : "Pass verified"}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          hitSlop={8}
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
        >
          <Feather name="x" size={19} color={Surface.textSecondary} />
        </Pressable>
      </View>

      {resolved === null ? (
        <>
          <ScanPane onScanned={handleCameraRead} onCancel={handleClose} isBusy={isResolving} />

          {error !== null ? (
            <View style={styles.error} accessibilityLiveRegion="polite">
              <Feather name="alert-circle" size={14} color={Blood.primary} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {showManual ? (
            <View style={styles.manual}>
              <TextInput
                value={manual}
                onChangeText={setManual}
                placeholder="Paste the pass code"
                placeholderTextColor={Surface.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.manualInput}
                accessibilityLabel="Pass code"
                returnKeyType="go"
                onSubmitEditing={() => void handleManual()}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Verify code"
                accessibilityState={{ disabled: manual.trim().length === 0 || isResolving }}
                disabled={manual.trim().length === 0 || isResolving}
                onPress={() => void handleManual()}
                style={({ pressed }) => [
                  styles.manualButton,
                  pressed && styles.pressed,
                  (manual.trim().length === 0 || isResolving) && styles.manualButtonDisabled,
                ]}
              >
                <Text style={styles.manualButtonText}>
                  {isResolving ? "Checking…" : "Verify"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enter pass code manually"
              onPress={() => setShowManual(true)}
              style={({ pressed }) => [styles.manualLink, pressed && styles.pressed]}
            >
              <Feather name="edit-3" size={14} color={Blood.primary} />
              <Text style={styles.manualLinkText}>Enter code manually</Text>
            </Pressable>
          )}
        </>
      ) : (
        <View style={styles.result}>
          <View style={[styles.resultBadge, resolved.isSelf && styles.resultBadgeSelf]}>
            <Feather
              name={resolved.isSelf ? "user" : "check-circle"}
              size={26}
              color={resolved.isSelf ? Blood.primary : Surface.online}
            />
          </View>

          <Text style={styles.resultName} numberOfLines={2}>
            {resolved.owner.fullName}
          </Text>

          <View style={styles.resultPill}>
            <Text style={styles.resultPillText}>{ROLE_NAME[resolved.owner.role]}</Text>
          </View>

          <View style={styles.resultFacts}>
            {resolved.owner.bloodGroup !== null ? (
              <Fact icon="droplet" label="Blood group" value={resolved.owner.bloodGroup} />
            ) : null}

            {resolved.owner.station !== null ? (
              <Fact icon="map-pin" label="Station" value={resolved.owner.station} />
            ) : null}

            {resolved.owner.wardLabel !== null ? (
              <Fact icon="home" label="Ward" value={resolved.owner.wardLabel} />
            ) : null}

            {resolved.owner.district !== null ? (
              <Fact icon="map" label="District" value={resolved.owner.district} />
            ) : null}

            {resolved.owner.isVerified ? (
              <Fact icon="shield" label="Status" value="Verified account" />
            ) : null}
          </View>

          {resolved.isSelf ? (
            <Text style={styles.selfNote}>This is your own pass.</Text>
          ) : null}

          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <Feather name={action.icon} size={15} color={Surface.onPrimary} />
              <Text style={styles.actionText}>{action.label}</Text>
            </Pressable>
          ))}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Scan another pass"
            onPress={reset}
            style={({ pressed }) => [styles.actionSecondary, pressed && styles.pressed]}
          >
            <Text style={styles.actionSecondaryText}>Scan another</Text>
          </Pressable>
        </View>
      )}
    </KeyboardDismissView>
  );
}

function Fact({ icon, label, value }: { icon: ComponentProps<typeof Feather>["name"]; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Feather name={icon} size={13} color={Surface.textMuted} />
      <Text style={styles.factLabel}>{label}</Text>
      <Text style={styles.factValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  headerText: {
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

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  pane: {
    height: 340,
    borderRadius: Radius.card,
    overflow: "hidden",
    backgroundColor: "#111318",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },

  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  error: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  errorText: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Blood.primary,
  },

  manualLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 44,
  },

  manualLinkText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  manual: {
    gap: 10,
  },

  manualInput: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.borderStrong,
    backgroundColor: Surface.card,
    color: Surface.text,
    ...Typography.body,
  },

  manualButton: {
    height: 48,
    borderRadius: Radius.field,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  manualButtonDisabled: {
    opacity: 0.5,
  },

  manualButtonText: {
    ...Typography.button,
    fontWeight: "700",
    color: Surface.onPrimary,
  },

  result: {
    gap: 12,
    alignItems: "center",
    padding: 18,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  resultBadge: {
    width: 62,
    height: 62,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.softGreen,
    borderWidth: 1,
    borderColor: Surface.softGreenBorder,
  },

  resultBadgeSelf: {
    backgroundColor: Surface.softBlue,
    borderColor: Surface.softBlueBorder,
  },

  resultName: {
    ...Typography.title,
    color: Surface.text,
    textAlign: "center",
  },

  resultPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  resultPillText: {
    ...Typography.micro,
    fontSize: 10.5,
    fontWeight: "700",
    color: Blood.primary,
  },

  resultFacts: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },

  fact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  factLabel: {
    ...Typography.small,
    color: Surface.textMuted,
    width: 96,
  },

  factValue: {
    flex: 1,
    ...Typography.small,
    fontWeight: "600",
    color: Surface.text,
  },

  selfNote: {
    ...Typography.small,
    color: Surface.textMuted,
  },

  action: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 50,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },

  actionText: {
    ...Typography.button,
    fontWeight: "700",
    color: Surface.onPrimary,
  },

  actionSecondary: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  actionSecondaryText: {
    ...Typography.small,
    fontWeight: "700",
    color: Blood.primary,
  },

  pressed: {
    opacity: 0.75,
  },
});
