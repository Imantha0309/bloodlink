/**
 * The demo accounts shown on the sign-in screen.
 *
 * These are not a fallback — they are real rows in the database, created by
 * `backend/scripts/seed.ts`. The card that renders them exists so the app can be
 * demonstrated without registering four accounts by hand, so if the seed has not
 * been run these credentials will simply fail to sign in.
 */

export type DemoAccount = {
  /** Email address or mobile number, exactly as it is typed into the form. */
  identifier: string;
  password: string;
  role: "donor" | "hospital" | "recipient" | "admin";
};

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { identifier: "0771234567", password: "Donor@123", role: "donor" },
  { identifier: "0779876543", password: "Hospital@123", role: "hospital" },
  { identifier: "0775551234", password: "Recipient@123", role: "recipient" },
  { identifier: "admin@bloodlink.lk", password: "Admin@123", role: "admin" },
];
