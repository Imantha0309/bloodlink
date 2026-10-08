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

CREATE TABLE IF NOT EXISTS blood_banks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  district    TEXT NOT NULL,
  address     TEXT,
  phone       TEXT,
  hours       TEXT,
  is_verified INTEGER NOT NULL DEFAULT 0,
  note        TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  id            TEXT PRIMARY KEY,
  blood_bank_id TEXT NOT NULL REFERENCES blood_banks(id) ON DELETE CASCADE,
  blood_group   TEXT NOT NULL CHECK (blood_group IN
                  ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  component     TEXT NOT NULL CHECK (component IN
                  ('whole_blood','prbc','platelets','plasma')),
  units         INTEGER NOT NULL DEFAULT 0,
  updated_at    TEXT NOT NULL,
  UNIQUE (blood_bank_id, blood_group, component)
);

CREATE INDEX IF NOT EXISTS idx_inventory_bank ON blood_inventory(blood_bank_id);

CREATE TABLE IF NOT EXISTS alerts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN
               ('new_match','status_change','donor_accepted','request_fulfilled')),
  request_id TEXT REFERENCES emergency_requests(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  read_at    TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id, created_at);

CREATE TABLE IF NOT EXISTS donor_screening (
  id                    TEXT PRIMARY KEY,
  response_id           TEXT NOT NULL REFERENCES donor_request_responses(id) ON DELETE CASCADE,
  temperature           TEXT,
  blood_pressure        TEXT,
  pulse                 TEXT,
  hemoglobin            TEXT,
  eligible              INTEGER NOT NULL DEFAULT 1,
  bed_label             TEXT,
  screened_by_user_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_screening_response ON donor_screening(response_id);

CREATE TABLE IF NOT EXISTS extraction_sessions (
  id                TEXT PRIMARY KEY,
  response_id       TEXT NOT NULL REFERENCES donor_request_responses(id) ON DELETE CASCADE,
  volume_ml         INTEGER,
  status            TEXT NOT NULL DEFAULT 'in_progress'
                      CHECK (status IN ('in_progress', 'completed')),
  phlebotomist_name TEXT,
  started_at        TEXT NOT NULL,
  completed_at      TEXT,
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_extraction_response ON extraction_sessions(response_id);
`;

db.exec(SCHEMA);

// `CREATE TABLE IF NOT EXISTS` never alters an existing table, so databases
// created before `registration_number` existed would silently miss the column.
const userColumns = db.pragma("table_info(users)") as Array<{ name: string }>;

if (!userColumns.some((column) => column.name === "registration_number")) {
  db.exec("ALTER TABLE users ADD COLUMN registration_number TEXT");
}

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
  db.exec(
    "ALTER TABLE donor_request_responses ADD COLUMN checkin_token_expires_at TEXT",
  );
}

// The hospital module declares `registration_number` on the request table, but
// databases created before it landed need the same one-off repair.
const requestColumns = db
  .prepare("PRAGMA table_info(emergency_requests)")
  .all() as { name: string }[];

if (!requestColumns.some((column) => column.name === "registration_number")) {
  db.exec("ALTER TABLE emergency_requests ADD COLUMN registration_number TEXT");
}

/** `new Date().toISOString()`, named for brevity at call sites. */
export function now(): string {
  return new Date().toISOString();
}
