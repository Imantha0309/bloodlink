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

      <Stack.Protected guard={status === "authenticated"}>
        <Stack.Screen
          name="dashboard/recipient"
          options={{ contentStyle: screenBackground }}
        />
        <Stack.Screen name="dashboard/donor" options={{ contentStyle: screenBackground }} />
        <Stack.Screen
          name="dashboard/hospital"
          options={{ contentStyle: screenBackground }}
        />
        <Stack.Screen name="dashboard/admin" options={{ contentStyle: screenBackground }} />
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