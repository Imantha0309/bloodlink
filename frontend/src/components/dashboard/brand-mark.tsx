import { StyleSheet, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";

type BrandMarkProps = {
  /** Square edge length. The drop scales proportionally. */
  size?: number;
};

/**
 * The BloodLink mark: a red rounded square with a white drop rotated 45°.
 *
 * Geometry matches the splash screen's inline logo (`src/app/index.tsx`) so the
 * identity reads the same on first launch and in the app chrome.
 */
export function BrandMark({ size = 30 }: BrandMarkProps) {
  return (
    <View
      style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="BloodLink"
    >
      <View
        style={[
          styles.drop,
          {
            width: size * 0.46,
            height: size * 0.59,
            borderTopLeftRadius: size * 0.32,
            borderTopRightRadius: size * 0.32,
            borderBottomLeftRadius: size * 0.32,
            borderBottomRightRadius: size * 0.09,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  drop: {
    backgroundColor: Surface.onPrimary,
    transform: [{ rotate: "45deg" }],
  },
});