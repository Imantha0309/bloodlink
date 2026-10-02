/**
 * Single entry point for authentication.
 *
 * The app talks to `authService` and never to a concrete adapter. Setting
 * `EXPO_PUBLIC_API_URL` switches the whole app from the local mock to the real
 * backend with no changes at the call sites.
 */

import { hasRemoteApi } from "@/services/config";

import { HttpAuthService } from "./http-auth-service";
import { MockAuthService } from "./mock-auth-service";
import type { AuthService } from "./types";

export const authService: AuthService = hasRemoteApi ? new HttpAuthService() : new MockAuthService();

export { HttpAuthService } from "./http-auth-service";
export { MockAuthService } from "./mock-auth-service";
export { clearSession, loadSession, saveSession } from "./session";
export {
  AuthError,
  authErrorMessage,
  USER_ROLES,
  type AuthService,
  type AuthSession,
  type AuthUser,
  type SignInInput,
  type UserRole,
} from "./types";