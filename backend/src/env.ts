/**
 * Environment loading and validation.
 *
 * Read once at startup so a missing secret fails loudly on boot rather than on
 * the first request that happens to need it.
 */

import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Copy backend/.env.example to backend/.env and fill it in.`,
    );
  }

  return value.trim();
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim().length === 0) {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${raw}".`);
  }

  return parsed;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: optionalNumber("PORT", 4000),

  mongoUri: required("MONGODB_URI"),
  mongoDb: process.env.MONGODB_DB?.trim() || "bloodlink",

  jwtSecret: required("JWT_SECRET"),
  sessionTtlDays: optionalNumber("SESSION_TTL_DAYS", 30),

  corsOrigin: process.env.CORS_ORIGIN?.trim() || "*",

  /** Where uploaded avatars are written, and the origin that serves them back. */
  uploadDir: process.env.UPLOAD_DIR?.trim() || "uploads",
  uploadBaseUrl: (process.env.UPLOAD_BASE_URL?.trim() || "/uploads").replace(/\/+$/, ""),

  maxLoginAttempts: optionalNumber("MAX_LOGIN_ATTEMPTS", 10),
  lockoutMinutes: optionalNumber("LOCKOUT_MINUTES", 15),
} as const;
