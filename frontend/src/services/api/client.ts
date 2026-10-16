/**
 * The HTTP transport.
 *
 * One `fetch` wrapper that every service module goes through. It exists so the
 * rest of the app never sees a status code: a failure is always an `ApiError`
 * carrying the same code union the screens were already built around, and a
 * success is always the parsed JSON body.
 *
 * The token is held in memory and mirrored into AsyncStorage by the auth
 * service. Reading storage on every request would work, but the polling hooks
 * hit this dozens of times a minute and the token only changes at sign-in and
 * sign-out.
 */

import Constants from "expo-constants";

import { ApiError, isApiErrorCode, type ApiErrorCode } from "@/services/api/errors";
import { loadSession } from "@/services/auth/session";

/** The port the API listens on. Only the host is ever swapped. */
const API_PORT = 4000;

/**
 * Where the API lives.
 *
 * `EXPO_PUBLIC_API_URL` wins whenever it is set — that is what `.env` is for,
 * and what a real build should use. With it unset, the host that served this
 * bundle is reused with the API's port rather than falling back to `localhost`:
 * on a phone `localhost` is the phone, and on an emulator it is the emulator, so
 * the hard-coded value can never reach the machine the API runs on. Metro
 * already knows the right address — it is how the bundle got to the device — so
 * it is the one thing that is correct on every platform.
 *
 * Metro inlines `EXPO_PUBLIC_*` at build time, so the lookup below must stay a
 * literal member expression, and changing the value needs a cleared cache.
 */
function resolveBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configured !== undefined && configured.length > 0) {
    return configured.replace(/\/+$/, "");
  }

  const hostUri = Constants.expoConfig?.hostUri;

  if (typeof hostUri === "string" && hostUri.length > 0) {
    // "192.168.1.42:8082" -> "192.168.1.42". A host with no port is kept whole,
    // and an IPv6 literal keeps its brackets because only the last colon splits.
    const separator = hostUri.lastIndexOf(":");
    const host = separator > 0 ? hostUri.slice(0, separator) : hostUri;

    if (host.length > 0) {
      return `http://${host}:${API_PORT}`;
    }
  }

  return `http://localhost:${API_PORT}`;
}

const BASE_URL = resolveBaseUrl();

/** Resolves an avatar path (relative or absolute) to a full URL. */
export function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("data:")) {
    return path;
  }
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type QueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  method?: Method;
  body?: unknown;
  query?: Record<string, QueryValue>;
  /** Set false for the endpoints reachable while signed out. */
  auth?: boolean;
  signal?: AbortSignal;
};

/* -------------------------------------------------------------------- token */

/** `undefined` means "not read from storage yet"; `null` means "signed out". */
let cachedToken: string | null | undefined;

/**
 * Keeps the in-memory token in step with the session.
 *
 * Called by the auth adapter on sign-in, restore and sign-out. Without this the
 * first request after a cold start would still read storage, which is correct
 * but slower.
 */
export function setAuthToken(token: string | null): void {
  cachedToken = token;
}

async function authToken(): Promise<string | null> {
  if (cachedToken === undefined) {
    cachedToken = (await loadSession())?.token ?? null;
  }

  return cachedToken;
}

/* ------------------------------------------------------------------ request */

/** Fallback mapping for a failure that carried no usable envelope. */
function codeFromStatus(status: number): ApiErrorCode {
  switch (status) {
    case 401:
      return "unauthorized";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 422:
      return "validation";
    case 423:
      return "account_locked";
    default:
      // Anything else — including a bodyless 5xx — is reported as unknown rather
      // than guessed at.
      return "unknown";
  }
}

type Envelope = {
  error?: { code?: unknown; message?: unknown; fields?: unknown };
};

/** Turns per-field copy from the server into the map `ApiError` carries. */
function readFields(value: unknown): Record<string, string> | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const fields: Record<string, string> = {};

  for (const [key, message] of Object.entries(value)) {
    if (typeof message === "string" && message.length > 0) {
      fields[key] = message;
    }
  }

  return Object.keys(fields).length > 0 ? fields : undefined;
}

/** Reads the server's error envelope, falling back to the status code. */
async function readError(response: Response): Promise<ApiError> {
  let envelope: Envelope | null = null;

  try {
    envelope = (await response.json()) as Envelope;
  } catch {
    // A proxy or a crash can return HTML where JSON was expected. The status
    // code is then the only signal there is, which is why it has a fallback.
    envelope = null;
  }

  const error = envelope?.error;
  const code = isApiErrorCode(error?.code) ? error.code : codeFromStatus(response.status);
  const message = typeof error?.message === "string" && error.message.length > 0 ? error.message : undefined;

  return new ApiError(code, message, readFields(error?.fields));
}

function buildUrl(path: string, query: Record<string, QueryValue> | undefined): string {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  if (query === undefined) {
    return url;
  }

  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined) {
      search.append(key, String(value));
    }
  }

  const suffix = search.toString();

  return suffix.length > 0 ? `${url}?${suffix}` : url;
}

/**
 * Sends a request and returns the parsed body.
 *
 * Resolves with `undefined` when the server answered with no content — which is
 * what the delete endpoints do, and what `Promise<void>` callers expect.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = await authToken();

    if (token !== null) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal === undefined ? {} : { signal }),
    });
  } catch (error) {
    // A rejected `fetch` is a transport failure — no server ever saw this. An
    // aborted request is the caller's own doing and is rethrown as-is so it
    // cannot be mistaken for an outage.
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    throw new ApiError("network");
  }

  if (!response.ok) {
    throw await readError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();

  if (text.length === 0) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("unknown", "The server returned a response the app could not read.");
  }
}

/**
 * Uploads a multipart FormData payload (e.g. avatar image) to the API.
 */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await authToken();

  if (token !== null) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(buildUrl(path, undefined), {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    throw new ApiError("network");
  }

  if (!response.ok) {
    throw await readError(response);
  }

  const text = await response.text();

  if (text.length === 0) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError("unknown", "The server returned a response the app could not read.");
  }
}
