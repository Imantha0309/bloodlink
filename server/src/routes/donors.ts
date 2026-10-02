/**
 * Donor statistics for the sign-in screen's reassurance card.
 *
 * Returns exactly the `ActiveDonorsSummary` shape the app already consumes:
 * `{total, provinces, avatarInitials, updatedAt}`. Every number here is derived
 * from real rows — there is no hard-coded "12,480" inflating the figure.
 */

import { Router } from "express";
import { z } from "zod";

import { db, now } from "../db";
import { initialsOf, provinceOf } from "../lib/geo";
import { parseBody } from "../lib/validate";
import { requireAuth } from "../middleware/auth";

type AvailableDonor = { full_name: string; district: string | null };

/** At most this many monograms are shown before the card runs out of room. */
const AVATAR_LIMIT = 4;

export const donorsRouter = Router();

donorsRouter.get("/stats", (_request, response) => {
  const donors = db
    .prepare(
      `SELECT u.full_name, u.district
         FROM users u
         JOIN donor_availability d ON d.user_id = u.id
        WHERE u.role = 'donor'
          AND d.is_available = 1
          AND u.is_locked = 0
        ORDER BY u.full_name`,
    )
    .all() as AvailableDonor[];

  // Distinct provinces, in the order donors appear, so the card is stable
  // between requests rather than reshuffling.
  const provinces: string[] = [];

  for (const donor of donors) {
    const province = provinceOf(donor.district);

    if (province !== null && !provinces.includes(province)) {
      provinces.push(province);
    }
  }

  response.json({
    total: donors.length,
    provinces,
    avatarInitials: donors.slice(0, AVATAR_LIMIT).map((donor) => initialsOf(donor.full_name)),
    updatedAt: now(),
  });
});

const availabilitySchema = z.object({
  isAvailable: z.boolean(),
  lastDonationAt: z.string().trim().min(1).nullable().optional(),
});

/**
 * Turns a donor's alerts on or off. A donor that is paused is excluded from
 * `/donors/stats` and from hospital dispatch lists.
 */
donorsRouter.put("/me/availability", requireAuth, (request, response) => {
  const user = request.user!;

  if (user.role !== "donor") {
    response.status(403).json({
      error: { code: "unauthorized", message: "Only donors have an availability window." },
    });
    return;
  }

  const input = parseBody(availabilitySchema, request.body);
  const timestamp = now();

  // Upsert: a donor registered before this feature existed has no row yet.
  db.prepare(
    `INSERT INTO donor_availability (user_id, is_available, last_donation_at, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       is_available = excluded.is_available,
       last_donation_at = COALESCE(excluded.last_donation_at, donor_availability.last_donation_at),
       updated_at = excluded.updated_at`,
  ).run(user.id, input.isAvailable ? 1 : 0, input.lastDonationAt ?? null, timestamp);

  const row = db
    .prepare("SELECT * FROM donor_availability WHERE user_id = ?")
    .get(user.id) as { is_available: number; last_donation_at: string | null };

  response.json({
    availability: {
      isAvailable: row.is_available === 1,
      lastDonationAt: row.last_donation_at,
    },
  });
});
