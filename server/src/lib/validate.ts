/**
 * Request-body validation.
 *
 * Every route parses its body through a zod schema, so a malformed request
 * becomes a clean 400 with per-field messages instead of a crash or a silently
 * undefined field.
 */

import { z } from "zod";

import { BLOOD_GROUPS, DONOR_RESPONSES, DONATION_STAGES, URGENCY_LEVELS } from "../types";
import { normalizeContact } from "./contact";
import { ApiError } from "./errors";
import { PASSWORD_MIN_LENGTH, isPasswordAcceptable } from "./passwords";

/** Roles a person may claim for themselves — `admin` is provisioned internally. */
export const SELF_REGISTER_ROLES = ["recipient", "donor", "hospital"] as const;

/** An email address or a Sri Lankan mobile number. */
const identifierSchema = z
  .string()
  .trim()
  .min(1, "Please enter your email or mobile number.")
  .refine((value) => normalizeContact(value) !== null, {
    message: "Please enter a valid email address or mobile number.",
  });

const passwordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  )
  .refine(isPasswordAcceptable, {
    message: "Password needs an uppercase letter, a lowercase letter and a number.",
  });

const bloodGroupSchema = z.enum(BLOOD_GROUPS);

export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Please enter your email or mobile number."),
  password: z.string().min(1, "Please enter your password."),
});

export const registerSchema = z.object({
  role: z.enum(SELF_REGISTER_ROLES, {
    errorMap: () => ({ message: "Choose a valid role." }),
  }),
  fullName: z.string().trim().min(2, "Please enter your full name."),
  identifier: identifierSchema,
  password: passwordSchema,
  district: z.string().trim().min(1).optional(),
  bloodGroup: bloodGroupSchema.optional(),
  /** Donors only — used to seed their availability record. */
  lastDonationAt: z.string().trim().min(1).optional(),
  /** Hospitals only. Captured for the admin verification queue. */
  registrationNumber: z.string().trim().min(1).optional(),
});

export const forgotPasswordSchema = z.object({
  identifier: identifierSchema,
});

export const verifyOtpSchema = z.object({
  resetId: z.string().trim().min(1),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const resetPasswordSchema = z.object({
  resetToken: z.string().trim().min(1),
  newPassword: passwordSchema,
});

export const emergencyRequestSchema = z.object({
  patientName: z.string().trim().min(2, "Please enter the patient's name."),
  bloodGroup: bloodGroupSchema,
  units: z.coerce
    .number()
    .int("Units must be a whole number.")
    .min(1, "At least 1 unit is required.")
    .max(20, "Contact the hospital directly for more than 20 units."),
  hospital: z.string().trim().min(2, "Please enter the hospital."),
  district: z.string().trim().min(1).optional(),
  contactName: z.string().trim().min(2, "Please enter a contact name."),
  contactMobile: z
    .string()
    .trim()
    .min(1, "Please enter a contact number.")
    .refine((value) => normalizeContact(value) !== null, {
      message: "Please enter a valid mobile number.",
    }),
  urgency: z.enum(URGENCY_LEVELS),
  notes: z.string().trim().max(500, "Please keep notes under 500 characters.").optional(),
});

export const donorResponseSchema = z.object({
  response: z.enum(DONOR_RESPONSES),
});

export const donorStageSchema = z.object({
  stage: z.enum(DONATION_STAGES),
});

export const checkInSchema = z.object({
  token: z.string().trim().min(20),
});

/**
 * Parses `body` against `schema`, converting a zod failure into an `ApiError`
 * carrying one message per invalid field.
 */
export function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const fields: Record<string, string> = {};

  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";

    // First message per field wins — showing every rule at once is noise.
    fields[key] ??= issue.message;
  }

  throw new ApiError("validation", "Please correct the highlighted fields.", { fields });
}
