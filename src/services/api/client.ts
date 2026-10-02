/**
 * The app's single HTTP entry point.
 *
 * Every service goes through `request()`, so timeout handling, bearer-token
 * attachment and error mapping exist in exactly one place. It replaces the
 * copy of this logic that used to live inside `http-auth-service.ts`.
 *
 * Requests are authenticated automatically: if a session is stored, its token
 * is attached. Public endpoints (sign-in, register, password reset) pass
 * `anonymous: true` so a stale token is not sent.
 */

import { loadSession } from "@/services/auth/session";
import { API_BASE_URL } from "@/services/config";

import { ApiError, isApiErrorCode } from "./errors";

const REQUEST_TIMEOUT_MS = 15000;

export type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Serialised as JSON. Omit for a bodiless request. */
  body?: unknown;
  /** Skip bearer-token attachment, for endpoints reachable while signed out. */
  anonymous?: boolean;
};

/** Narrows an unknown JSON body to something we can safely read fields off. */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

/** Reads the server's `{error: {code, message, fields}}` envelope. */
function readErrorBody(body: unknown): {
  code: unknown;
  message: string | undefined;
  fields: Record<string, string> | undefined;
} {
  const error = asRecord(asRecord(body).error);
  const rawFields = asRecord(error.fields);

  const fields: Record<string, string> = {};

  for (const [key, value] of Object.entries(rawFields)) {
    if (typeof value === "string") {
      fields[key] = value;
    }
  }

  return {
    code: error.code,
    message: typeof error.message === "string" ? error.message : undefined,
    fields: Object.keys(fields).length > 0 ? fields : undefined,
  };
}

/**
 * Translates a non-2xx response into an `ApiError`.
 *
 * The server's own `code` is trusted when present. The status-code fallback
 * exists so an older or third-party server still produces a sane error.
 */
function toApiError(status: number, body: unknown): ApiError {
  const { code, message, fields } = readErrorBody(body);

  if (isApiErrorCode(code)) {
    return new ApiError(code, message, fields);
  }

  if (status === 401 || status === 403) {
    return new ApiError("unauthorized", message);
  }

  if (status === 423) {
    return new ApiError("account_locked", message);
  }

  if (status === 400 || status === 422) {
    return new ApiError("validation", message, fields);
  }

  if (status === 404) {
    return new ApiError("not_found", message);
  }

  if (status === 409) {
    return new ApiError("conflict", message);
  }

  return new ApiError("unknown", message);
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = API_BASE_URL;

  if (base === null) {
    throw new ApiError("unknown", "EXPO_PUBLIC_API_URL is not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (options.anonymous !== true) {
    const session = await loadSession();

    if (session !== null) {
      headers.Authorization = `Bearer ${session.token}`;
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${base}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    // Offline, DNS failure, or timeout — all surfaced as a connectivity
    // problem rather than a credential problem.
    throw new ApiError("network");
  } finally {
    clearTimeout(timer);
  }

  // 204 No Content carries no body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw toApiError(response.status, body);
  }

  return asRecord(body) as T;
}
