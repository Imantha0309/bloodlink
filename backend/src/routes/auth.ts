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
import { authUserRow, passOwnerRow } from "../domain/serialize";
import {
  MAX_AVATAR_BYTES,
  readUploadedAvatar,
  removeStoredAvatar,
  storeAvatar,
  uploadAvatar,
  uploadErrorMessage,
  type UploadedAvatar,
} from "../avatar";
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
 * Donors, recipients and hospitals all edit the same set of contact fields —
 * name, email, mobile, district. The route used to reject everyone but donors,
 * which meant a hospital could never correct a typo in its own name and a
 * recipient could not change a phone number. Blood group stays donor-only: it is
 * a clinical value that drives donation compatibility, so it is not something a
 * recipient should be able to set to widen who can donate to them.
 *
 * Admin stays locked: accounts there are provisioned by seed, and the route is
 * the same one every self-service edit goes through.
 */
authRouter.patch(
  "/me",
  requireAuth,
  validateBody(updateMeSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const input = req.body as z.infer<typeof updateMeSchema>;

    if (user.role === "admin") {
      throw fail.conflict("Administrator profiles are managed by the seed script, not edited here.");
    }

    if (input.bloodGroup !== undefined && input.bloodGroup !== null && user.role !== "donor") {
      throw fail.conflict("Only a donor can set a blood group.");
    }

    if (input.bloodGroup !== undefined && input.bloodGroup !== null && !isBloodGroup(input.bloodGroup)) {
      throw fail.validation("Choose a valid blood group.", {
        bloodGroup: "Choose a valid blood group.",
      });
    }

    // Checked for every role now, not only donors, so two accounts racing on the
    // same email still resolves to a conflict rather than a duplicate-key crash.
    await assertContactDetailsFree(user, input.email, input.mobile);

    if (input.fullName !== undefined) user.fullName = input.fullName;
    if (input.district !== undefined) user.district = input.district;
    if (input.email !== undefined) user.email = input.email;
    if (input.mobile !== undefined) user.mobile = input.mobile;
    if (user.role === "donor" && input.bloodGroup !== undefined) {
      user.bloodGroup = input.bloodGroup;
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

/* ------------------------------------------------------------------- avatar */

/**
 * Replaces the signed-in user's profile picture.
 *
 * The old file is deleted before the new path is committed to the database, so a
 * crash mid-upload leaves an unreferenced file rather than a user with no
 * avatar. Multer's own errors are mapped rather than allowed through, because an
 * unhandled rejection from the middleware is a 500 that tells the user nothing.
 */
authRouter.post(
  "/me/avatar",
  requireAuth,
  uploadAvatar,
  asyncHandler(async (req, res) => {
    const user = currentUser(req);

    const file = (req as { file?: UploadedAvatar }).file;

    try {
      const buffer = await readUploadedAvatar(file);
      const avatarUrl = await storeAvatar(String(user._id), buffer);
      const previous = user.avatarUrl;

      user.avatarUrl = avatarUrl;
      await user.save();

      await removeStoredAvatar(previous);

      res.json({ user: authUserRow(user) });
    } catch (error) {
      throw fail.validation(uploadErrorMessage(error));
    }
  }),
);

/* ------------------------------------------------------------- identity pass */

/**
 * How long an identity pass stays valid.
 *
 * Long enough that nobody re-opens their profile mid-shift to refresh a QR that
 * a colleague is about to scan, short enough that a lost phone stops being a
 * permanent exposure. The app re-issues silently on expiry, so this is a ceiling
 * on staleness rather than something a user has to act on.
 */
const PASS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const passTokenSchema = z.object({
  tokenHash: z.string().trim().min(16, "A pass hash is required.").max(128),
});

/**
 * Issues (or rotates) the signed-in user's identity pass.
 *
 * The device generates the secret and sends only its SHA-256, exactly as the
 * donor intake ticket does, so the raw value never reaches this process. Issuing
 * overwrites the stored hash, which retires any pass already in the wild — that
 * is the whole of "revoke", and it is why rotation needs no extra bookkeeping.
 */
authRouter.post(
  "/me/pass",
  requireAuth,
  validateBody(passTokenSchema),
  asyncHandler(async (req, res) => {
    const user = currentUser(req);
    const { tokenHash } = req.body as { tokenHash: string };

    const expiresAt = new Date(Date.now() + PASS_TTL_MS);

    // `passTokenHash` is `select: false`, so the loaded document does not carry
    // the current value and saving would drop it without this explicit update.
    await User.updateOne(
      { _id: user._id },
      { $set: { passTokenHash: tokenHash, passTokenExpiresAt: expiresAt } },
    );

    res.json({ pass: { expiresAt } });
  }),
);

/**
 * Resolves a scanned pass to the person who owns it.
 *
 * Requires a session, deliberately: an anonymous caller with one phone could
 * otherwise walk a list of pass hashes off the database and pull a name and role
 * for each. `requireAuth` alone would allow any registered account to do the
 * same, so the returned row is the narrow `passOwnerRow` — enough to confirm
 * identity at a desk, and nothing that turns a pass into a directory.
 *
 * A miss is a conflict rather than a 404, so a caller cannot tell "no such pass"
 * apart from "that pass has expired" and use the difference to probe.
 */
authRouter.post(
  "/pass/resolve",
  requireAuth,
  validateBody(passTokenSchema),
  asyncHandler(async (req, res) => {
    const scanner = currentUser(req);
    const { tokenHash } = req.body as { tokenHash: string };

    const owner = await User.findOne({ passTokenHash: tokenHash }).select("+passTokenHash");

    if (
      owner === null ||
      owner.passTokenExpiresAt === null ||
      owner.passTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw fail.conflict("This pass is invalid or has expired.");
    }

    owner.passLastScanBy = scanner._id;
    owner.passLastScanAt = new Date();
    await owner.save();

    res.json({
      pass: {
        owner: passOwnerRow(owner),
        expiresAt: owner.passTokenExpiresAt,
        // Lets the client say "this is you" without a second round trip.
        isSelf: String(owner._id) === String(scanner._id),
        scannedAt: owner.passLastScanAt,
      },
    });
  }),
);
