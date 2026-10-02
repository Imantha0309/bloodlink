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
export { MockAuthService, MOCK_CREDENTIAL_HINT, MOCK_RESET_CODE } from "./mock-auth-service";
export { clearSession, loadSession, saveSession } from "./session";

/** Failure type and its user-facing copy. */
export { ApiError, apiErrorMessage } from "@/services/api/errors";

/** Whether a backend is configured; drives the dev-only hints in the UI. */
export { hasRemoteApi } from "@/services/config";

export {
  USER_ROLES,
  type AuthService,
  type AuthSession,
  type AuthUser,
  type PasswordResetChallenge,
  type SelfRegisterRole,
  type SignInInput,
  type SignUpInput,
  type UserRole,
} from "./types";
