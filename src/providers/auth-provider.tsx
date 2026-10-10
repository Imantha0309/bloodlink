import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { app, USE_EMULATORS } from "@/services/firebase";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { getFunctions, httpsCallable } from "firebase/functions";

import {
    authService,
    saveSession,
    type AuthSession,
    type AuthUser,
    type DonorProfileInput,
    type SignInInput,
    type SignUpInput,
} from "@/services/auth";

// Show alerts even when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Whether the stored session has been checked yet.
 *
 * `loading` is deliberately distinct from "signed out": guards must never
 * evaluate against an unknown session, or a signed-in user would be bounced
 * off their dashboard during the first render.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  /**
   * Authenticates and stores the session. Prefer this over calling
   * `authService` directly, so navigation guards observe the new state.
   */
  signIn: (input: SignInInput) => Promise<AuthSession>;
  /** Registers a new account and signs it in, with the same guarantee. */
  signUp: (input: SignUpInput) => Promise<AuthSession>;
  updateDonorProfile: (input: DonorProfileInput) => Promise<AuthUser>;
  /** Re-points the signed-in recipient's district (the "location" page). */
  updateRecipientDistrict: (district: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Registers the device for push notifications and saves the FCM token to
 * Firestore (via the savePushToken Cloud Function) so the notification fan-out
 * function can target this device.
 *
 * Non-blocking — a failure here must never break sign-in or session restore.
 *
 * Skipped entirely in emulator mode. Push cannot work there: FCM is a no-op in
 * the emulator and the Cloud Function is not deployed, so the only outcome would
 * be a doomed network round-trip on every sign-in.
 */
async function registerForPushNotifications(user: AuthUser): Promise<void> {
  try {
    if (USE_EMULATORS) {
      return;
    }

    // Push notifications only work on physical devices
    if (!Device.isDevice) {
      return;
    }

    // Android requires a notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("blood_requests", {
        name: "Blood Requests",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D32F2F",
        sound: "default",
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      // User denied — that's fine, we just won't send push
      return;
    }

    // Get the raw FCM/APNs device token (not the Expo push token)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const rawToken = tokenData.data;

    if (!rawToken) {
      return;
    }

    // Save to Firestore via the Cloud Function so the fan-out query can reach it
    const fns = getFunctions(app);
    const savePushTokenFn = httpsCallable(fns, "savePushToken");
    await savePushTokenFn({
      token: rawToken,
      bloodGroup: user.bloodGroup ?? null,
      isAvailable: true,
    });
  } catch {
    // Non-blocking — push is best-effort; auth flow must not be affected
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    let isActive = true;

    void authService.restoreSession().then((restored) => {
      if (!isActive) {
        return;
      }

      setSession(restored);
      setIsResolved(true);

      // Register for push notifications on session restore (non-blocking)
      if (restored !== null) {
        void registerForPushNotifications(restored.user);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const signIn = useCallback(async (input: SignInInput) => {
    const next = await authService.signIn(input);

    // Must land before the caller navigates, otherwise the dashboard guard is
    // still closed and the redirect bounces straight back to login.
    setSession(next);

    // Register push token after successful sign-in (non-blocking)
    void registerForPushNotifications(next.user);

    return next;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const next = await authService.signUp(input);

    // Must land before the caller navigates, otherwise the dashboard guard is
    // still closed and the redirect bounces straight back to registration.
    setSession(next);

    // Register push token after successful sign-up (non-blocking)
    void registerForPushNotifications(next.user);

    return next;
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
  }, []);

  const updateDonorProfile = useCallback(async (input: DonorProfileInput) => {
    const updatedUser = await authService.updateDonorProfile(input);
    if (session === null) throw new Error("No active donor session.");
    const next = { ...session, user: updatedUser };
    await saveSession(next);
    setSession(next);
    return updatedUser;
  }, [session]);

  const updateRecipientDistrict = useCallback(async (district: string) => {
    const updatedUser = await authService.updateRecipientDistrict(district);
    if (session === null) throw new Error("No active recipient session.");
    const next = { ...session, user: updatedUser };
    await saveSession(next);
    setSession(next);
    return updatedUser;
  }, [session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status: !isResolved ? "loading" : session !== null ? "authenticated" : "unauthenticated",
      session,
      signIn,
      signUp,
      updateDonorProfile,
      updateRecipientDistrict,
      signOut,
    }),
    [isResolved, session, signIn, signUp, updateDonorProfile, updateRecipientDistrict, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

/**
 * Throws when used outside the provider — a missing provider is a wiring bug,
 * not a state to render around.
 */
export function useAuth(): AuthContextValue {
  const context = use(AuthContext);

  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}