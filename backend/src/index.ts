/**
 * The Express application.
 *
 * The database is connected before the socket is opened, so a bad connection
 * string stops the process at boot with a real error instead of accepting
 * requests it cannot serve. Every failure — including a route that does not
 * exist — leaves through the same JSON envelope, so the app only ever has one
 * error shape to parse.
 */

import cors from "cors";
import express from "express";
import path from "node:path";

import { connectDb, connectionState } from "./db";
import { env } from "./env";
import { errorHandler } from "./http";
import { adminRouter } from "./routes/admin";
import { alertsRouter } from "./routes/alerts";
import { authRouter } from "./routes/auth";
import { bloodBanksRouter } from "./routes/blood-banks";
import { dashboardRouter } from "./routes/dashboard";
import { donorsRouter } from "./routes/donors";
import { emergencyRouter } from "./routes/emergency";
import { hospitalRouter } from "./routes/hospital";

const app = express();

/**
 * CORS.
 *
 * A wildcard is fine in development but must be named explicitly in production —
 * `CORS_ORIGIN` takes a comma-separated list, because the web build is served
 * from a different origin to the API.
 */
app.use(env.corsOrigin === "*" ? cors() : cors({ origin: env.corsOrigin.split(",").map((origin) => origin.trim()) }));

// Request bodies here are small — a request, a screening, a stock count.
// The avatar route is the exception: it receives a whole image, so it is
// declared with its own limit rather than widening this one for every route.
app.use(express.json({ limit: "256kb" }));

/**
 * Avatars are served from this process rather than a CDN, which is why the
 * directory is resolved against where the server is running from rather than
 * `__dirname` — a compiled deployment runs from `dist/` with `UPLOAD_DIR`
 * pointing at the real location.
 */
app.use(
  env.uploadBaseUrl,
  express.static(path.resolve(process.cwd(), env.uploadDir), {
    fallthrough: true,
    // Avatars are immutable: every upload writes a new filename, so an
    // aggressively cached response can never serve a stale picture.
    maxAge: "30d",
    immutable: true,
  }),
);

/** Liveness, and a cheap way to see which database the process reached. */
app.get("/health", (_req, res) => {
  res.json({ ok: true, database: connectionState() });
});

app.use("/auth", authRouter);
app.use("/emergency", emergencyRouter);
app.use("/donors", donorsRouter);
app.use("/hospital", hospitalRouter);
app.use("/blood-banks", bloodBanksRouter);
app.use("/alerts", alertsRouter);
app.use("/dashboard", dashboardRouter);
app.use("/admin", adminRouter);

// An unknown path is still an envelope, so the client's error mapping works the
// same for a typo as for a rule violation.
app.use((_req, res) => {
  res.status(404).json({
    error: { code: "not_found", message: "That endpoint does not exist." },
  });
});

app.use(errorHandler);

async function main(): Promise<void> {
  await connectDb();

  console.log(`[bloodlink] mongo: ${connectionState()} (db "${env.mongoDb}")`);

  app.listen(env.port, () => {
    console.log(`[bloodlink] listening on http://localhost:${env.port}`);
  });
}

main().catch((error: unknown) => {
  console.error("[bloodlink] failed to start:", error);
  process.exit(1);
});
