import { normalizeContact, normalizeEmail, normalizeMobile } from "@/utils/contact";

import { clearSession, loadSession, saveSession } from "./session";
import {
  ApiError,
  type AuthService,
  type AuthSession,
  type AuthUser,
  type DonorProfileInput,
  type PasswordResetChallenge,
  type SignInInput,
  type SignUpInput,
  type UserRole,
} from "./types";

/**
 * Local stand-in for the real authentication endpoint, used when
 * `EXPO_PUBLIC_API_URL` is not configured.
 *
 * It deliberately does **not** accept any password. Credentials must match a
 * fixture below, otherwise it rejects with `invalid_credentials` — so the
 * failure path is genuinely reachable and the screen is never faked into a
 * success. Swap in `HttpAuthService` by setting the env var; no UI changes.
 *
 * Accounts created through `signUp` live only in memory for the lifetime of
 * the process, which is enough to walk the registration flow offline.
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
      bloodGroup: "O+",
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
      bloodGroup: "A+",
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

/**
 * The code the offline flow accepts. Fixed rather than random because there is
 * no channel to deliver a real one — the reset screen shows it in a dev banner.
 */
export const MOCK_RESET_CODE = "123456";

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

  return MOCK_ACCOUNTS.find(
    (account) =>
      [account.identifier, account.user.email, account.user.mobile].includes(normalized) &&
      account.password === password,
  );
}

/** Splits an identifier into the email/mobile columns, as the server does. */
function splitIdentifier(identifier: string): { email: string | null; mobile: string | null } {
  const normalized = normalizeContact(identifier);

  if (normalized === null) {
    return { email: null, mobile: null };
  }

  return normalized.includes("@")
    ? { email: normalized, mobile: null }
    : { email: null, mobile: normalized };
}

export class MockAuthService implements AuthService {
  /** Pending resets, keyed by reset id. In-memory only. */
  private readonly resets = new Map<string, { identifier: string; verified: boolean }>();

  async signIn(input: SignInInput): Promise<AuthSession> {
    await delay(LATENCY_MS);

    if (input.password === FORCE_OFFLINE_PASSWORD) {
      throw new ApiError("network");
    }

    const account = findAccount(input.identifier, input.password);

    if (account === undefined) {
      throw new ApiError("invalid_credentials", "Incorrect email or password.");
    }

    const session = toSession(account.user);

    await saveSession(session);

    return session;
  }

  async signUp(input: SignUpInput): Promise<AuthSession> {
    await delay(LATENCY_MS);

    const normalized = normalizeContact(input.identifier);

    if (normalized === null) {
      throw new ApiError("validation", "Please enter a valid email address or mobile number.", {
        identifier: "Please enter a valid email address or mobile number.",
      });
    }

    if (MOCK_ACCOUNTS.some((account) => account.identifier === normalized)) {
      throw new ApiError("conflict", "An account with those details already exists.", {
        identifier: "An account with those details already exists.",
      });
    }

    const { email, mobile } = splitIdentifier(input.identifier);

    const account: MockAccount = {
      identifier: normalized,
      password: input.password,
      user: {
        id: `usr_mock_${MOCK_ACCOUNTS.length + 1}_${Date.now().toString(36)}`,
        role: input.role,
        fullName: input.fullName,
        email,
        mobile,
        district: input.district ?? null,
        bloodGroup: input.bloodGroup ?? null,
      },
    };

    MOCK_ACCOUNTS.push(account);

    const session = toSession(account.user);

    await saveSession(session);

    return session;
  }

  async updateDonorProfile(input: DonorProfileInput): Promise<AuthUser> {
    const session = await loadSession();
    if (!session || session.user.role !== "donor") {
      throw new ApiError("unauthorized", "Only donors can edit a donor profile.");
    }

    const account = MOCK_ACCOUNTS.find((candidate) => candidate.user.id === session.user.id);
    if (!account) throw new ApiError("not_found", "Donor profile could not be found.");

    const email = input.email?.trim() ? normalizeEmail(input.email) : null;
    const mobile = input.mobile?.trim() ? normalizeMobile(input.mobile) : null;
    if (input.email?.trim() && !email) {
      throw new ApiError("validation", "Enter a valid email address.", { email: "Enter a valid email address." });
    }
    if (input.mobile?.trim() && !mobile) {
      throw new ApiError("validation", "Enter a valid mobile number.", { mobile: "Enter a valid mobile number." });
    }
    if (mobile === null && email === null) {
      throw new ApiError("validation", "Provide an email address or mobile number.", {
        mobile: "Provide an email address or mobile number.",
      });
    }
    if (MOCK_ACCOUNTS.some(
      (candidate) => candidate !== account &&
        [candidate.identifier, candidate.user.email, candidate.user.mobile].some((value) =>
          value !== null && [email, mobile].includes(value),
        ),
    )) {
      throw new ApiError("conflict", "That email or mobile number is already in use.");
    }

    account.identifier = mobile ?? email!;
    account.user = {
      ...account.user,
      fullName: input.fullName.trim(),
      email,
      mobile,
      district: input.district,
      bloodGroup: input.bloodGroup,
    };
    const updatedSession = { ...session, user: account.user };
    await saveSession(updatedSession);
    return account.user;
  }

  async restoreSession(): Promise<AuthSession | null> {
    return loadSession();
  }

  async signOut(): Promise<void> {
    await clearSession();
  }

  async requestPasswordReset(identifier: string): Promise<PasswordResetChallenge> {
    await delay(LATENCY_MS);

    const normalized = normalizeContact(identifier);
    const account = MOCK_ACCOUNTS.find((candidate) => candidate.identifier === normalized);

    if (account === undefined) {
      throw new ApiError("not_found", "No account found with those details.");
    }

    const resetId = `rst_mock_${Date.now().toString(36)}`;
    this.resets.set(resetId, { identifier: account.identifier, verified: false });

    return { resetId, devCode: MOCK_RESET_CODE };
  }

  async verifyPasswordResetCode(resetId: string, code: string): Promise<string> {
    await delay(LATENCY_MS);

    const reset = this.resets.get(resetId);

    if (reset === undefined) {
      throw new ApiError("validation", "That code has expired. Request a new one.", {
        code: "That code has expired. Request a new one.",
      });
    }

    if (code !== MOCK_RESET_CODE) {
      throw new ApiError("validation", "That code is not correct.", {
        code: "That code is not correct.",
      });
    }

    reset.verified = true;

    return `mock_reset_token.${resetId}`;
  }

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    await delay(LATENCY_MS);

    const resetId = resetToken.replace(/^mock_reset_token\./, "");
    const reset = this.resets.get(resetId);

    if (reset === undefined || !reset.verified) {
      throw new ApiError("validation", "This reset link has expired. Start again.", {
        resetToken: "This reset link has expired. Start again.",
      });
    }

    const account = MOCK_ACCOUNTS.find((candidate) => candidate.identifier === reset.identifier);

    if (account === undefined) {
      throw new ApiError("not_found", "No account found with those details.");
    }

    account.password = newPassword;
    this.resets.delete(resetId);
  }
}

/**
 * Fixtures are exported for the dev-only credential hint on the sign-in screen.
 * Nothing in the login flow depends on them.
 */
export const MOCK_CREDENTIAL_HINT: readonly {
  identifier: string;
  password: string;
  role: UserRole;
}[] = MOCK_ACCOUNTS.slice(0, 4).map((account) => ({
  identifier: account.identifier,
  password: account.password,
  role: account.user.role,
}));
