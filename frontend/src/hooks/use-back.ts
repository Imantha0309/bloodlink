import { useNavigation, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

import { ROUTES } from "@/constants/routes";

/**
 * One back decision, shared by the header arrow, Android's button and the iOS
 * swipe.
 *
 * The three are genuinely different code paths. Only the arrow belongs to the
 * screen — the hardware button and the edge swipe go straight to the navigator,
 * which pops, and with no history behind it leaves the app entirely. Wiring only
 * the arrow left the two disagreeing on the same screen at the same instant:
 * the arrow honoured a fallback route, the hardware button quit.
 *
 * Order of preference, highest first:
 *
 *   1. `onStepBack` — a step *within* this screen. Return `true` if it handled
 *      the press, and nothing is navigated. This is what keeps the emergency
 *      request form's patient details alive on step two.
 *   2. the previous screen, if the stack has one;
 *   3. `fallback`, for a deep link or cold start.
 *
 * ## Why a single hook, and why the ref
 *
 * Two separate `beforeRemove` listeners on one screen fight. Whichever
 * prevented the removal cancelled the other's navigation, and the pass-through
 * flag below got consumed by a pop that was then blocked anyway — leaving back
 * permanently stuck. So one listener makes the whole decision.
 *
 * The flag is also what keeps step 1 from deadlocking. This hook *has* to pop,
 * and it prevented the removal before doing so; the `router.back()` that follows
 * dispatches a fresh action which fires `beforeRemove` again, and that second
 * pass-through is what actually navigates. One extra hop, no loop.
 *
 * `router.replace` never fires `beforeRemove`, so the fallback path leaves the
 * flag clear and cannot strand a later press.
 *
 * `onStepBack` is read through a ref so the listener is not torn down and
 * re-added on every render just because the caller passed an inline closure.
 */
export function useBack(onStepBack: () => boolean, fallback: Href = ROUTES.splash): () => void {
  const router = useRouter();
  const navigation = useNavigation();

  const stepBack = useRef(onStepBack);
  const allowNext = useRef(false);

  useEffect(() => {
    stepBack.current = onStepBack;
  });

  const go = useCallback(() => {
    if (stepBack.current()) {
      return;
    }

    if (router.canGoBack()) {
      allowNext.current = true;
      router.back();
    } else {
      allowNext.current = false;
      router.replace(fallback);
    }
  }, [router, fallback]);

  useEffect(
    () =>
      navigation.addListener("beforeRemove", (event) => {
        if (allowNext.current) {
          allowNext.current = false;
          return;
        }

        event.preventDefault();
        go();
      }),
    [navigation, go],
  );

  return go;
}
