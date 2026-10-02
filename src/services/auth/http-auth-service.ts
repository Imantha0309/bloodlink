import { request } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";

import { clearSession, loadSession, saveSession } from "./session";
import type {
  AuthService,
  AuthSession,
  AuthUser,
  PasswordResetChallenge,
  SignInInput,
  SignUpInput,
} from "./types";

/**
 * Talks to the real BloodLink backend (`server/` in this repo).
 *
 * Active whenever `EXPO_PUBLIC_API_URL` is set — `src/services/auth/index.ts`
 * picks the mock adapter until then. All transport concerns (timeout, bearer
 * token, error mapping) live in `@/services/api/client`.
 */

const SIGN_IN_PATH = "/auth/sign-in";
const REGISTER_PATH = "/auth/register";
const ME_PATH = "/auth/me";
const SIGN_OUT_PATH = "/auth/sign-out";
const FORGOT_PASSWORD_PATH = "/auth/forgot-password";
const VERIFY_OTP_PATH = "/auth/verify-otp";
const RESET_PASSWORD_PATH = "/auth/reset-password";

/** Narrows an unknown payload to a session we can store and trust. */
function readSession(body: unknown): AuthSession {
  const session = (body as { session?: Partial<AuthSession> } | null)?.session;

  if (
    !session ||
    typeof session.token !== "string" ||
    typeof session.expiresAt !== "string" ||
    typeof session.user !== "object" ||
    session.user === null
  ) {
    throw new ApiError("unknown", "The server returned an unexpected response.");
  }

  return session as AuthSession;
}

export class HttpAuthService implements AuthService {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const body = await request<unknown>(SIGN_IN_PATH, {
      method: "POST",
      anonymous: true,
      body: {
        identifier: input.identifier.trim(),
        password: input.password,
      },
    });

    const session = readSession(body);

    // Written here rather than by the screen, so every adapter has the same
    // persistence behaviour.
    await saveSession(session);

    return session;
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    const body = await request<unknown>(REGISTER_PATH, {
      method: "POST",
      anonymous: true,
      body: {
        role: input.role,
        fullName: input.fullName.trim(),
        identifier: input.identifier.trim(),
        password: input.password,
        district: input.district ?? undefined,
        bloodGroup: input.bloodGroup ?? undefined,
        lastDonationAt: input.lastDonationAt ?? undefined,
        registrationNumber: input.registrationNumber ?? undefined,
      },
    });

    const session = readSession(body);

    await saveSession(session);

    return session;
  }

  /**
   * Re-reads the stored session and confirms the token is still good.
   *
   * Without the server round-trip a token revoked on another device — or one
   * invalidated by a password reset — would keep working until it expired. A
   * connectivity failure is not proof the session is bad, so the cached value
   * is kept in that case and the user is only signed out on an explicit 401.
   */
  async restoreSession(): Promise<AuthSession | null> {
    const stored = await loadSession();

    if (stored === null) {
      return null;
    }

    try {
      const body = await request<{ user?: AuthUser }>(ME_PATH);
      const user = body.user;

      if (!user || typeof user.id !== "string") {
        return stored;
      }

      const refreshed: AuthSession = { ...stored, user };
      await saveSession(refreshed);

      return refreshed;
    } catch (error) {
      if (error instanceof ApiError && error.code === "unauthorized") {
        await clearSession();
        return null;
      }

      return stored;
    }
  }

  async signOut(): Promise<void> {
    try {
      await request<void>(SIGN_OUT_PATH, { method: "POST" });
    } catch {
      // The local session is cleared regardless — a failed revoke must not
      // leave the user stuck signed in.
    }

    await clearSession();
  }

  async requestPasswordReset(identifier: string): Promise<PasswordResetChallenge> {
    const body = await request<{ resetId?: string; devCode?: string }>(FORGOT_PASSWORD_PATH, {
      method: "POST",
      anonymous: true,
      body: { identifier: identifier.trim() },
    });

    if (typeof body.resetId !== "string") {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return { resetId: body.resetId, devCode: body.devCode ?? null };
  }

  async verifyPasswordResetCode(resetId: string, code: string): Promise<string> {
    const body = await request<{ resetToken?: string }>(VERIFY_OTP_PATH, {
      method: "POST",
      anonymous: true,
      body: { resetId, code },
    });

    if (typeof body.resetToken !== "string") {
      throw new ApiError("unknown", "The server returned an unexpected response.");
    }

    return body.resetToken;
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    await request<void>(RESET_PASSWORD_PATH, {
      method: "POST",
      anonymous: true,
      body: { resetToken, newPassword },
    });
  }
}
