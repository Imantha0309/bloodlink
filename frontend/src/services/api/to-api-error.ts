/**
 * Normalises anything a service call can throw into an `ApiError`.
 *
 * The HTTP client already rejects with `ApiError`, so in practice this is a
 * pass-through. It stays because a service body can also fail on its own terms —
 * a selector that finds the payload malformed, JSON that will not parse — and
 * those must reach the screen as the same type rather than as a raw `TypeError`.
 *
 * Replaces the old `services/dataconnect/errors.ts`, which did the same job for
 * the Firebase SDK's error codes.
 */

import { ApiError } from "@/services/api/errors";

export function toApiError(error: unknown, fallbackMessage?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError("unknown", fallbackMessage);
}
