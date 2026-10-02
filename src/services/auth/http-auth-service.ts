import { API_BASE_URL } from "@/services/config";

import { clearSession, loadSession, saveSession } from "./session";
import {
  AuthError,
  type AuthService,
  type AuthSession,
  type SignInInput,
} from "./types";

/**
 * Talks to the real BloodLink backend.
 *
 * Inactive until `EXPO_PUBLIC_API_URL` is set — `src/services/auth/index.ts`
 * picks the mock adapter until then. The endpoints below are the contract this
 * screen expects; adjust paths and payload keys to match the server without
 * touching any UI code.
 */

const SIGN_IN_PATH = "/auth/sign-in";

const REQUEST_TIMEOUT_MS = 15000;

/** Narrows an unknown JSON body to something we can safely read fields off. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const base = API_BASE_URL;

  if (base === null) {
    throw new AuthError("unknown", "EXPO_PUBLIC_API_URL is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...init.headers,
      },
    });
  } catch {
    // Offline, DNS failure, or timeout — all surfaced as a connectivity
    // problem rather than a credential problem.
    throw new AuthError("network");
  } finally {
    clearTimeout(timer);
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthError("invalid_credentials");
  }

  if (response.status === 423) {
    throw new AuthError("account_locked");
  }

  if (!response.ok) {
    throw new AuthError("unknown");
  }

  return asRecord(body) as T;
}

export class HttpAuthService implements AuthService {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const body = await request<Record<string, unknown>>(SIGN_IN_PATH, {
      method: "POST",
      body: JSON.stringify({
        identifier: input.identifier.trim(),
        password: input.password,
      }),
    });

    const session = body.session as AuthSession | undefined;

    if (!session || typeof session.token !== "string") {
      throw new AuthError("unknown");
    }

    // Session is written here rather than by the screen, so every adapter has
    // the same persistence behaviour.
    await saveSession(session);

    return session;
  }

  async restoreSession(): Promise<AuthSession | null> {
    return loadSession();
  }

  async signOut(): Promise<void> {
    await clearSession();
  }
}