/**
 * Authentication domain types.
 *
 * Screens and components depend only on the `AuthService` interface, never on
 * a concrete adapter. Swapping the backend implementation therefore does not
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
  /** True when this user has a blood group set — they can act as a donor regardless of role. */
  isDonorEligible?: boolean;
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

  /** Re-points the signed-in recipient's district (their "location" page). */
  updateRecipientDistrict(district: string): Promise<AuthUser>;

  /** Session for the currently signed-in user, or `null` when signed out. */
  restoreSession(): Promise<AuthSession | null>;

  signOut(): Promise<void>;

  /**
   * Emails a password-reset link to the account behind `identifier`. Resolves
   * even when the account is unknown, so the caller never reveals whether an
   * address is registered.
   */
  requestPasswordReset(identifier: string): Promise<void>;
}
