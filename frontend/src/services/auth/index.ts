/**
 * Single entry point for authentication.
 *
 * The app talks to `authService` and never to a concrete adapter. Identity and
 * profile both live behind the BloodLink API; the adapter below is the only
 * thing that knows how they are fetched.
 */

import { HttpAuthService } from "./http-auth-service";
import type { AuthService } from "./types";

export const authService: AuthService = new HttpAuthService();

export { HttpAuthService } from "./http-auth-service";
export { DEMO_ACCOUNTS } from "./demo-accounts";
export { clearSession, loadSession, saveSession } from "./session";

/** Failure type and its user-facing copy. */
export { ApiError, apiErrorMessage } from "@/services/api/errors";

export {
  USER_ROLES,
  type AuthService,
  type AuthSession,
  type AuthUser,
  type DonorProfileInput,
  type UpdateProfileInput,
  type SelfRegisterRole,
  type SignInInput,
  type SignUpInput,
  type UserRole,
} from "./types";
