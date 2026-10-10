import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { Typography } from "@/constants/typography";

type MapPreviewProps = {
  /** Area name shown at the centre of the map, e.g. "Colombo". */
  area: string;
};

/**
 * Decorative stand-in for a map.
 *
 * There is no maps SDK in the project and this brief explicitly rules out adding
 * one, so this draws a schematic of the coast the request covers: pale land, the
 * Indian Ocean along the lower edge, a handful of arterial roads, two parks and
 * the facility pin.
 *
 * It is `accessibilityElementsHidden` because it conveys nothing a screen reader
 * can use — the coverage card below states the same information as text.
 *
 * Geometry is absolutely-positioned Views using percentages rather than an SVG,
 * so it scales across phone widths and stays dependency-free.
 */
export function MapPreview({ area }: MapPreviewProps) {
  return (
    <View
      style={styles.map}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Land */}
      <View style={styles.land} />

      {/* Parks, under the road network the way a real basemap layers them. */}
      <View style={[styles.park, styles.parkInner]} />
      <View style={[styles.park, styles.parkOuter]} />

      {/* Arterials: two coast-parallel runs plus two inland diagonals. */}
      <View style={[styles.road, styles.roadNorth]} />
      <View style={[styles.road, styles.roadSouth]} />
      <View style={[styles.road, styles.roadKandy]} />
      <View style={[styles.road, styles.roadAirport]} />
      <View style={[styles.road, styles.roadMinorA]} />
      <View style={[styles.road, styles.roadMinorB]} />
      <View style={[styles.road, styles.railway]} />

      {/* Ocean, drawn over the roads so the shoreline clips them. */}
      <View style={styles.water} />

      {/* Shoreline hairline, to read as a coast rather than a colour band. */}
      <View style={styles.coastline} />

      {/* Road labels */}
      <Text style={[styles.roadLabel, styles.roadLabelNorth]}>A12</Text>
      <Text style={[styles.roadLabel, styles.roadLabelSouth]}>Galle Rd</Text>

      {/* Place labels */}
      <Text style={[styles.placeLabel, styles.placeAirport]}>Katunayake</Text>
      <Text style={[styles.placeLabel, styles.placeKandy]}>Kandy</Text>
      <Text style={[styles.placeLabel, styles.placeGalle]}>Galle</Text>
      <Text style={[styles.placeLabel, styles.placeDehiwala]}>Dehiwala</Text>

      {/* Facility pin, centred on the coverage area. */}
      <View style={styles.pinWrap}>
        <View style={styles.pinHalo} />

        <View style={styles.pin}>
          <Feather name="map-pin" size={12} color={Surface.onPrimary} />
        </View>
      </View>

      <Text style={styles.area} numberOfLines={1}>
        {area}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 112,
    overflow: "hidden",
    backgroundColor: Surface.softBlue,
    borderRadius: Radius.field,
  },

  /** Pale sage so the land separates from the blue-white cards around it. */
  land: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F1F4EF",
  },

  park: {
    position: "absolute",
    backgroundColor: "#DEEBD4",
  },

  parkInner: {
    top: 30,
    left: 108,
    width: 30,
    height: 18,
    borderRadius: 6,
  },

  parkOuter: {
    top: 52,
    left: 148,
    width: 18,
    height: 14,
    borderRadius: 5,
  },

  road: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
  },

  roadNorth: {
    top: 20,
    left: "-6%",
    right: "-6%",
    height: 4,
    borderRadius: 2,
  },

  roadSouth: {
    top: 62,
    left: "-6%",
    right: "-6%",
    height: 3.5,
    borderRadius: 1.75,
  },

  roadKandy: {
    top: -30,
    left: "64%",
    width: 3,
    height: 150,
    transform: [{ rotate: "-30deg" }],
  },

  roadAirport: {
    top: -30,
    left: "24%",
    width: 3,
    height: 150,
    transform: [{ rotate: "14deg" }],
  },

  roadMinorA: {
    top: 40,
    left: "-6%",
    right: "-6%",
    height: 1.5,
    backgroundColor: "#E9EDE7",
  },

  roadMinorB: {
    top: -30,
    left: "86%",
    width: 1.5,
    height: 150,
    transform: [{ rotate: "-6deg" }],
    backgroundColor: "#E9EDE7",
  },

  /** Coastal railway — thinner and greyer than the roads. */
  railway: {
    top: -30,
    left: "46%",
    width: 1.5,
    height: 150,
    transform: [{ rotate: "8deg" }],
    backgroundColor: "#E2E7E0",
  },

  /** Indian Ocean. Overhangs on every side so rotation leaves no corner gaps. */
  water: {
    position: "absolute",
    top: 76,
    left: -40,
    right: -40,
    bottom: -70,
    backgroundColor: Surface.mapWater,
    transform: [{ rotate: "-11deg" }],
  },

  coastline: {
    position: "absolute",
    top: 74,
    left: -40,
    right: -40,
    height: 1,
    backgroundColor: "#6FC3D6",
    transform: [{ rotate: "-11deg" }],
  },

  roadLabel: {
    ...Typography.micro,
    position: "absolute",
    fontSize: 6,
    lineHeight: 8,
    fontWeight: "600",
    letterSpacing: 0.2,
    color: "#A3AEA6",
  },

  roadLabelNorth: {
    top: 11,
    left: 44,
  },

  roadLabelSouth: {
    top: 66,
    left: 26,
  },

  placeLabel: {
    ...Typography.micro,
    position: "absolute",
    fontSize: 6.5,
    lineHeight: 9,
    fontWeight: "500",
    letterSpacing: 0.1,
    color: "#94A19A",
  },

  placeAirport: {
    top: 6,
    left: 14,
  },

  placeKandy: {
    top: 14,
    right: 10,
  },

  placeGalle: {
    bottom: 6,
    left: 12,
    color: "#5F9FB2",
  },

  placeDehiwala: {
    bottom: 4,
    right: 12,
    color: "#5F9FB2",
  },

  pinWrap: {
    position: "absolute",
    top: 30,
    left: "50%",
    marginLeft: -16,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
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
    width: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Blood.primary,
  },

  /** Area name reads as a map label, not a floating chip. */
  area: {
    ...Typography.micro,
    position: "absolute",
    top: 64,
    left: "50%",
    marginLeft: 14,
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: "700",
    letterSpacing: 0.1,
    color: "#5C6B63",
  },
});