/**
 * A small, dependency-free query cache.
 *
 * Every screen in this app used to fetch on its own: a `useEffect` that ran
 * once, wrote into `useState`, and never heard about that data again. Three
 * costs came with that:
 *
 *   1. the same query is issued once per screen that needs it, even when two
 *      screens are mounted at the same time;
 *   2. a screen already on the stack never learns the data changed underneath
 *      it — `useUnreadAlerts` is the clearest case, where the badge was read
 *      once on mount and never moved again;
 *   3. a mutation leaves every *other* screen rendering the values it read a
 *      minute ago.
 *
 * This module is the store that fixes all three. It holds no React import on
 * purpose: `src/data/use-query.ts` is its only consumer, so the cache stays
 * readable — and testable — without a renderer.
 *
 * Two behaviours callers depend on:
 *
 *   - `peek()` returns the *same object* for a key until the data actually
 *     changes. `useSyncExternalStore` compares snapshots by identity, so
 *     building a fresh object per read would re-render forever.
 *   - `invalidate()` never discards data, it only marks it stale. A mounted
 *     screen refetches; an unmounted one refetches when it next mounts; and
 *     neither blanks out to a spinner in the meantime.
 */

/** A structured cache key, e.g. `["donors", "directory", "A+", null]`. */
export type QueryKey = readonly unknown[];

export type QueryStatus = "idle" | "loading" | "success" | "error";

/**
 * What a subscriber observes. `data` survives a failed refetch on purpose, so
 * a dropped connection degrades to "slightly old data" rather than an error
 * screen where a populated list used to be.
 */
export type QuerySnapshot<T> = {
  status: QueryStatus;
  data: T | undefined;
  error: unknown;
  /** A request is in flight — including one running on top of existing data. */
  isFetching: boolean;
  /** When `data` was last written. `null` means "stale". */
  updatedAt: number | null;
};

type Entry = {
  key: QueryKey;
  snapshot: QuerySnapshot<unknown>;
  listeners: Set<() => void>;
  inFlight: Promise<void> | null;
};

/**
 * Shared empty snapshot. One frozen object rather than a new one per read,
 * because `peek` must be identity-stable for keys that have no entry yet.
 */
const EMPTY: QuerySnapshot<unknown> = {
  status: "idle",
  data: undefined,
  error: null,
  isFetching: false,
  updatedAt: null,
};

/**
 * How long cached data is reused before a mounting screen refetches it.
 *
 * Short enough that switching tabs shows current numbers, long enough that
 * bouncing between two screens does not cost a request per navigation.
 */
export const DEFAULT_STALE_TIME = 30_000;

function serializeKey(key: QueryKey): string {
  return JSON.stringify(key);
}

/** True when `key` starts with every element of `prefix`. */
function hasPrefix(key: QueryKey, prefix: QueryKey): boolean {
  if (prefix.length > key.length) {
    return false;
  }

  return prefix.every((part, index) => Object.is(part, key[index]));
}

export class QueryCache {
  private readonly entries = new Map<string, Entry>();

  /** Reads the snapshot for a key. Safe to call during render. */
  peek<T>(key: QueryKey): QuerySnapshot<T> {
    const entry = this.entries.get(serializeKey(key));

    return (entry?.snapshot ?? EMPTY) as QuerySnapshot<T>;
  }

  /** Calls `listener` whenever this key's snapshot is replaced. */
  subscribe(key: QueryKey, listener: () => void): () => void {
    const entry = this.own(key);

    entry.listeners.add(listener);

    return () => {
      entry.listeners.delete(listener);
    };
  }

  /**
   * Loads a key, sharing one request between concurrent callers.
   *
   * Resolves when the request settles, so a caller can `await` a read it
   * triggered. A key that is already fresh is left untouched unless `force` is
   * set — which is what makes remounting a screen cheap.
   */
  read<T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: { staleTime?: number; force?: boolean },
  ): Promise<void> {
    const entry = this.own(key);

    if (options?.force !== true && this.isFresh(entry, options?.staleTime)) {
      return Promise.resolve();
    }

    if (entry.inFlight !== null) {
      return entry.inFlight;
    }

    const request = this.load(entry, fetcher);

    entry.inFlight = request;

    return request;
  }

  /**
   * Writes a value without asking the server — an optimistic edit, or a
   * realtime push. The result counts as fresh, so it also silences a pending
   * read rather than being immediately overwritten by one.
   */
  write<T>(key: QueryKey, update: (current: T | undefined) => T): void {
    const entry = this.own(key);

    this.publish(entry, (current) => ({
      status: "success",
      data: update(current.data as T | undefined),
      error: null,
      isFetching: current.isFetching,
      updatedAt: Date.now(),
    }));
  }

  /**
   * Marks entries stale. With no argument, everything.
   *
   * This is what a mutation calls once it has changed something: it names the
   * families of queries that are no longer true. Data is kept, so the refetch
   * that follows lands on top of the old values instead of a skeleton.
   */
  invalidate(prefix?: QueryKey): void {
    for (const entry of this.entries.values()) {
      if (prefix !== undefined && !hasPrefix(entry.key, prefix)) {
        continue;
      }

      this.publish(entry, (current) => ({
        ...current,
        status: current.data === undefined ? "idle" : "success",
        updatedAt: null,
      }));
    }
  }

  /** Drops everything — used when the signed-in account changes. */
  clear(): void {
    for (const entry of this.entries.values()) {
      this.publish(entry, () => EMPTY);
    }

    this.entries.clear();
  }

  /** Fetches or creates the entry for a key. */
  private own(key: QueryKey): Entry {
    const id = serializeKey(key);
    const existing = this.entries.get(id);

    if (existing !== undefined) {
      return existing;
    }

    const created: Entry = {
      key,
      snapshot: EMPTY,
      listeners: new Set(),
      inFlight: null,
    };

    this.entries.set(id, created);

    return created;
  }

  private isFresh(entry: Entry, staleTime = DEFAULT_STALE_TIME): boolean {
    return (
      entry.snapshot.status === "success" &&
      entry.snapshot.updatedAt !== null &&
      Date.now() - entry.snapshot.updatedAt < staleTime
    );
  }

  private async load<T>(entry: Entry, fetcher: () => Promise<T>): Promise<void> {
    this.publish(entry, (current) => ({
      ...current,
      // A first load shows a skeleton; a refresh keeps the list on screen.
      status: current.data === undefined ? "loading" : "success",
      isFetching: true,
    }));

    try {
      const data = await fetcher();

      this.publish(entry, () => ({
        status: "success",
        data,
        error: null,
        isFetching: false,
        updatedAt: Date.now(),
      }));
    } catch (error) {
      // Keep whatever is cached. A failed refresh should not demote good data
      // to an error state; only a first load, with nothing to fall back on,
      // has an error worth showing.
      this.publish(entry, (current) => ({
        status: "error",
        data: current.data,
        error,
        isFetching: false,
        updatedAt: current.updatedAt,
      }));
    } finally {
      // Cleared last so a `read` racing the settle still sees this request.
      entry.inFlight = null;
    }
  }

  private publish(
    entry: Entry,
    next: (current: QuerySnapshot<unknown>) => QuerySnapshot<unknown>,
  ): void {
    entry.snapshot = next(entry.snapshot);

    for (const listener of entry.listeners) {
      listener();
    }
  }
}
