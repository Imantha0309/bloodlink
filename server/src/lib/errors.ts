/**
 * Machine-readable API failures.
 *
 * The codes deliberately match the app's `ApiErrorCode` so the client can map a
 * failure onto user-facing copy without parsing messages.
 */

export type ApiErrorCode =
  | "invalid_credentials"
  | "account_locked"
  | "validation"
  | "not_found"
  | "conflict"
  | "unauthorized"
  | "unknown";

/** Codes carrying a non-200 default status. */
const DEFAULT_STATUS: Record<ApiErrorCode, number> = {
  invalid_credentials: 401,
  account_locked: 423,
  validation: 400,
  not_found: 404,
  conflict: 409,
  unauthorized: 401,
  unknown: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  /** Per-field messages for `validation`, surfaced under the right input. */
  readonly fields?: Record<string, string>;

  constructor(
    code: ApiErrorCode,
    message?: string,
    options: { status?: number; fields?: Record<string, string> } = {},
  ) {
    super(message ?? code);
    this.name = "ApiError";
    this.code = code;
    this.status = options.status ?? DEFAULT_STATUS[code];
    this.fields = options.fields;
  }
}

/** Shape every failure response takes. */
export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fields?: Record<string, string>;
  };
};
