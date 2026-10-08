/**
 * Blood facilities and their stock.
 *
 * Public read — a signed-out person on the urgent path needs to see where
 * blood is before they create a request, and stock levels are not personal
 * data. Writes live on the hospital router (`PUT /hospital/inventory/...`).
 */

import { Router } from "express";

import { db, now } from "../db";
import { ApiError } from "../lib/errors";

export const bloodBanksRouter = Router();

export type InventoryItem = {
  bloodGroup: string;
  component: string;
  units: number;
  updatedAt: string;
};

type BankRow = {
  id: string;
  name: string;
  district: string;
  address: string | null;
  phone: string | null;
  hours: string | null;
  is_verified: number;
  note: string | null;
};

function toBank(row: BankRow) {
  return {
    id: row.id,
    name: row.name,
    district: row.district,
    address: row.address,
    phone: row.phone,
    hours: row.hours,
    isVerified: row.is_verified === 1,
    note: row.note,
  };
}

function inventoryFor(bankId: string): InventoryItem[] {
  return (
    db
      .prepare(
        `SELECT blood_group, component, units, updated_at
           FROM blood_inventory
          WHERE blood_bank_id = ?
          ORDER BY blood_group, component`,
      )
      .all(bankId) as { blood_group: string; component: string; units: number; updated_at: string }[]
  ).map((row) => ({
    bloodGroup: row.blood_group,
    component: row.component,
    units: row.units,
    updatedAt: row.updated_at,
  }));
}

bloodBanksRouter.get("/", (_request, response) => {
  const rows = db
    .prepare("SELECT * FROM blood_banks ORDER BY is_verified DESC, name")
    .all() as BankRow[];

  const totals = db.prepare(
    `SELECT blood_bank_id, SUM(units) AS total
       FROM blood_inventory GROUP BY blood_bank_id`,
  );
  const totalsByBank = new Map(
    (totals.all() as { blood_bank_id: string; total: number }[]).map((row) => [
      row.blood_bank_id,
      row.total,
    ]),
  );

  response.json({
    banks: rows.map((row) => ({
      ...toBank(row),
      totalUnits: totalsByBank.get(row.id) ?? 0,
      updatedAt: now(),
    })),
  });
});

bloodBanksRouter.get("/:id", (request, response) => {
  const row = db.prepare("SELECT * FROM blood_banks WHERE id = ?").get(request.params.id) as
    | BankRow
    | undefined;

  if (!row) {
    throw new ApiError("not_found", "That blood bank could not be found.");
  }

  response.json({ bank: { ...toBank(row), inventory: inventoryFor(row.id) } });
});
