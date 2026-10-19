import { Feather } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { BrandMark } from "@/components/dashboard/brand-mark";
import { Blood, Surface } from "@/constants/colors";

type WelcomeScreenProps = {
  onLayout?: () => void;
  onGetStarted: () => void;
};

export function WelcomeScreen({ onLayout, onGetStarted }: WelcomeScreenProps) {
  return (
    <View style={styles.screen} onLayout={onLayout}>
      <View style={styles.content}>
        <View style={styles.brand}>
          <BrandMark size={42} />
          <Text style={styles.brandName}>
            Blood<Text style={styles.brandAccent}>Link</Text>
          </Text>
        </View>

        <Image
          source={require("../../../assets/images/loadingScreenimage.png")}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityLabel="A blood drop with a heartbeat line"
        />

        <Text style={styles.title}>Connecting lives through donation</Text>
        <Text style={styles.message}>
          Every drop matters. Find donors, give hope, and help save lives.
        </Text>

        <Pressable
          onPress={onGetStarted}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Feather name="arrow-right" size={18} color={Surface.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F8",
    paddingHorizontal: 28,
  },

  content: {
    width: "100%",
    maxWidth: 560,
    alignItems: "center",
    gap: 18,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  brandName: {
    color: Surface.text,
    fontSize: 27,
    fontWeight: "800",
    letterSpacing: -0.8,
  },

  brandAccent: {
    color: Blood.primary,
  },

  illustration: {
    width: "100%",
    aspectRatio: 1802 / 868,
    maxHeight: 300,
  },

  title: {
    color: Surface.text,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  message: {
    color: Surface.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 340,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minWidth: 190,
    minHeight: 54,
    marginTop: 8,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: Blood.primary,
    shadowColor: Blood.primary,
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: Surface.onPrimary,
    fontSize: 15,
    fontWeight: "700",
  },
});
