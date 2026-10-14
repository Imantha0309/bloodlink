/**
 * Seeds a development database.
 *
 * Replaces the old `seed-local.mjs` + `seed.sql` pair, and additionally creates
 * the demo accounts that `src/services/auth/demo-accounts.ts` advertises on the
 * sign-in screen — those used to be provisioned by hand in Firebase Auth.
 *
 * Everything here is idempotent: run it twice and you get the same rows, not
 * duplicates. The hospitals are seeded already verified, which is not what a
 * real registration produces — an administrator normally approves them — but it
 * is what makes the end-to-end flow walkable without a second account.
 */

import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import { connectDb, disconnectDb } from "../src/db";
import { env } from "../src/env";
import { BLOOD_GROUPS } from "../src/domain/compatibility";
import { BloodBank } from "../src/models/blood-bank";
import { BloodInventory } from "../src/models/blood-inventory";
import { DonorAvailability } from "../src/models/donor-availability";
import { User } from "../src/models/user";
import { BLOOD_COMPONENTS } from "../src/models/shared";
import { syncIndexes } from "../src/models";

/** The four accounts the sign-in screen shows. Passwords match that card. */
const DEMO_ACCOUNTS = [
  {
    role: "donor" as const,
    fullName: "Nimal Perera",
    mobile: "0771234567",
    password: "Donor@123",
    district: "Colombo",
    bloodGroup: "O+",
    isVerified: true,
    // A donor starts switched on, which is what registration does too.
    available: true,
  },
  {
    role: "hospital" as const,
    fullName: "National Blood Centre",
    mobile: "0779876543",
    password: "Hospital@123",
    district: "Colombo",
    bloodGroup: null,
    isVerified: true,
    available: false,
  },
  {
    role: "recipient" as const,
    fullName: "Saman Silva",
    mobile: "0775551234",
    password: "Recipient@123",
    district: "Colombo",
    bloodGroup: null,
    isVerified: true,
    available: false,
  },
  {
    role: "admin" as const,
    fullName: "BloodLink Admin",
    mobile: null,
    email: "admin@bloodlink.lk",
    password: "Admin@123",
    district: "Colombo",
    bloodGroup: null,
    isVerified: true,
    available: false,
  },
];

const BANKS = [
  {
    name: "National Blood Centre",
    district: "Colombo",
    address: "Ella Road, Colombo 08",
    phone: "+94 11 236 9931",
    hours: "Open 24 hours",
    isVerified: true,
    note: "The national collection and distribution centre.",
  },
  {
    name: "Teaching Hospital Kandy Blood Bank",
    district: "Kandy",
    address: "Kandy Teaching Hospital, Kandy",
    phone: "+94 81 223 5332",
    hours: "6.00am - 8.00pm",
    isVerified: true,
    note: null,
  },
  {
    name: "Karapitiya Teaching Hospital Blood Bank",
    district: "Galle",
    address: "Karapitiya, Galle",
    phone: "+94 91 223 2415",
    hours: "Open 24 hours",
    isVerified: true,
    note: null,
  },
  {
    name: "Jaffna Teaching Hospital Blood Bank",
    district: "Jaffna",
    address: "Hospital Road, Jaffna",
    phone: "+94 21 222 2263",
    hours: "7.00am - 6.00pm",
    isVerified: true,
    note: null,
  },
  {
    name: "Gampaha District Blood Bank",
    district: "Gampaha",
    address: "District General Hospital, Gampaha",
    phone: "+94 33 222 2261",
    hours: "7.00am - 5.00pm",
    isVerified: false,
    note: "Awaiting verification — no contactless pickup yet.",
  },
];

/**
 * Deterministic unit counts.
 *
 * A fixed function of the position rather than `Math.random`, so re-running the
 * seed restores the same shelf instead of reshuffling it.
 */
function unitsFor(bankIndex: number, groupIndex: number, componentIndex: number): number {
  return ((bankIndex * 7 + groupIndex * 3 + componentIndex * 5) % 18) + 1;
}

async function seedBloodBanks(): Promise<void> {
  let lines = 0;

  for (const [bankIndex, definition] of BANKS.entries()) {
    const bank = await BloodBank.findOneAndUpdate(
      { name: definition.name, district: definition.district },
      { $set: definition },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    for (const [groupIndex, bloodGroup] of BLOOD_GROUPS.entries()) {
      for (const [componentIndex, component] of BLOOD_COMPONENTS.entries()) {
        await BloodInventory.findOneAndUpdate(
          { bank: bank._id, bloodGroup, component },
          { $set: { units: unitsFor(bankIndex, groupIndex, componentIndex) } },
          { upsert: true, setDefaultsOnInsert: true },
        );

        lines += 1;
      }
    }
  }

  console.log(`[seed] ${BANKS.length} blood banks, ${lines} stock lines`);
}

async function seedAccounts(): Promise<void> {
  for (const account of DEMO_ACCOUNTS) {
    const { password, available, ...fields } = account;

    const passwordHash = await bcrypt.hash(password, 10);

    const filter =
      fields.email != null ? { email: fields.email } : { mobile: fields.mobile as string };

    const user = await User.findOneAndUpdate(
      filter,
      { $set: { ...fields, passwordHash, failedLoginAttempts: 0, lockedUntil: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    if (available) {
      await DonorAvailability.findOneAndUpdate(
        { userId: user._id },
        { $set: { isAvailable: true, lastDonationAt: null } },
        { upsert: true, setDefaultsOnInsert: true },
      );
    }

    console.log(`[seed] ${fields.role.padEnd(9)} ${fields.email ?? fields.mobile}`);
  }
}

async function main(): Promise<void> {
  await connectDb();
  console.log(`[seed] connected (db "${env.mongoDb}")`);

  // Indexes first: the partial unique indexes on email and mobile are what make
  // the upserts above safe to re-run.
  const synced = await syncIndexes();
  console.log(`[seed] indexes synced for ${synced.length} models`);

  await seedBloodBanks();
  await seedAccounts();

  await disconnectDb();

  console.log("");
  console.log("[seed] done. Sign in with:");
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${(account.email ?? account.mobile ?? "").padEnd(22)} ${account.password}`);
  }
  console.log("");
}

main().catch(async (error: unknown) => {
  console.error("[seed] failed:", error);

  // Leave the process cleanly even on a failure so a bad run does not hold the
  // connection open and hang a terminal.
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
