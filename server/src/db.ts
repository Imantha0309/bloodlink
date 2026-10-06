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

CREATE TABLE IF NOT EXISTS donor_request_responses (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL REFERENCES emergency_requests(id) ON DELETE CASCADE,
  donor_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  response    TEXT NOT NULL CHECK (response IN ('accepted', 'declined')),
  stage       TEXT NOT NULL DEFAULT 'accepted'
                CHECK (stage IN ('accepted', 'en_route', 'arrived', 'completed')),
  checkin_token_hash    TEXT,
  checkin_token_expires_at TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  UNIQUE (request_id, donor_id)
);

CREATE INDEX IF NOT EXISTS idx_donor_responses_donor ON donor_request_responses(donor_id, updated_at);

CREATE TABLE IF NOT EXISTS donor_availability (
  user_id          TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_available     INTEGER NOT NULL DEFAULT 1,
  last_donation_at TEXT,
  updated_at       TEXT NOT NULL
);
`;

db.exec(SCHEMA);

// Add workflow columns when opening databases created before donor transit and
// QR check-in were introduced. SQLite's CREATE TABLE IF NOT EXISTS does not
// add columns to an existing file.
const donorResponseColumns = db
  .prepare("PRAGMA table_info(donor_request_responses)")
  .all() as { name: string }[];

if (!donorResponseColumns.some((column) => column.name === "stage")) {
  db.exec(
    "ALTER TABLE donor_request_responses ADD COLUMN stage TEXT NOT NULL DEFAULT 'accepted'",
  );
}

if (!donorResponseColumns.some((column) => column.name === "checkin_token_hash")) {
  db.exec("ALTER TABLE donor_request_responses ADD COLUMN checkin_token_hash TEXT");
}

if (!donorResponseColumns.some((column) => column.name === "checkin_token_expires_at")) {
  db.exec("ALTER TABLE donor_request_responses ADD COLUMN checkin_token_expires_at TEXT");
}

/** `new Date().toISOString()`, named for brevity at call sites. */
export function now(): string {
  return new Date().toISOString();
}
