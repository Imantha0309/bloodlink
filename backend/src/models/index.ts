/**
 * Model barrel.
 *
 * Importing this module registers every schema with mongoose, which is what
 * `syncIndexes` in the seed script needs — an index is only created for a model
 * that has actually been loaded.
 */

export { Alert } from "./alert";
export { BloodBank } from "./blood-bank";
export { BloodInventory } from "./blood-inventory";
export { DiscrepancyReport } from "./discrepancy-report";
export { DonorAvailability } from "./donor-availability";
export { DonorRequestResponse } from "./donor-request-response";
export { DonorScreening } from "./donor-screening";
export { EmergencyRequest } from "./emergency-request";
export { ExtractionSession } from "./extraction-session";
export { PasswordReset } from "./password-reset";
export { Session } from "./session";
export { ShiftHandover } from "./shift-handover";
export { User } from "./user";

export * from "./shared";

import mongoose from "mongoose";

/** Every registered model, in a stable order. */
export const ALL_MODELS = Object.values(mongoose.models);

/**
 * Creates the indexes declared in the schemas.
 *
 * Called by the seed script rather than on boot: building indexes implicitly at
 * startup is how a production database acquires an unplanned index build.
 */
export async function syncIndexes(): Promise<string[]> {
  const created: string[] = [];

  for (const registered of ALL_MODELS) {
    try {
      await registered.syncIndexes();
      created.push(registered.modelName);
    } catch (error) {
      console.error(`[bloodlink] index sync failed for ${registered.modelName}:`, error);
    }
  }

  return created;
}
