"use strict";
/**
 * The Express application.
 *
 * The database is connected before the socket is opened, so a bad connection
 * string stops the process at boot with a real error instead of accepting
 * requests it cannot serve. Every failure — including a route that does not
 * exist — leaves through the same JSON envelope, so the app only ever has one
 * error shape to parse.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const node_path_1 = __importDefault(require("node:path"));
const db_1 = require("./db");
const env_1 = require("./env");
const http_1 = require("./http");
const admin_1 = require("./routes/admin");
const alerts_1 = require("./routes/alerts");
const auth_1 = require("./routes/auth");
const blood_banks_1 = require("./routes/blood-banks");
const dashboard_1 = require("./routes/dashboard");
const donors_1 = require("./routes/donors");
const emergency_1 = require("./routes/emergency");
const hospital_1 = require("./routes/hospital");
const app = (0, express_1.default)();
/**
 * CORS.
 *
 * A wildcard is fine in development but must be named explicitly in production —
 * `CORS_ORIGIN` takes a comma-separated list, because the web build is served
 * from a different origin to the API.
 */
app.use(env_1.env.corsOrigin === "*" ? (0, cors_1.default)() : (0, cors_1.default)({ origin: env_1.env.corsOrigin.split(",").map((origin) => origin.trim()) }));
// Request bodies here are small — a request, a screening, a stock count.
// The avatar route is the exception: it receives a whole image, so it is
// declared with its own limit rather than widening this one for every route.
app.use(express_1.default.json({ limit: "256kb" }));
/**
 * Avatars are served from this process rather than a CDN, which is why the
 * directory is resolved against where the server is running from rather than
 * `__dirname` — a compiled deployment runs from `dist/` with `UPLOAD_DIR`
 * pointing at the real location.
 */
app.use(env_1.env.uploadBaseUrl, express_1.default.static(node_path_1.default.resolve(process.cwd(), env_1.env.uploadDir), {
    fallthrough: true,
    // Avatars are immutable: every upload writes a new filename, so an
    // aggressively cached response can never serve a stale picture.
    maxAge: "30d",
    immutable: true,
}));
/** Liveness, and a cheap way to see which database the process reached. */
app.get("/health", (_req, res) => {
    res.json({ ok: true, database: (0, db_1.connectionState)() });
});
app.use("/auth", auth_1.authRouter);
app.use("/emergency", emergency_1.emergencyRouter);
app.use("/donors", donors_1.donorsRouter);
app.use("/hospital", hospital_1.hospitalRouter);
app.use("/blood-banks", blood_banks_1.bloodBanksRouter);
app.use("/alerts", alerts_1.alertsRouter);
app.use("/dashboard", dashboard_1.dashboardRouter);
app.use("/admin", admin_1.adminRouter);
// An unknown path is still an envelope, so the client's error mapping works the
// same for a typo as for a rule violation.
app.use((_req, res) => {
    res.status(404).json({
        error: { code: "not_found", message: "That endpoint does not exist." },
    });
});
app.use(http_1.errorHandler);
async function main() {
    await (0, db_1.connectDb)();
    console.log(`[bloodlink] mongo: ${(0, db_1.connectionState)()} (db "${env_1.env.mongoDb}")`);
    app.listen(env_1.env.port, () => {
        console.log(`[bloodlink] listening on http://localhost:${env_1.env.port}`);
    });
}
main().catch((error) => {
    console.error("[bloodlink] failed to start:", error);
    process.exit(1);
});
