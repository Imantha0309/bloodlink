/**
 * Haptic feedback, funnelled through one tiny module.
 *
 * Every call is fire-and-forget: feedback is a side effect, so a missing
 * vibration service (web, some emulators) must never throw into a screen.
 */

import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const supported = Platform.OS === "ios" || Platform.OS === "android";

function fire(pattern: () => Promise<void>): void {
  if (!supported) return;
  pattern().catch(() => {});
}

export const haptics = {
  /** Selection ticks — availability switch, chip taps. */
  light: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),

  /** Commitments — accept request, start transit. */
  medium: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),

  /** Heavy confirmations — extraction complete, case completion. */
  heavy: () => fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  success: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),

  warning: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),

  error: () => fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
