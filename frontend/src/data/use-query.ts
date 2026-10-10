/**
 * The read side of the data layer.
 *
 * Shaped to drop into `AsyncState`: it returns exactly the `isLoading` /
 * `error` / `refetch` triple those screens already pass down, so migrating a
 * screen means deleting its `useEffect` and `useState` rather than rewriting
 * its JSX.
 *
 * Two things it does that a hand-rolled effect did not:
 *   - a second screen asking for the same key reuses the first screen's data
 *     instead of issuing a second request;
 *   - a key that something else invalidated refetches, so a screen that is
 *     already open is not stuck on the values it read when it opened.
 */

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { DEFAULT_STALE_TIME, type QueryKey, type QuerySnapshot } from "@/data/query-cache";
import { useQueryCache } from "@/data/provider";
import { apiErrorMessage } from "@/services/api/errors";

export type UseQueryOptions<T> = {
  key: QueryKey;
  queryFn: () => Promise<T>;
  /** Hold the fetch back until the screen has what the query needs. */
  enabled?: boolean;
  staleTime?: number;
};

export type UseQueryResult<T> = {
  data: T | undefined;
  /** Message fit for `AsyncState`, or null. Only set when nothing is cached. */
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refetch: () => Promise<void>;
};

export function useQuery<T>({
  key,
  queryFn,
  enabled = true,
  staleTime = DEFAULT_STALE_TIME,
}: UseQueryOptions<T>): UseQueryResult<T> {
  const cache = useQueryCache();

  // `key` is a new array every render, so it cannot be a dependency. Its
  // serialized form is stable for equal keys, and parsing that back yields an
  // array with a stable identity — which is what the store and the effect
  // below actually need.
  const keyString = JSON.stringify(key);
  const stableKey = useMemo<QueryKey>(() => JSON.parse(keyString) as QueryKey, [keyString]);

  // Hold the newest closure without making it a dependency: a screen that
  // passes an inline arrow must not refetch on every render.
  const queryFnRef = useRef(queryFn);

  useEffect(() => {
    queryFnRef.current = queryFn;
  });

  const subscribe = useCallback(
    (listener: () => void) => cache.subscribe(stableKey, listener),
    [cache, stableKey],
  );

  const getSnapshot = useCallback(() => cache.peek<T>(stableKey), [cache, stableKey]);

  const snapshot: QuerySnapshot<T> = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  // Stale means both "never loaded" and "explicitly invalidated": the store
  // sets `updatedAt` to null in each case, and only a successful load or a
  // `write` clears it again.
  const isStale = snapshot.updatedAt === null;

  useEffect(() => {
    if (!enabled || !isStale) {
      return;
    }

    // Not forced: on a stale key this fetches, and on a *failed* key the
    // dependencies do not change — so a dead server cannot spin here.
    void cache.read(stableKey, () => queryFnRef.current(), { staleTime });
  }, [cache, stableKey, enabled, isStale, staleTime]);

  const refetch = useCallback(
    () => cache.read(stableKey, () => queryFnRef.current(), { force: true }),
    [cache, stableKey],
  );

  const data = snapshot.data;

  return {
    data,
    // A failed *refresh* leaves the cached data on screen, so it is not an
    // error state. Only a first load with nothing behind it is.
    error:
      data === undefined && snapshot.status === "error" ? apiErrorMessage(snapshot.error) : null,
    isLoading: data === undefined && snapshot.status !== "error",
    isRefreshing: snapshot.isFetching && data !== undefined,
    refetch,
  };
}
