import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Blood, Surface } from "@/constants/colors";
import { resolveAvatarUrl } from "@/services/api/client";

const DEFAULT_AVATAR = require("../../../assets/images/donoravatars.png");

export type AnimatedAvatarProps = {
  url?: string | null;
  name?: string | null;
  size?: number;
  animated?: boolean;
  showHalo?: boolean;
  role?: string;
  badgeIcon?: ComponentProps<typeof Feather>["name"] | string;
  pulseColor?: string;
  showEditBadge?: boolean;
  isUploading?: boolean;
  onPress?: () => void;
  style?: object;
};

function getInitials(name?: string | null): string {
  if (!name) return "BL";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AnimatedAvatar({
  url,
  name,
  size = 72,
  animated = false,
  showHalo,
  role: _role,
  badgeIcon,
  pulseColor = Blood.primary,
  showEditBadge = false,
  isUploading = false,
  onPress,
  style,
}: AnimatedAvatarProps) {
  const isAnimated = showHalo ?? animated;
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isAnimated) {
      ringScale.value = withRepeat(
        withTiming(1.22, { duration: 1800, easing: Easing.out(Easing.ease) }),
        -1,
        false,
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 900 }),
          withTiming(0, { duration: 900 }),
        ),
        -1,
        false,
      );
    }
  }, [isAnimated, ringScale, ringOpacity]);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const fullUrl = resolveAvatarUrl(url);
  const initials = getInitials(name);
  const badgeSize = Math.max(22, Math.round(size * 0.32));
  const iconSize = Math.max(11, Math.round(badgeSize * 0.52));

  const content = (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {animated ? (
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: pulseColor,
            },
            animatedRingStyle,
          ]}
        />
      ) : null}

      <View
        style={[
          styles.avatarCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: fullUrl ? Surface.card : Surface.softRed,
          },
        ]}
      >
        {fullUrl ? (
          <Image
            source={{ uri: fullUrl }}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : name ? (
          <Text
            style={[
              styles.initialsText,
              { fontSize: Math.round(size * 0.38), color: Blood.primary },
            ]}
          >
            {initials}
          </Text>
        ) : (
          <Image
            source={DEFAULT_AVATAR}
            style={{ width: size, height: size, borderRadius: size / 2 }}
            resizeMode="cover"
          />
        )}

        {isUploading ? (
          <View
            style={[
              styles.uploadingOverlay,
              { width: size, height: size, borderRadius: size / 2 },
            ]}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {showEditBadge || badgeIcon ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -2,
              bottom: -2,
            },
          ]}
        >
          <Feather
            name={(badgeIcon as ComponentProps<typeof Feather>["name"]) ?? "camera"}
            size={iconSize}
            color="#FFFFFF"
          />
        </View>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={showEditBadge ? "Change profile photo" : "Profile photo"}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
        disabled={isUploading}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
  },
  avatarCircle: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  initialsText: {
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  uploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    backgroundColor: Blood.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});
