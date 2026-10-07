import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  authService,
  saveSession,
  type AuthSession,
  type AuthUser,
  type DonorProfileInput,
  type SignInInput,
  type SignUpInput,
} from "@/services/auth";

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
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

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

    return next;
  }, []);

  const signUp = useCallback(async (input: SignUpInput) => {
    const next = await authService.signUp(input);

    // Must land before the caller navigates, otherwise the dashboard guard is
    // still closed and the redirect bounces straight back to registration.
    setSession(next);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      status: !isResolved ? "loading" : session !== null ? "authenticated" : "unauthenticated",
      session,
      signIn,
      signUp,
      updateDonorProfile,
      signOut,
    }),
    [isResolved, session, signIn, signUp, updateDonorProfile, signOut],
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