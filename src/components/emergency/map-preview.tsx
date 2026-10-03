import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type MapPreviewProps = {
  /** Area name shown at the centre of the map, e.g. "Colombo". */
  area: string;
  /** Short caption under the area name, e.g. "Western Province". */
  areaDetail?: string;
};

/**
 * Decorative stand-in for a map.
 *
 * There is no maps SDK in the project and this brief explicitly rules out adding
 * one, so this draws a schematic of the area the request covers: a tinted base,
 * a few road runs, two district labels and the facility pin. It is
 * `accessibilityElementsHidden` because it conveys nothing a screen reader can
 * use — the coverage card below states the same information as text.
 *
 * Roads are absolutely-positioned Views rather than an SVG so the whole thing
 * stays dependency-free.
 */
export function MapPreview({ area, areaDetail }: MapPreviewProps) {
  return (
    <View
      style={styles.map}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Land tint */}
      <View style={styles.base} />

      {/* Road runs. Widths and angles are fixed; the composition is decorative. */}
      <View style={[styles.road, styles.roadHorizontal]} />
      <View style={[styles.road, styles.roadHorizontalLow]} />
      <View style={[styles.road, styles.roadDiagonalA]} />
      <View style={[styles.road, styles.roadDiagonalB]} />
      <View style={[styles.road, styles.roadVertical]} />

      <Text style={[styles.mapLabel, styles.mapLabelLeft]} numberOfLines={1}>
        Kandy
      </Text>

      <Text style={[styles.mapLabel, styles.mapLabelRight]} numberOfLines={1}>
        Dehiwala
      </Text>

      {/* Facility pin, centred on the coverage area. */}
      <View style={styles.pinWrap}>
        <View style={styles.pinHalo} />

        <View style={styles.pin}>
          <Feather name="map-pin" size={13} color={Surface.onPrimary} />
        </View>
      </View>

      <View style={styles.areaBlock}>
        <Text style={styles.area} numberOfLines={1}>
          {area}
        </Text>

        {areaDetail !== undefined ? (
          <Text style={styles.areaDetail} numberOfLines={1}>
            {areaDetail}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 116,
    overflow: "hidden",
    backgroundColor: Surface.softBlue,
    borderTopLeftRadius: Radius.field,
    borderTopRightRadius: Radius.field,
  },

  base: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#E4EEF9",
  },

  road: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },

  roadHorizontal: {
    top: 34,
    left: -10,
    right: -10,
    height: 3,
  },

  roadHorizontalLow: {
    top: 74,
    left: -10,
    right: -10,
    height: 2,
  },

  roadDiagonalA: {
    top: -20,
    left: 78,
    width: 3,
    height: 170,
    transform: [{ rotate: "22deg" }],
  },

  roadDiagonalB: {
    top: -20,
    left: 226,
    width: 2,
    height: 170,
    transform: [{ rotate: "-14deg" }],
  },

  roadVertical: {
    top: -20,
    left: 168,
    width: 2,
    height: 170,
    transform: [{ rotate: "6deg" }],
  },

  mapLabel: {
    ...Typography.micro,
    fontSize: 7.5,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: "#8A9BB0",
    position: "absolute",
  },

  mapLabelLeft: {
    top: 22,
    left: 16,
  },

  mapLabelRight: {
    top: 90,
    right: 16,
  },

  pinWrap: {
    position: "absolute",
    top: 30,
    left: "50%",
    marginLeft: -18,
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },

  /** Soft ring behind the pin so it stays legible over the roads. */
  pinHalo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: Radius.full,
    backgroundColor: Blood.glow,
  },

  pin: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  areaBlock: {
    position: "absolute",
    bottom: 9,
    alignSelf: "center",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: Surface.card,
  },

  area: {
    ...Typography.micro,
    fontSize: 9,
    letterSpacing: 0.1,
    color: Surface.text,
  },

  areaDetail: {
    ...Typography.micro,
    fontSize: 7.5,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: Surface.textMuted,
  },
});