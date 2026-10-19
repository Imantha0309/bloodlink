"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_1 = require("express");
const node_crypto_1 = require("node:crypto");
const zod_1 = require("zod");
const compatibility_1 = require("../domain/compatibility");
const serialize_1 = require("../domain/serialize");
const avatar_1 = require("../avatar");
const env_1 = require("../env");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const donor_availability_1 = require("../models/donor-availability");
const password_reset_1 = require("../models/password-reset");
const session_1 = require("../models/session");
const user_1 = require("../models/user");
const tokens_1 = require("../tokens");
exports.authRouter = (0, express_1.Router)();
/** Roles a person may choose for themselves. `admin` is provisioned by seed. */
const SELF_REGISTER_ROLES = ["recipient", "donor", "hospital"];
const BCRYPT_ROUNDS = 10;
/* ------------------------------------------------------------------ helpers */
/**
 * Splits the single sign-in identifier into whichever column it names.
 *
 * The app's `SignInInput.identifier` is "email address or mobile number exactly
 * as the user typed it", and the demo accounts sign in by mobile number, so the
 * server — not the caller — decides which one it is.
 */
function parseIdentifier(identifier) {
    const value = identifier.trim();
    if (value.includes("@")) {
        return { email: value.toLowerCase(), mobile: null };
    }
    // Strip spacing from a typed phone number; keep any leading + or 0 as given.
    return { email: null, mobile: value.replace(/[\s-]/g, "") };
}
/** Finds an account by either identifier, optionally with its password hash. */
async function findByIdentifier(identifier, withHash) {
    const { email, mobile } = parseIdentifier(identifier);
    const clauses = [];
    if (email !== null)
        clauses.push({ email });
    if (mobile !== null)
        clauses.push({ mobile });
    if (clauses.length === 0) {
        return null;
    }
    const query = user_1.User.findOne({ $or: clauses });
    return withHash ? await query.select("+passwordHash") : await query;
}
/** Creates the session row, signs a token, and returns the app's AuthSession. */
async function issueSession(user) {
    const tokenId = (0, tokens_1.newTokenId)();
    const expiresAt = (0, tokens_1.sessionExpiry)();
    const token = (0, tokens_1.signSessionToken)(String(user._id), tokenId, expiresAt);
    await session_1.Session.create({ user: user._id, tokenId, expiresAt });
    return {
        token,
        expiresAt: expiresAt.toISOString(),
        user: (0, serialize_1.authUserRow)(user),
    };
}
/** A donor (or donor-eligible recipient) gets an availability row on sign-up. */
async function ensureAvailability(user, lastDonationAt) {
    if (!(0, compatibility_1.isDonorEligible)(user.role, user.bloodGroup)) {
        return;
    }
    await donor_availability_1.DonorAvailability.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id, isAvailable: true, lastDonationAt } }, { upsert: true });
}
/** Turns a duplicate-key failure into the message the user should read. */
function isDuplicateKey(error) {
    return (typeof error === "object" && error !== null && error.code === 11000);
}
/** Refuses contact details that belong to a different account. */
async function assertContactDetailsFree(user, email, mobile) {
    const clauses = [];
    if (typeof email === "string" && email.length > 0)
        clauses.push({ email: email.toLowerCase() });
    if (typeof mobile === "string" && mobile.length > 0)
        clauses.push({ mobile });
    if (clauses.length === 0) {
        return;
    }
    const clash = await user_1.User.findOne({ _id: { $ne: user._id }, $or: clauses }).select("_id");
    if (clash !== null) {
        throw http_1.fail.conflict("Another account already uses that email or mobile number.");
    }
}
/** Counts a bad password and locks the account once the limit is reached. */
async function recordFailedAttempt(user) {
    const attempts = user.failedLoginAttempts + 1;
    if (attempts >= env_1.env.maxLoginAttempts) {
        await user_1.User.updateOne({ _id: user._id }, {
            $set: {
                failedLoginAttempts: 0,
                lockedUntil: new Date(Date.now() + env_1.env.lockoutMinutes * 60 * 1000),
            },
        });
        return;
    }
    await user_1.User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
}
/* ------------------------------------------------------------------- schemas */
const identifierSchema = zod_1.z.string().trim().min(3, "Enter your email or mobile number.");
const registerSchema = zod_1.z.object({
    role: zod_1.z.enum(SELF_REGISTER_ROLES),
    fullName: zod_1.z.string().trim().min(2, "Enter your full name."),
    identifier: identifierSchema,
    password: zod_1.z.string().min(8, "Use at least 8 characters."),
    district: zod_1.z.string().trim().nullable().optional(),
    bloodGroup: zod_1.z.string().trim().nullable().optional(),
    lastDonationAt: zod_1.z.string().trim().nullable().optional(),
    registrationNumber: zod_1.z.string().trim().nullable().optional(),
});
const loginSchema = zod_1.z.object({
    identifier: identifierSchema,
    password: zod_1.z.string().min(1, "Enter your password."),
});
const updateMeSchema = zod_1.z.object({
    fullName: zod_1.z.string().trim().min(2, "Enter your full name.").optional(),
    email: zod_1.z.string().trim().nullable().optional(),
    mobile: zod_1.z.string().trim().nullable().optional(),
    district: zod_1.z.string().trim().nullable().optional(),
    bloodGroup: zod_1.z.string().trim().nullable().optional(),
});
/* -------------------------------------------------------------------- routes */
/** Creates an account and signs the new user straight in. */
exports.authRouter.post("/register", (0, validate_1.validateBody)(registerSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const input = req.body;
    const { email, mobile } = parseIdentifier(input.identifier);
    const bloodGroup = input.bloodGroup ?? null;
    if (bloodGroup !== null && !(0, compatibility_1.isBloodGroup)(bloodGroup)) {
        throw http_1.fail.validation("Choose a valid blood group.", {
            bloodGroup: "Choose a valid blood group.",
        });
    }
    const passwordHash = await bcryptjs_1.default.hash(input.password, BCRYPT_ROUNDS);
    let user;
    try {
        user = await user_1.User.create({
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
    }
    catch (error) {
        if (isDuplicateKey(error)) {
            throw http_1.fail.conflict("An account already exists for that email or mobile number.");
        }
        throw error;
    }
    const lastDonationAt = input.lastDonationAt ? new Date(input.lastDonationAt) : null;
    await ensureAvailability(user, lastDonationAt);
    res.status(201).json(await issueSession(user));
}));
/** Signs an existing account in. */
exports.authRouter.post("/login", (0, validate_1.validateBody)(loginSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const input = req.body;
    const user = await findByIdentifier(input.identifier, true);
    // One message for "no such account" and "wrong password" alike, so the
    // response cannot be used to discover which addresses are registered.
    if (user === null) {
        throw http_1.fail.invalidCredentials();
    }
    if (user.lockedUntil !== null && user.lockedUntil.getTime() > Date.now()) {
        throw http_1.fail.accountLocked();
    }
    if (!(await bcryptjs_1.default.compare(input.password, user.passwordHash))) {
        await recordFailedAttempt(user);
        throw http_1.fail.invalidCredentials();
    }
    if (user.failedLoginAttempts !== 0 || user.lockedUntil !== null) {
        await user_1.User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockedUntil: null } });
    }
    res.json(await issueSession(user));
}));
/** Revokes the presented session. */
exports.authRouter.post("/logout", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    const token = req.header("authorization")?.split(" ")[1];
    const claims = token ? (0, tokens_1.verifySessionToken)(token) : null;
    if (claims !== null) {
        await session_1.Session.deleteOne({ tokenId: claims.jti });
    }
    res.json({ ok: true });
}));
/** The signed-in user. `restoreSession` in the app calls this to validate. */
exports.authRouter.get("/me", auth_1.requireAuth, (req, res) => {
    res.json({ user: (0, serialize_1.authUserRow)((0, auth_1.currentUser)(req)) });
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
exports.authRouter.patch("/me", auth_1.requireAuth, (0, validate_1.validateBody)(updateMeSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const input = req.body;
    if (user.role === "admin") {
        throw http_1.fail.conflict("Administrator profiles are managed by the seed script, not edited here.");
    }
    if (input.bloodGroup !== undefined && input.bloodGroup !== null && user.role !== "donor") {
        throw http_1.fail.conflict("Only a donor can set a blood group.");
    }
    if (input.bloodGroup !== undefined && input.bloodGroup !== null && !(0, compatibility_1.isBloodGroup)(input.bloodGroup)) {
        throw http_1.fail.validation("Choose a valid blood group.", {
            bloodGroup: "Choose a valid blood group.",
        });
    }
    // Checked for every role now, not only donors, so two accounts racing on the
    // same email still resolves to a conflict rather than a duplicate-key crash.
    await assertContactDetailsFree(user, input.email, input.mobile);
    if (input.fullName !== undefined)
        user.fullName = input.fullName;
    if (input.district !== undefined)
        user.district = input.district;
    if (input.email !== undefined)
        user.email = input.email;
    if (input.mobile !== undefined)
        user.mobile = input.mobile;
    if (user.role === "donor" && input.bloodGroup !== undefined) {
        user.bloodGroup = input.bloodGroup;
    }
    try {
        await user.save();
    }
    catch (error) {
        if (isDuplicateKey(error)) {
            throw http_1.fail.conflict("Another account already uses that email or mobile number.");
        }
        throw error;
    }
    res.json({ user: (0, serialize_1.authUserRow)(user) });
}));
/**
 * Starts a password reset.
 *
 * Always reports success, even for an unknown identifier — otherwise the
 * endpoint becomes a way to check who has an account. The reset link is printed
 * to the server console: real delivery needs an email provider, and pretending
 * to send one would be worse than saying plainly where the link went.
 */
exports.authRouter.post("/password-reset", (0, validate_1.validateBody)(zod_1.z.object({ identifier: identifierSchema })), (0, http_1.asyncHandler)(async (req, res) => {
    const { identifier } = req.body;
    const user = await findByIdentifier(identifier, false);
    if (user !== null) {
        const token = (0, node_crypto_1.randomBytes)(32).toString("hex");
        const tokenHash = (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await password_reset_1.PasswordReset.create({ user: user._id, tokenHash, expiresAt });
        console.log([
            "",
            "[bloodlink] password reset requested",
            `  account : ${user.email ?? user.mobile ?? String(user._id)}`,
            `  link    : bloodlink://reset-password?token=${token}`,
            `  expires : ${expiresAt.toISOString()}`,
            "",
        ].join("\n"));
    }
    res.json({ ok: true });
}));
/** Registers the device's push token so notifications can reach it. */
exports.authRouter.put("/push-token", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ token: zod_1.z.string().trim().min(1) })), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { token } = req.body;
    user.pushToken = token;
    await user.save();
    res.json({ ok: true });
}));
/* ------------------------------------------------------------------- avatar */
/**
 * Replaces the signed-in user's profile picture.
 *
 * The old file is deleted before the new path is committed to the database, so a
 * crash mid-upload leaves an unreferenced file rather than a user with no
 * avatar. Multer's own errors are mapped rather than allowed through, because an
 * unhandled rejection from the middleware is a 500 that tells the user nothing.
 */
exports.authRouter.post("/me/avatar", auth_1.requireAuth, avatar_1.uploadAvatar, (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const file = req.file;
    try {
        const buffer = await (0, avatar_1.readUploadedAvatar)(file);
        const avatarUrl = await (0, avatar_1.storeAvatar)(String(user._id), buffer);
        const previous = user.avatarUrl;
        user.avatarUrl = avatarUrl;
        await user.save();
        await (0, avatar_1.removeStoredAvatar)(previous);
        res.json({ user: (0, serialize_1.authUserRow)(user) });
    }
    catch (error) {
        throw http_1.fail.validation((0, avatar_1.uploadErrorMessage)(error));
    }
}));
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
const passTokenSchema = zod_1.z.object({
    tokenHash: zod_1.z.string().trim().min(16, "A pass hash is required.").max(128),
});
/**
 * Issues (or rotates) the signed-in user's identity pass.
 *
 * The device generates the secret and sends only its SHA-256, exactly as the
 * donor intake ticket does, so the raw value never reaches this process. Issuing
 * overwrites the stored hash, which retires any pass already in the wild — that
 * is the whole of "revoke", and it is why rotation needs no extra bookkeeping.
 */
exports.authRouter.post("/me/pass", auth_1.requireAuth, (0, validate_1.validateBody)(passTokenSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const user = (0, auth_1.currentUser)(req);
    const { tokenHash } = req.body;
    const expiresAt = new Date(Date.now() + PASS_TTL_MS);
    // `passTokenHash` is `select: false`, so the loaded document does not carry
    // the current value and saving would drop it without this explicit update.
    await user_1.User.updateOne({ _id: user._id }, { $set: { passTokenHash: tokenHash, passTokenExpiresAt: expiresAt } });
    res.json({ pass: { expiresAt } });
}));
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
exports.authRouter.post("/pass/resolve", auth_1.requireAuth, (0, validate_1.validateBody)(passTokenSchema), (0, http_1.asyncHandler)(async (req, res) => {
    const scanner = (0, auth_1.currentUser)(req);
    const { tokenHash } = req.body;
    const owner = await user_1.User.findOne({ passTokenHash: tokenHash }).select("+passTokenHash");
    if (owner === null ||
        owner.passTokenExpiresAt === null ||
        owner.passTokenExpiresAt.getTime() <= Date.now()) {
        throw http_1.fail.conflict("This pass is invalid or has expired.");
    }
    owner.passLastScanBy = scanner._id;
    owner.passLastScanAt = new Date();
    await owner.save();
    res.json({
        pass: {
            owner: (0, serialize_1.passOwnerRow)(owner),
            expiresAt: owner.passTokenExpiresAt,
            // Lets the client say "this is you" without a second round trip.
            isSelf: String(owner._id) === String(scanner._id),
            scannedAt: owner.passLastScanAt,
        },
    });
}));
