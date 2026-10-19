"use strict";
/**
 * One stock line: a single (bank, blood group, component) combination.
 *
 * The unique index makes the restock route a plain upsert, and makes a
 * concurrent double-write land on one document instead of two.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodInventory = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const bloodInventorySchema = new mongoose_1.Schema({
    bank: { type: mongoose_1.Schema.Types.ObjectId, ref: "BloodBank", required: true },
    bloodGroup: { type: String, required: true },
    component: { type: String, enum: shared_1.BLOOD_COMPONENTS, required: true },
    units: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
bloodInventorySchema.index({ bank: 1, bloodGroup: 1, component: 1 }, { unique: true, name: "one_line_per_combination" });
(0, shared_1.applyJsonTransform)(bloodInventorySchema);
exports.BloodInventory = (0, mongoose_1.model)("BloodInventory", bloodInventorySchema);
