import { normalizeContact } from "@/utils/contact";

import { clearSession, loadSession, saveSession } from "./session";
import {
  AuthError,
  type AuthService,
  type AuthSession,
  type AuthUser,
  type SignInInput,
  type UserRole,
} from "./types";

/**
 * Local stand-in for the real authentication endpoint, used until
 * `EXPO_PUBLIC_API_URL` is configured.
 *
 * It deliberately does **not** accept any password. Credentials must match a
 * fixture below, otherwise it rejects with `invalid_credentials` — so the
 * failure path is genuinely reachable and the screen is never faked into a
 * success. Swap in `HttpAuthService` by setting the env var; no UI changes.
 */

type MockAccount = {
  /** Compared against the normalised identifier. */
  identifier: string;
  password: string;
  user: AuthUser;
};

const MOCK_ACCOUNTS: MockAccount[] = [
  {
    identifier: "0771234567",
    password: "Donor@123",
    user: {
      id: "usr_mock_donor",
      role: "donor",
      fullName: "Nimal Perera",
      email: null,
      mobile: "0771234567",
      district: "Colombo",
    },
  },
  {
    identifier: "0779876543",
    password: "Hospital@123",
    user: {
      id: "usr_mock_hospital",
      role: "hospital",
      fullName: "Nagaoka Hospital",
      email: null,
      mobile: "0779876543",
      district: "Gampaha",
    },
  },
  {
    identifier: "0775551234",
    password: "Recipient@123",
    user: {
      id: "usr_mock_recipient",
      role: "recipient",
      fullName: "Sanduni Jayasinghe",
      email: null,
      mobile: "0775551234",
      district: "Kandy",
    },
  },
  {
    identifier: "admin@bloodlink.lk",
    password: "Admin@123",
    user: {
      id: "usr_mock_admin",
      role: "admin",
      fullName: "Service Administrator",
      email: "admin@bloodlink.lk",
      mobile: null,
      district: null,
    },
  },
];

/** Password that forces a simulated connectivity failure, for QA only. */
const FORCE_OFFLINE_PASSWORD = "offline";

/** Round-trip time a real request would take. */
const LATENCY_MS = 700;

const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function toSession(user: AuthUser): AuthSession {
  return {
    token: `mock.${user.id}.${Date.now().toString(36)}`,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    user,
  };
}

function findAccount(identifier: string, password: string): MockAccount | undefined {
  const normalized = normalizeContact(identifier);

  if (normalized === null) {
    return undefined;
  }

  return MOCK_ACCOUNTS.find((account) => account.identifier === normalized && account.password === password);
}

export class MockAuthService implements AuthService {
  async signIn(input: SignInInput): Promise<AuthSession> {
    await delay(LATENCY_MS);

    if (input.password === FORCE_OFFLINE_PASSWORD) {
      throw new AuthError("network");
    }

    const account = findAccount(input.identifier, input.password);

    if (account === undefined) {
      throw new AuthError("invalid_credentials");
    }

    const session = toSession(account.user);

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

/**
 * Fixtures are exported for the dev-only credential helper screen only.
 * Nothing in the login UI should import this.
 */
export const MOCK_CREDENTIAL_HINT: readonly {
  identifier: string;
  password: string;
  role: UserRole;
}[] = MOCK_ACCOUNTS.map((account) => ({
  identifier: account.identifier,
  password: account.password,
  role: account.user.role,
}));