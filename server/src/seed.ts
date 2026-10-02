/**
 * Database seed.
 *
 * `npm run seed` RESETS the database: every table is cleared and repopulated.
 * That is the point — it gives a predictable starting state for development.
 * Never run it against data you care about.
 *
 * The four documented demo accounts are recreated with the same credentials the
 * in-app mock already advertises, so existing instructions keep working. The
 * additional donor records exist so `/donors/stats` and the dashboards show
 * real aggregate numbers instead of a hard-coded figure.
 */

import { db, now } from "./db";
import { hashPassword } from "./lib/passwords";
import { generateId } from "./lib/tokens";
import type { BloodGroup, UrgencyLevel, UserRole } from "./types";

const DEMO_PASSWORD = "Donor@123";

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

/**
 * Additional donors, so the national pool is more than one person. Names are
 * fictional; districts and blood groups follow the real distribution closely
 * enough to make the matching logic meaningful.
 */
const EXTRA_DONORS: readonly [string, string, BloodGroup][] = [
  ["Kasun Silva", "Colombo", "O+"],
  ["Amara Fernando", "Colombo", "A+"],
  ["Ruwan Bandara", "Gampaha", "B+"],
  ["Dilini Wickramasinghe", "Gampaha", "AB+"],
  ["Chathura Rajapaksa", "Kalutara", "O-"],
  ["Nilanka Jayawardena", "Kandy", "A-"],
  ["Thilini Gunasekara", "Kandy", "B+"],
  ["Sampath Weerasinghe", "Matale", "O+"],
  ["Hasini Dissanayake", "Nuwara Eliya", "AB-"],
  ["Prasad Kumara", "Galle", "A+"],
  ["Iresha Mendis", "Galle", "O+"],
  ["Dinesh Rathnayake", "Matara", "B-"],
  ["Sandya Abeywickrama", "Hambantota", "O+"],
  ["Mahesh Peiris", "Jaffna", "A+"],
  ["Kavitha Sivakumar", "Jaffna", "B+"],
  ["Nuwan Herath", "Kurunegala", "O+"],
  ["Chamari Ekanayake", "Kurunegala", "AB+"],
  ["Ajith Nawaratne", "Puttalam", "A-"],
  ["Sumudu Thilakarathne", "Anuradhapura", "O+"],
  ["Rangana Karunaratne", "Polonnaruwa", "B+"],
  ["Menaka Wijesuriya", "Badulla", "O-"],
  ["Lahiru Senanayake", "Ratnapura", "A+"],
  ["Dilrukshi Pathirana", "Kegalle", "AB+"],
  ["Sujeewa Alwis", "Trincomalee", "O+"],
];

type SeedRequest = {
  patientName: string;
  bloodGroup: BloodGroup;
  units: number;
  hospital: string;
  district: string;
  contactName: string;
  contactMobile: string;
  urgency: UrgencyLevel;
  notes: string | null;
  status: "pending" | "verified" | "fulfilled";
  /** Links the request to the demo recipient account. */
  ownedByRecipient?: boolean;
};

const SEED_REQUESTS: SeedRequest[] = [
  {
    patientName: "R. M. Silva",
    bloodGroup: "O-",
    units: 3,
    hospital: "National Hospital of Sri Lanka",
    district: "Colombo",
    contactName: "Ravindu Silva",
    contactMobile: "0771234501",
    urgency: "critical",
    notes: "Road traffic accident. Theatre scheduled within the hour.",
    status: "pending",
  },
  {
    patientName: "F. A. Rizwan",
    bloodGroup: "A+",
    units: 2,
    hospital: "Kandy Teaching Hospital",
    district: "Kandy",
    contactName: "Fathima Rizwan",
    contactMobile: "0775551234",
    urgency: "urgent",
    notes: "Post-operative transfusion.",
    status: "verified",
    ownedByRecipient: true,
  },
  {
    patientName: "W. P. Gunathilaka",
    bloodGroup: "B+",
    units: 1,
    hospital: "Gampaha District General Hospital",
    district: "Gampaha",
    contactName: "Wasana Gunathilaka",
    contactMobile: "0771234503",
    urgency: "standard",
    notes: null,
    status: "pending",
  },
  {
    patientName: "M. I. Nawaz",
    bloodGroup: "AB+",
    units: 4,
    hospital: "Karapitiya Teaching Hospital",
    district: "Galle",
    contactName: "Mohamed Nawaz",
    contactMobile: "0771234504",
    urgency: "critical",
    notes: "Dengue with low platelets.",
    status: "pending",
  },
  {
    patientName: "H. K. Bandara",
    bloodGroup: "O+",
    units: 2,
    hospital: "Anuradhapura Teaching Hospital",
    district: "Anuradhapura",
    contactName: "Harsha Bandara",
    contactMobile: "0771234505",
    urgency: "urgent",
    notes: null,
    status: "pending",
  },
  {
    patientName: "S. Thavarajah",
    bloodGroup: "A-",
    units: 5,
    hospital: "Jaffna Teaching Hospital",
    district: "Jaffna",
    contactName: "Suresh Thavarajah",
    contactMobile: "0771234506",
    urgency: "critical",
    notes: "Thalassaemia patient, recurring transfusion.",
    status: "pending",
  },
  {
    patientName: "D. L. Perera",
    bloodGroup: "B-",
    units: 2,
    hospital: "Matara District General Hospital",
    district: "Matara",
    contactName: "Dilani Perera",
    contactMobile: "0771234507",
    urgency: "standard",
    notes: "Completed last week.",
    status: "fulfilled",
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

  const bulkHash = await hashPassword(DEMO_PASSWORD);
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
    const ids = new Map<string, string>();

    for (const user of DEMO_USERS) {
      const id = generateId("usr");
      ids.set(user.mobile ?? user.email ?? user.fullName, id);

      insertUser.run(
        id,
        user.role,
        user.fullName,
        user.email,
        user.mobile,
        user.district,
        user.bloodGroup,
        demoHashes.get(user.password) ?? bulkHash,
        user.isVerified ? 1 : 0,
        timestamp,
        timestamp,
      );
    }

    // Bulk donors. Mobile numbers are sequential and unique so signs-ins are
    // reproducible if anyone wants to test with them.
    EXTRA_DONORS.forEach(([fullName, district, bloodGroup], index) => {
      const mobile = `077100${String(index + 1).padStart(4, "0")}`;
      const id = generateId("usr");
      ids.set(mobile, id);

      insertUser.run(
        id,
        "donor",
        fullName,
        null,
        mobile,
        district,
        bloodGroup,
        bulkHash,
        1,
        timestamp,
        timestamp,
      );
    });

    // Availability: pause every fourth donor so the "active" count is a real
    // subset rather than everything.
    const donorRows = db
      .prepare("SELECT id FROM users WHERE role = 'donor' ORDER BY full_name")
      .all() as { id: string }[];

    const insertAvailability = db.prepare(
      `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
       VALUES (?, ?, ?, ?)`,
    );

    donorRows.forEach((row, index) => {
      const lastDonation =
        index % 3 === 0
          ? new Date(Date.now() - (60 + index) * 24 * 60 * 60 * 1000).toISOString()
          : null;

      insertAvailability.run(row.id, index % 4 === 3 ? 0 : 1, lastDonation, timestamp);
    });

    const recipientId = ids.get("0775551234") ?? null;
    const insertRequest = db.prepare(
      `INSERT INTO emergency_requests
         (id, requester_user_id, patient_name, blood_group, units, hospital,
          district, contact_name, contact_mobile, urgency, notes, status,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    for (const request of SEED_REQUESTS) {
      // Spread the seeded requests over the past few days so the queue does not
      // all share a timestamp.
      const createdAt = new Date(
        Date.now() - Math.floor(Math.random() * 72) * 60 * 60 * 1000,
      ).toISOString();

      insertRequest.run(
        generateId("req"),
        request.ownedByRecipient ? recipientId : null,
        request.patientName,
        request.bloodGroup,
        request.units,
        request.hospital,
        request.district,
        request.contactName,
        request.contactMobile,
        request.urgency,
        request.notes,
        request.status,
        createdAt,
        createdAt,
      );
    }
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

  console.log(`  ${counts.users} users (${counts.donors} donors)`);
  console.log(`  ${counts.requests} emergency requests`);
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
