/**
 * Database seed.
 *
 * `npm run seed` RESETS the database: every table is cleared and repopulated.
 * That is the point — it gives a predictable starting state for development.
 * Never run it against data you care about.
 *
 * The four documented demo accounts are recreated with the same credentials the
 * in-app mock already advertises, so existing instructions keep working. No
 * fictional emergency requests or extra donor profiles are inserted.
 */

import { db, now } from "./db";
import { hashPassword } from "./lib/passwords";
import { generateId } from "./lib/tokens";
import type { BloodGroup, UserRole } from "./types";

type SeedUser = {
  role: UserRole;
  fullName: string;
  email: string | null;
  mobile: string | null;
  district: string | null;
  bloodGroup: BloodGroup | null;
  password: string;
  isVerified: boolean;
};

/** The four accounts quoted throughout the app's docs and README. */
const DEMO_USERS: SeedUser[] = [
  {
    role: "donor",
    fullName: "Nimal Perera",
    email: null,
    mobile: "0771234567",
    district: "Colombo",
    bloodGroup: "O+",
    password: "Donor@123",
    isVerified: true,
  },
  {
    role: "hospital",
    fullName: "Nagaoka Hospital",
    email: null,
    mobile: "0779876543",
    district: "Gampaha",
    bloodGroup: null,
    password: "Hospital@123",
    isVerified: true,
  },
  {
    role: "recipient",
    fullName: "Sanduni Jayasinghe",
    email: null,
    mobile: "0775551234",
    district: "Kandy",
    bloodGroup: "A+",
    password: "Recipient@123",
    isVerified: true,
  },
  {
    role: "admin",
    fullName: "Service Administrator",
    email: "admin@bloodlink.lk",
    mobile: null,
    district: null,
    bloodGroup: null,
    password: "Admin@123",
    isVerified: true,
  },
];

async function seed(): Promise<void> {
  console.log("Seeding BloodLink database...");

  // Hash the four demo passwords up front — scrypt is deliberately slow, so
  // this is the only async part. The bulk donors below all share one password,
  // and therefore one derived hash: a real deployment would never do that, but
  // it keeps a throwaway dataset from taking seconds to build.
  const demoHashes = new Map<string, string>();

  for (const user of DEMO_USERS) {
    demoHashes.set(user.password, await hashPassword(user.password));
  }

  const timestamp = now();

  const insertUser = db.prepare(
    `INSERT INTO users
       (id, role, full_name, email, mobile, district, blood_group,
        password_hash, is_verified, is_locked, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
  );

  const clearAll = db.transaction(() => {
    // Order matters: children before parents.
    db.prepare("DELETE FROM password_resets").run();
    db.prepare("DELETE FROM sessions").run();
    db.prepare("DELETE FROM donor_availability").run();
    db.prepare("DELETE FROM emergency_requests").run();
    db.prepare("DELETE FROM users").run();
  });

  const insertEverything = db.transaction(() => {
    for (const user of DEMO_USERS) {
      const id = generateId("usr");

      insertUser.run(
        id,
        user.role,
        user.fullName,
        user.email,
        user.mobile,
        user.district,
        user.bloodGroup,
        demoHashes.get(user.password),
        user.isVerified ? 1 : 0,
        timestamp,
        timestamp,
      );
    }

    // Create availability only for the single documented demo donor account.
    const donorRows = db
      .prepare("SELECT id FROM users WHERE role = 'donor' ORDER BY full_name")
      .all() as { id: string }[];

    const insertAvailability = db.prepare(
      `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    );

    donorRows.forEach((row) => insertAvailability.run(row.id, 0, null, timestamp));
  });

  clearAll();
  insertEverything();

  const counts = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM users WHERE role = 'donor') AS donors,
         (SELECT COUNT(*) FROM emergency_requests) AS requests`,
    )
    .get() as { users: number; donors: number; requests: number };

  console.log(`  ${counts.users} users (${counts.donors} demo donor)`);
  console.log(`  ${counts.requests} emergency requests (none preloaded)`);
  console.log("");
  console.log("  Demo credentials:");
  console.log("    0771234567      Donor@123      donor");
  console.log("    0779876543      Hospital@123   hospital");
  console.log("    0775551234      Recipient@123  recipient");
  console.log("    admin@bloodlink.lk  Admin@123  admin");
  console.log("");

  db.close();
}

seed().catch((error: unknown) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
