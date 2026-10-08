/**
 * BloodLink backend entry point.
 *
 * Run with `npm run dev` (watch mode) or `npm start`. Schema creation and
 * pragma setup happen on import of `./db`, so no migration step is needed.
 */

import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";

import { db } from "./db";
import { HOST, PORT } from "./config";
import { ApiError, type ApiErrorBody } from "./lib/errors";
import { alertsRouter } from "./routes/alerts";
import { authRouter } from "./routes/auth";
import { bloodBanksRouter } from "./routes/blood-banks";
import { dashboardRouter } from "./routes/dashboard";
import { donorsRouter } from "./routes/donors";
import { emergencyRouter } from "./routes/emergency";
import { hospitalRouter } from "./routes/hospital";
import { passwordResetRouter } from "./routes/password-reset";

const app = express();

// The app is served from a Metro dev server on a different origin, so CORS has
// to be open. This server is meant for local development only.
app.use(cors());

// Caps request bodies — nothing this API accepts is larger than a few hundred
// bytes, so anything bigger is a mistake or an attack.
app.use(express.json({ limit: "100kb" }));

/** One line per request, so a failing call is visible while developing. */
app.use((request: Request, response: Response, next: NextFunction) => {
  const startedAt = Date.now();

  response.on("finish", () => {
    const ms = Date.now() - startedAt;
    console.log(`${request.method} ${request.originalUrl} -> ${response.statusCode} (${ms}ms)`);
  });

  next();
});

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.use("/auth", authRouter);
app.use("/auth", passwordResetRouter);
app.use("/donors", donorsRouter);
app.use("/emergency-requests", emergencyRouter);
app.use("/dashboard", dashboardRouter);
app.use("/blood-banks", bloodBanksRouter);
app.use("/hospital", hospitalRouter);
app.use("/alerts", alertsRouter);

// Unmatched route — must come after every router.
app.use((_request, response) => {
  const body: ApiErrorBody = {
    error: { code: "not_found", message: "That endpoint does not exist." },
  };

  response.status(404).json(body);
});

/**
 * Terminal error handler. Express identifies it by its four parameters, so
 * `next` cannot be dropped even though it is unused.
 */
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  if (error instanceof ApiError) {
    const body: ApiErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.fields ? { fields: error.fields } : {}),
      },
    };

    response.status(error.status).json(body);
    return;
  }

  // Anything unexpected is logged in full but reported generically, so
  // internals never reach the client.
  console.error("Unhandled error:", error);

  const body: ApiErrorBody = {
    error: { code: "unknown", message: "Something went wrong. Please try again." },
  };

  response.status(500).json(body);
});

const server = app.listen(PORT, HOST, () => {
  console.log("");
  console.log(`  BloodLink API listening on http://localhost:${PORT}`);
  console.log(`  Android emulator reaches it at http://10.0.2.2:${PORT}`);
  console.log(`  Health check: http://localhost:${PORT}/health`);
  console.log("");
});

function shutdown(signal: string): void {
  console.log(`\n${signal} received — shutting down.`);

  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});
