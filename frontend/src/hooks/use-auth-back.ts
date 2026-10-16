import { useRouter, type Href } from "expo-router";
import { useCallback } from "react";

import { ROUTES } from "@/constants/routes";

/**
 * Back handler that always lands somewhere.
 *
 * `router.back()` is a no-op when a screen was opened directly (deep link or
 * cold start), which would leave the user stuck. Falls back to the splash so
 * there is always a way out.
 *
 * Header-only. This wires the arrow and nothing else, so on a screen the
 * hardware back button and the iOS swipe still pop without the fallback — use
 * `useBack` from `@/hooks/use-back` where the two have to agree, which is
 * anywhere the screen is reachable cold or by deep link.
 */
export function useAuthBack(fallback: Href = ROUTES.splash) {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback);
    }
  }, [router, fallback]);
}
