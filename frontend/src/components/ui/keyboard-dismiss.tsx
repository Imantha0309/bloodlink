import type { ReactNode } from "react";
import { Keyboard, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";

type KeyboardDismissViewProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Tapping anywhere that is not itself interactive puts the keyboard away.
 *
 * Replaces the root `View` on screens that take input. Without it the keyboard
 * has exactly two ways out — the platform's dismiss affordance, or a drag on the
 * three screens that set `keyboardDismissMode` — so on the rest, tapping the
 * background left it up with nothing apparently responding.
 *
 * ## Why a `Pressable` and not `TouchableWithoutFeedback`
 *
 * This works because of how the responder is negotiated, and the order is the
 * whole trick:
 *
 *   - a **drag** is claimed by the `ScrollView` on *move*, so scrolling is
 *     untouched;
 *   - a **tap on a button** is claimed by that button on *start*, so the button
 *     still fires and the keyboard deliberately stays up — the iOS convention,
 *     and the reason there is no per-button wiring anywhere;
 *   - a **tap on empty space** reaches this view, which is the only candidate
 *     left, and dismisses.
 *
 * `TouchableWithoutFeedback` claims the responder on start too, so it would take
 * taps that belong to the content inside it.
 *
 * ## The one thing this shadows
 *
 * A `RefreshControl` on the *same* view. A screen that pulls to refresh must
 * keep the `ScrollView` as this component's parent, not put the control inside
 * it — `DashboardShell` already does the right thing by owning the refreshable
 * `ScrollView` itself and rendering children inside it.
 */
export function KeyboardDismissView({ children, style }: KeyboardDismissViewProps) {
  return (
    <Pressable
      // A full-screen invisible button would otherwise be announced as one.
      accessible={false}
      onPress={Keyboard.dismiss}
      style={[styles.fill, style]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
