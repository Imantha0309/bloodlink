/**
 * The `AuthService` implementation for the BloodLink API.
 *
 * This replaces `FirebaseAuthService`. The interface is unchanged, which is the
 * whole point: no screen or component knows which of the two it is talking to.
 *
 * Two things differ from the Firebase version, both deliberate:
 *
 *   - The token is a session JWT the server issues, not a Firebase ID token. It
 *     is long-lived and revoked server-side on sign-out, which is why signing
 *     out still works immediately even though the token has not expired.
 *   - `restoreSession` does *not* sign the user out when the server cannot be
 *     reached. Firebase's version did, because it had no local session to fall
 *     back on. Here a flaky connection at launch would otherwise throw the user
 *     back to the login screen for no reason.
 */

import { ApiError } from "@/services/api/errors";
import { apiRequest, apiUpload, setAuthToken } from "@/services/api/client";
import { clearSession, loadSession, saveSession } from "@/services/auth/session";
import {
  USER_ROLES,
  type AuthSession,
  type AuthService,
  type AuthUser,
  type DonorProfileInput,
  type SignInInput,
  type SignUpInput,
  type UpdateProfileInput,
  type UserRole,
} from "@/services/auth/types";

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Narrows one `AuthUser` off the wire. Returns null rather than trusting it. */
function readUser(value: unknown): AuthUser | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as Partial<AuthUser>;

  if (typeof candidate.id !== "string" || !isRole(candidate.role) || typeof candidate.fullName !== "string") {
    return null;
  }

  const bloodGroup = readText(candidate.bloodGroup);

  return {
    id: candidate.id,
    role: candidate.role,
    fullName: candidate.fullName,
    email: readText(candidate.email),
    mobile: readText(candidate.mobile),
    district: readText(candidate.district),
    bloodGroup,
    // Carried through unvalidated; `readStationAssignment` is what decides
    // whether this build knows the station.
    station: readText(candidate.station),
    wardLabel: readText(candidate.wardLabel),
    // The server computes this, but deriving it here as well means a row that
    // predates the field still behaves correctly.
    isDonorEligible:
      typeof candidate.isDonorEligible === "boolean"
        ? candidate.isDonorEligible
        : candidate.role === "donor" || bloodGroup !== null,
    avatarUrl: readText(candidate.avatarUrl),
  };
}

function readSession(value: unknown): AuthSession | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const candidate = value as { token?: unknown; expiresAt?: unknown; user?: unknown };

  if (typeof candidate.token !== "string" || typeof candidate.expiresAt !== "string") {
    return null;
  }

  const user = readUser(candidate.user);

  if (user === null) {
    return null;
  }

  return { token: candidate.token, expiresAt: candidate.expiresAt, user };
}

export class HttpAuthService implements AuthService {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const session = readSession(
      await apiRequest<unknown>("/auth/login", {
        method: "POST",
        auth: false,
        body: { identifier: input.identifier.trim(), password: input.password },
      }),
    );

    if (session === null) {
      throw new ApiError("unknown", "Sign-in could not be completed.");
    }

    await this.persist(session);

    return session;
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    const session = readSession(
      await apiRequest<unknown>("/auth/register", {
        method: "POST",
        auth: false,
        body: {
          role: input.role,
          fullName: input.fullName.trim(),
          identifier: input.identifier.trim(),
          password: input.password,
          district: input.district ?? null,
          bloodGroup: input.bloodGroup ?? null,
          lastDonationAt: input.lastDonationAt ?? null,
          registrationNumber: input.registrationNumber ?? null,
        },
      }),
    );

    if (session === null) {
      throw new ApiError("unknown", "Your account was created but the session could not be started.");
    }

    await this.persist(session);

    return session;
  }

  async updateDonorProfile(input: DonorProfileInput): Promise<AuthUser> {
    const { user } = await apiRequest<{ user: unknown }>("/auth/me", {
      method: "PATCH",
      body: {
        fullName: input.fullName.trim(),
        email: input.email,
        mobile: input.mobile,
        district: input.district.trim(),
        bloodGroup: input.bloodGroup,
      },
    });

    return this.requireUser(user, "Could not refresh the donor profile.");
  }

  async updateRecipientDistrict(district: string): Promise<AuthUser> {
    const { user } = await apiRequest<{ user: unknown }>("/auth/me", {
      method: "PATCH",
      body: { district },
    });

    return this.requireUser(user, "Could not refresh the recipient profile.");
  }

  async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
    const body: Record<string, unknown> = {};
    if (input.fullName !== undefined) body.fullName = input.fullName.trim();
    if (input.email !== undefined) body.email = input.email ? input.email.trim() : null;
    if (input.mobile !== undefined) body.mobile = input.mobile ? input.mobile.trim() : null;
    if (input.district !== undefined) body.district = input.district ? input.district.trim() : null;
    if (input.bloodGroup !== undefined) body.bloodGroup = input.bloodGroup ? input.bloodGroup.trim() : null;

    const { user } = await apiRequest<{ user: unknown }>("/auth/me", {
      method: "PATCH",
      body,
    });

    const updatedUser = this.requireUser(user, "Could not update your profile.");
    const currentSession = await loadSession();
    if (currentSession !== null) {
      await this.persist({ ...currentSession, user: updatedUser });
    }
    return updatedUser;
  }

  async uploadAvatar(imageUri: string): Promise<AuthUser> {
    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : "jpg";
    const type = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

    formData.append("avatar", {
      uri: imageUri,
      name: filename,
      type,
    } as unknown as Blob);

    const { user } = await apiUpload<{ user: unknown }>("/auth/me/avatar", formData);
    const updatedUser = this.requireUser(user, "Could not upload profile picture.");

    const currentSession = await loadSession();
    if (currentSession !== null) {
      await this.persist({ ...currentSession, user: updatedUser });
    }

    return updatedUser;
  }

  /**
   * The session for this device, re-checked against the server.
   *
   * A stored session is only discarded when the server actively rejects it.
   * Being unreachable is not a rejection, so the user stays signed in.
   */
  async restoreSession(): Promise<AuthSession | null> {
    const stored = await loadSession();

    if (stored === null) {
      setAuthToken(null);
      return null;
    }

    try {
      const { user } = await apiRequest<{ user: unknown }>("/auth/me");
      const profile = readUser(user);

      if (profile === null) {
        await this.clear();
        return null;
      }

      const session: AuthSession = {
        token: stored.token,
        expiresAt: stored.expiresAt,
        // The profile may have changed on another device, so the live copy
        // replaces the cached one.
        user: profile,
      };

      await this.persist(session);

      return session;
    } catch (error) {
      if (error instanceof ApiError && error.code === "unauthorized") {
        await this.clear();
        return null;
      }

      setAuthToken(stored.token);

      return stored;
    }
  }

  async signOut(): Promise<void> {
    try {
      // Revokes the session row server-side. A failure here still signs the
      // user out locally — leaving them signed in because the network is down
      // would be the worse outcome.
      await apiRequest<unknown>("/auth/logout", { method: "POST" });
    } catch {
      // Intentionally swallowed; `clear()` below is what the user sees.
    } finally {
      await this.clear();
    }
  }

  /**
   * Asks for a reset link. Always resolves, so the UI cannot use this to probe
   * whether an address has an account.
   */
  async requestPasswordReset(identifier: string): Promise<void> {
    try {
      await apiRequest<unknown>("/auth/password-reset", {
        method: "POST",
        auth: false,
        body: { identifier: identifier.trim() },
      });
    } catch {
      // Deliberately swallowed — see the method doc.
    }
  }

  /** Stores a session in both the token cache and AsyncStorage. */
  private async persist(session: AuthSession): Promise<void> {
    setAuthToken(session.token);
    await saveSession(session);
  }

  /** Drops the session everywhere it is held. */
  private async clear(): Promise<void> {
    setAuthToken(null);
    await clearSession();
  }

  private requireUser(value: unknown, fallbackMessage: string): AuthUser {
    const user = readUser(value);

    if (user === null) {
      throw new ApiError("unknown", fallbackMessage);
    }

    return user;
  }
}
