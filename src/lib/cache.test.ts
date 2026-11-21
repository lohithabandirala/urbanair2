import { beforeEach, describe, expect, it, vi } from "vitest";
import { cached, cacheSize, clearCache, settleCache } from "./cache";

const policy = (now: () => number) => ({ ttlMs: 100, staleMs: 1000, now });

describe("cached", () => {
  beforeEach(() => clearCache());

  it("fetches on a miss and caches the value", async () => {
    let now = 1000;
    const fetcher = vi.fn(async () => "value");
    const first = await cached("key", policy(() => now), fetcher);

    expect(first).toEqual({ value: "value", status: "miss" });
    expect(fetcher).toHaveBeenCalledTimes(1);

    now = 1050;
    const second = await cached("key", policy(() => now), fetcher);
    expect(second).toEqual({ value: "value", status: "fresh" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("serves stale data and refreshes in the background", async () => {
    let now = 1000;
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("old")
      .mockResolvedValueOnce("new");

    await cached("stale-key", policy(() => now), fetcher);

    now = 1200;
    const stale = await cached("stale-key", policy(() => now), fetcher);
    expect(stale).toEqual({ value: "old", status: "stale" });

    await settleCache();
    expect(fetcher).toHaveBeenCalledTimes(2);

    now = 1250;
    const refreshed = await cached("stale-key", policy(() => now), fetcher);
    expect(refreshed).toEqual({ value: "new", status: "fresh" });
  });

  it("refetches after the stale window expires", async () => {
    let now = 1000;
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("first")
      .mockResolvedValueOnce("second");

    await cached("expiry-key", policy(() => now), fetcher);

    now = 5000;
    const result = await cached("expiry-key", policy(() => now), fetcher);
    expect(result).toEqual({ value: "second", status: "miss" });
  });

  it("shares one in-flight request between concurrent callers", async () => {
    let resolveFetcher: ((value: string) => void) | undefined;
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveFetcher = resolve;
        }),
    );

    const first = cached("shared", { ttlMs: 100, staleMs: 100 }, fetcher);
    const second = cached("shared", { ttlMs: 100, staleMs: 100 }, fetcher);

    resolveFetcher?.("shared-value");
    const results = await Promise.all([first, second]);

    expect(results.map((result) => result.value)).toEqual([
      "shared-value",
      "shared-value",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps background refresh failures from breaking the stale response", async () => {
    let now = 1000;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetcher = vi
      .fn<() => Promise<string>>()
      .mockResolvedValueOnce("old")
      .mockRejectedValueOnce(new Error("upstream down"));

    await cached("failure-key", policy(() => now), fetcher);
    now = 1200;
    const stale = await cached("failure-key", policy(() => now), fetcher);
    expect(stale.value).toBe("old");

    await settleCache();
    expect(warn).toHaveBeenCalled();
  });

  it("clears all entries or a prefix", async () => {
    await cached("a:1", policy(() => 0), async () => 1);
    await cached("a:2", policy(() => 0), async () => 2);
    await cached("b:1", policy(() => 0), async () => 3);
    expect(cacheSize()).toBe(3);

    clearCache("a:");
    expect(cacheSize()).toBe(1);

    clearCache();
    expect(cacheSize()).toBe(0);
  });
});
