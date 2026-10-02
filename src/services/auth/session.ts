/**
 * Persisted authentication session.
 *
 * Kept separate from the service adapters so every adapter shares one storage
 * contract. Reads are defensive: anything unrecognised on disk is discarded
 * rather than trusted.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { USER_ROLES, type AuthSession, type UserRole } from "@/services/auth/types";

const SESSION_KEY = "@bloodlink/auth/session";

function isRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Only a well-formed session is returned. A truncated or hand-edited value
 * must force the user back through the login flow, never crash it.
 */
function parseSession(raw: string | null): AuthSession | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    const candidate = parsed as Partial<AuthSession>;

    if (
      typeof candidate.token !== "string" ||
      typeof candidate.expiresAt !== "string" ||
      typeof candidate.user !== "object" ||
      candidate.user === null ||
      !isRole(candidate.user.role)
    ) {
      return null;
    }

    if (Date.parse(candidate.expiresAt) <= Date.now()) {
      return null;
    }

    return candidate as AuthSession;
  } catch {
    return null;
  }
}

export async function saveSession(session: AuthSession): Promise<void> {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<AuthSession | null> {
  try {
    return parseSession(await AsyncStorage.getItem(SESSION_KEY));
  } catch {
    // Unreadable storage is treated as "signed out" rather than an error worth
    // showing a user mid-login.
    return null;
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing actionable — the in-memory session is already gone.
  }
}