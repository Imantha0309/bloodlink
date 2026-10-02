import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Blood } from "@/constants/colors";

const DROP_SIZE = 44;
const FALL_DISTANCE = 190;
const RIPPLE_COUNT = 3;
const RIPPLE_INTERVAL = 260;
const CYCLE = 1900;
const SQUASH = 1.9;

type BloodDropProps = {
  size?: number;
};

/**
 * A falling drop of blood that squashes on impact and sends out expanding
 * ripples. Built from transforms and opacity only, so it runs identically on
 * Android, iOS and web without pulling in an SVG dependency.
 */
export function BloodDrop({ size = DROP_SIZE }: BloodDropProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const dropStyle = useAnimatedStyle(() => {
    const p = progress.value;

    if (p < 0.42) {
      const fall = p / 0.42;
      const eased = fall * fall;
      return {
        opacity: 1,
        transform: [
          { translateY: -FALL_DISTANCE + eased * FALL_DISTANCE },
          { scaleX: 1 + fall * 0.18 },
          { scaleY: 1 - fall * 0.18 },
        ],
      };
    }

    const impact = (p - 0.42) / 0.18;
    if (impact < 1) {
      return {
        opacity: 1 - impact * 0.85,
        transform: [
          { translateY: 0 },
          { scaleX: 1 + impact * (SQUASH - 1) },
          { scaleY: 1 - impact * (1 - 1 / SQUASH) },
        ],
      };
    }

    return {
      opacity: 0,
      transform: [
        { translateY: 0 },
        { scaleX: SQUASH },
        { scaleY: 1 / SQUASH },
      ],
    };
  });

  return (
    <View style={[styles.container, { width: size * 3, height: size * 3 }]}>
      <Animated.View
        style={[styles.drop, dropStyle, { width: size, height: size }]}
      >
        <View
          style={[
            styles.dropHighlight,
            { width: size * 0.22, height: size * 0.3 },
          ]}
        />
      </Animated.View>

      {Array.from({ length: RIPPLE_COUNT }).map((_, index) => (
        <Ripple key={index} index={index} maxSize={size * 2.6} />
      ))}
    </View>
  );
}

type RippleProps = {
  index: number;
  maxSize: number;
};

function Ripple({ index, maxSize }: RippleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * RIPPLE_INTERVAL,
      withRepeat(
        withTiming(1, { duration: CYCLE, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [index, progress]);

  const rippleStyle = useAnimatedStyle(() => {
    const start = 0.44 + index * 0.06;
    const p = progress.value;

    if (p < start) {
      return { opacity: 0, width: 0, height: 0 };
    }

    const local = (p - start) / (0.56 - index * 0.04);
    const eased = 1 - Math.pow(1 - Math.min(local, 1), 3);

    return {
      opacity: Math.sin(Math.min(local, 1) * Math.PI) * 0.7,
      width: maxSize * eased,
      height: maxSize * eased,
      borderRadius: maxSize / 2,
    };
  });

  return <Animated.View style={[styles.ripple, rippleStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  drop: {
    position: "absolute",
    backgroundColor: Blood.primary,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 4,
    shadowColor: Blood.light,
    shadowOpacity: 0.8,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
  dropHighlight: {
    position: "absolute",
    top: "18%",
    left: "26%",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 999,
  },
  ripple: {
    position: "absolute",
    borderWidth: 2,
    borderColor: Blood.ripple,
  },
});
