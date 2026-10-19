"use strict";
/**
 * Model barrel.
 *
 * Importing this module registers every schema with mongoose, which is what
 * `syncIndexes` in the seed script needs — an index is only created for a model
 * that has actually been loaded.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_MODELS = exports.User = exports.ShiftHandover = exports.Session = exports.PasswordReset = exports.ExtractionSession = exports.EmergencyRequest = exports.DonorScreening = exports.DonorRequestResponse = exports.DonorAvailability = exports.DiscrepancyReport = exports.BloodInventory = exports.BloodBank = exports.Alert = void 0;
exports.syncIndexes = syncIndexes;
var alert_1 = require("./alert");
Object.defineProperty(exports, "Alert", { enumerable: true, get: function () { return alert_1.Alert; } });
var blood_bank_1 = require("./blood-bank");
Object.defineProperty(exports, "BloodBank", { enumerable: true, get: function () { return blood_bank_1.BloodBank; } });
var blood_inventory_1 = require("./blood-inventory");
Object.defineProperty(exports, "BloodInventory", { enumerable: true, get: function () { return blood_inventory_1.BloodInventory; } });
var discrepancy_report_1 = require("./discrepancy-report");
Object.defineProperty(exports, "DiscrepancyReport", { enumerable: true, get: function () { return discrepancy_report_1.DiscrepancyReport; } });
var donor_availability_1 = require("./donor-availability");
Object.defineProperty(exports, "DonorAvailability", { enumerable: true, get: function () { return donor_availability_1.DonorAvailability; } });
var donor_request_response_1 = require("./donor-request-response");
Object.defineProperty(exports, "DonorRequestResponse", { enumerable: true, get: function () { return donor_request_response_1.DonorRequestResponse; } });
var donor_screening_1 = require("./donor-screening");
Object.defineProperty(exports, "DonorScreening", { enumerable: true, get: function () { return donor_screening_1.DonorScreening; } });
var emergency_request_1 = require("./emergency-request");
Object.defineProperty(exports, "EmergencyRequest", { enumerable: true, get: function () { return emergency_request_1.EmergencyRequest; } });
var extraction_session_1 = require("./extraction-session");
Object.defineProperty(exports, "ExtractionSession", { enumerable: true, get: function () { return extraction_session_1.ExtractionSession; } });
var password_reset_1 = require("./password-reset");
Object.defineProperty(exports, "PasswordReset", { enumerable: true, get: function () { return password_reset_1.PasswordReset; } });
var session_1 = require("./session");
Object.defineProperty(exports, "Session", { enumerable: true, get: function () { return session_1.Session; } });
var shift_handover_1 = require("./shift-handover");
Object.defineProperty(exports, "ShiftHandover", { enumerable: true, get: function () { return shift_handover_1.ShiftHandover; } });
var user_1 = require("./user");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return user_1.User; } });
__exportStar(require("./shared"), exports);
const mongoose_1 = __importDefault(require("mongoose"));
/** Every registered model, in a stable order. */
exports.ALL_MODELS = Object.values(mongoose_1.default.models);
/**
 * Creates the indexes declared in the schemas.
 *
 * Called by the seed script rather than on boot: building indexes implicitly at
 * startup is how a production database acquires an unplanned index build.
 */
async function syncIndexes() {
    const created = [];
    for (const registered of exports.ALL_MODELS) {
        try {
            await registered.syncIndexes();
            created.push(registered.modelName);
        }
        catch (error) {
            console.error(`[bloodlink] index sync failed for ${registered.modelName}:`, error);
        }
    }
    return created;
}
