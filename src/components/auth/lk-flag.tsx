import { StyleSheet, View } from "react-native";

import { Radius } from "@/constants/radius";

/**
 * National flag colours. These are the actual flag colours, not brand UI
 * colours, so they live next to the component that needs them rather than in
 * `Surface`.
 */
const FLAG = {
  gold: "#FFC72C",
  green: "#00534E",
  orange: "#FF883E",
  maroon: "#9E1F32",
  white: "#FFFFFF",
} as const;

const MAROON_RATIO = 0.5;

type LkFlagProps = {
  width?: number;
  /** Hide the accessibility label when the flag is purely decorative. */
  decorative?: boolean;
};

/**
 * Sri Lankan flag drawn from plain views — no image asset and no SVG
 * dependency. Honest at small sizes: four colour bands plus the maroon hoist
 * panel with its four gold bo leaves. The lion is not legible at 24x16 and is
 * omitted rather than faked.
 */
export function LkFlag({ width = 24, decorative = false }: LkFlagProps) {
  const height = Math.round(width * (2 / 3));
  const maroonWidth = width * MAROON_RATIO;
  const bandHeight = height / 4;

  return (
    <View
      accessible={!decorative}
      accessibilityRole="image"
      accessibilityLabel="Flag of Sri Lanka"
      style={[styles.container, { width, height }]}
    >
      <View style={[styles.maroon, { width: maroonWidth, height }]}>
        {/* Four gold bo leaves, 2x2, as on the real flag. */}
        <View style={[styles.leaf, { top: height * 0.16, left: maroonWidth * 0.22 }]} />
        <View style={[styles.leaf, { top: height * 0.16, left: maroonWidth * 0.62 }]} />
        <View style={[styles.leaf, { top: height * 0.6, left: maroonWidth * 0.22 }]} />
        <View style={[styles.leaf, { top: height * 0.6, left: maroonWidth * 0.62 }]} />
      </View>

      <View style={{ width: width - maroonWidth, height }}>
        <View style={[styles.band, { height: bandHeight, backgroundColor: FLAG.gold }]} />
        <View style={[styles.band, { height: bandHeight, backgroundColor: FLAG.green }]} />
        <View style={[styles.band, { height: bandHeight, backgroundColor: FLAG.orange }]} />
        <View style={[styles.band, { height: bandHeight, backgroundColor: FLAG.white }]} />
      </View>
    </View>
  );
}

const leafSize = 3;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: FLAG.maroon,
  },

  maroon: {
    backgroundColor: FLAG.maroon,
  },

  band: {
    width: "100%",
  },

  leaf: {
    position: "absolute",
    width: leafSize,
    height: leafSize,
    borderRadius: Radius.full,
    backgroundColor: FLAG.gold,
  },
});