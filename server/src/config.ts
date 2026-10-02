/**
 * Server configuration.
 *
 * Read once at import time. Defaults are chosen so `npm run dev` works with no
 * `.env` file at all — the app's `.env` already assumes port 4000.
 */

import { resolve } from "node:path";

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === "") {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`${name} must be an integer, received "${raw}"`);
  }

  return parsed;
}

export const PORT = envInt("PORT", 4000);

/**
 * Binds to all interfaces by default so a physical device on the same network
 * can reach the server. Use HOST=127.0.0.1 to restrict it to this machine.
 */
export const HOST = process.env.HOST ?? "0.0.0.0";

/** SQLite file. Resolved against the server package root, not the cwd. */
export const DB_PATH = resolve(
  process.cwd(),
  process.env.BLOODLINK_DB_PATH ?? "./data/bloodlink.db",
);

/** Session lifetime, mirroring SESSION_TTL_MS in the app's mock adapter. */
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

/** How long a password-reset code stays valid. */
export const RESET_CODE_TTL_MS = 10 * 60 * 1000;

/** Wrong codes allowed before a reset request is burned. */
export const RESET_MAX_ATTEMPTS = 5;
