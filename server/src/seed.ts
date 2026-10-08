/**
 * Database seed.
 *
 * `npm run seed` RESETS the database: every table is cleared and repopulated.
 * That is the point — it gives a predictable starting state for development.
 * Never run it against data you care about.
 *
 * The four documented demo accounts are recreated with the same credentials the
 * in-app mock already advertises, so existing instructions keep working.
 * Facilities, stock, a handful of demo requests and alerts are also loaded so
 * every screen has real rows to render on a fresh checkout.
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
  /** Hospitals only — mirrors the register endpoint's captured value. */
  registrationNumber?: string;
  /** Donors only — whether they appear in dispatch and the directory. */
  available?: boolean;
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
    registrationNumber: "RGL-2019-0447",
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

type SeedBank = {
  id: string;
  name: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  isVerified: boolean;
  note: string;
};

/** The curated facility list the urgent form and the storage screens read. */
const DEMO_BANKS: SeedBank[] = [
  {
    id: "nhs_l",
    name: "National Hospital of Sri Lanka",
    district: "Colombo",
    address: "Regent Street, Colombo 00700",
    phone: "+94 11 200 0001",
    hours: "24 hours",
    isVerified: true,
    note: "Verified national medical facility with 24/7 cold storage",
  },
  {
    id: "lady_ridgeway",
    name: "Lady Ridgeway Hospital for Children",
    district: "Colombo",
    address: "Regent Street, Colombo 00800",
    phone: "+94 11 200 0002",
    hours: "24 hours",
    isVerified: true,
    note: "Verified teaching hospital with a paediatric blood bank",
  },
  {
    id: "sir_james_peiris",
    name: "Sir James Peiris Hospital",
    district: "Colombo",
    address: "Sir James Pieris Mawatha, Colombo 00800",
    phone: "+94 11 200 0003",
    hours: "7:00 - 19:00",
    isVerified: false,
    note: "Municipal hospital — confirm stock before travelling",
  },
  {
    id: "kandy_teaching",
    name: "Kandy Teaching Hospital",
    district: "Kandy",
    address: "Arthur Senanayake Road, Kandy 20000",
    phone: "+94 11 200 0004",
    hours: "24 hours",
    isVerified: true,
    note: "Verified teaching hospital with 24/7 cold storage",
  },
  {
    id: "galle_general",
    name: "Galle General Hospital",
    district: "Galle",
    address: "Hospital Road, Galle 80000",
    phone: "+94 11 200 0005",
    hours: "24 hours",
    isVerified: true,
    note: "Verified regional blood bank",
  },
  {
    id: "anuradhapura_general",
    name: "Anuradhapura General Hospital",
    district: "Anuradhapura",
    address: "Kalawewa Road, Anuradhapura 50000",
    phone: "+94 11 200 0006",
    hours: "7:00 - 19:00",
    isVerified: false,
    note: "Regional hospital — confirm stock before travelling",
  },
  {
    id: "gampaha_base",
    name: "Gampaha Base Hospital",
    district: "Gampaha",
    address: "Colombo Road, Gampaha 11600",
    phone: "+94 11 200 0007",
    hours: "24 hours",
    isVerified: true,
    note: "District hospital with 24/7 emergency blood bank",
  },
];

const SEED_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEED_COMPONENTS = ["whole_blood", "prbc", "platelets", "plasma"] as const;

/**
 * Deterministic stock levels — same numbers on every seed so screenshots and
 * tests stay comparable, with O- kept deliberately scarce like the real world.
 */
function seedUnits(bankIndex: number, groupIndex: number, componentIndex: number): number {
  const base = (bankIndex * 5 + groupIndex * 7 + componentIndex * 3) % 14;
  const group = SEED_GROUPS[groupIndex];
  const component = SEED_COMPONENTS[componentIndex];

  if (group === "O-") return base % 4;
  if (component === "platelets") return base % 6;
  return base;
}

type SeedRequest = {
  key: string;
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  district: string;
  contactName: string;
  contactMobile: string;
  urgency: "critical" | "urgent" | "standard";
  status: "pending" | "verified";
  /** Set when the recipient demo account raised it. */
  fromRecipient?: boolean;
  /** When set, the demo donor has accepted and is on the way. */
  donorAccepted?: boolean;
  notes?: string;
};

const DEMO_REQUESTS: SeedRequest[] = [
  {
    key: "req_kandy",
    patientName: "Amal Fernando",
    bloodGroup: "A+",
    units: 2,
    hospital: "Kandy Teaching Hospital",
    district: "Kandy",
    contactName: "Sanduni Jayasinghe",
    contactMobile: "0775551234",
    urgency: "urgent",
    status: "pending",
    fromRecipient: true,
    notes: "Scheduled surgery — donors must be A+ or O.",
  },
  {
    key: "req_transit",
    patientName: "G. Fernando",
    bloodGroup: "A+",
    units: 3,
    hospital: "National Hospital of Sri Lanka",
    district: "Colombo",
    contactName: "Sanduni Jayasinghe",
    contactMobile: "0775551234",
    urgency: "critical",
    status: "verified",
    fromRecipient: true,
    donorAccepted: true,
    notes: "Theatre waiting — transport arranged by the ward.",
  },
  {
    key: "req_critical",
    patientName: "Ward 4 Patient",
    bloodGroup: "O-",
    units: 4,
    hospital: "National Hospital of Sri Lanka",
    district: "Colombo",
    contactName: "Ward Coordinator",
    contactMobile: "0770000001",
    urgency: "critical",
    status: "verified",
    notes: "Accident service — universal donor units required.",
  },
  {
    key: "req_standard",
    patientName: "R. Silva",
    bloodGroup: "B+",
    units: 1,
    hospital: "Galle General Hospital",
    district: "Galle",
    contactName: "R. Silva",
    contactMobile: "0770000002",
    urgency: "standard",
    status: "pending",
  },
];

/**
 * Extra donors beyond the documented demo account, spread across districts and
 * blood groups so dispatch counts, the directory and candidate tallies have
 * something to show. They share the demo donor password on purpose — this is a
 * throwaway development dataset, not production identities.
 */
const DEMO_EXTRA_DONORS: SeedUser[] = [
  { role: "donor", fullName: "Ishara Bandara", email: null, mobile: "0771111111", district: "Colombo", bloodGroup: "O-", password: "Donor@123", isVerified: true, available: true },
  { role: "donor", fullName: "Ruwan Jayasuriya", email: null, mobile: "0772222222", district: "Gampaha", bloodGroup: "O+", password: "Donor@123", isVerified: true, available: true },
  { role: "donor", fullName: "Tharushi Silva", email: null, mobile: "0773333333", district: "Kandy", bloodGroup: "A+", password: "Donor@123", isVerified: true, available: true },
  { role: "donor", fullName: "Mohamed Faizal", email: null, mobile: "0774444444", district: "Galle", bloodGroup: "B+", password: "Donor@123", isVerified: true, available: true },
  { role: "donor", fullName: "Dilan Perera", email: null, mobile: "0776666666", district: "Colombo", bloodGroup: "AB+", password: "Donor@123", isVerified: true, available: true },
  { role: "donor", fullName: "Nadeesha Wickramasinghe", email: null, mobile: "0777777777", district: "Gampaha", bloodGroup: "O-", password: "Donor@123", isVerified: true, available: true },
];

async function seed(): Promise<void> {
  console.log("Seeding BloodLink database...");

  // Hash the four demo passwords up front — scrypt is deliberately slow, so
  // this is the only async part. The bulk donors below all share one password,
  // and therefore one derived hash: a real deployment would never do that, but
  // it keeps a throwaway dataset from taking seconds to build.
  const demoHashes = new Map<string, string>();

  for (const user of [...DEMO_USERS, ...DEMO_EXTRA_DONORS]) {
    demoHashes.set(user.password, await hashPassword(user.password));
  }

  const timestamp = now();

  const insertUser = db.prepare(
    `INSERT INTO users
       (id, role, full_name, email, mobile, district, blood_group,
        password_hash, is_verified, is_locked, registration_number,
        created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
  );

  const clearAll = db.transaction(() => {
    // Order matters: children before parents.
    db.prepare("DELETE FROM alerts").run();
    db.prepare("DELETE FROM extraction_sessions").run();
    db.prepare("DELETE FROM donor_screening").run();
    db.prepare("DELETE FROM blood_inventory").run();
    db.prepare("DELETE FROM blood_banks").run();
    db.prepare("DELETE FROM password_resets").run();
    db.prepare("DELETE FROM sessions").run();
    db.prepare("DELETE FROM donor_availability").run();
    db.prepare("DELETE FROM emergency_requests").run();
    db.prepare("DELETE FROM users").run();
  });

  const insertEverything = db.transaction(() => {
    for (const user of [...DEMO_USERS, ...DEMO_EXTRA_DONORS]) {
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
        user.registrationNumber ?? null,
        timestamp,
        timestamp,
      );
    }

    const donorRows = db
      .prepare("SELECT id, full_name FROM users WHERE role = 'donor' ORDER BY full_name")
      .all() as { id: string; full_name: string }[];

    const availableNames = new Set(
      DEMO_EXTRA_DONORS.filter((user) => user.available).map((user) => user.fullName),
    );

    const insertAvailability = db.prepare(
      `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    );

    // The documented demo donor stays paused so the "STANDBY" dashboard state
    // remains the default; the extras are live so dispatch has reach.
    donorRows.forEach((row) =>
      insertAvailability.run(row.id, availableNames.has(row.full_name) ? 1 : 0, null, timestamp),
    );
  });

  const seedFacilities = db.transaction(() => {
    const insertBank = db.prepare(
      `INSERT INTO blood_banks
         (id, name, district, address, phone, hours, is_verified, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const insertStock = db.prepare(
      `INSERT INTO blood_inventory (id, blood_bank_id, blood_group, component, units, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    );

    DEMO_BANKS.forEach((bank, bankIndex) => {
      insertBank.run(
        bank.id,
        bank.name,
        bank.district,
        bank.address,
        bank.phone,
        bank.hours,
        bank.isVerified ? 1 : 0,
        bank.note,
        timestamp,
        timestamp,
      );

      SEED_GROUPS.forEach((group, groupIndex) => {
        SEED_COMPONENTS.forEach((component, componentIndex) => {
          insertStock.run(
            generateId("inv"),
            bank.id,
            group,
            component,
            seedUnits(bankIndex, groupIndex, componentIndex),
            timestamp,
          );
        });
      });
    });
  });

  const seedRequests = db.transaction(() => {
    const recipient = db
      .prepare("SELECT id FROM users WHERE role = 'recipient' LIMIT 1")
      .get() as { id: string } | undefined;
    // The documented demo donor is the one with a live commitment.
    const donor = db
      .prepare("SELECT id FROM users WHERE role = 'donor' AND full_name = 'Nimal Perera' LIMIT 1")
      .get() as { id: string } | undefined;

    const insertRequest = db.prepare(
      `INSERT INTO emergency_requests
         (id, requester_user_id, patient_name, blood_group, units, hospital,
          district, registration_number, contact_name, contact_mobile,
          urgency, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
    );

    const requestIdByKey = new Map<string, string>();

    for (const request of DEMO_REQUESTS) {
      const id = generateId("req");
      requestIdByKey.set(request.key, id);

      insertRequest.run(
        id,
        request.fromRecipient ? recipient?.id ?? null : null,
        request.patientName,
        request.bloodGroup,
        request.units,
        request.hospital,
        request.district,
        request.contactName,
        request.contactMobile,
        request.urgency,
        request.notes ?? null,
        request.status,
        timestamp,
        timestamp,
      );
    }

    // The transit demo case: one accepted commitment already en route.
    const transit = DEMO_REQUESTS.find((request) => request.donorAccepted);
    if (transit && donor) {
      db.prepare(
        `INSERT INTO donor_request_responses
           (id, request_id, donor_id, response, stage, created_at, updated_at)
         VALUES (?, ?, ?, 'accepted', 'en_route', ?, ?)`,
      ).run(generateId("resp"), requestIdByKey.get(transit.key), donor.id, timestamp, timestamp);
    }
  });

  const seedAlerts = db.transaction(() => {
    const recipient = db
      .prepare("SELECT id FROM users WHERE role = 'recipient' LIMIT 1")
      .get() as { id: string } | undefined;

    if (!recipient) return;

    const transitId = db
      .prepare(
        `SELECT id FROM emergency_requests
          WHERE patient_name = 'G. Fernando' AND requester_user_id = ?`,
      )
      .get(recipient.id) as { id: string } | undefined;

    const insertAlert = db.prepare(
      `INSERT INTO alerts (id, user_id, type, request_id, title, body, read_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    if (transitId) {
      insertAlert.run(
        generateId("alrt"),
        recipient.id,
        "donor_accepted",
        transitId.id,
        "A donor accepted your request",
        "Nimal Perera is ready to donate A+ for G. Fernando.",
        null,
        timestamp,
      );
      insertAlert.run(
        generateId("alrt"),
        recipient.id,
        "status_change",
        transitId.id,
        "Request updated",
        "G. Fernando's request is now verified.",
        timestamp,
        timestamp,
      );
    }

    insertAlert.run(
      generateId("alrt"),
      recipient.id,
      "new_match",
      null,
      "New critical request in Colombo",
      "O- needed for Ward 4 Patient at National Hospital of Sri Lanka.",
      null,
      timestamp,
    );
  });

  clearAll();
  insertEverything();
  seedFacilities();
  seedRequests();
  seedAlerts();

  const counts = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users) AS users,
         (SELECT COUNT(*) FROM users WHERE role = 'donor') AS donors,
         (SELECT COUNT(*) FROM emergency_requests) AS requests,
         (SELECT COUNT(*) FROM blood_banks) AS banks,
         (SELECT COUNT(*) FROM blood_inventory) AS stock,
         (SELECT COUNT(*) FROM alerts) AS alerts`,
    )
    .get() as {
    users: number;
    donors: number;
    requests: number;
    banks: number;
    stock: number;
    alerts: number;
  };

  console.log(`  ${counts.users} users (${counts.donors} donors, 1 documented)`);
  console.log(`  ${counts.requests} emergency requests (1 accepted, en route)`);
  console.log(`  ${counts.banks} blood banks with ${counts.stock} stock lines`);
  console.log(`  ${counts.alerts} demo alerts`);
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
