import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Blood } from "@/constants/colors";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { useAuth } from "@/providers/auth-provider";

export default function LoadingScreen() {
  const router = useRouter();
  const { session, status } = useAuth();

  /**
   * "Get Started" has to respect the guards in `_layout.tsx`: `login` is only
   * reachable while signed out, so pushing it from an authenticated session
   * would bounce. A signed-in user goes straight to their own dashboard.
   */
  function handleGetStarted() {
    if (status === "authenticated" && session !== null) {
      router.replace(ROLE_HOME[session.user.role]);
      return;
    }

    router.push(ROUTES.login);
  }

  // Lazy `useState` initialisers rather than `useRef(...).current`: same stable
  // per-instance Animated.Value, but nothing reads a ref during render.
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.85));

  useEffect(() => {
    // =========================
    // LOGO FADE + SCALE
    // =========================

    const intro = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 45,
        useNativeDriver: true,
      }),
    ]);

    intro.start();

    return () => {
      intro.stop();
    };
  }, [fadeAnim, scaleAnim]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ================= LOGO ================= */}

          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.logo}>
              <View style={styles.logoDrop} />
            </View>

            <View style={styles.brandArea}>
              <View style={styles.brandRow}>
                <Text style={styles.brandName}>BloodLink</Text>

                <View style={styles.proBadge}>
                  <Text style={styles.proText}>PRO</Text>
                </View>
              </View>

              <Text style={styles.brandSubtitle}>
                National Blood Transfusion Service • LK
              </Text>
            </View>
          </Animated.View>

          {/* ================= HERO ================= */}

          <Animated.View
            style={[
              styles.heroContainer,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Image
              source={require("../../assets/images/loadingScreenimage.png")}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </Animated.View>

          {/* ================= TEXT ================= */}

          <Animated.View
            style={[
              styles.textArea,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.smallLabel}>RAPID LIFE CONNECTION</Text>

            <Text style={styles.title}>Every drop connects a</Text>

            <Text style={styles.redTitle}>life in critical seconds.</Text>

            <Text style={styles.description}>
              Connecting donors, hospitals and blood
              {"\n"}
              banks across Sri Lanka in real-time.
            </Text>
          </Animated.View>

          {/* ================= LOADING ================= */}

          <Animated.View
            style={[
              styles.loadingArea,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <View style={styles.loadingDots}>
              <LoadingDot delay={0} />
              <LoadingDot delay={180} />
              <LoadingDot delay={360} />
            </View>

            <Text style={styles.loadingText}>
              Connecting you to life-saving services
            </Text>
          </Animated.View>

          {/* ================= GET STARTED ================= */}

          <Animated.View style={[styles.actionArea, { opacity: fadeAnim }]}>
            <Pressable
              style={styles.getStartedButton}
              accessibilityRole="button"
              accessibilityLabel="Get Started"
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedText}>Get Started →</Text>
            </Pressable>

            <Pressable
              style={styles.nbtsLink}
              accessibilityRole="link"
              accessibilityLabel="Visit National Blood Transfusion Service website"
              onPress={() => {
                Linking.openURL("https://nbts.health.gov.lk/");
              }}
            >
              <Text style={styles.nbtsLinkText}>
                Visit National Blood Transfusion Service
              </Text>
            </Pressable>
          </Animated.View>

          {/* ================= FOOTER ================= */}

          <Text style={styles.footer}>NBTS & Ministry of Health Endorsed</Text>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

/* =====================================================
   LOADING DOT
===================================================== */

function LoadingDot({ delay }: { delay: number }) {
  const [opacity] = useState(() => new Animated.Value(0.3));
  const [scale] = useState(() => new Animated.Value(0.8));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(scale, {
            toValue: 1.2,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),

        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(scale, {
            toValue: 0.8,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [delay, opacity, scale]);

  return (
    <Animated.View
      style={[
        styles.loadingDot,
        {
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
}

/* =====================================================
   STYLES
===================================================== */

/**
 * Vertical spacing scale. Every gap between sections comes from this so the
 * screen stays balanced instead of stretching or crowding unevenly.
 */
const GAP = 14;
const GAP_SM = 10;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  safeArea: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: GAP,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 18,
  },

  /* ================= LOGO ================= */

  logoContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#D7193F",
    alignItems: "center",
    justifyContent: "center",
    marginRight: GAP_SM,
  },

  logoDrop: {
    width: 21,
    height: 27,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 4,
    transform: [{ rotate: "45deg" }],
  },

  brandArea: {
    alignItems: "flex-start",
    flexShrink: 1,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#1D2632",
    letterSpacing: -0.6,
  },

  proBadge: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: "#FFF0F3",
  },

  proText: {
    fontSize: 7,
    fontWeight: "900",
    color: "#D7193F",
  },

  brandSubtitle: {
    marginTop: 3,
    fontSize: 8,
    color: "#858D97",
  },

  /* ================= HERO ================= */

  heroContainer: {
    width: "100%",
    aspectRatio: 1802 / 873,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#F4F5F6",
    position: "relative",

    shadowColor: "#8B9299",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },

    elevation: 5,
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  /* ================= TEXT ================= */

  textArea: {
    width: "100%",
    alignItems: "center",
  },

  smallLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#D7193F",
    letterSpacing: 0.5,
    marginBottom: GAP_SM,
  },

  title: {
    textAlign: "center",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    color: "#18212D",
    letterSpacing: -0.6,
  },

  redTitle: {
    textAlign: "center",
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "800",
    color: "#D7193F",
    letterSpacing: -0.6,
  },

  description: {
    textAlign: "center",
    marginTop: GAP_SM,
    fontSize: 11.5,
    lineHeight: 17,
    color: "#78818C",
  },

  /* ================= LOADING ================= */

  loadingArea: {
    alignItems: "center",
  },

  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: GAP_SM,
  },

  loadingDot: {
    width: 7,
    height: 7,
    borderRadius: 7,
    backgroundColor: "#D7193F",
    marginHorizontal: 3,
  },

  loadingText: {
    fontSize: 8.5,
    color: "#8A929C",
    fontWeight: "500",
  },

  /* ================= ACTIONS ================= */

  actionArea: {
    width: "100%",
    alignItems: "center",
  },

  getStartedButton: {
    width: "100%",
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",

    shadowColor: Blood.glow,
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 6,
    },

    elevation: 8,
  },

  getStartedText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },

  nbtsLink: {
    marginTop: GAP_SM,

    /* Grows the touch target toward 44dp without moving the text. */
    paddingVertical: 12,
  },

  nbtsLinkText: {
    fontSize: 13,
    color: Blood.dark,
    textAlign: "center",
    textDecorationLine: "underline",
  },

  /* ================= FOOTER ================= */

  footer: {
    fontSize: 7.5,
    color: "#7B838D",
    textAlign: "center",
  },
});
