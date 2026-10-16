/**
 * Identity passes: the QR every user shows on their profile, and the lookup a
 * scanner performs when someone reads it.
 *
 * A pass is a long-lived credential for the person holding the phone, so it
 * follows the same rule the donor intake ticket does: the secret is generated on
 * the device and only its SHA-256 hash is sent to the backend. The server can
 * therefore never mint a pass, and reading the database does not let anyone walk
 * in as a user.
 *
 * Unlike the intake ticket a pass is not single-use and is not tied to one
 * donation, so issuing one is not a privileged action — every account gets a
 * pass on demand, and rotating it is how a user retires a lost phone's pass.
 */

import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from "expo-crypto";

import { apiRequest } from "@/services/api/client";
import { toApiError } from "@/services/api/to-api-error";
import type { UserRole } from "@/services/auth/types";
import { encodePass } from "@/utils/qr-payload";

export type IdentityPass = {
  /** The exact string to render as a QR code. */
  payload: string;
  expiresAt: string;
};

/** The person behind a scanned pass. Never carries contact details. */
export type PassOwner = {
  id: string;
  fullName: string;
  role: UserRole;
  bloodGroup: string | null;
  district: string | null;
  station: string | null;
  wardLabel: string | null;
  isVerified: boolean;
};

export type ResolvedPass = {
  owner: PassOwner;
  expiresAt: string;
  /** True when the scanner is reading their own pass. */
  isSelf: boolean;
  scannedAt: string;
};

async function hashToken(token: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, token);
}

function newSecret(): string {
  return randomUUID().replace(/-/g, "");
}

/** True once `expiresAt` has passed, with a minute of slack for clock skew. */
export function isPassExpired(expiresAt: string, now: number = Date.now()): boolean {
  const expiry = new Date(expiresAt).getTime();

  return !Number.isFinite(expiry) || expiry - 60_000 <= now;
}

function readExpiry(value: unknown, fallbackMessage: string): string {
  if (typeof value !== "string" || !Number.isFinite(new Date(value).getTime())) {
    throw new Error(fallbackMessage);
  }

  return value;
}

/**
 * Issues a fresh pass for the signed-in user.
 *
 * Always rotates, never reuses: the previous pass is retired server-side the
 * moment this returns, so a user who thinks their old QR is still valid is
 * wrong in the safe direction.
 */
export async function rotateMyPass(): Promise<IdentityPass> {
  try {
    const secret = newSecret();

    const { pass } = await apiRequest<{ pass: { expiresAt?: unknown } | null }>(
      "/auth/me/pass",
      { method: "POST", body: { tokenHash: await hashToken(secret) } },
    );

    if (pass === null || pass === undefined) {
      throw new Error("The server did not issue a pass.");
    }

    return {
      payload: encodePass(secret),
      expiresAt: readExpiry(pass.expiresAt, "The server returned an invalid pass expiry."),
    };
  } catch (error) {
    throw toApiError(error, "Could not create your pass.");
  }
}

/**
 * Returns a usable pass, issuing one only when needed.
 *
 * The secret cannot be recovered from its hash, so an unexpired pass whose
 * secret this device no longer holds is not repairable — it has to be rotated.
 * That is the normal path after a reinstall or a cache clear, and it is why the
 * screen behind this shows a spinner rather than a spinner that never ends.
 */
export async function getOrCreateMyPass(cached: IdentityPass | null): Promise<IdentityPass> {
  if (cached !== null && !isPassExpired(cached.expiresAt)) {
    return cached;
  }

  return rotateMyPass();
}

function readOwner(value: unknown): PassOwner | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const row = value as Record<string, unknown>;

  if (typeof row.id !== "string" || typeof row.fullName !== "string" || typeof row.role !== "string") {
    return null;
  }

  const text = (key: string): string | null => (typeof row[key] === "string" && row[key] !== "" ? (row[key] as string) : null);
  const bloodGroup = text("bloodGroup");

  return {
    id: row.id,
    fullName: row.fullName,
    // The role union is re-checked rather than cast: a build that predates a
    // role must not let an unrecognised value through as if it were known.
    role: isUserRole(row.role) ? row.role : "recipient",
    bloodGroup: bloodGroup === null || bloodGroup === "" ? null : bloodGroup,
    district: text("district"),
    station: text("station"),
    wardLabel: text("wardLabel"),
    isVerified: row.isVerified === true,
  };
}

function isUserRole(value: string): value is UserRole {
  return value === "recipient" || value === "donor" || value === "hospital" || value === "admin";
}

/**
 * Resolves a scanned pass to the person who owns it.
 *
 * The failure is deliberately coarse: a wrong, retired or expired pass all come
 * back as the same conflict, so this cannot be used to discover which pass
 * secrets exist.
 */
export async function resolvePass(secret: string): Promise<ResolvedPass> {
  try {
    const { pass } = await apiRequest<{ pass: unknown }>("/auth/pass/resolve", {
      method: "POST",
      body: { tokenHash: await hashToken(secret) },
    });

    if (typeof pass !== "object" || pass === null) {
      throw new Error("The server returned an unreadable pass.");
    }

    const row = pass as Record<string, unknown>;
    const owner = readOwner(row.owner);

    if (owner === null) {
      throw new Error("The server returned a pass with no owner.");
    }

    return {
      owner,
      expiresAt: readExpiry(row.expiresAt, "The server returned an invalid pass expiry."),
      isSelf: row.isSelf === true,
      scannedAt: typeof row.scannedAt === "string" ? row.scannedAt : new Date().toISOString(),
    };
  } catch (error) {
    throw toApiError(error, "This pass is invalid or has expired.");
  }
}

/**
 * Records a hospital desk's response for the donor whose pass was just scanned.
 *
 * Takes the raw pass secret rather than a donor id on purpose — the server
 * resolves the secret to the donor itself, so the caller cannot act for anyone
 * whose pass it has not read. The same is true of the token on the wire: only
 * its hash is sent, exactly as `/pass/resolve` does.
 *
 * The donor is not told this happened. An acceptance recorded here shows up in
 * their journey and on the requester's dashboard, which is the honest record.
 */
export async function respondForScannedPass(
  requestId: string,
  secret: string,
  response: "accepted" | "declined",
): Promise<void> {
  try {
    await apiRequest<{ created: { response?: unknown } | null }>(
      `/emergency/${requestId}/response/on-behalf`,
      { method: "POST", body: { tokenHash: await hashToken(secret), response } },
    );
  } catch (error) {
    throw toApiError(error);
  }
}
