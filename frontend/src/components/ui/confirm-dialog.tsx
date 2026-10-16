import { Feather } from "@expo/vector-icons";
import { useEffect, type ComponentProps } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

export type FeatherName = ComponentProps<typeof Feather>["name"];

export type ConfirmChoice = {
  label: string;
  destructive?: boolean;
};

/**
 * The one confirmation surface for the whole app.
 *
 * `Alert.alert` cannot be used for this: react-native-web ships `Alert` as an
 * empty stub (`static alert() {}`), so on web — desktop *and* mobile browser —
 * every confirm prompt silently does nothing and the button behind it looks
 * dead. `Modal` is implemented on both platforms, so this renders the same
 * dialog everywhere and the actions actually fire.
 *
 * Three shapes are supported by the same markup:
 *   - alert:   no `cancelLabel`, no `choices`      -> one button
 *   - confirm: `cancelLabel` + `confirmLabel`      -> two buttons
 *   - choose:  `cancelLabel` + `choices`           -> a stack of buttons
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  icon = "alert-triangle",
  cancelLabel,
  cancelDestructive = false,
  confirmLabel = "OK",
  choices,
  onChoice,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message?: string;
  icon?: FeatherName;
  /** Left button. Omit for the single-button alert shape. */
  cancelLabel?: string;
  cancelDestructive?: boolean;
  /** Right button. Ignored when `choices` is given. */
  confirmLabel?: string;
  /** Action-sheet shape — one button per row, rendered under the message. */
  choices?: ConfirmChoice[];
  /** Required whenever `choices` is given; receives the tapped label. */
  onChoice?: (label: string) => void;
  /** Paints the confirm button in the danger red. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Escape closes the dialog on the web, which has no hardware back button and
  // where RNW's `Modal` does not wire the key itself.
  useEffect(() => {
    if (!visible || Platform.OS !== "web") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onCancel]);

  const confirmColor = destructive ? Surface.danger : Blood.primary;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Tapping the dimmed area is a second route to cancel, so it is kept
            out of the accessibility tree: the explicit Cancel button is the
            discoverable one, and an invisible full-screen button would
            otherwise swallow VoiceOver focus. */}
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.dialog} accessibilityViewIsModal accessibilityLiveRegion="polite">
          <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
            <Feather name={icon} size={24} color={destructive ? Surface.danger : Blood.primary} />
          </View>

          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>

          {message !== undefined ? <Text style={styles.message}>{message}</Text> : null}

          {choices !== undefined ? (
            <View style={styles.choiceStack}>
              {choices.map((choice) => (
                <Pressable
                  key={choice.label}
                  accessibilityRole="button"
                  accessibilityLabel={choice.label}
                  onPress={() => {
                    onChoice?.(choice.label);
                  }}
                  style={({ pressed }) => [styles.choiceButton, pressed && styles.pressed]}
                >
                  <Text
                    style={[
                      styles.choiceText,
                      choice.destructive === true && styles.choiceTextDestructive,
                    ]}
                  >
                    {choice.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.actions}>
              {cancelLabel !== undefined ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={cancelLabel}
                  onPress={onCancel}
                  style={({ pressed }) => [
                    styles.actionButton,
                    cancelDestructive && styles.actionButtonCancelDestructive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.cancelText,
                      cancelDestructive && styles.cancelTextDestructive,
                    ]}
                  >
                    {cancelLabel}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.confirmButton,
                  { backgroundColor: confirmColor },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.confirmText}>{confirmLabel}</Text>
              </Pressable>
            </View>
          )}

          {choices !== undefined && cancelLabel !== undefined ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={cancelLabel}
              onPress={onCancel}
              style={({ pressed }) => [styles.cancelOnly, pressed && styles.pressed]}
            >
              <Text style={styles.cancelOnlyText}>{cancelLabel}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 24, 38, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  dialog: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: Surface.card,
    borderRadius: Radius.card + 4,
    padding: 22,
    alignItems: "center",
    gap: 12,
    ...Elevation.card,
  },

  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Surface.softRed,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapDestructive: {
    backgroundColor: Surface.softRed,
    borderWidth: 1,
    borderColor: Surface.softRedBorder,
  },

  title: {
    ...Typography.cardTitle,
    fontSize: 18,
    color: Surface.text,
    textAlign: "center",
  },

  message: {
    ...Typography.small,
    color: Surface.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  actions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 6,
  },

  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.background,
  },

  actionButtonCancelDestructive: {
    borderColor: Surface.softRedBorder,
    backgroundColor: Surface.softRed,
  },

  confirmButton: {
    flex: 1.2,
    borderWidth: 0,
  },

  cancelText: {
    ...Typography.button,
    fontSize: 14,
    color: Surface.text,
  },

  cancelTextDestructive: {
    color: Surface.danger,
  },

  confirmText: {
    ...Typography.button,
    fontSize: 14,
    color: Surface.onPrimary,
  },

  choiceStack: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },

  choiceButton: {
    minHeight: 48,
    borderRadius: Radius.field,
    borderWidth: 1,
    borderColor: Surface.border,
    backgroundColor: Surface.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },

  choiceText: {
    ...Typography.button,
    fontSize: 14,
    color: Surface.text,
  },

  choiceTextDestructive: {
    color: Surface.danger,
  },

  cancelOnly: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },

  cancelOnlyText: {
    ...Typography.button,
    fontSize: 14,
    color: Surface.textSecondary,
  },

  pressed: {
    opacity: 0.8,
  },
});
