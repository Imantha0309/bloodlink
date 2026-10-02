/**
 * API failure types.
 *
 * `ApiError` is the single error type every service in the app throws. It
 * started life as the auth-only `AuthError`; it is now shared so the request,
 * donor and dashboard services can surface failures the same way.
 *
 * Codes are machine-readable. `apiErrorMessage` is the only place they turn
 * into copy, so technical detail never reaches the user.
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

const API_ERROR_CODES: readonly string[] = [
  "invalid_credentials",
  "network",
  "account_locked",
  "validation",
  "not_found",
  "conflict",
  "unauthorized",
  "unknown",
];

export function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && API_ERROR_CODES.includes(value);
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;

  /**
   * Per-field messages from the server, keyed by field name. Present on
   * `validation` failures so a form can mark the offending inputs rather than
   * only showing a banner.
   */
  readonly fields?: Record<string, string>;

  constructor(code: ApiErrorCode, message?: string, fields?: Record<string, string>) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.fields = fields;
  }
}

/**
 * Maps a failure onto the copy the user should read. Anything unrecognised
 * falls back to a generic message rather than leaking internals.
 */
export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.code) {
      case "invalid_credentials":
        return "Incorrect email or password.";
      case "network":
        return "Unable to connect. Please try again.";
      case "account_locked":
        return "This account is temporarily locked. Please try again later.";
      case "validation":
        // The server's validation copy is written for humans, so it is safe to
        // show directly.
        return error.message;
      case "not_found":
        return error.message;
      case "conflict":
        return error.message;
      case "unauthorized":
        return "Your session has expired. Please sign in again.";
      case "unknown":
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return "Unable to connect. Please try again.";
}
