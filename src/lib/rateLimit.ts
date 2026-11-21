export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

/**
 * Small fixed-window limiter for the assistant endpoint.
 *
 * This is intentionally in-memory: it protects a single server instance from
 * accidental loops and casual abuse. On a multi-instance deployment, swap it
 * for a shared store (Redis/Upstash) behind the same interface.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs, now = Date.now }: RateLimitOptions,
): RateLimitResult {
  const current = now();
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= current) {
    bucket = { count: 0, resetAt: current + windowMs };
    buckets.set(key, bucket);
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  const remaining = Math.max(0, limit - bucket.count);
  const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - current) / 1000));

  if (buckets.size > MAX_BUCKETS) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= current) buckets.delete(bucketKey);
    }
  }

  return {
    allowed,
    remaining,
    resetAt: bucket.resetAt,
    retryAfterSec,
  };
}

export function resetRateLimits(): void {
  buckets.clear();
}
