import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";

import { useAuth } from "@/providers/auth-provider";
import { Blood, Elevation, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_CARDS } from "@/constants/roles";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";

/**
 * BloodLink web home page.
 *
 * Public landing page for unauthenticated visitors — hero, role selection and
 * a three-step explainer. Signed-in users are redirected straight to their
 * role dashboard (`ROLE_HOME`). While the stored session is still resolving,
 * nothing renders so the router's auth guards stay closed.
 */
export default function HomeScreen() {
  const { status, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user.role) {
      router.replace(ROLE_HOME[session.user.role]);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return null;
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ---------- Hero ---------- */}
      <View style={styles.hero}>
        <Image
          source={{
            uri:
              "https://images.unsplash.com/photo-1551077885-bb0193992345?q=80&w=2000&auto=format&fit=crop",
          }}
          style={styles.heroImage}
          alt="Blood donation hero banner"
        />
        <View style={styles.heroOverlay}>
          <View style={styles.heroContent}>
            <Feather name="heart" size={34} color={Surface.onPrimary} />
            <Text style={styles.heroKicker}>BloodLink</Text>
            <Text style={styles.heroTitle}>
              Emergency blood donation for Sri Lanka
            </Text>
            <Text style={styles.heroSubtitle}>
              Recipients raise urgent requests, verified donors respond, and
              hospital staff collect through intake, screening and donation.
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                onPress={() => router.push(ROUTES.emergencyRequest)}
                accessibilityRole="button"
                accessibilityLabel="Request emergency blood"
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>I need blood</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push(ROUTES.roleSelect)}
                accessibilityRole="button"
                accessibilityLabel="Become a donor"
                style={styles.secondaryButton}
              >
                <Text style={styles.buttonText}>I want to donate</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* ---------- How it works ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How it works</Text>
        <View style={styles.steps}>
          <StepCard
            number="1"
            title="Request"
            body="A recipient or their family raises an emergency blood request with blood group, units and target hospital."
          />
          <StepCard
            number="2"
            title="Match"
            body="Nearby verified donors are alerted and matched against the two inverse donor–recipient compatibility maps."
          />
          <StepCard
            number="3"
            title="Donate"
            body="Hospital staff verify the donor, run intake and screening, then collect through the standard donation workflow."
          />
        </View>
      </View>

      {/* ---------- Choose your role ---------- */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose your role</Text>
        <View style={styles.roleGrid}>
          {ROLE_CARDS.map((meta) => (
            <Pressable
              key={meta.role}
              onPress={() => router.push(`${ROUTES.login}?role=${meta.role}`)}
              accessibilityRole="button"
              accessibilityLabel={`Join as ${meta.title}`}
              style={styles.roleCard}
            >
              <View style={styles.roleCardImageWrap}>
                <Image
                  source={{
                    uri: roleImageUri(meta.role),
                  }}
                  style={styles.roleCardImage}
                  alt={`${meta.title} illustration`}
                />
                <View style={styles.roleCardBadge}>
                  <Text style={styles.roleCardBadgeText}>{meta.badge}</Text>
                </View>
              </View>
              <Text style={styles.roleCardTitle}>{meta.title}</Text>
              <Text style={styles.roleCardDesc}>{meta.description}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ---------- Demo credentials hint ---------- */}
      <View style={styles.demoHint}>
        <Feather name="info" size={14} color={Surface.textMuted} />
        <Text style={styles.demoHintText}>
          Dev accounts are listed on the sign-in screen — Donor, Hospital,
          Recipient and Administrator.
        </Text>
      </View>

      <View style={styles.spacer} />
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          BloodLink &middot; Sri Lanka blood-donation platform
        </Text>
      </View>
    </ScrollView>
  );
}

/** Unsplash photo (open source, free for commercial use) per role. */
function roleImageUri(role: string): string {
  const map: Record<string, string> = {
    recipient:
      "https://images.unsplash.com/photo-1579684376925-05055e83575e?q=80&w=800&auto=format&fit=crop",
    donor:
      "https://images.unsplash.com/photo-1522726281693-18cb929291c2?q=80&w=800&auto=format&fit=crop",
    hospital:
      "https://images.unsplash.com/photo-1551077885-bb0193992345?q=80&w=800&auto=format&fit=crop",
  };
  return (
    map[role] ??
    "https://images.unsplash.com/photo-1552664734-d7358e776357?q=80&w=800&auto=format&fit=crop"
  );
}

/** One "how it works" step card. */
function StepCard({ number, title, body }: { number: string | number; title: string; body: string }) {
  return (
    <View style={stepStyles.card}>
      <View style={stepStyles.numberWrap}>
        <Text style={stepStyles.number}>{number}</Text>
      </View>
      <Text style={stepStyles.title}>{title}</Text>
      <Text style={stepStyles.body}>{body}</Text>
    </View>
  );
}

const ControlHeight = {
  button: 54,
} as const;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 32,
  },

  // Hero is a full-bleed banner. The image is constrained by maxHeight so it
  // never dominates a tall desktop viewport.
  hero: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    ...Elevation.card,
  },

  heroImage: {
    width: "100%",
    height: 360,
    maxHeight: 420,
    borderRadius: Radius.card,
  },

  heroOverlay: {
    position: "absolute",
    inset: 0,
    borderRadius: Radius.card,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },

  heroContent: {
    alignItems: "center",
    gap: 12,
    maxWidth: 720,
  },

  heroKicker: {
    ...Typography.micro,
    color: Surface.onPrimary,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  heroTitle: {
    ...Typography.screenTitle,
    color: Surface.onPrimary,
    textAlign: "center",
    lineHeight: 30,
  },

  heroSubtitle: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 560,
  },

  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
  },

  primaryButton: {
    minHeight: ControlHeight.button,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    ...Elevation.button,
  },

  secondaryButton: {
    minHeight: ControlHeight.button,
    borderRadius: Radius.field,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.4)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  buttonText: {
    ...Typography.button,
    color: Surface.onPrimary,
  },

  // Sections
  section: {
    gap: 16,
  },

  sectionTitle: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  steps: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  // Role grid — 4 cards across on desktop, fewer on narrow viewports.
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },

  roleCard: {
    width: "100%",
    maxWidth: 280,
    borderRadius: Radius.card,
    borderWidth: 1.5,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    overflow: "hidden",
    ...Elevation.card,
  },

  roleCardImageWrap: {
    position: "relative",
    width: "100%",
    height: 160,
    backgroundColor: Surface.card,
  },

  roleCardImage: {
    width: "100%",
    height: 160,
  },

  roleCardBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Blood.primary,
  },

  roleCardBadgeText: {
    ...Typography.micro,
    color: Surface.onPrimary,
  },

  roleCardTitle: {
    ...Typography.cardTitle,
    color: Surface.text,
    marginTop: 12,
    marginHorizontal: 14,
  },

  roleCardDesc: {
    ...Typography.small,
    color: Surface.textSecondary,
    lineHeight: 18,
    marginHorizontal: 14,
    marginBottom: 14,
  },

  // Demo hint
  demoHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 14,
    borderRadius: Radius.field,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    maxWidth: 600,
    alignSelf: "center",
  },

  demoHintText: {
    ...Typography.small,
    color: Surface.textSecondary,
  },

  spacer: {
    height: 24,
  },

  footer: {
    alignItems: "center",
    paddingBottom: 8,
  },

  footerText: {
    ...Typography.micro,
    color: Surface.textMuted,
  },
});

const stepStyles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 220,
    maxWidth: 320,
    padding: 18,
    borderRadius: Radius.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
    backgroundColor: Surface.card,
    gap: 10,
    ...Elevation.card,
  },

  numberWrap: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Blood.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  number: {
    ...Typography.micro,
    color: Surface.onPrimary,
  },

  title: {
    ...Typography.cardTitle,
    color: Surface.text,
  },

  body: {
    ...Typography.small,
    color: Surface.textSecondary,
    lineHeight: 18,
  },
});
