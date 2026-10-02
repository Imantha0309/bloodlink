/**
 * Password recovery.
 *
 * Three steps, each its own endpoint:
 *   1. POST /auth/forgot-password  -> issues a 6-digit code
 *   2. POST /auth/verify-otp       -> exchanges a valid code for a reset token
 *   3. POST /auth/reset-password   -> sets the new password
 *
 * Splitting it this way means the reset token is only ever handed out after a
 * correct code, so holding a `resetId` alone is not enough to take over an
 * account.
 *
 * There is no SMS or email provider wired up, so `devCode` is returned in the
 * response body. That is a deliberate local-development shortcut — it MUST NOT
 * survive contact with a real deployment.
 */

import { timingSafeEqual } from "node:crypto";

import { Router } from "express";

import { RESET_CODE_TTL_MS, RESET_MAX_ATTEMPTS } from "../config";
import { db, now } from "../db";
import { asyncHandler } from "../lib/async-handler";
import { ApiError } from "../lib/errors";
import { hashPassword, isPasswordAcceptable, PASSWORD_MIN_LENGTH } from "../lib/passwords";
import { revokeAllSessionsForUser } from "../lib/sessions";
import { generateId, generateResetCode, generateToken, hashToken } from "../lib/tokens";
import { findUserByIdentifier } from "../lib/users";
import {
  forgotPasswordSchema,
  parseBody,
  resetPasswordSchema,
  verifyOtpSchema,
} from "../lib/validate";

/** How long the reset token stays usable after the code is verified. */
const RESET_TOKEN_TTL_MS = 5 * 60 * 1000;

type ResetRow = {
  id: string;
  user_id: string;
  code_hash: string;
  expires_at: string;
  consumed_at: string | null;
  attempts: number;
};

export const passwordResetRouter = Router();

passwordResetRouter.post(
  "/forgot-password",
  asyncHandler(async (request, response) => {
    const { identifier } = parseBody(forgotPasswordSchema, request.body);
    const user = findUserByIdentifier(identifier);

    // This endpoint deliberately reveals whether an account exists, which a
    // production system should not do. For a locally-run development backend
    // the clearer error is worth more than the enumeration resistance.
    if (!user) {
      throw new ApiError("not_found", "No account found with those details.");
    }

    const code = generateResetCode();
    const resetId = generateId("rst");

    db.prepare(
      `INSERT INTO password_resets (id, user_id, code_hash, expires_at, attempts)
       VALUES (?, ?, ?, ?, 0)`,
    ).run(
      resetId,
      user.id,
      hashToken(code),
      new Date(Date.now() + RESET_CODE_TTL_MS).toISOString(),
    );

    response.json({ resetId, devCode: code });
  }),
);

passwordResetRouter.post(
  "/verify-otp",
  asyncHandler(async (request, response) => {
    const { resetId, code } = parseBody(verifyOtpSchema, request.body);
    const row = db
      .prepare("SELECT * FROM password_resets WHERE id = ?")
      .get(resetId) as ResetRow | undefined;

    if (!row || row.consumed_at !== null || Date.parse(row.expires_at) <= Date.now()) {
      throw new ApiError("validation", "That code has expired. Request a new one.", {
        fields: { code: "That code has expired. Request a new one." },
      });
    }

    if (row.attempts >= RESET_MAX_ATTEMPTS) {
      throw new ApiError("validation", "Too many attempts. Request a new code.", {
        fields: { code: "Too many attempts. Request a new code." },
      });
    }

    db.prepare("UPDATE password_resets SET attempts = attempts + 1 WHERE id = ?").run(resetId);

    const provided = Buffer.from(hashToken(code), "hex");
    const expected = Buffer.from(row.code_hash, "hex");
    const matches =
      provided.length === expected.length && timingSafeEqual(provided, expected);

    if (!matches) {
      throw new ApiError("validation", "That code is not correct.", {
        fields: { code: "That code is not correct." },
      });
    }

    const resetToken = generateToken();

    db.prepare(
      `UPDATE password_resets
          SET consumed_at = ?, reset_token_hash = ?, reset_token_expires_at = ?
        WHERE id = ?`,
    ).run(
      now(),
      hashToken(resetToken),
      new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString(),
      resetId,
    );

    response.json({ resetToken });
  }),
);

passwordResetRouter.post(
  "/reset-password",
  asyncHandler(async (request, response) => {
    const { resetToken, newPassword } = parseBody(resetPasswordSchema, request.body);

    if (!isPasswordAcceptable(newPassword)) {
      throw new ApiError("validation", "Please correct the highlighted fields.", {
        fields: {
          newPassword: `Password needs at least ${PASSWORD_MIN_LENGTH} characters, an uppercase letter, a lowercase letter and a number.`,
        },
      });
    }

    const row = db
      .prepare(
        `SELECT * FROM password_resets
          WHERE reset_token_hash = ? AND reset_token_expires_at > ?`,
      )
      .get(hashToken(resetToken), now()) as ResetRow | undefined;

    if (!row) {
      throw new ApiError("validation", "This reset link has expired. Start again.", {
        fields: { resetToken: "This reset link has expired. Start again." },
      });
    }

    const timestamp = now();

    db.prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?").run(
      await hashPassword(newPassword),
      timestamp,
      row.user_id,
    );

    // The token is single-use, and every existing session is killed so a stolen
    // session cannot outlive the password change.
    db.prepare("UPDATE password_resets SET reset_token_hash = NULL WHERE id = ?").run(row.id);
    revokeAllSessionsForUser(row.user_id);

    response.json({ ok: true });
  }),
);
