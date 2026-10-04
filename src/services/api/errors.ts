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

/** Copy for a failure we have no specific wording for. */
const GENERIC_FAILURE = "Something went wrong. Please try again.";

/**
 * The server's own message, when it actually supplied one.
 *
 * `ApiError` falls back to its own code when `message` is omitted, so reading
 * `error.message` directly can surface the bare word `"validation"` to the user.
 * A message identical to the code carries no wording, so it is discarded.
 */
function serverMessage(error: ApiError): string {
  return error.message.length > 0 && error.message !== error.code
    ? error.message
    : GENERIC_FAILURE;
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
        return serverMessage(error);
      case "not_found":
        return serverMessage(error);
      case "conflict":
        return serverMessage(error);
      case "unauthorized":
        return "Your session has expired. Please sign in again.";
      case "unknown":
      default:
        return serverMessage(error);
    }
  }

  // `client.ts` funnels every transport failure into `ApiError("network")`, so
  // reaching here means something unexpected failed inside the app itself —
  // storage, or serialising the request body. Reporting that as a connectivity
  // problem would point the reader at the network instead of the real fault.
  return GENERIC_FAILURE;
}
