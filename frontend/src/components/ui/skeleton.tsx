/**
 * Shimmer placeholders for content that is loading.
 *
 * The pulse is deliberately gentle and stops entirely under reduced-motion
 * settings — a loading screen is the worst place to force animation on
 * someone who asked the system to keep things still.
 */

import { useEffect } from "react";
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";

type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = "100%", height = 16, radius = 8, style }: SkeletonProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0.45);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.6;
      return;
    }

    pulse.value = withRepeat(
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reduced]);

  const animated = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      style={[styles.block, { width, height, borderRadius: radius ?? Radius.sm }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.sheen, animated]} />
    </View>
  );
};

type SkeletonCardProps = {
  /** Body lines under the title row. */
  lines?: number;
  style?: StyleProp<ViewStyle>;
};

/** Card-shaped placeholder — matches the request/list card geometry. */
export function SkeletonCard({ lines = 2, style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.cardTop}>
        <Skeleton width={44} height={40} radius={Radius.sm} />
        <View style={styles.cardHeading}>
          <Skeleton width="55%" height={14} />
          <Skeleton width="75%" height={11} />
        </View>
        <Skeleton width={64} height={22} radius={Radius.pill} />
      </View>

      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} width={index === lines - 1 ? "60%" : "100%"} height={11} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  block: {
    backgroundColor: Surface.iconWash,
    overflow: "hidden",
  },

  sheen: {
    backgroundColor: Surface.card,
  },

  card: {
    gap: 10,
    padding: 14,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardHeading: {
    flex: 1,
    gap: 6,
  },
});
