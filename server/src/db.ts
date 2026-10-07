/**
 * SQLite connection and schema.
 *
 * The schema is created on import and every statement is idempotent, so
 * `npm run dev` against a fresh checkout works with no migration step.
 *
 * This is the only module that knows which SQLite driver is in use. If
 * `better-sqlite3` will not install on your machine (it is a native module —
 * see the server README), swapping to the built-in `node:sqlite` should require
 * changes here and nowhere else.
 */

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { DB_PATH } from "./config";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// WAL keeps reads from blocking on writes. Foreign keys are OFF by default in
// SQLite and must be enabled per connection.
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  role          TEXT NOT NULL CHECK (role IN ('recipient', 'donor', 'hospital', 'admin')),
  full_name     TEXT NOT NULL,
  email         TEXT UNIQUE,
  mobile        TEXT UNIQUE,
  district      TEXT,
  blood_group   TEXT CHECK (blood_group IS NULL OR blood_group IN
                  ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  password_hash TEXT NOT NULL,
  is_verified   INTEGER NOT NULL DEFAULT 0,
  is_locked     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

CREATE TABLE IF NOT EXISTS password_resets (
  id                      TEXT PRIMARY KEY,
  user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash               TEXT NOT NULL,
  expires_at              TEXT NOT NULL,
  consumed_at             TEXT,
  attempts                INTEGER NOT NULL DEFAULT 0,
  reset_token_hash        TEXT,
  reset_token_expires_at  TEXT
);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id                TEXT PRIMARY KEY,
  requester_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  patient_name      TEXT NOT NULL,
  blood_group       TEXT NOT NULL CHECK (blood_group IN
                      ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  units             INTEGER NOT NULL,
  hospital          TEXT NOT NULL,
  district          TEXT,
  registration_number TEXT,
  contact_name      TEXT NOT NULL,
  contact_mobile    TEXT NOT NULL,
  urgency           TEXT NOT NULL CHECK (urgency IN ('critical', 'urgent', 'standard')),
  notes             TEXT,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'verified', 'fulfilled', 'cancelled')),
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_requests_status ON emergency_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_group ON emergency_requests(blood_group);

CREATE TABLE IF NOT EXISTS donor_availability (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_available     INTEGER NOT NULL DEFAULT 1,
  last_donation_at TEXT,
  updated_at       TEXT NOT NULL
);
`;

db.exec(SCHEMA);

// `CREATE TABLE IF NOT EXISTS` never alters an existing table, so databases
// created before `registration_number` existed would silently miss the column.
const userColumns = db.pragma("table_info(users)") as Array<{ name: string }>;

if (!userColumns.some((column) => column.name === "registration_number")) {
  db.exec("ALTER TABLE users ADD COLUMN registration_number TEXT");
}

/** `new Date().toISOString()`, named for brevity at call sites. */
export function now(): string {
  return new Date().toISOString();
}
