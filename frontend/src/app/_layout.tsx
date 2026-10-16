import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, type Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { ConfirmProvider } from "@/components/ui/confirm-provider";
import { Surface } from "@/constants/colors";
import { ROLE_HOME, ROUTES } from "@/constants/routes";
import { QueryCacheProvider } from "@/data/provider";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

import "@/global.css";

SplashScreen.preventAutoHideAsync();

/** Matches `Surface.background`, so transitions never flash white. */
const screenBackground = { backgroundColor: Surface.background };

/** Custom scheme the donor intake QR encodes into. */
const INTAKE_SCHEME = "bloodlink-intake:";

/**
 * Maps the intake QR payload onto the pass screen.
 *
 * `bloodlink://...` is expo-router's own job. The intake QR is the exception: it
 * packs the ticket into a custom scheme (`bloodlink-intake:v1:<requestId>:<secret>`)
 * rather than a path, so nothing in the router knows to send it to
 * `pass-details`. The payload is forwarded whole as `raw` and read there by the
 * one canonical decoder, rather than being split into pieces a second time here.
 */
function routeForIntakeUrl(url: string): Href | null {
  if (!url.startsWith(INTAKE_SCHEME)) {
    return null;
  }

  return `${ROUTES.passDetails}?raw=${encodeURIComponent(url)}`;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* Inside AuthProvider: the cache resets when the signed-in account
          changes, which it can only observe from there. */}
      <QueryCacheProvider>
        {/* Above the navigator so `ConfirmDialog` overlays every screen, and
            above `QueryCacheProvider` so a prompt raised by a screen survives
            the sign-out that navigates it away. */}
        <ConfirmProvider>
          <AppNavigator />
        </ConfirmProvider>
      </QueryCacheProvider>
    </AuthProvider>
  );
}

/**
 * Split out so it can read auth state from the provider above it.
 *
 * Also owns hiding the native splash: it stays up until the stored session has
 * been resolved, so a signed-in user never sees a flash of the login screen on
 * cold start.
 */
function AppNavigator() {
  const { status, session } = useAuth();
  const isResolved = status !== "loading";
  const router = useRouter();

  useEffect(() => {
    if (isResolved) {
      SplashScreen.hideAsync();
    }
  }, [isResolved]);

  // Handle notification taps — deep-link to the relevant request or dashboard
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | null;
      const requestId = typeof data?.requestId === "string" ? data.requestId : null;

      if (requestId) {
        router.push({ pathname: ROUTES.requestStatus, params: { id: requestId } });
      } else if (session?.user.role) {
        router.push(ROLE_HOME[session.user.role]);
      }
    });

    return () => subscription.remove();
  }, [session, router]);

  /**
   * Intake QR deep links, both cold and warm.
   *
   * The cold-start branch matters most: a scan that launches the app from a
   * closed state delivers its URL once, before any listener is attached, so
   * without `getInitialURL` the ticket is silently dropped and the scanner sees
   * the splash screen instead of the pass.
   *
   * Both branches wait for the stored session to resolve, because pushing to a
   * screen still behind an unresolved guard is dropped by the router.
   */
  useEffect(() => {
    if (!isResolved) {
      return;
    }

    const open = (url: string | null) => {
      if (url === null) {
        return;
      }

      const target = routeForIntakeUrl(url);

      if (target !== null) {
        router.push(target);
      }
    };

    void Linking.getInitialURL().then(open);

    const subscription = Linking.addEventListener("url", ({ url }) => {
      open(url);
    });

    return () => subscription.remove();
  }, [isResolved, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: screenBackground,
      }}
    >
      {/* Always reachable. */}
      <Stack.Screen name="index" />

      {/* "Zero Login" — the account-free urgent request path, so it must stay
          reachable whether or not anyone is signed in. */}
      <Stack.Screen name="emergency-request" options={{ contentStyle: screenBackground }} />

      {/* Public pass verification screen for QR code scans. */}
      <Stack.Screen name="pass-details" options={{ contentStyle: screenBackground }} />

      {/* Catch-all for unmatched paths — a stale or truncated QR payload lands
          here rather than on a screen that would render invented details. Kept
          outside both guards so it resolves signed in or out. */}
      <Stack.Screen name="+not-found" options={{ contentStyle: screenBackground }} />

      <Stack.Protected guard={status === "authenticated"}>
        <Stack.Screen
          name="dashboard/recipient"
          options={{ contentStyle: screenBackground }}
        />
        <Stack.Screen name="dashboard/donor" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/donor-requests" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/donor-transit" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/donor-intake" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/donor-profile" options={{ contentStyle: screenBackground }} />
        <Stack.Screen
          name="dashboard/hospital"
          options={{ contentStyle: screenBackground }}
        />

        {/* Admin tabs: queue, banks and accounts. */}
        <Stack.Screen name="dashboard/admin" options={{ contentStyle: screenBackground }} />

        {/* Recipient destinations the home screen links to. */}
        <Stack.Screen name="dashboard/requests" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/alerts" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/profile" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="donors" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="compatibility" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="blood-bank-detail" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="location" options={{ contentStyle: screenBackground }} />

        {/* The Donate tab is a route so it can be linked to directly. */}
        <Stack.Screen name="dashboard/donate" options={{ contentStyle: screenBackground }} />

        <Stack.Screen name="dashboard/request-status" options={{ contentStyle: screenBackground }} />

        {/* The pass scanner, plus the admin profile that hosts one. */}
        <Stack.Screen name="scan" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/admin-profile" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="settings" options={{ contentStyle: screenBackground }} />
      </Stack.Protected>

      <Stack.Protected guard={status === "unauthenticated"}>
        <Stack.Screen name="role-select" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="login" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="register" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="forgot-password" options={{ contentStyle: screenBackground }} />
      </Stack.Protected>
    </Stack>
  );
}