/**
 * One `QueryCache` per app, plus the two bits of cache hygiene that have to be
 * global rather than per-screen:
 *
 *   - **Refetch on focus.** A phone that spent an hour in a pocket comes back
 *     to a foregrounded app; without this it would keep rendering the numbers
 *     it read before it went to sleep.
 *   - **Reset per account.** The cache belongs to a signed-in account, not to
 *     the install. Signing out and back in as somebody else must never be able
 *     to render the previous account's alerts out of memory.
 *
 * Must be mounted *inside* `AuthProvider` — it reads the session to know when
 * the account changed.
 */

import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";

import { QueryCache } from "@/data/query-cache";
import { useAuth } from "@/providers/auth-provider";

const QueryCacheContext = createContext<QueryCache | null>(null);

export function QueryCacheProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(() => new QueryCache());
  const { session } = useAuth();

  // `id` rather than the session object: a token refresh produces a new session
  // for the same account, and that must not wipe the cache.
  const accountId = session?.user.id ?? null;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        // Stale, not empty: every mounted query refetches on top of its data.
        cache.invalidate();
      }
    });

    return () => subscription.remove();
  }, [cache]);

  useEffect(() => {
    cache.clear();
  }, [cache, accountId]);

  return <QueryCacheContext value={cache}>{children}</QueryCacheContext>;
}

/**
 * Throws when used outside the provider. A missing provider is a wiring bug —
 * the alternative, silently handing back a throwaway cache, would show up as
 * data that never updates, which is the exact symptom this layer exists to
 * remove.
 */
export function useQueryCache(): QueryCache {
  const cache = use(QueryCacheContext);

  if (cache === null) {
    throw new Error("useQueryCache must be used within a QueryCacheProvider");
  }

  return cache;
}
