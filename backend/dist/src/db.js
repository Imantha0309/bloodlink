"use strict";
/**
 * MongoDB connection.
 *
 * One shared mongoose connection for the whole process; every model registers
 * against it. `connectDb` is awaited before the HTTP server starts listening, so
 * a bad connection string fails at boot rather than on the first request.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDb = connectDb;
exports.disconnectDb = disconnectDb;
exports.connectionState = connectionState;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDb() {
    mongoose_1.default.set("strictQuery", true);
    await mongoose_1.default.connect(env_1.env.mongoUri, {
        dbName: env_1.env.mongoDb,
        // The driver default is fine for Atlas; this just keeps a clearer error
        // than a hung socket when a deploy allow-lists nothing.
        serverSelectionTimeoutMS: 15_000,
    });
}
async function disconnectDb() {
    await mongoose_1.default.disconnect();
}
/** Human-readable connection state, for the startup log. */
function connectionState() {
    switch (mongoose_1.default.connection.readyState) {
        case 1:
            return "connected";
        case 2:
            return "connecting";
        case 3:
            return "disconnecting";
        default:
            return "disconnected";
    }
}
