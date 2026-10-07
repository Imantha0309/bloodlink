/**
 * Runtime service configuration.
 *
 * `EXPO_PUBLIC_*` values are inlined by Metro at build time, so the base URL
 * must be declared in the environment (e.g. `.env`) rather than hard-coded.
 * When it is absent the app stays on the local mock adapter.
 */

import Constants from "expo-constants";

/** Hosts that only resolve on the machine running the dev server. */
const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "10.0.2.2", "10.0.3.2"]);

const configuredUrl = process.env.EXPO_PUBLIC_API_URL ?? null;

/** The hostname of an `http(s)://host[:port][/path]` URL, or `null`. */
function readHost(url: string): string | null {
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/:?#]+)/i.exec(url);

  return match ? match[1] : null;
}

function withHost(url: string, host: string): string {
  return url.replace(/^([a-z][a-z0-9+.-]*:\/\/)[^/:?#]+/i, `$1${host}`);
}

/** e.g. `172.20.10.3:8081` — where the running app reached Metro. */
function devServerHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;

  if (typeof hostUri !== "string" || hostUri.length === 0) {
    return null;
  }

  const host = hostUri.split(":")[0];

  return host.length > 0 ? host : null;
}

/**
 * A loopback-only host (`localhost`, the emulator's `10.0.2.2`, …) cannot be
 * reached from a physical device, so it is rewritten to the address the device
 * actually used to load the app. Explicit network hosts are left as configured.
 */
function resolveApiBaseUrl(): string | null {
  if (configuredUrl === null || configuredUrl.trim() === "") {
    return null;
  }

  const configuredHost = readHost(configuredUrl);
  const host = devServerHost();

  if (configuredHost !== null && host !== null && LOOPBACK_HOSTS.has(configuredHost)) {
    return withHost(configuredUrl, host);
  }

  return configuredUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** True once a backend base URL has been configured. */
export const hasRemoteApi = API_BASE_URL !== null && API_BASE_URL.length > 0;