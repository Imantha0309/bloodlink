/**
 * Blood facilities and live stock.
 *
 * Public on purpose — the urgent path lets a signed-out visitor look up where
 * to go. The only derived value is `totalUnits`, which the list endpoint sums
 * across every component; the detail endpoint returns the full matrix instead.
 */

import { Router } from "express";
import mongoose from "mongoose";

import { bankRow, inventoryRow } from "../domain/serialize";
import { asyncHandler, fail } from "../http";
import { BloodBank } from "../models/blood-bank";
import { BloodInventory } from "../models/blood-inventory";

export const bloodBanksRouter = Router();

/** Every bank, with its total stocked units, verified first. */
bloodBanksRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const banks = await BloodBank.find().sort({ isVerified: -1, name: 1 });

    const totals = await BloodInventory.aggregate<{ _id: mongoose.Types.ObjectId; total: number }>([
      { $group: { _id: "$bank", total: { $sum: "$units" } } },
    ]);

    const totalByBank = new Map(totals.map((row) => [String(row._id), row.total]));

    res.json({
      banks: banks.map((bank) => bankRow(bank, totalByBank.get(String(bank._id)) ?? 0)),
    });
  }),
);

/** One bank with its full inventory matrix — what the detail screen shows. */
bloodBanksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw fail.notFound("That blood bank could not be found.");
    }

    const bank = await BloodBank.findById(req.params.id);

    if (bank === null) {
      throw fail.notFound("That blood bank could not be found.");
    }

    const inventory = await BloodInventory.find({ bank: bank._id }).sort({
      bloodGroup: 1,
      component: 1,
    });

    res.json({ bank: { ...bankRow(bank), inventory: inventory.map(inventoryRow) } });
  }),
);
