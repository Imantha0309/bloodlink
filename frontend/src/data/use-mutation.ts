/**
 * The write side of the data layer.
 *
 * A mutation's job after it succeeds is to say which queries are no longer
 * true. Naming them here — rather than having each caller remember to refetch
 * by hand — is the whole reason the badge beside the Alerts tab can move the
 * instant "Mark all read" is tapped, instead of on the next mount.
 *
 * Failures resolve to `null` and land in `error` rather than throwing, so a
 * screen can show the message without wrapping every call in a try/catch.
 * Callers that must branch on success check for `null`.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { QueryKey } from "@/data/query-cache";
import { useQueryCache } from "@/data/provider";
import { apiErrorMessage } from "@/services/api/errors";

export type UseMutationOptions<TData, TVariables> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Key families marked stale once the mutation succeeds. */
  invalidate?: QueryKey[];
  onSuccess?: (data: TData, variables: TVariables) => void;
};

export type UseMutationResult<TData, TVariables> = {
  /** Resolves to the result, or `null` when the mutation failed. */
  mutate: (variables: TVariables) => Promise<TData | null>;
  isPending: boolean;
  /** Message fit for a banner, or null. Cleared when a new attempt starts. */
  error: string | null;
  reset: () => void;
};

export function useMutation<TData, TVariables>({
  mutationFn,
  invalidate,
  onSuccess,
}: UseMutationOptions<TData, TVariables>): UseMutationResult<TData, TVariables> {
  const cache = useQueryCache();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Same reason as `useQuery`: the options object is rebuilt every render, so
  // it is read through a ref rather than listed as a dependency.
  const optionsRef = useRef({ mutationFn, invalidate, onSuccess });

  useEffect(() => {
    optionsRef.current = { mutationFn, invalidate, onSuccess };
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      setIsPending(true);
      setError(null);

      try {
        const data = await optionsRef.current.mutationFn(variables);

        for (const key of optionsRef.current.invalidate ?? []) {
          cache.invalidate(key);
        }

        optionsRef.current.onSuccess?.(data, variables);

        return data;
      } catch (caught) {
        setError(apiErrorMessage(caught));

        return null;
      } finally {
        setIsPending(false);
      }
    },
    [cache],
  );

  const reset = useCallback(() => setError(null), []);

  return { mutate, isPending, error, reset };
}
