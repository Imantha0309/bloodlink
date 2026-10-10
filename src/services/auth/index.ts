/**
 * Single entry point for authentication.
 *
 * The app talks to `authService` and never to a concrete adapter. All identity
 * comes from Firebase Auth; the Data Connect profile row comes with it.
 */

import { FirebaseAuthService } from "./firebase-auth-service";
import type { AuthService } from "./types";

export const authService: AuthService = new FirebaseAuthService();

export { FirebaseAuthService } from "./firebase-auth-service";
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
  type SelfRegisterRole,
  type SignInInput,
  type SignUpInput,
  type UserRole,
} from "./types";