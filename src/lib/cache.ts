export interface CachePolicy {
  /** How long a value is served as fresh. */
  ttlMs: number;
  /** How long a stale value may still be served if refresh fails. */
  staleMs: number;
  /** Injectable clock for deterministic tests. */
  now?: () => number;
}

export type CacheStatus = "fresh" | "stale" | "miss";

export interface CachedResult<T> {
  value: T;
  status: CacheStatus;
}

interface CacheEntry<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
  createdAt: number;
}

const MAX_ENTRIES = 250;
const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function evictIfNeeded(): void {
  if (store.size <= MAX_ENTRIES) return;
  const entries = [...store.entries()].sort(
    (a, b) => a[1].createdAt - b[1].createdAt,
  );
  const excess = store.size - MAX_ENTRIES;
  for (let i = 0; i < excess; i += 1) {
    const key = entries[i]?.[0];
    if (key) store.delete(key);
  }
}

async function refresh<T>(
  key: string,
  policy: CachePolicy,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = (async () => {
    const value = await fetcher();
    const now = (policy.now ?? Date.now)();
    store.set(key, {
      value,
      freshUntil: now + policy.ttlMs,
      staleUntil: now + policy.ttlMs + policy.staleMs,
      createdAt: now,
    });
    evictIfNeeded();
    return value;
  })();

  inflight.set(key, promise);
  try {
    return await promise;
  } finally {
    inflight.delete(key);
  }
}

/**
 * TTL cache with stale-while-revalidate semantics.
 *
 * - fresh: return immediately.
 * - stale: return the old value immediately and refresh in the background.
 * - missing/expired: await the fetch; concurrent callers share one request.
 *
 * This keeps API routes fast during provider hiccups and prevents a burst of
 * identical upstream calls when several components mount at once.
 */
export async function cached<T>(
  key: string,
  policy: CachePolicy,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  const now = (policy.now ?? Date.now)();
  const entry = store.get(key) as CacheEntry<T> | undefined;

  if (entry && now < entry.freshUntil) {
    return { value: entry.value, status: "fresh" };
  }

  if (entry && now < entry.staleUntil) {
    void refresh(key, policy, fetcher).catch((error: unknown) => {
      console.warn(`[cache] background refresh failed for ${key}`, error);
    });
    return { value: entry.value, status: "stale" };
  }

  const value = await refresh(key, policy, fetcher);
  return { value, status: "miss" };
}

/** Waits for background refreshes (used by tests and graceful shutdown). */
export async function settleCache(): Promise<void> {
  await Promise.allSettled([...inflight.values()]);
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    store.clear();
    inflight.clear();
    return;
  }
  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export function cacheSize(): number {
  return store.size;
}
