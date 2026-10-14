import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

import { apiRequest } from "@/services/api/client";
import {
    authService,
    saveSession,
    type AuthSession,
    type AuthUser,
    type DonorProfileInput,
    type SignInInput,
    type SignUpInput,
} from "@/services/auth";
import type { StationAssignment } from "@/services/hospital/station";

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
  /**
   * Folds a station change the server has already confirmed back into the
   * cached session. The write itself belongs to `services/hospital/station` —
   * this only keeps the profile row from showing the desk just left behind.
   */
  applyStation: (assignment: StationAssignment) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Registers the device for push notifications and hands the Expo push token to
 * the BloodLink API, which stores it on the user row so the alert fan-out can
 * reach this device.
 *
 * Non-blocking — a failure here must never break sign-in or session restore.
 *
 * The token is an Expo push token rather than a raw FCM/APNs one: nothing in
 * this stack talks to FCM directly any more. Note that `getExpoPushTokenAsync`
 * needs an EAS project id, which this app does not yet declare — the call will
 * throw until one exists, and the `catch` below means that surfaces as "no
 * push" rather than as a broken sign-in.
 */
async function registerForPushNotifications(): Promise<void> {
  try {
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

    const { data: token } = await Notifications.getExpoPushTokenAsync();

    if (!token) {
      return;
    }

    await apiRequest<unknown>("/auth/push-token", { method: "PUT", body: { token } });
  } catch (error) {
    // Non-blocking — push is best-effort; the auth flow must not be affected.
    // Warned about in dev only, because otherwise "no push ever arrives" is
    // invisible: the usual cause is the missing `extra.eas.projectId`.
    if (__DEV__) {
      console.warn("[push] registration skipped:", error);
    }
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
        void registerForPushNotifications();
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
    void registerForPushNotifications();

    return next;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const next = await authService.signUp(input);

    // Must land before the caller navigates, otherwise the dashboard guard is
    // still closed and the redirect bounces straight back to registration.
    setSession(next);

    // Register push token after successful sign-up (non-blocking)
    void registerForPushNotifications();

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

  /**
   * Records a station the server has already accepted.
   *
   * Everything that reads the desk — the hospital profile row, the station
   * caveat on the board — reads it off the session, so without this the screen
   * would keep showing the station the staff member just left until the next
   * restore.
   */
  const applyStation = useCallback(
    async (assignment: StationAssignment) => {
      if (session === null) {
        return;
      }

      const next = { ...session, user: { ...session.user, ...assignment } };
      await saveSession(next);
      setSession(next);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status: !isResolved ? "loading" : session !== null ? "authenticated" : "unauthenticated",
      session,
      signIn,
      signUp,
      updateDonorProfile,
      updateRecipientDistrict,
      applyStation,
      signOut,
    }),
    [
      isResolved,
      session,
      signIn,
      signUp,
      updateDonorProfile,
      updateRecipientDistrict,
      applyStation,
      signOut,
    ],
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