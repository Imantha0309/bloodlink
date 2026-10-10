/**
 * MongoDB connection.
 *
 * One shared mongoose connection for the whole process; every model registers
 * against it. `connectDb` is awaited before the HTTP server starts listening, so
 * a bad connection string fails at boot rather than on the first request.
 */

import mongoose from "mongoose";

import { env } from "./env";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.mongoUri, {
    dbName: env.mongoDb,
    // The driver default is fine for Atlas; this just keeps a clearer error
    // than a hung socket when a deploy allow-lists nothing.
    serverSelectionTimeoutMS: 15_000,
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}

/** Human-readable connection state, for the startup log. */
export function connectionState(): string {
  switch (mongoose.connection.readyState) {
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
