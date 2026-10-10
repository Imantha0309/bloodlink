/**
 * Live-ish reads, polled on a focused screen.
 *
 * This replaces `useLiveQuery`. A Data Connect subscription was a push channel;
 * React Native has no built-in `EventSource` and the API has no websocket, so
 * the same effect is produced by asking again on a timer — but only while the
 * screen is actually in front of the user. A backgrounded screen polls nothing.
 *
 * App foreground is deliberately *not* handled here. `QueryCacheProvider`
 * already invalidates the whole cache when the app returns to the foreground,
 * which refetches every mounted query — including this one — on top of its
 * cached data. Duplicating it here would just double the first request.
 *
 * Reads the same cache key a plain `useQuery` would, so a polling screen and a
 * non-polling one watching the same data cannot disagree.
 */

import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";

import { useQuery, type UseQueryOptions, type UseQueryResult } from "@/data/use-query";

/** Slow enough not to hammer the API, fast enough to feel live. */
const DEFAULT_INTERVAL_MS = 15_000;

export type UsePollingQueryOptions<T> = UseQueryOptions<T> & {
  /** How often to ask again while focused. */
  intervalMs?: number;
};

export function usePollingQuery<T>({
  intervalMs = DEFAULT_INTERVAL_MS,
  ...options
}: UsePollingQueryOptions<T>): UseQueryResult<T> {
  const query = useQuery(options);

  // The timer must not be torn down and rebuilt whenever a refetch changes the
  // identity of `refetch`, so it reads the newest one off a ref instead.
  const refetch = useRef(query.refetch);

  useEffect(() => {
    refetch.current = query.refetch;
  });

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        // A screen can be focused while the app itself is in the background —
        // on iOS the focus effect is not unmounted when the app is suspended.
        // Polling then would be pure waste.
        if (AppState.currentState === "active") {
          void refetch.current();
        }
      }, intervalMs);

      return () => clearInterval(interval);
    }, [intervalMs]),
  );

  return query;
}
