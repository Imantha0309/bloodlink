/**
 * Maps Data Connect errors onto the app's `ApiError` contract.
 *
 * Every SDK call funnels through here so screens keep working with
 * `apiErrorMessage` unchanged. `@check` guards surface as `conflict` while their
 * (already human-worded) message copy is preserved.
 */

import { DataConnectError } from "firebase/data-connect";

import { ApiError, type ApiErrorCode } from "@/services/api/errors";

const DATA_CONNECT_TO_APP_CODE: Partial<Record<string, ApiErrorCode>> = {
  "invalid-argument": "validation",
  "out-of-range": "validation",
  unauthorized: "unauthorized",
  "permission-denied": "unauthorized",
  "not-found": "not_found",
  "already-exists": "conflict",
  "failed-precondition": "conflict",
  aborted: "conflict",
  "resource-exhausted": "conflict",
  unavailable: "network",
  "deadline-exceeded": "network",
  cancelled: "network",
  "not-initialized": "network",
  "already-initialized": "network",
  internal: "unknown",
  "data-loss": "unknown",
  "not-supported": "unknown",
  "partial-error": "unknown",
  other: "unknown",
  unknown: "unknown",
};

/** Whether the error message carries real copy rather than boilerplate. */
function hasMessage(message: string): boolean {
  return message.length > 0;
}

/**
 * Converts anything thrown by a Data Connect call into an `ApiError`. Firebase
 * Auth errors are already mapped to `ApiError` by the auth service before they
 * reach here, so an `ApiError` coming in passes straight through.
 */
export function toApiError(error: unknown, fallbackMessage?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof DataConnectError) {
    const code = DATA_CONNECT_TO_APP_CODE[error.code] ?? "unknown";
    return hasMessage(error.message) ? new ApiError(code, error.message) : new ApiError(code);
  }

  return new ApiError("unknown", fallbackMessage);
}