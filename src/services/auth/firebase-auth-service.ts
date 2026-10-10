/**
 * Firebase Auth adapter for the `AuthService` contract.
 *
 * Identity lives in Firebase Auth (email/password) and the profile lives in the
 * Data Connect `users` table, keyed by the Firebase `uid`. A numeric identifier
 * like `0771234567` maps to the derived sign-in email `71234567@bloodlink.lk`,
 * since Firebase Auth does not store phone numbers by default.
 *
 * Password recovery emails a Firebase reset link; the client never sees a code.
 */

import { ApiError } from "@/services/api/errors";
import { clearSession, saveSession } from "@/services/auth/session";
import {
    USER_ROLES,
    type AuthSession,
    type AuthUser,
    type DonorProfileInput,
    type SignInInput,
    type SignUpInput,
    type UserRole,
} from "@/services/auth/types";
import { toApiError } from "@/services/dataconnect/errors";
import { auth } from "@/services/firebase";
import {
    getMe as fetchMe,
    UserRole as GeneratedUserRole,
    registerUser,
    updateRecipientDistrict as updateLocation,
    updateDonorProfile as updateProfile,
} from "@dataconnect/generated";
import {
    createUserWithEmailAndPassword,
    deleteUser,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    type User,
} from "firebase/auth";

/**
 * `07XXXXXXXX` (or `7XXXXXXXX`) becomes `7XXXXXXXX@bloodlink.lk`; anything with
 * an `@` is treated as an email.
 */
function resolveEmail(identifier: string): string {
  const value = identifier.trim();

  if (value.includes("@")) {
    return value.toLowerCase();
  }

  const digits = value.replace(/[^0-9]/g, "").replace(/^0+/, "");

  if (digits.length === 0) {
    return value.toLowerCase();
  }

  return `${digits}@bloodlink.lk`;
}

/** Returns `{ email, mobile }`. Phones store both the digits and the derived email. */
function splitIdentifier(identifier: string): { email: string; mobile: string | null } {
  const value = identifier.trim();

  if (value.includes("@")) {
    return { email: value.toLowerCase(), mobile: null };
  }

  const digits = value.replace(/\D/g, "");

  return { email: resolveEmail(value), mobile: digits.length > 0 ? digits : null };
}

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Narrows the `GetMe` row onto the app's user shape. */
function readMe(value: unknown): AuthUser | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as {
    uid?: unknown;
    role?: unknown;
    fullName?: unknown;
    email?: unknown;
    mobile?: unknown;
    district?: unknown;
    bloodGroup?: unknown;
  };

  if (
    typeof candidate.uid !== "string" ||
    !isRole(candidate.role) ||
    typeof candidate.fullName !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.uid,
    role: candidate.role,
    fullName: candidate.fullName,
    email: typeof candidate.email === "string" ? candidate.email : null,
    mobile: typeof candidate.mobile === "string" ? candidate.mobile : null,
    district: typeof candidate.district === "string" ? candidate.district : null,
    bloodGroup: typeof candidate.bloodGroup === "string" ? candidate.bloodGroup : null,
    isDonorEligible:
      typeof candidate.bloodGroup === "string" && candidate.bloodGroup.length > 0,
  };
}

/** Waits for Firebase persistence to restore any signed-in user. */
function restoreCurrentUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

function mapAuthError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as { code?: unknown }).code
      : undefined;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/invalid-email":
    case "auth/user-not-found":
      return new ApiError("invalid_credentials");
    case "auth/email-already-in-use":
      return new ApiError("conflict", "An account already exists for this email or number.");
    case "auth/weak-password":
      return new ApiError("validation", "That password is too weak. Use at least 6 characters.");
    case "auth/network-request-failed":
      return new ApiError("network");
    case "auth/too-many-requests":
      return new ApiError("account_locked");
    case "auth/user-disabled":
      return new ApiError("account_locked", "This account is currently disabled.");
    default:
      return new ApiError("unknown");
  }
}

export class FirebaseAuthService {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const email = resolveEmail(input.identifier);

    try {
      await signInWithEmailAndPassword(auth, email, input.password);
      const user = auth.currentUser;

      if (user === null) {
        throw new ApiError("unknown", "Sign-in could not be completed.");
      }

      const session = await this.buildSession(user);
      await saveSession(session);
      return session;
    } catch (error) {
      throw mapAuthError(error);
    }
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    const { email, mobile } = splitIdentifier(input.identifier);
    let createdUser: User | null = null;

    try {
      const credential = await createUserWithEmailAndPassword(auth, email, input.password);
      createdUser = credential.user;

      await registerUser({
        role: GeneratedUserRole[input.role],
        fullName: input.fullName.trim(),
        district: input.district ?? null,
        bloodGroup: input.bloodGroup ?? null,
        registrationNumber: input.registrationNumber ?? null,
        lastDonationAt: input.lastDonationAt ?? null,
        email,
        mobile,
      });

      const session = await this.buildSession(createdUser);
      await saveSession(session);
      return session;
    } catch (error) {
      if (createdUser !== null) {
        try {
          await deleteUser(createdUser);
        } catch {
          // Best-effort rollback; the profile insert was never applied.
        }
      }

      throw mapAuthError(error);
    }
  }

  async updateDonorProfile(input: DonorProfileInput): Promise<AuthUser> {
    const user = await this.requireUser();

    try {
      await updateProfile({
        fullName: input.fullName.trim(),
        email: input.email,
        mobile: input.mobile,
        district: input.district.trim(),
        bloodGroup: input.bloodGroup,
      });

      const profile = await this.fetchProfile(user);

      if (profile === null) {
        throw new ApiError("unknown", "Could not refresh the donor profile.");
      }

      return profile;
    } catch (error) {
      throw toApiError(error);
    }
  }

  async updateRecipientDistrict(district: string): Promise<AuthUser> {
    const user = await this.requireUser();

    try {
      await updateLocation({ district });

      const profile = await this.fetchProfile(user);

      if (profile === null) {
        throw new ApiError("unknown", "Could not refresh the recipient profile.");
      }

      return profile;
    } catch (error) {
      throw toApiError(error);
    }
  }

  async restoreSession(): Promise<AuthSession | null> {
    try {
      const user = await restoreCurrentUser();

      if (user === null) {
        await clearSession();
        return null;
      }

      const session = await this.buildSession(user);
      await saveSession(session);
      return session;
    } catch {
      await clearSession();
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } finally {
      await clearSession();
    }
  }

  /**
   * Emails a reset link. Always resolves, so the UI cannot use this to probe
   * whether an address has an account.
   */
  async requestPasswordReset(identifier: string): Promise<void> {
    const email = resolveEmail(identifier);

    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Deliberately swallowed — see the method doc.
    }
  }

  private async requireUser(): Promise<User> {
    const user = await restoreCurrentUser();

    if (user === null) {
      throw new ApiError("unauthorized", "Your session has expired. Please sign in again.");
    }

    return user;
  }

  private async fetchProfile(user: User): Promise<AuthUser | null> {
    try {
      const { data } = await fetchMe();
      return readMe(data.me);
    } catch {
      return null;
    }
  }

  private async buildSession(user: User): Promise<AuthSession> {
    try {
      const { data } = await fetchMe();
      const profile = readMe(data.me);

      if (profile === null) {
        throw new ApiError("not_found", "This account has no profile yet. Please sign up first.");
      }

      const tokenResult = await user.getIdTokenResult();

      return {
        token: tokenResult.token,
        expiresAt: tokenResult.expirationTime,
        user: profile,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw toApiError(error);
    }
  }
}