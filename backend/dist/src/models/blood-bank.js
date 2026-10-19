"use strict";
/**
 * A blood facility and its contact details. Publicly readable.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BloodBank = void 0;
const mongoose_1 = require("mongoose");
const shared_1 = require("./shared");
const bloodBankSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    address: { type: String, default: null },
    phone: { type: String, default: null },
    hours: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    note: { type: String, default: null },
}, { timestamps: true });
bloodBankSchema.index({ district: 1, name: 1 }, { name: "district_name" });
(0, shared_1.applyJsonTransform)(bloodBankSchema);
exports.BloodBank = (0, mongoose_1.model)("BloodBank", bloodBankSchema);
