import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { Surface } from "@/constants/colors";
import { AuthProvider, useAuth } from "@/providers/auth-provider";

import "@/global.css";

SplashScreen.preventAutoHideAsync();

/** Matches `Surface.background`, so transitions never flash white. */
const screenBackground = { backgroundColor: Surface.background };

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
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
  const { status } = useAuth();
  const isResolved = status !== "loading";

  useEffect(() => {
    if (isResolved) {
      SplashScreen.hideAsync();
    }
  }, [isResolved]);

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
        <Stack.Screen name="dashboard/admin" options={{ contentStyle: screenBackground }} />

        {/* Destinations the recipient home links to. Shared placeholders until
            each is built. */}
        <Stack.Screen name="dashboard/requests" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/alerts" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/profile" options={{ contentStyle: screenBackground }} />
        <Stack.Screen
          name="dashboard/request-detail"
          options={{ contentStyle: screenBackground }}
        />
        <Stack.Screen name="donors" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="compatibility" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="blood-bank-detail" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="location" options={{ contentStyle: screenBackground }} />

        {/* Recipient flow step placeholders */}
        <Stack.Screen name="dashboard/blood-group" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/hospital-location" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/review-request" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/matching-donors" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/donor-profile" options={{ contentStyle: screenBackground }} />
        <Stack.Screen name="dashboard/request-status" options={{ contentStyle: screenBackground }} />
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