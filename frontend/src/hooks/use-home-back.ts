import { useAuth } from "@/providers/auth-provider";

import { useBack } from "./use-back";
import { ROLE_HOME } from "@/constants/routes";

/**
 * Back always means the signed-in user's own dashboard.
 *
 * Eleven screens used to pass a hand-picked fallback route to `useAuthBack`, and
 * they did not agree. Four hospital screens fell back to the *hospital profile*
 * rather than home; `alerts` fell back to `/dashboard/alerts`, which is the
 * screen it is already on, so the button did nothing; and `compatibility` fell
 * back to `DASHBOARD_TABS.home`, which is the *recipient* dashboard, so a donor
 * or a hospital user tapping back landed on someone else's.
 *
 * Deriving the destination here rather than at each call site is the point: a
 * screen cannot pick the wrong one, because it no longer picks. Adding the role
 * home as the only argument makes "where does back go" a single decision
 * instead of eleven.
 *
 * It builds on `useBack` rather than `useAuthBack`, so the Android button and
 * the iOS swipe go to the same place as the header arrow. Those eleven were all
 * header-only, which is why their fallback worked when you tapped the arrow and
 * did nothing when you pressed the hardware button.
 *
 * For the signed-out screens — login, role-select, register, forgot-password —
 * there is no dashboard to go back to, so those keep passing an auth route to
 * `useBack` directly.
 */
export function useHomeBack(): () => void {
  const { session } = useAuth();

  return useBack(() => false, ROLE_HOME[session?.user.role ?? "recipient"]);
}
