/**
 * Authentication and profile.
 *
 * This is the piece Firebase Auth used to own. The shape of every response was
 * chosen to match what the app's `AuthService` interface already returned, so
 * switching the adapter changes no screen: `signIn`/`signUp` resolve to an
 * `AuthSession` of `{ token, expiresAt, user }` with `expiresAt` as an ISO
 * string, which is exactly what `saveSession` writes to AsyncStorage and what
 * `loadSession` refuses to restore once it has passed.
 *
 * Tokens are long-lived by design (SESSION_TTL_DAYS, default 30). The app has no
 * refresh flow and discards a session the moment it expires, so a short access
 * token would sign the user out mid-session; revocation on sign-out is handled
 * by deleting the session row instead.
 */

import bcrypt from "bcryptjs";
import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

import { isBloodGroup, isDonorEligible } from "../domain/compatibility";
import { authUserRow } from "../domain/serialize";
import { env } from "../env";
import { asyncHandler, fail } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { DonorAvailability } from "../models/donor-availability";
import { PasswordReset } from "../models/password-reset";
import { Session } from "../models/session";
import { User, type UserDoc } from "../models/user";
import { newTokenId, sessionExpiry, signSessionToken, verifySessionToken } from "../tokens";

export const authRouter = Router();

/** Roles a person may choose for themselves. `admin` is provisioned by seed. */
const SELF_REGISTER_ROLES = ["recipient", "donor", "hospital"] as const;

const BCRYPT_ROUNDS = 10;

/* ------------------------------------------------------------------ helpers */

/**
 * Splits the single sign-in identifier into whichever column it names.
 *
 * The app's `SignInInput.identifier` is "email address or mobile number exactly
 * as the user typed it", and the demo accounts sign in by mobile number, so the
 * server — not the caller — decides which one it is.
 */
function parseIdentifier(identifier: string): { email: string | null; mobile: string | null } {
  const value = identifier.trim();

  if (value.includes("@")) {
    return { email: value.toLowerCase(), mobile: null };
  }

  // Strip spacing from a typed phone number; keep any leading + or 0 as given.
  return { email: null, mobile: value.replace(/[\s-]/g, "") };
}

/** Finds an account by either identifier, optionally with its password hash. */
async function findByIdentifier(
  identifier: string,
  withHash: boolean,
): Promise<UserDoc | null> {
  const { email, mobile } = parseIdentifier(identifier);

  const clauses: Record<string, string>[] = [];

  if (email !== null) clauses.push({ email });
  if (mobile !== null) clauses.push({ mobile });

  if (clauses.length === 0) {
    return null;
  }

  const query = User.findOne({ $or: clauses });

  return withHash ? await query.select("+passwordHash") : await query;
}

/** Creates the session row, signs a token, and returns the app's AuthSession. */
async function issueSession(user: UserDoc) {
  const tokenId = newTokenId();
  const expiresAt = sessionExpiry();
  const token = signSessionToken(String(user._id), tokenId, expiresAt);

  await Session.create({ user: user._id, tokenId, expiresAt });

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: authUserRow(user),
  };
}

/** A donor (or donor-eligible recipient) gets an availability row on sign-up. */
async function ensureAvailability(user: UserDoc, lastDonationAt: Date | null): Promise<void> {
  if (!isDonorEligible(user.role, user.bloodGroup)) {
    return;
  }

  await DonorAvailability.updateOne(
    { userId: user._id },
    { $setOnInsert: { userId: user._id, isAvailable: true, lastDonationAt } },
    { upsert: true },
  );
}

/** Turns a duplicate-key failure into the message the user should read. */
function isDuplicateKey(error: unknown): boolean {
  return (
    typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000
  );
}

/** Refuses contact details that belong to a different account. */
async function assertContactDetailsFree(
  user: UserDoc,
  email: string | null | undefined,
  mobile: string | null | undefined,
): Promise<void> {
  const clauses: Record<string, unknown>[] = [];

  if (typeof email === "string" && email.length > 0) clauses.push({ email: email.toLowerCase() });
  if (typeof mobile === "string" && mobile.length > 0) clauses.push({ mobile });

  if (clauses.length === 0) {
    return;
  }

  const clash = await User.findOne({ _id: { $ne: user._id }, $or: clauses }).select("_id");

  if (clash !== null) {
    throw fail.conflict("Another account already uses that email or mobile number.");
  }
}

/** Counts a bad password and locks the account once the limit is reached. */
async function recordFailedAttempt(user: UserDoc): Promise<void> {
  const attempts = user.failedLoginAttempts + 1;

  if (attempts >= env.maxLoginAttempts) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + env.lockoutMinutes * 60 * 1000),
        },
      },
    );

    return;
  }

  await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
}

/* ------------------------------------------------------------------- schemas */

const identifierSchema = z.string().trim().min(3, "Enter your email or mobile number.");

const registerSchema = z.object({
  role: z.enum(SELF_REGISTER_ROLES),
  fullName: z.string().trim().min(2, "Enter your full name."),
  identifier: identifierSchema,
  password: z.string().min(8, "Use at least 8 characters."),
  district: z.string().trim().nullable().optional(),
  bloodGroup: z.string().trim().nullable().optional(),
  lastDonationAt: z.string().trim().nullable().optional(),
  registrationNumber: z.string().trim().nullable().optional(),
});

const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "Enter your password."),
});

const updateMeSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").optional(),
  email: z.string().trim().nullable().optional(),
  mobile: z.string().trim().nullable().optional(),
  district: z.string().trim().nullable().optional(),
  bloodGroup: z.string().trim().nullable().optional(),
});

/* -------------------------------------------------------------------- routes */

/** Creates an account and signs the new user straight in. */
authRouter.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof registerSchema>;

    const { email, mobile } = parseIdentifier(input.identifier);
    const bloodGroup = input.bloodGroup ?? null;

    if (bloodGroup !== null && !isBloodGroup(bloodGroup)) {
      throw fail.validation("Choose a valid blood group.", {
        bloodGroup: "Choose a valid blood group.",
      });
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    let user: UserDoc;

    try {
      user = await User.create({
        role: input.role,
        fullName: input.fullName,
        email,
        mobile,
        district: input.district ?? null,
        registrationNumber: input.registrationNumber ?? null,
        bloodGroup,
        // A hospital is provisional until an admin approves it; everyone else
        // is usable immediately, exactly as the old SQL did it.
        isVerified: input.role !== "hospital",
        passwordHash,
      });
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw fail.conflict("An account already exists for that email or mobile number.");
      }

      throw error;
    }

    const lastDonationAt = input.lastDonationAt ? new Date(input.lastDonationAt) : null;

    await ensureAvailability(user, lastDonationAt);

    res.status(201).json(await issueSession(user));
  }),
);

/** Signs an existing account in. */
authRouter.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const input = req.body as z.infer<typeof loginSchema>;

    const user = await findByIdentifier(input.identifier, true);

    // One message for "no such account" and "wrong password" alike, so the
    // response cannot be used to discover which addresses are registered.
    if (user === null) {
      throw fail.invalidCredentials();
    }

    if (user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now()) {
      throw fail.accountLocked();
    }

    if (!(await bcrypt.compare(input.password, user.passwordHash))) {
      await recordFailedAttempt(user);
      throw fail.invalidCredentials();
    }

    if (user.failedLoginAttempts !== 0 || user.lockedUntil !== null) {
      await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    res.json(await issueSession(user));
  }),
);

/** Revokes the presented session. */
authRouter.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    const token = req.header("authorization")?.split(" ")[1];
    const claims = token ? verifySessionToken(token) : null;

    if (claims !== null) {
      await Session.deleteOne({ tokenId: claims.jti });
    }

    res.json({ ok: true });
  }),
);

/** The signed-in user. `restoreSession` in the app calls this to validate. */
authRouter.get("/me", requireAuth, (req, res) => {
  res.json({ user: authUserRow(currentUser(req)) });
});

/**
 * Profile edits.
 *
 * Two app calls land here: a donor editing everything, and a recipient moving
 * their district. Which fields are honoured depends on the role, because the old
 * SQL had two separate guarded mutations for exactly that reason.
 */
authRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateMeSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const input = req.body as z.infer<typeof updateMeSchema>;

    if (user.role === "donor") {
      if (input.bloodGroup !== undefined && input.bloodGroup !== null && !isBloodGroup(input.bloodGroup)) {
        throw fail.validation("Choose a valid blood group.", {
          bloodGroup: "Choose a valid blood group.",
        });
      }

      await assertContactDetailsFree(user, input.email, input.mobile);

      if (input.fullName !== undefined) user.fullName = input.fullName;
      if (input.district !== undefined) user.district = input.district;
      if (input.bloodGroup !== undefined) user.bloodGroup = input.bloodGroup;
      if (input.email !== undefined) user.email = input.email;
      if (input.mobile !== undefined) user.mobile = input.mobile;
    } else if (user.role === "recipient") {
      // The location screen only ever moves the district.
      if (input.district !== undefined) user.district = input.district;
    } else {
      throw fail.conflict("Profile editing is not available for this account type.");
    }

    try {
      await user.save();
    } catch (error) {
      if (isDuplicateKey(error)) {
        throw fail.conflict("Another account already uses that email or mobile number.");
      }

      throw error;
    }

    res.json({ user: authUserRow(user) });
  }),
);

/**
 * Starts a password reset.
 *
 * Always reports success, even for an unknown identifier — otherwise the
 * endpoint becomes a way to check who has an account. The reset link is printed
 * to the server console: real delivery needs an email provider, and pretending
 * to send one would be worse than saying plainly where the link went.
 */
authRouter.post(
  "/password-reset",
  validateBody(z.object({ identifier: identifierSchema })),
  asyncHandler(async (req, res) => {
    const { identifier } = req.body as { identifier: string };

    const user = await findByIdentifier(identifier, false);

    if (user !== null) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordReset.create({ user: user._id, tokenHash, expiresAt });

      console.log(
        [
          "",
          "[bloodlink] password reset requested",
          `  account : ${user.email ?? user.mobile ?? String(user._id)}`,
          `  link    : bloodlink://reset-password?token=${token}`,
          `  expires : ${expiresAt.toISOString()}`,
          "",
        ].join("\n"),
      );
    }

    res.json({ ok: true });
  }),
);

/** Registers the device's push token so notifications can reach it. */
authRouter.put(
  "/push-token",
  requireAuth,
  validateBody(z.object({ token: z.string().trim().min(1) })),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { token } = req.body as { token: string };

    user.pushToken = token;
    await user.save();

    res.json({ ok: true });
  }),
);
