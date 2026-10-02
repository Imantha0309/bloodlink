/**
 * Runtime service configuration.
 *
 * `EXPO_PUBLIC_*` values are inlined by Metro at build time, so the base URL
 * must be declared in the environment (e.g. `.env`) rather than hard-coded.
 * When it is absent the app stays on the local mock adapter.
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? null;

/** True once a backend base URL has been configured. */
export const hasRemoteApi = API_BASE_URL !== null && API_BASE_URL.length > 0;