import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimits());

  it("allows requests up to the limit and then blocks", () => {
    const now = 0;
    const options = { limit: 2, windowMs: 1000, now: () => now };

    const first = checkRateLimit("client-a", options);
    expect(first).toMatchObject({
      allowed: true,
      remaining: 1,
      resetAt: 1000,
      retryAfterSec: 1,
    });

    const second = checkRateLimit("client-a", options);
    expect(second).toMatchObject({ allowed: true, remaining: 0 });

    const third = checkRateLimit("client-a", options);
    expect(third).toMatchObject({ allowed: false, remaining: 0 });
  });

  it("resets after the window elapses", () => {
    let now = 0;
    const options = { limit: 1, windowMs: 1000, now: () => now };

    expect(checkRateLimit("client-b", options).allowed).toBe(true);
    expect(checkRateLimit("client-b", options).allowed).toBe(false);

    now = 1000;
    const reset = checkRateLimit("client-b", options);
    expect(reset.allowed).toBe(true);
    expect(reset.resetAt).toBe(2000);
  });

  it("keeps separate buckets per key", () => {
    const now = 0;
    const options = { limit: 1, windowMs: 1000, now: () => now };

    expect(checkRateLimit("a", options).allowed).toBe(true);
    expect(checkRateLimit("a", options).allowed).toBe(false);
    expect(checkRateLimit("b", options).allowed).toBe(true);
  });

  it("never returns a retry-after below one second", () => {
    const result = checkRateLimit("c", {
      limit: 0,
      windowMs: 100,
      now: () => 0,
    });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBe(1);
  });
});
