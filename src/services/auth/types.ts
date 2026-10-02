/**
 * Authentication domain types.
 *
 * Screens and components depend only on the `AuthService` interface, never on
 * a concrete adapter. Swapping the mock for the real backend therefore does not
 * touch any UI code.
 */

export const USER_ROLES = ["recipient", "donor", "hospital", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type AuthUser = {
  id: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district?: string | null;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

export type SignInInput = {
  /** Email address or mobile number exactly as the user typed it. */
  identifier: string;
  password: string;
};

/**
 * Machine-readable failure reasons. UI maps these to human copy so technical
 * detail never reaches the user.
 */
export type AuthErrorCode =
  | "invalid_credentials"
  | "network"
  | "account_locked"
  | "unknown";

export class AuthError extends Error {
  readonly code: AuthErrorCode;

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code);
    this.name = "AuthError";
    this.code = code;
  }
}

export interface AuthService {
  /**
   * Resolves with a session on success. Rejects with `AuthError` on any
   * failure — implementations never resolve with a fake success.
   */
  signIn(input: SignInInput): Promise<AuthSession>;

  /** Session for the currently signed-in user, or `null` when signed out. */
  restoreSession(): Promise<AuthSession | null>;

  signOut(): Promise<void>;
}

/**
 * Maps a failure onto the copy the user should read. Anything unrecognised
 * falls back to a generic message rather than leaking internals.
 */
export function authErrorMessage(error: unknown): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "invalid_credentials":
        return "Incorrect email or password.";
      case "network":
        return "Unable to connect. Please try again.";
      case "account_locked":
        return "This account is temporarily locked. Please try again later.";
      case "unknown":
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return "Unable to connect. Please try again.";
}