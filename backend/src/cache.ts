/**
 * Simple in-memory TTL cache for dashboard summary data.
 *
 * Keys are scoped by role to avoid cross-role contamination.
 * Default TTL: 30 seconds (configurable per export).
 * Falls back to `null` on cache miss so callers can transparently
 * re-query without try/catch.
 */

type CacheEntry<T> = {
  value: T;
  expiry: number; // unix epoch ms
};

class Cache {
  private store: Map<string, CacheEntry<any>> = new Map();

  /** Set a value with a TTL (ms). */
  set<K>(key: string, value: K, ttlMs: number = 30_000): void {
    this.store.set(key, { value, expiry: Date.now() + ttlMs });
  }

  /** Get a value if not expired; otherwise delete and return null. */
  get<K>(key: string): K | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.value as K;
  }

  /** Invalidate a specific key. */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all entries. */
  clear(): void {
    this.store.clear();
  }
}

export const cache = new Cache();

export function cacheKey(role: string, postfix = ""): string {
  return `dashboard:${role}${postfix}`;
}