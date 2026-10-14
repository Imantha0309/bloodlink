/**
 * The machine-readable failure codes the API returns.
 *
 * This union is deliberately identical to the app's `ApiErrorCode` in
 * `frontend/src/services/api/errors.ts`. The client maps a response onto an
 * `ApiError` carrying this code, and `apiErrorMessage` is the only place the
 * code becomes user-facing copy — so adding a code here means deciding what the
 * user reads in the app.
 *
 * There is no `forbidden`: a role the caller does not hold is reported as
 * `conflict` with a human-written message, which is how the SQL guards behaved
 * and what the screens are already written to display.
 */
export type ApiErrorCode =
  | "invalid_credentials"
  | "network"
  | "account_locked"
  | "validation"
  | "not_found"
  | "conflict"
  | "unauthorized"
  | "unknown";

/** HTTP status for each code, for the handful of places that need a default. */
export const STATUS_FOR_CODE: Record<ApiErrorCode, number> = {
  invalid_credentials: 401,
  network: 503,
  account_locked: 423,
  validation: 422,
  not_found: 404,
  conflict: 409,
  unauthorized: 401,
  unknown: 500,
};
