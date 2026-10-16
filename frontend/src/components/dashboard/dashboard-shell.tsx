import { Feather } from "@expo/vector-icons";
import { useFocusEffect, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppState, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AsyncState } from "@/components/ui/async-state";
import { useConfirm } from "@/components/ui/confirm-provider";
import { Blood, Surface } from "@/constants/colors";
import { Radius } from "@/constants/radius";
import { ROLE_NAME } from "@/constants/roles";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { Typography } from "@/constants/typography";
import { useBack } from "@/hooks/use-back";
import { useAuth } from "@/providers/auth-provider";
import { apiErrorMessage } from "@/services/auth";
import {
  getDashboardSummary,
  type DashboardSummary,
  type DonorAvailability,
} from "@/services/dashboard/dashboard";

const DONOR_REFRESH_INTERVAL_MS = 10_000;

/** Handed to the role content so a mutation can update what is on screen. */
export type DashboardHelpers = {
  /**
   * Refetches in the background. No spinner: it runs after the user has already
   * changed something, where blanking the screen would be worse than showing
   * content that is a moment stale.
   */
  reload: () => void;
  /**
   * Writes a server-confirmed availability change straight into the summary.
   *
   * The write endpoints return the new value, so the switch can be correct
   * immediately rather than waiting for the refetch to land.
   */
  applyAvailability: (next: DonorAvailability) => void;
};

type DashboardShellProps = {
  /** Shown under the role name in the header. */
  title: string;
  bottomNavigation?: ReactNode;
  children: (summary: DashboardSummary, helpers: DashboardHelpers) => ReactNode;
  /**
   * Replaces the default role/title/sign-out header.
   *
   * The recipient home supplies its own compact header, which has no sign-out —
   * that moves to the Profile tab. Omit this and the default header renders, so
   * the other three role dashboards are unaffected.
   */
  header?: ReactNode;
  /**
   * Rendered below the scroll area, outside it.
   *
   * Used for the tab bar, which must stay pinned to the bottom rather than
   * scrolling away with the content.
   */
  footer?: ReactNode;
};

/**
 * Chrome and data loading shared by the four role dashboards.
 *
 * Every dashboard is the same shape — fetch `GET /dashboard/me`, then render
 * role-specific blocks from it — so the fetch, the three non-happy states, the
 * pull-to-refresh and the sign-out affordance all live here once. The role
 * screens supply only their content via a render prop.
 */
export function DashboardShell({
  title,
  bottomNavigation,
  children,
  header,
  footer,
}: DashboardShellProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { session, signOut } = useAuth();
  const { confirm, alert: notify } = useConfirm();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  /**
   * How a settled fetch becomes state. Shared by the mount effect and the
   * event-driven reloads so the two cannot drift apart.
   */
  const applySummary = useCallback((next: DashboardSummary) => {
    setSummary(next);
    setError(null);
  }, []);

  /**
   * Records a failure.
   *
   * `silent` suppresses the error state for a background refetch: the caller has
   * already reported its own failure, so replacing the whole dashboard with an
   * error screen would be a worse outcome than leaving content up.
   */
  const applyError = useCallback((caught: unknown, silent: boolean) => {
    if (!silent) {
      setError(apiErrorMessage(caught));
    }
  }, []);

  /** Reloads triggered by the user, where a spinner is expected. */
  const runLoad = useCallback(
    async (silent: boolean): Promise<void> => {
      try {
        applySummary(await getDashboardSummary());
      } catch (caught) {
        applyError(caught, silent);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [applySummary, applyError],
  );

  useEffect(() => {
    // Deliberately not `runLoad`: the lint rule against synchronous setState in
    // an effect cannot see through the call, and the promise callbacks below are
    // the pattern it asks for. `isLoading` already starts true, so nothing needs
    // setting up front.
    let isActive = true;

    void getDashboardSummary()
      .then((next) => {
        if (isActive) {
          applySummary(next);
        }
      })
      .catch((caught: unknown) => {
        if (isActive) {
          applyError(caught, false);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [applySummary, applyError]);

  const reload = useCallback(() => {
    void runLoad(true);
  }, [runLoad]);

  const retry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    void runLoad(false);
  }, [runLoad]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    void runLoad(true);
  }, [runLoad]);

  useFocusEffect(
    useCallback(() => {
      if (session?.user.role !== "donor") return;

      const refreshSubscription = AppState.addEventListener("change", (nextState) => {
        if (nextState === "active") void runLoad(true);
      });
      const interval = setInterval(() => {
        if (AppState.currentState === "active") void runLoad(true);
      }, DONOR_REFRESH_INTERVAL_MS);

      return () => {
        refreshSubscription.remove();
        clearInterval(interval);
      };
    }, [runLoad, session?.user.role]),
  );

  const applyAvailability = useCallback((next: DonorAvailability) => {
    setSummary((current) => (current === null ? current : { ...current, availability: next }));
  }, []);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    const approved = await confirm({
      title: "Sign out",
      message: "Are you sure you want to sign out?",
      confirmLabel: "Sign out",
      icon: "log-out",
      destructive: true,
    });

    if (!approved) {
      return;
    }

    // The session has to be gone before navigating: the login screen is
    // guarded off while authenticated, so navigating first bounces back here.
    setIsSigningOut(true);

    try {
      await signOut();
      router.replace(ROUTES.login);
    } catch (error) {
      console.error("Failed to sign out:", error);
      await notify({
        title: "Sign out failed",
        message: "There was an error signing out. Please try again.",
        icon: "alert-triangle",
        destructive: true,
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  const role = summary?.role ?? session?.user.role ?? "recipient";
  const roleHome = ROLE_HOME[role];
  const isRoleHome = pathname === roleHome;

  /**
   * Back means this role's home tab.
   *
   * The tab bars navigate with `router.replace`, so switching tabs never builds
   * a stack and there is no previous tab to pop; `router.back()` from here
   * would leave the app. That is why this used to sign the user out and go to
   * `role-select`: the reasoning about the auth guard was sound, the conclusion
   * was not. Ending a session is never the answer to "back", and it shipped on
   * six screens where one stray tap lost the session.
   *
   * `useBack` rather than a bare arrow, so the Android button and the iOS swipe
   * agree with it. Without that they pop the whole stack and leave the app,
   * which is the same bug arriving from the other direction.
   */
  const handleBack = useBack(() => false, roleHome);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {header ?? (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          {/* On the role's own home there is no previous tab, so the arrow would
              only ever self-navigate. A spacer the width of the button keeps
              the title aligned with the screens that do have one, without
              drawing a phantom circle. */}
          {isRoleHome ? (
            <View style={styles.headerSpacer} />
          ) : (
            <Pressable
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel={`Back to ${ROLE_NAME[role]} dashboard`}
              hitSlop={6}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Feather name="arrow-left" size={20} color={Surface.text} />
            </Pressable>
          )}

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>{ROLE_NAME[role].toUpperCase()}</Text>

            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push(ROUTES.settings)}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              hitSlop={6}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
              ]}
            >
              <Feather name="settings" size={18} color={Surface.text} />
            </Pressable>

            <Pressable
              hitSlop={6}
              onPress={() => {
                void handleSignOut();
              }}
              disabled={isSigningOut}
              accessibilityRole="button"
              accessibilityLabel="Sign out"
              accessibilityState={{ disabled: isSigningOut }}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.iconButtonPressed,
                isSigningOut && styles.iconButtonDisabled,
              ]}
            >
              <Feather name="log-out" size={18} color={Surface.text} />
            </Pressable>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        // A tap that lands on a control while the keyboard is up must reach that
        // control, not be spent on dismissing the keyboard first.
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Blood.primary}
            colors={[Blood.primary]}
          />
        }
      >
        <AsyncState isLoading={isLoading} error={error} onRetry={retry}>
          {summary !== null ? children(summary, { reload, applyAvailability }) : null}
        </AsyncState>
      </ScrollView>

      {/* Outside the ScrollView so a tab bar stays pinned to the bottom. */}
      {footer}
      {bottomNavigation}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Surface.background,
  },

  flex: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },

  headerSpacer: {
    width: 44,
    height: 44,
  },

  headerText: {
    flex: 1,
    gap: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  eyebrow: {
    ...Typography.micro,
    color: Surface.textMuted,
  },

  title: {
    ...Typography.screenTitle,
    color: Surface.text,
  },

  /** Circular header affordance, shared by back and sign out. */
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surface.iconWash,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Surface.border,
  },

  iconButtonPressed: {
    backgroundColor: Surface.border,
  },

  iconButtonDisabled: {
    opacity: 0.5,
  },

  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
});
