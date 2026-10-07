/**
 * Authentication domain types.
 *
 * Screens and components depend only on the `AuthService` interface, never on
 * a concrete adapter. Swapping the mock for the real backend therefore does not
 * touch any UI code.
 */

export const USER_ROLES = ["recipient", "donor", "hospital", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

/**
 * Roles a person may sign themselves up for — `admin` is provisioned.
 *
 * Defined here rather than in `@/constants/roles` so the domain layer does not
 * depend on the presentation layer; that module re-exports it.
 */
export type SelfRegisterRole = Exclude<UserRole, "admin">;

export type AuthUser = {
  id: string;
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district?: string | null;
  bloodGroup?: string | null;
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

export type SignUpInput = {
  role: SelfRegisterRole;
  fullName: string;
  /** Email address or mobile number; the server decides which column it is. */
  identifier: string;
  password: string;
  district?: string | null;
  /** Required for donors, optional for recipients, unused by hospitals. */
  bloodGroup?: string | null;
  /** Donors only. */
  lastDonationAt?: string | null;
  /** Hospitals only — captured for the admin verification queue. */
  registrationNumber?: string | null;
};

export type DonorProfileInput = {
  fullName: string;
  email: string | null;
  mobile: string | null;
  district: string;
  bloodGroup: string;
};

/** What `requestPasswordReset` hands back for the next step. */
export type PasswordResetChallenge = {
  resetId: string;
  /**
   * The one-time code, returned by the local backend because no SMS or email
   * provider is wired up. `null`/absent against a real server.
   */
  devCode?: string | null;
};

/**
 * Machine-readable failure reasons.
 *
 * Re-exported from the shared API layer — kept as `AuthError` here because
 * every existing auth call site refers to it by that name.
 */
export { ApiError, ApiError as AuthError } from "@/services/api/errors";
export type { ApiErrorCode, ApiErrorCode as AuthErrorCode } from "@/services/api/errors";

export interface AuthService {
  /**
   * Resolves with a session on success. Rejects with `AuthError` on any
   * failure — implementations never resolve with a fake success.
   */
  signIn(input: SignInInput): Promise<AuthSession>;

  /** Creates an account and signs the new user straight in. */
  signUp(input: SignUpInput): Promise<AuthSession>;

  /** Updates the profile details for the currently signed-in donor. */
  updateDonorProfile(input: DonorProfileInput): Promise<AuthUser>;

  /** Session for the currently signed-in user, or `null` when signed out. */
  restoreSession(): Promise<AuthSession | null>;

  signOut(): Promise<void>;

  /** Starts password recovery. Rejects when the account does not exist. */
  requestPasswordReset(identifier: string): Promise<PasswordResetChallenge>;

  /** Exchanges a correct code for a single-use reset token. */
  verifyPasswordResetCode(resetId: string, code: string): Promise<string>;

  /** Completes recovery. Invalidates every existing session for the account. */
  resetPassword(resetToken: string, newPassword: string): Promise<void>;
}
