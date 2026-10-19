import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { Blood, Elevation, Surface } from "@/constants/colors";
import { ROLE_CARDS } from "@/constants/roles";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { useAuth } from "@/providers/auth-provider";
import { getActiveDonors } from "@/services/donors/active-donors";
import { listBloodBanks } from "@/services/blood-banks";

type Section = "top" | "about" | "roles" | "requests" | "contact";

export default function HomeScreen() {
  const { status, session } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const headerHeight = useRef(0);
  const sectionY = useRef<Partial<Record<Section, number>>>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [donorCount, setDonorCount] = useState<number | null>(null);
  const [hospitalCount, setHospitalCount] = useState<number | null>(null);
  const isWide = width >= 760;
  const isDesktop = width >= 1024;
  const isHeroWide = width >= 960;

  useEffect(() => {
    if (status === "authenticated" && session?.user.role) {
      router.replace(ROLE_HOME[session.user.role]);
    }
  }, [status, session, router]);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([getActiveDonors(), listBloodBanks()]).then(([donors, banks]) => {
      if (!active) return;
      if (donors.status === "fulfilled" && donors.value.total > 0) setDonorCount(donors.value.total);
      if (banks.status === "fulfilled" && banks.value.length > 0) {
        setHospitalCount(banks.value.filter((bank) => bank.isVerified).length);
      }
    });
    return () => { active = false; };
  }, []);

  if (status === "loading") return null;

  function jumpTo(section: Section) {
    setMenuOpen(false);
    if (section === "top") {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const y = sectionY.current[section];
    if (typeof y === "number") scrollRef.current?.scrollTo({ y: Math.max(0, y + headerHeight.current - 18), animated: true });
  }

  function goLogin(role?: string) {
    setMenuOpen(false);
    router.push(role ? `${ROUTES.login}?role=${role}` : ROUTES.login);
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.root}
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerOuter} onLayout={(e) => { headerHeight.current = e.nativeEvent.layout.height; }}>
        <View style={[styles.header, { paddingHorizontal: isDesktop ? 34 : 20 }]}>
          <Pressable style={styles.brand} onPress={() => jumpTo("top")} accessibilityRole="button" accessibilityLabel="BloodLink home">
            <View style={styles.brandMark}><Feather name="heart" size={20} color="#fff" /></View>
            <Text style={styles.brandName}>Blood<Text style={styles.brandAccent}>Link</Text></Text>
          </Pressable>
          {isDesktop ? (
            <View style={styles.navLinks}>
              <NavLink label="Home" onPress={() => jumpTo("top")} />
              <NavLink label="About" onPress={() => jumpTo("about")} />
              <NavLink label="Find Donors" onPress={() => goLogin("recipient")} />
              <NavLink label="Blood Requests" onPress={() => jumpTo("requests")} />
              <NavLink label="Hospitals" onPress={() => goLogin("hospital")} />
              <NavLink label="Contact" onPress={() => jumpTo("contact")} />
            </View>
          ) : null}
          <View style={styles.headerActions}>
            {isDesktop ? <Pressable onPress={() => goLogin()} style={styles.loginButton}><Text style={styles.loginText}>Log in</Text></Pressable> : null}
            {isDesktop ? <Pressable onPress={() => router.push(ROUTES.roleSelect)} style={styles.signupButton}><Text style={styles.signupText}>Sign up</Text><Feather name="arrow-up-right" size={15} color="#fff" /></Pressable> : null}
            {!isDesktop ? (
              <Pressable onPress={() => setMenuOpen((open) => !open)} accessibilityRole="button" accessibilityLabel={menuOpen ? "Close navigation menu" : "Open navigation menu"} accessibilityState={{ expanded: menuOpen }} style={styles.menuButton}>
                <Feather name={menuOpen ? "x" : "menu"} size={22} color={Surface.text} />
              </Pressable>
            ) : null}
          </View>
        </View>
        {!isDesktop && menuOpen ? (
          <View style={styles.mobileMenu}>
            <NavLink label="Home" onPress={() => jumpTo("top")} />
            <NavLink label="About" onPress={() => jumpTo("about")} />
            <NavLink label="Find Donors" onPress={() => goLogin("recipient")} />
            <NavLink label="Blood Requests" onPress={() => jumpTo("requests")} />
            <NavLink label="Hospitals" onPress={() => goLogin("hospital")} />
            <NavLink label="Contact" onPress={() => jumpTo("contact")} />
            <View style={styles.mobileActions}>
              <Pressable onPress={() => goLogin()} style={styles.loginButton}><Text style={styles.loginText}>Log in</Text></Pressable>
              <Pressable onPress={() => { setMenuOpen(false); router.push(ROUTES.roleSelect); }} style={styles.signupButton}><Text style={styles.signupText}>Sign up</Text><Feather name="arrow-up-right" size={15} color="#fff" /></Pressable>
            </View>
          </View>
        ) : null}
      </View>

      <View style={[styles.main, { paddingHorizontal: isDesktop ? 34 : 20 }]}>
        <View style={[styles.hero, isHeroWide && styles.heroWide]}>
          <View style={[styles.heroCopy, isHeroWide && styles.heroCopyWide]}>
            <View style={styles.eyebrow}><View style={styles.eyebrowDot} /><Text style={styles.eyebrowText}>EVERY DROP MATTERS</Text></View>
            <Text style={[styles.heroTitle, { fontSize: isDesktop ? 54 : isWide ? 42 : 38, lineHeight: isDesktop ? 62 : isWide ? 49 : 45 }]}>Be Someone&apos;s <Text style={styles.redText}>Reason to Live.</Text></Text>
            <Text style={styles.heroSubtitle}>Connect with verified blood donors and help patients across Sri Lanka get the blood they urgently need.</Text>
            <View style={styles.heroActions}>
              <ActionButton label="Request Blood" icon="arrow-right" onPress={() => router.push(ROUTES.emergencyRequest)} primary />
              <ActionButton label="Become a Donor" icon="heart" onPress={() => router.push(ROUTES.roleSelect)} />
            </View>
            <View style={styles.heroTrust}><View style={styles.trustAvatars}><TrustAvatar label="S" /><TrustAvatar label="R" /><TrustAvatar label="M" /></View><Text style={styles.trustCopy}><Text style={styles.trustStrong}>Community-powered</Text>{"\n"}Care when it matters most</Text></View>
          </View>
          <View style={[styles.heroVisual, isHeroWide && styles.heroVisualWide]}>
            <Image source={require("../../assets/images/dorner.png")} style={styles.heroImage} resizeMode="cover" accessibilityLabel="A donor giving blood in a clinical setting" />
            <View style={styles.heroImageWash} />
            <View style={styles.imageNote}><View style={styles.noteIcon}><Feather name="heart" size={17} color={Blood.primary} /></View><View><Text style={styles.noteTitle}>One donation</Text><Text style={styles.noteSubtitle}>can save up to three lives</Text></View></View>
            <View style={styles.imageBadge}><Feather name="check-circle" size={14} color="#16834A" /><Text style={styles.imageBadgeText}>Verified donor network</Text></View>
          </View>
        </View>

        <View style={[styles.statsPanel, isWide && styles.statsWide]}>
          <Stat icon="users" value={donorCount === null ? "Growing" : donorCount.toLocaleString()} label="Verified donors" />
          <View style={styles.statDivider} />
          <Stat icon="activity" value="Here for you" label="Urgent blood support" />
          <View style={styles.statDivider} />
          <Stat icon="home" value={hospitalCount === null ? "Connected" : hospitalCount.toLocaleString()} label="Verified hospitals" />
        </View>

        <View style={styles.section} onLayout={(e) => { sectionY.current.about = e.nativeEvent.layout.y; }}>
          <SectionHeading eyebrow="SIMPLE. HUMAN. CONNECTED." title="How BloodLink works" body="A clear path from an urgent need to a life-saving donation." />
          <View style={[styles.steps, isWide && styles.cardsWide]}>
            <StepCard number="01" icon="file-text" title="Request" body="A patient or family member shares the blood group, units needed, and hospital for an emergency request." />
            <StepCard number="02" icon="search" title="Match" body="Eligible, verified donors are matched using blood group, location, availability, and compatibility." />
            <StepCard number="03" icon="heart" title="Donate" body="Hospital staff verify the donor and coordinate a safe, supported donation." />
          </View>
        </View>

        <View style={styles.section} onLayout={(e) => { sectionY.current.roles = e.nativeEvent.layout.y; }}>
          <SectionHeading eyebrow="MAKE A DIFFERENCE" title="How would you like to help?" body="Choose the path that brings you here. We’ll guide you through the next step." />
          <View style={[styles.roleGrid, isWide && styles.cardsWide]}>
            {ROLE_CARDS.map((role) => (
              <Pressable key={role.role} onPress={() => goLogin(role.role)} accessibilityRole="button" accessibilityLabel={`${role.title}. ${role.description}`} style={({ pressed }) => [styles.roleCard, isWide && styles.roleCardWide, pressed && styles.pressed]}>
                <View style={styles.roleImageFrame}>
                  <Image source={roleImageSource(role.role)} style={styles.roleImage} resizeMode="cover" accessibilityLabel={`${role.title}`} />
                  <View style={[styles.roleIconBadge, { backgroundColor: role.accent.background }]}><Feather name={role.icon} size={18} color={role.accent.icon} /></View>
                </View>
                <View style={styles.roleText}>
                  <Text style={styles.roleTitle}>{role.role === "recipient" ? "I Need Blood" : role.role === "donor" ? "I Want to Donate" : "Hospital / Blood Bank"}</Text>
                  <Text style={styles.roleDesc}>{role.role === "recipient" ? "Find eligible donors for a patient." : role.role === "donor" ? "Share your availability and help others." : "Manage and verify blood requests."}</Text>
                  <View style={styles.roleAction}><Text style={styles.roleActionText}>{role.role === "recipient" ? "Request Blood" : role.role === "donor" ? "Become a Donor" : "Hospital Portal"}</Text><Feather name="arrow-up-right" size={15} color={Blood.primary} /></View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.urgentWrap} onLayout={(e) => { sectionY.current.requests = e.nativeEvent.layout.y; }}>
          <View style={styles.urgentIcon}><Feather name="droplet" size={22} color="#fff" /></View>
          <View style={styles.urgentCopy}><Text style={styles.urgentEyebrow}>WHEN EVERY MOMENT COUNTS</Text><Text style={styles.urgentTitle}>Someone may need your help today.</Text><Text style={styles.urgentBody}>Start an emergency request or find out how BloodLink connects patients with local donors.</Text></View>
          <ActionButton label="Get urgent help" icon="arrow-right" onPress={() => router.push(ROUTES.emergencyRequest)} primary />
        </View>
      </View>

      <View style={styles.footer} onLayout={(e) => { sectionY.current.contact = e.nativeEvent.layout.y; }}>
        <View style={[styles.footerInner, { paddingHorizontal: isDesktop ? 34 : 20 }]}>
          <View style={styles.footerTop}>
            <View style={styles.footerBrandBlock}><View style={styles.footerBrand}><View style={styles.footerMark}><Feather name="heart" size={18} color="#fff" /></View><Text style={styles.footerBrandName}>BloodLink</Text></View><Text style={styles.footerTagline}>Connecting Lives Through Donation</Text><Text style={styles.footerDescription}>A community of donors, patients, and hospitals helping Sri Lanka when it matters most.</Text></View>
            <View style={styles.footerColumn}><Text style={styles.footerHeading}>Explore</Text><FooterLink label="Home" onPress={() => jumpTo("top")} /><FooterLink label="How it works" onPress={() => jumpTo("about")} /><FooterLink label="Find donors" onPress={() => goLogin("recipient")} /><FooterLink label="Blood requests" onPress={() => jumpTo("requests")} /></View>
            <View style={styles.footerColumn}><Text style={styles.footerHeading}>Get involved</Text><FooterLink label="Become a donor" onPress={() => goLogin("donor")} /><FooterLink label="Hospital portal" onPress={() => goLogin("hospital")} /><FooterLink label="Request blood" onPress={() => router.push(ROUTES.emergencyRequest)} /><FooterLink label="Sign in" onPress={() => goLogin()} /></View>
            <View style={styles.footerColumn}><Text style={styles.footerHeading}>Support</Text><Text style={styles.footerSupport}>Need help using BloodLink?</Text><Pressable onPress={() => goLogin()} style={styles.footerContact}><Feather name="message-circle" size={15} color="#FCA5B4" /><Text style={styles.footerContactText}>Contact our team</Text></Pressable><Text style={styles.footerLegal}>Privacy and terms are available through your account.</Text></View>
          </View>
          <View style={styles.footerBottom}><Text style={styles.copyright}>© {new Date().getFullYear()} BloodLink Sri Lanka</Text><Text style={styles.footerMotto}>Give blood. Give hope.</Text></View>
        </View>
      </View>
    </ScrollView>
  );
}

function NavLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.navLink, pressed && styles.pressed]}><Text style={styles.navLinkText}>{label}</Text></Pressable>;
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.footerLink, pressed && styles.pressed]}><Text style={styles.footerLinkText}>{label}</Text></Pressable>;
}

function ActionButton({ label, icon, onPress, primary = false }: { label: string; icon: "arrow-right" | "heart"; onPress: () => void; primary?: boolean }) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.actionButton, primary ? styles.actionPrimary : styles.actionSecondary, pressed && styles.pressed]}><Text style={[styles.actionText, !primary && styles.actionTextSecondary]}>{label}</Text><Feather name={icon} size={16} color={primary ? "#fff" : Blood.primary} /></Pressable>;
}

function Stat({ icon, value, label }: { icon: "users" | "activity" | "home"; value: string; label: string }) {
  return <View style={styles.stat}><View style={styles.statIcon}><Feather name={icon} size={19} color={Blood.primary} /></View><View style={styles.statText}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View></View>;
}

function TrustAvatar({ label }: { label: string }) {
  return <View style={styles.trustAvatar}><Text style={styles.trustAvatarText}>{label}</Text></View>;
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionBody}>{body}</Text></View>;
}

function StepCard({ number, icon, title, body }: { number: string; icon: "file-text" | "search" | "heart"; title: string; body: string }) {
  return <View style={styles.stepCard}><View style={styles.stepTop}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View><View style={styles.stepIcon}><Feather name={icon} size={19} color={Blood.primary} /></View></View><Text style={styles.stepTitle}>{title}</Text><Text style={styles.stepBody}>{body}</Text></View>;
}

function roleImageSource(role: string) {
  if (role === "recipient") return require("../../assets/images/recimpient.webp");
  if (role === "donor") return require("../../assets/images/dorner.png");
  return require("../../assets/images/bloodbank.png");
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8FAFC" },
  page: { alignItems: "center", paddingBottom: 0 },
  headerOuter: { width: "100%", backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#EEF1F5", zIndex: 2 },
  header: { width: "100%", maxWidth: 1280, minHeight: 78, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 37, height: 37, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: Blood.primary },
  brandName: { fontSize: 21, fontWeight: "800", letterSpacing: -0.7, color: "#172033" },
  brandAccent: { color: Blood.primary },
  navLinks: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 22 },
  navLink: { paddingVertical: 10, paddingHorizontal: 2 },
  navLinkText: { fontSize: 13, fontWeight: "600", color: "#536174" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  loginButton: { minHeight: 42, justifyContent: "center", paddingHorizontal: 14, borderRadius: 12 },
  loginText: { color: "#344054", fontSize: 13, fontWeight: "700" },
  signupButton: { minHeight: 43, paddingHorizontal: 17, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Blood.primary },
  signupText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  menuButton: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  mobileMenu: { width: "100%", paddingHorizontal: 22, paddingBottom: 16, backgroundColor: "#fff", gap: 2 },
  mobileActions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 8 },
  main: { width: "100%", maxWidth: 1280, alignSelf: "center", gap: 76, paddingTop: 42, paddingBottom: 78 },
  hero: { width: "100%", gap: 26, alignItems: "stretch" },
  heroWide: { flexDirection: "row", alignItems: "center", gap: 28 },
  heroCopy: { minWidth: 0, alignItems: "flex-start", justifyContent: "center", gap: 19, maxWidth: 620, paddingVertical: 16 },
  heroCopyWide: { flex: 0.9 },
  eyebrow: { flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFF0F2" },
  eyebrowDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Blood.primary },
  eyebrowText: { color: Blood.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.25 },
  heroTitle: { width: "100%", maxWidth: 600, minWidth: 0, color: "#172033", fontWeight: "800", letterSpacing: -2.2 },
  redText: { color: Blood.primary },
  heroSubtitle: { width: "100%", maxWidth: 500, minWidth: 0, color: "#64748B", fontSize: 16, lineHeight: 26 },
  heroActions: { width: "100%", flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 3 },
  actionButton: { minHeight: 50, paddingHorizontal: 19, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11 },
  actionPrimary: { backgroundColor: Blood.primary, ...Elevation.button },
  actionSecondary: { backgroundColor: "#fff", borderWidth: 1, borderColor: Blood.primary },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  actionTextSecondary: { color: "#344054" },
  pressed: { opacity: 0.76 },
  heroTrust: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 7 },
  trustAvatars: { flexDirection: "row", paddingLeft: 1 },
  trustAvatar: { width: 29, height: 29, borderRadius: 15, alignItems: "center", justifyContent: "center", marginLeft: -2, backgroundColor: "#FCE7EB", borderWidth: 2, borderColor: "#F8FAFC" },
  trustAvatarText: { fontSize: 10, fontWeight: "800", color: Blood.primary },
  trustCopy: { color: "#788496", fontSize: 11, lineHeight: 16 },
  trustStrong: { color: "#344054", fontWeight: "700" },
  heroVisual: { width: "100%", minWidth: 0, aspectRatio: 1.25, position: "relative", overflow: "hidden", borderRadius: 28, backgroundColor: "#F3DADD", justifyContent: "flex-end", ...Elevation.card },
  heroVisualWide: { flex: 1.1, width: undefined, maxWidth: undefined },
  heroImage: { width: "100%", height: "100%", borderRadius: 28 },
  heroImageWash: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(255, 248, 249, 0.12)" },
  imageNote: { position: "absolute", left: 16, bottom: 16, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 11, paddingHorizontal: 13, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.96)", ...Elevation.card },
  noteIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F2" },
  noteTitle: { color: "#172033", fontSize: 12, fontWeight: "800" },
  noteSubtitle: { color: "#64748B", fontSize: 10, marginTop: 2 },
  imageBadge: { position: "absolute", top: 15, right: 15, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.95)" },
  imageBadgeText: { color: "#344054", fontSize: 10, fontWeight: "700" },
  statsPanel: { width: "100%", padding: 17, gap: 16, borderRadius: 20, borderWidth: 1, borderColor: "#E9EDF3", backgroundColor: "#fff", ...Elevation.card },
  statsWide: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 26, paddingVertical: 22 },
  stat: { flexDirection: "row", alignItems: "center", gap: 12 },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F2" },
  statText: { gap: 2 },
  statValue: { color: "#172033", fontSize: 17, fontWeight: "800" },
  statLabel: { color: "#758195", fontSize: 11 },
  statDivider: { height: 35, width: 1, backgroundColor: "#E8ECF1", alignSelf: "center" },
  section: { width: "100%", gap: 28 },
  sectionHeading: { alignItems: "center", gap: 9 },
  sectionEyebrow: { color: Blood.primary, fontWeight: "800", fontSize: 10, letterSpacing: 1.4, textAlign: "center" },
  sectionTitle: { color: "#172033", fontSize: 30, lineHeight: 38, fontWeight: "800", letterSpacing: -0.9, textAlign: "center" },
  sectionBody: { maxWidth: 530, color: "#718096", fontSize: 14, lineHeight: 22, textAlign: "center" },
  steps: { width: "100%", gap: 14 },
  cardsWide: { flexDirection: "row" },
  stepCard: { flex: 1, minWidth: 0, padding: 22, borderRadius: 19, borderWidth: 1, borderColor: "#E8ECF1", backgroundColor: "#fff", gap: 12, ...Elevation.card },
  stepTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stepNumber: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: Blood.primary },
  stepNumberText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  stepIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF0F2" },
  stepTitle: { color: "#172033", fontSize: 18, fontWeight: "800", marginTop: 5 },
  stepBody: { color: "#718096", fontSize: 13, lineHeight: 21 },
  roleGrid: { width: "100%", gap: 15 },
  roleCard: { width: "100%", overflow: "hidden", borderRadius: 19, borderWidth: 1, borderColor: "#E8ECF1", backgroundColor: "#fff", ...Elevation.card },
  roleCardWide: { flex: 1, minWidth: 0 },
  roleImageFrame: { width: "100%", height: 170, position: "relative", backgroundColor: "#F0F2F5" },
  roleImage: { width: "100%", height: "100%" },
  roleIconBadge: { position: "absolute", bottom: -17, left: 17, width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff" },
  roleText: { padding: 18, paddingTop: 27, gap: 8 },
  roleTitle: { color: "#172033", fontSize: 16, fontWeight: "800" },
  roleDesc: { color: "#718096", fontSize: 12, lineHeight: 19, minHeight: 38 },
  roleAction: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
  roleActionText: { color: Blood.primary, fontSize: 12, fontWeight: "800" },
  urgentWrap: { width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 17, padding: 23, borderRadius: 22, backgroundColor: "#172033" },
  urgentIcon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: Blood.primary },
  urgentCopy: { flex: 1, minWidth: 220, gap: 5 },
  urgentEyebrow: { color: "#FCA5B4", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  urgentTitle: { color: "#fff", fontSize: 19, lineHeight: 25, fontWeight: "800" },
  urgentBody: { color: "#C3CAD5", fontSize: 12, lineHeight: 19, maxWidth: 560 },
  footer: { width: "100%", backgroundColor: "#111827" },
  footerInner: { width: "100%", maxWidth: 1280, alignSelf: "center", paddingTop: 45, paddingBottom: 22 },
  footerTop: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 32, paddingBottom: 32 },
  footerBrandBlock: { flex: 2, minWidth: 225, maxWidth: 330, gap: 11 },
  footerBrand: { flexDirection: "row", alignItems: "center", gap: 9 },
  footerMark: { width: 33, height: 33, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: Blood.primary },
  footerBrandName: { color: "#fff", fontSize: 19, fontWeight: "800" },
  footerTagline: { color: "#FCA5B4", fontSize: 12, fontWeight: "700" },
  footerDescription: { color: "#98A2B3", fontSize: 12, lineHeight: 19 },
  footerColumn: { flex: 1, minWidth: 130, gap: 10 },
  footerHeading: { color: "#fff", fontSize: 12, fontWeight: "800", marginBottom: 3 },
  footerLink: { paddingVertical: 3, alignSelf: "flex-start" },
  footerLinkText: { color: "#AEB7C5", fontSize: 11 },
  footerSupport: { color: "#AEB7C5", fontSize: 11, lineHeight: 17 },
  footerContact: { flexDirection: "row", alignItems: "center", gap: 7, paddingVertical: 3 },
  footerContactText: { color: "#FCA5B4", fontSize: 11, fontWeight: "700" },
  footerLegal: { color: "#7E8999", fontSize: 10, lineHeight: 16, maxWidth: 190 },
  footerBottom: { borderTopWidth: 1, borderTopColor: "#293244", paddingTop: 17, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 8 },
  copyright: { color: "#7E8999", fontSize: 10 },
  footerMotto: { color: "#AEB7C5", fontSize: 10, fontWeight: "600" },
});
