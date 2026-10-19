"use strict";
/**
 * Blood facilities and live stock.
 *
 * Public on purpose — the urgent path lets a signed-out visitor look up where
 * to go. The only derived value is `totalUnits`, which the list endpoint sums
 * across every component; the detail endpoint returns the full matrix instead.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bloodBanksRouter = void 0;
const express_1 = require("express");
const mongoose_1 = __importDefault(require("mongoose"));
const serialize_1 = require("../domain/serialize");
const http_1 = require("../http");
const blood_bank_1 = require("../models/blood-bank");
const blood_inventory_1 = require("../models/blood-inventory");
exports.bloodBanksRouter = (0, express_1.Router)();
/** Every bank, with its total stocked units, verified first. */
exports.bloodBanksRouter.get("/", (0, http_1.asyncHandler)(async (_req, res) => {
    const banks = await blood_bank_1.BloodBank.find().sort({ isVerified: -1, name: 1 });
    const totals = await blood_inventory_1.BloodInventory.aggregate([
        { $group: { _id: "$bank", total: { $sum: "$units" } } },
    ]);
    const totalByBank = new Map(totals.map((row) => [String(row._id), row.total]));
    res.json({
        banks: banks.map((bank) => (0, serialize_1.bankRow)(bank, totalByBank.get(String(bank._id)) ?? 0)),
    });
}));
/** One bank with its full inventory matrix — what the detail screen shows. */
exports.bloodBanksRouter.get("/:id", (0, http_1.asyncHandler)(async (req, res) => {
    if (!mongoose_1.default.isValidObjectId(req.params.id)) {
        throw http_1.fail.notFound("That blood bank could not be found.");
    }
    const bank = await blood_bank_1.BloodBank.findById(req.params.id);
    if (bank === null) {
        throw http_1.fail.notFound("That blood bank could not be found.");
    }
    const inventory = await blood_inventory_1.BloodInventory.find({ bank: bank._id }).sort({
        bloodGroup: 1,
        component: 1,
    });
    res.json({ bank: { ...(0, serialize_1.bankRow)(bank), inventory: inventory.map(serialize_1.inventoryRow) } });
}));
