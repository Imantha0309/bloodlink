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

import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { adminUserRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { currentUser, requireAuth } from "../middleware/auth";
import { validateBody, param } from "../middleware/validate";
import { USER_ROLES, type UserRole } from "../models/shared";
import { User } from "../models/user";

export const adminRouter = Router();

/** How many accounts a search may return in one page. */
const PAGE_LIMIT = 100;

/**
 * Rejects anyone who is not an admin.
 *
 * Deliberately not `assertStaff`: hospital staff are cleared to move stock and
 * patients, but must not be able to read or edit the account table.
 */
function assertAdmin(user: { role: UserRole }): void {
  if (user.role !== "admin") {
    throw fail.conflict("Only administrators can manage accounts.");
  }
}

const listSchema = z.object({
  role: z.string().trim().nullable().optional(),
  search: z.string().trim().optional(),
});

/**
 * The account table, filtered.
 *
 * `search` matches a name, an email or a mobile number — the three things the
 * search box's placeholder promises — and is escaped before it becomes a regex,
 * so a stray `(` does not blow up the query.
 */
adminRouter.get(
  "/users",
  requireAuth,
  asyncHandler(async (req, res) => {
    assertAdmin(currentUser(req));

    const { role, search } = listSchema.parse({
      role: req.query.role ?? null,
      search: req.query.search ?? "",
    });

    const filter: Record<string, unknown> = {};

    if (role !== null && role !== undefined && role.length > 0) {
      filter.role = role;
    }

    if (search !== undefined && search.length > 0) {
      const pattern = new RegExp(escapeRegExp(search), "i");

      filter.$or = [{ fullName: pattern }, { email: pattern }, { mobile: pattern }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).limit(PAGE_LIMIT);

    res.json({ users: users.map(adminUserRow) });
  }),
);

/** The caller may not revoke their own access — that is how a system locks out. */
function assertNotSelf(actor: { _id: unknown }, targetId: string, action: string): void {
  if (String(actor._id) === targetId) {
    throw fail.conflict(`You cannot ${action} your own account.`);
  }
}

/** Approves or revokes a hospital. The one flag every staff operation gates on. */
adminRouter.patch(
  "/users/:uid/verification",
  requireAuth,
  validateBody(z.object({ isVerified: z.boolean() })),
  asyncHandler(async (req, res) => {
    const actor = currentUser(req);
    assertAdmin(actor);

    const target = await findUser(param(req, "uid"));
    const { isVerified } = req.body as { isVerified: boolean };

    if (!isVerified) {
      assertNotSelf(actor, String(target._id), "revoke");
    }

    target.isVerified = isVerified;
    await target.save();

    res.json({ user: adminUserRow(target) });
  }),
);

/**
 * Reassigns a role.
 *
 * Guarded against the two ways this hurts: demoting yourself out of the admin
 * role, and turning the last remaining admin into something else — either one
 * leaves nobody who can approve hospitals.
 */
adminRouter.patch(
  "/users/:uid/role",
  requireAuth,
  validateBody(z.object({ role: z.enum(USER_ROLES) })),
  asyncHandler(async (req, res) => {
    const actor = currentUser(req);
    assertAdmin(actor);

    const target = await findUser(param(req, "uid"));
    const { role } = req.body as { role: UserRole };

    // Demoting an admin is the direction that can strand the system; promoting
    // one is always allowed.
    if (target.role === "admin" && role !== "admin") {
      assertNotSelf(actor, String(target._id), "change the role of");

      const admins = await User.countDocuments({ role: "admin" });

      if (admins <= 1) {
        throw fail.conflict("This is the only administrator. Promote another account first.");
      }
    }

    target.role = role;
    await target.save();

    res.json({ user: adminUserRow(target) });
  }),
);

/* ------------------------------------------------------------------ helpers */

async function findUser(uid: string) {
  if (!mongoose.isValidObjectId(uid)) {
    throw fail.notFound("That account could not be found.");
  }

  const user = await User.findById(uid);

  if (user === null) {
    throw fail.notFound("That account could not be found.");
  }

  return user;
}

/** Makes a user-typed search safe to compile into a regex. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
