/**
 * Seeded demo accounts, shown as tap-to-fill rows on the sign-in screen in
 * development builds. Identifiers match what `FirebaseAuthService` accepts
 * (`07XXXXXXXX` phone numbers map to derived emails).
 */

import type { UserRole } from "@/services/auth/types";

export const DEMO_ACCOUNTS: readonly { identifier: string; password: string; role: UserRole }[] = [
  { identifier: "0771234567", password: "Donor@123", role: "donor" },
  { identifier: "0779876543", password: "Hospital@123", role: "hospital" },
  { identifier: "0775551234", password: "Recipient@123", role: "recipient" },
  { identifier: "admin@bloodlink.lk", password: "Admin@123", role: "admin" },
];