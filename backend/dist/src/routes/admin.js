"use strict";
/**
 * Account administration.
 *
 * One rule governs this whole surface: only an admin gets past the door. The
 * old SQL expressed it as `ListUsers` matching no rows unless the caller held
 * the admin role; here it is an explicit 403 instead of a silently empty list,
 * because "you are not allowed" and "there is nothing here" should not look the
 * same to the person asking.
 *
 * Verification is the action that matters: `users.isVerified` is the flag every
 * staff-only operation gates on, so an unapproved hospital cannot touch stock or
 * patients until someone approves it here.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const zod_1 = require("zod");
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const auth_1 = require("../middleware/auth");
const validate_1 = require("../middleware/validate");
const shared_1 = require("../models/shared");
const user_1 = require("../models/user");
exports.adminRouter = (0, express_1.Router)();
/** How many accounts a search may return in one page. */
const PAGE_LIMIT = 100;
/**
 * Rejects anyone who is not an admin.
 *
 * Deliberately not `assertStaff`: hospital staff are cleared to move stock and
 * patients, but must not be able to read or edit the account table.
 */
function assertAdmin(user) {
    if (user.role !== "admin") {
        throw http_1.fail.conflict("Only administrators can manage accounts.");
    }
}
const listSchema = zod_1.z.object({
    role: zod_1.z.string().trim().nullable().optional(),
    search: zod_1.z.string().trim().optional(),
});
/**
 * The account table, filtered.
 *
 * `search` matches a name, an email or a mobile number — the three things the
 * search box's placeholder promises — and is escaped before it becomes a regex,
 * so a stray `(` does not blow up the query.
 */
exports.adminRouter.get("/users", auth_1.requireAuth, (0, http_1.asyncHandler)(async (req, res) => {
    assertAdmin((0, auth_1.currentUser)(req));
    const { role, search } = listSchema.parse({
        role: req.query.role ?? null,
        search: req.query.search ?? "",
    });
    const filter = {};
    if (role !== null && role !== undefined && role.length > 0) {
        filter.role = role;
    }
    if (search !== undefined && search.length > 0) {
        const pattern = new RegExp(escapeRegExp(search), "i");
        filter.$or = [{ fullName: pattern }, { email: pattern }, { mobile: pattern }];
    }
    const users = await user_1.User.find(filter).sort({ createdAt: -1 }).limit(PAGE_LIMIT);
    res.json({ users: users.map(serialize_1.adminUserRow) });
}));
/** The caller may not revoke their own access — that is how a system locks out. */
function assertNotSelf(actor, targetId, action) {
    if (String(actor._id) === targetId) {
        throw http_1.fail.conflict(`You cannot ${action} your own account.`);
    }
}
/** Approves or revokes a hospital. The one flag every staff operation gates on. */
exports.adminRouter.patch("/users/:uid/verification", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ isVerified: zod_1.z.boolean() })), (0, http_1.asyncHandler)(async (req, res) => {
    const actor = (0, auth_1.currentUser)(req);
    assertAdmin(actor);
    const target = await findUser((0, validate_1.param)(req, "uid"));
    const { isVerified } = req.body;
    if (!isVerified) {
        assertNotSelf(actor, String(target._id), "revoke");
    }
    target.isVerified = isVerified;
    await target.save();
    res.json({ user: (0, serialize_1.adminUserRow)(target) });
}));
/**
 * Reassigns a role.
 *
 * Guarded against the two ways this hurts: demoting yourself out of the admin
 * role, and turning the last remaining admin into something else — either one
 * leaves nobody who can approve hospitals.
 */
exports.adminRouter.patch("/users/:uid/role", auth_1.requireAuth, (0, validate_1.validateBody)(zod_1.z.object({ role: zod_1.z.enum(shared_1.USER_ROLES) })), (0, http_1.asyncHandler)(async (req, res) => {
    const actor = (0, auth_1.currentUser)(req);
    assertAdmin(actor);
    const target = await findUser((0, validate_1.param)(req, "uid"));
    const { role } = req.body;
    // Demoting an admin is the direction that can strand the system; promoting
    // one is always allowed.
    if (target.role === "admin" && role !== "admin") {
        assertNotSelf(actor, String(target._id), "change the role of");
        const admins = await user_1.User.countDocuments({ role: "admin" });
        if (admins <= 1) {
            throw http_1.fail.conflict("This is the only administrator. Promote another account first.");
        }
    }
    target.role = role;
    await target.save();
    res.json({ user: (0, serialize_1.adminUserRow)(target) });
}));
/* ------------------------------------------------------------------ helpers */
async function findUser(uid) {
    if (!mongoose_1.default.isValidObjectId(uid)) {
        throw http_1.fail.notFound("That account could not be found.");
    }
    const user = await user_1.User.findById(uid);
    if (user === null) {
        throw http_1.fail.notFound("That account could not be found.");
    }
    return user;
}
/** Makes a user-typed search safe to compile into a regex. */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
