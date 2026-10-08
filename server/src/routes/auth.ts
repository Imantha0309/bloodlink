/**
 * Authentication routes.
 *
 * `POST /auth/sign-in` is the contract the app's `HttpAuthService` was already
 * written against: it sends `{identifier, password}` and expects
 * `{session: {token, expiresAt, user}}` back, with 401 for bad credentials and
 * 423 for a locked account.
 */

import { Router } from "express";

import { db, now } from "../db";
import { asyncHandler } from "../lib/async-handler";
import { ApiError } from "../lib/errors";
import { hashPassword, verifyPassword } from "../lib/passwords";
import { issueSession, revokeSession } from "../lib/sessions";
import { generateId } from "../lib/tokens";
import { normalizeEmail, normalizeMobile } from "../lib/contact";
import { findUserByIdentifier, identifierToColumns } from "../lib/users";
import { parseBody, donorProfileSchema, registerSchema, signInSchema } from "../lib/validate";
import { requireAuth } from "../middleware/auth";
import { toAuthUser } from "../types";

export const authRouter = Router();

authRouter.post(
  "/sign-in",
  asyncHandler(async (request, response) => {
    const { identifier, password } = parseBody(signInSchema, request.body);
    const user = findUserByIdentifier(identifier);

    // Deliberately identical failure for "no such user" and "wrong password",
    // so the endpoint cannot be used to enumerate registered accounts.
    if (!user) {
      throw new ApiError("invalid_credentials", "Incorrect email or password.");
    }

    if (user.is_locked === 1) {
      throw new ApiError("account_locked", "This account is temporarily locked.");
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      throw new ApiError("invalid_credentials", "Incorrect email or password.");
    }

    response.json({ session: issueSession(user) });
  }),
);

authRouter.post(
  "/register",
  asyncHandler(async (request, response) => {
    const input = parseBody(registerSchema, request.body);
    const { email, mobile } = identifierToColumns(input.identifier);

    if (email === null && mobile === null) {
      throw new ApiError("validation", "Please correct the highlighted fields.", {
        fields: { identifier: "Please enter a valid email address or mobile number." },
      });
    }

    if (findUserByIdentifier(input.identifier)) {
      throw new ApiError("conflict", "An account with those details already exists.", {
        fields: { identifier: "An account with those details already exists." },
      });
    }

    // Blood group is what makes a donor reachable for a matching request, and
    // the recipient needs one to find donors — required for both even though
    // the column is nullable (hospitals/admins have none).
    if ((input.role === "donor" || input.role === "recipient") && !input.bloodGroup) {
      throw new ApiError("validation", "Please correct the highlighted fields.", {
        fields: { bloodGroup: "Select your blood group." },
      });
    }

    const timestamp = now();
    const userId = generateId("usr");

    db.prepare(
      `INSERT INTO users
         (id, role, full_name, email, mobile, district, blood_group,
          password_hash, is_verified, is_locked, registration_number,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
    ).run(
      userId,
      input.role,
      input.fullName,
      email,
      mobile,
      input.district ?? null,
      input.bloodGroup ?? null,
      await hashPassword(input.password),
      // Hospitals must be verified by an admin before they can act; everyone
      // else is usable immediately.
      input.role === "hospital" ? 0 : 1,
      input.registrationNumber ?? null,
      timestamp,
      timestamp,
    );

    if (input.role === "donor") {
      db.prepare(
        `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
         VALUES (?, 1, ?, ?)`,
      ).run(userId, input.lastDonationAt ?? null, timestamp);
    }

    const user = findUserByIdentifier(input.identifier);

    if (!user) {
      // Only reachable if the insert above silently failed.
      throw new ApiError("unknown", "Could not create the account.");
    }

    response.status(201).json({ session: issueSession(user) });
  }),
);

authRouter.get("/me", requireAuth, (request, response) => {
  // `requireAuth` guarantees this.
  response.json({ user: toAuthUser(request.user!) });
});

authRouter.patch("/me", requireAuth, (request, response) => {
  const currentUser = request.user!;
  if (currentUser.role !== "donor") {
    throw new ApiError("unauthorized", "Only donors can edit a donor profile.", { status: 403 });
  }

  const input = parseBody(donorProfileSchema, request.body);
  const email = input.email ? normalizeEmail(input.email) : null;
  const mobile = input.mobile ? normalizeMobile(input.mobile) : null;

  const duplicate = db
    .prepare("SELECT id FROM users WHERE id <> ? AND ((email IS NOT NULL AND email = ?) OR (mobile IS NOT NULL AND mobile = ?)) LIMIT 1")
    .get(currentUser.id, email, mobile);
  if (duplicate) {
    throw new ApiError("conflict", "That email or mobile number is already in use.", {
      fields: { email: "That email or mobile number is already in use.", mobile: "That email or mobile number is already in use." },
    });
  }

  const timestamp = now();
  db.prepare(
    `UPDATE users
        SET full_name = ?, email = ?, mobile = ?, district = ?, blood_group = ?, updated_at = ?
      WHERE id = ? AND role = 'donor'`,
  ).run(input.fullName, email, mobile, input.district, input.bloodGroup, timestamp, currentUser.id);

  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(currentUser.id);
  if (!updated) throw new ApiError("not_found", "Donor profile could not be found.");

  response.json({ user: toAuthUser(updated as typeof currentUser) });
});

authRouter.post("/sign-out", requireAuth, (request, response) => {
  revokeSession(request.session!.id);
  response.status(204).end();
});
