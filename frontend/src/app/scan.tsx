/**
 * The scanner every role can open.
 *
 * Reads somebody's pass and tells the person holding the phone who they are.
 * What happens next is decided by *this* device's role, not the pass owner's:
 * hospital staff get the intake desk, admin get the accounts table, and a donor
 * or recipient gets confirmation and nothing else — there is no donor-side or
 * recipient-side workflow that acting on a scanned identity would mean.
 *
 * The pass proves who someone is. It deliberately does not authorise anything:
 * the intake desk still scans the donor's single-use intake ticket, which is
 * bound to one donation. Confusing the two would let one person's pass satisfy
 * a check that is supposed to prove they arrived for a *specific* request.
 *
 * A donor or recipient additionally gets the matching-requests screen: a read-only
 * cross-reference of the donor they just scanned against the requests this account
 * can already see. It is a second step of this same screen rather than a route,
 * because it needs the pass secret, and a secret does not belong in a URL.
 */

import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PassMatchList } from "@/components/qr/pass-match-list";
import { ScanSheet, type PassAction } from "@/components/qr/scan-sheet";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useBack } from "@/hooks/use-back";
import { useAuth } from "@/providers/auth-provider";
import type { ResolvedPass } from "@/services/auth/pass-service";
import { haptics } from "@/utils/haptics";

const TITLE_BY_ROLE = {
  hospital: "Verify at the desk",
  admin: "Identify a user",
  donor: "Scan a pass",
  recipient: "Scan a pass",
} as const;

/** A resolved pass plus the secret that proves it, held only in memory. */
type ScannedPass = { resolved: ResolvedPass; secret: string };

export default function ScanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();

  const role = session?.user.role ?? "recipient";
  const [isOpen, setIsOpen] = useState(false);
  const [scanned, setScanned] = useState<ScannedPass | null>(null);

  const actionsFor = useCallback(
    (resolved: ResolvedPass): PassAction[] => {
      // Scanning your own pass is a no-op rather than a mistake to route on.
      if (resolved.isSelf) {
        return [];
      }

      if (role === "hospital") {
        return [
          {
            label: "Open the intake desk",
            icon: "clipboard",
            onPress: () => {
              haptics.medium();
              setIsOpen(false);
              router.push(ROUTES.hospitalVerifyDonor);
            },
          },
        ];
      }

      if (role === "admin") {
        return [
          {
            label: "Open accounts",
            icon: "users",
            onPress: () => {
              haptics.medium();
              setIsOpen(false);
              router.push(ROUTES.adminUsers);
            },
          },
        ];
      }

      return [];
    },
    [role, router],
  );

  // Only these two roles get the cross-reference. `admin` is deliberately left
  // out: it already has the accounts table, which is the whole-country version of
  // the same question, and a pass is not a licence to browse it.
  const canSeeMatches = role === "recipient" || role === "hospital";

  // The match list is a step of this screen, not a screen of its own, so back
  // returns to the scanner instead of leaving. The pass secret is held in state
  // precisely so this never has to be a route.
  //
  // With nothing on the match list, back leaves — and since `/scan` is
  // reachable cold, where the stack has no parent, the fallback is this role's
  // own home.
  const handleBack = useBack(() => {
    if (scanned === null) {
      return false;
    }

    setScanned(null);
    return true;
  }, ROLE_HOME[role]);

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {scanned !== null ? (
          <>
            <PassMatchList
              resolved={scanned.resolved}
              secret={scanned.secret}
              scope={role === "recipient" ? "mine" : "board"}
              canRespond={role === "hospital"}
              onBack={() => {
                setScanned(null);
                setIsOpen(false);
              }}
            />
          </>
        ) : (
          <>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                hitSlop={6}
                onPress={handleBack}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <Feather name="arrow-left" size={20} color={Surface.text} />
              </Pressable>

              <Text style={styles.title} numberOfLines={1}>
                Scan
              </Text>

              <View style={styles.headerSpacer} />
            </View>

            {isOpen ? (
              <ScanSheet
                visible
                onClose={() => setIsOpen(false)}
                actionsFor={actionsFor}
                title={TITLE_BY_ROLE[role]}
                onResolved={(resolved, secret) => {
                  // A donor and a recipient have no action inside the sheet, so
                  // the scan would otherwise end there. Both get the matches.
                  if (canSeeMatches && !resolved.isSelf) {
                    setScanned({ resolved, secret });
                    return;
                  }

                  setScanned(null);
                }}
              />
            ) : (
              <View style={styles.idle}>
                <View style={styles.idleIcon}>
                  <Feather name="maximize" size={34} color={Surface.textMuted} />
                </View>

                <Text style={styles.idleTitle}>Ready to scan</Text>

                <Text style={styles.idleMessage}>
                  Ask the other person to open their profile and show you the pass under
                  &ldquo;My pass&rdquo;. Their name appears here once the code checks out
                  against the server.
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open scanner"
                  accessibilityHint="Opens the camera to read a pass"
                  onPress={() => {
                    haptics.light();
                    setIsOpen(true);
                  }}
                  style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
                >
                  <Feather name="camera" size={17} color={Surface.onPrimary} />
                  <Text style={styles.ctaText}>Open scanner</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  content: {
    paddingHorizontal: 20,
    gap: 14,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  title: {
    flex: 1,
    ...Typography.title,
    color: Surface.text,
  },

  idle: {
    alignItems: "center",
    gap: 12,
    paddingTop: 28,
  },

  idleIcon: {
    width: 76,
    height: 76,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  idleTitle: {
    ...Typography.title,
    color: Surface.text,
  },

  idleMessage: {
    ...Typography.body,
    color: Surface.textSecondary,
    textAlign: "center",
    paddingHorizontal: 8,
  },

  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    minHeight: 54,
    marginTop: 6,
    borderRadius: Radius.field,
    backgroundColor: Blood.primary,
  },

  ctaText: {
    ...Typography.button,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  pressed: {
    opacity: 0.75,
  },
});
