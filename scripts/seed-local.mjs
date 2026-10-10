/**
 * Applies `scripts/seed.sql` to the Data Connect emulator's Postgres.
 *
 * The emulator prints its real connection string at boot, but the address is
 * stable and much easier to read written down:
 *
 *   postgres://postgres@127.0.0.1:5432/bloodlink-db?sslmode=disable
 *
 * Note the database is `bloodlink-db`, not `postgres`.
 *
 * There is no `psql` on many machines, so this uses the `pg` client rather than
 * shelling out. Requires a one-off `npm install --no-save pg` if `pg` is not
 * present — it is a dev-only tool and is deliberately not a project dependency.
 *
 * Safe to rerun: every statement upserts by primary key.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = process.argv[2] ?? join(here, "..", "scripts", "seed.sql");

let Client;
try {
  ({ Client } = require("pg"));
} catch {
  console.error(
    "This script needs the `pg` package.\n" +
      "Run:  npm install --no-save pg\n" +
      "It is a seed helper only and is intentionally not a project dependency."
  );
  process.exit(1);
}

const client = new Client({
  connectionString:
    process.env.PG_CONNECTION ??
    "postgres://postgres@127.0.0.1:5432/bloodlink-db?sslmode=disable",
});

await client.connect();

try {
  await client.query(readFileSync(sqlPath, "utf8"));

  const tables = [
    "blood_banks",
    "blood_inventory",
    "emergency_requests",
    "alerts",
    "users",
  ];
  for (const t of tables) {
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM ${t}`);
    console.log(`  ${t.padEnd(20)} ${rows[0].n}`);
  }
  console.log("\nSeed applied.");
} catch (error) {
  console.error(`\nSeed failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}