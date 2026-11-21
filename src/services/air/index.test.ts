import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache, settleCache } from "@/lib/cache";
import { DELHI, makeSnapshot } from "@/test/fixtures";
import {
  defaultAirProviders,
  getAirQuality,
  resetAirProviderState,
  type AirProvider,
} from "./index";
import { UpstreamError } from "../upstream";

function provider(
  id: AirProvider["id"],
  fetch: AirProvider["fetch"],
): AirProvider {
  return { id, fetch };
}

describe("defaultAirProviders", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("always includes the keyless CAMS provider", () => {
    vi.stubEnv("CPCB_API_KEY", "");
    vi.stubEnv("WAQI_TOKEN", "");

    expect(defaultAirProviders().map((entry) => entry.id)).toEqual([
      "open-meteo",
    ]);
  });

  it("prefers configured official station providers", () => {
    vi.stubEnv("CPCB_API_KEY", "cpcb-key");
    vi.stubEnv("WAQI_TOKEN", "waqi-token");

    expect(defaultAirProviders().map((entry) => entry.id)).toEqual([
      "cpcb",
      "waqi",
      "open-meteo",
    ]);
  });
});

describe("getAirQuality", () => {
  beforeEach(() => {
    clearCache();
    resetAirProviderState();
  });

  afterEach(() => {
    clearCache();
    resetAirProviderState();
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("falls through to the next provider when one fails", async () => {
    const failing = vi.fn(async () => {
      throw new Error("provider down");
    });
    const healthy = vi.fn(async () => makeSnapshot());

    const result = await getAirQuality(DELHI, {
      providers: [
        provider("cpcb", failing),
        provider("open-meteo", healthy),
      ],
    });

    expect(failing).toHaveBeenCalledTimes(1);
    expect(healthy).toHaveBeenCalledTimes(1);
    expect(result).toEqual(makeSnapshot());
  });

  it("serves a stale cached value while revalidating", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T09:00:00Z"));

    const fetcher = vi.fn(async () => makeSnapshot());
    const providers = [provider("open-meteo", fetcher)];

    const first = await getAirQuality(DELHI, { providers });
    expect(first.freshness).toBe("live");

    // Air data is fresh for 10 minutes; move beyond that window.
    vi.setSystemTime(new Date("2026-11-21T09:20:00Z"));
    const second = await getAirQuality(DELHI, { providers });

    expect(second.freshness).toBe("cached");
    expect(second.notes).toContain("cached");
    expect(fetcher).toHaveBeenCalledTimes(2);
    await settleCache();
  });

  it("returns sample data when every provider fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new Error("offline");
    });

    const result = await getAirQuality(DELHI, {
      providers: [provider("open-meteo", failing)],
    });

    expect(result.freshness).toBe("sample");
    expect(result.isLive).toBe(false);
    warn.mockRestore();
  });

  it("throws instead of using sample data when demo mode is disabled", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = vi.fn(async () => {
      throw new Error("offline");
    });

    await expect(
      getAirQuality(DELHI, {
        providers: [provider("open-meteo", failing)],
        allowDemo: false,
      }),
    ).rejects.toBeInstanceOf(UpstreamError);
    warn.mockRestore();
  });

  it("returns a partial snapshot when only non-particulate readings exist", async () => {
    const partial = makeSnapshot({
      aqi: null,
      category: "unknown",
      dominantPollutant: null,
      readings: [],
    });

    const result = await getAirQuality(DELHI, {
      providers: [provider("cpcb", async () => partial)],
      allowDemo: false,
    });

    expect(result).toBe(partial);
  });

  it("prefers a later provider that has a usable AQI", async () => {
    const partial = makeSnapshot({
      aqi: null,
      category: "unknown",
      dominantPollutant: null,
      readings: [],
    });
    const complete = makeSnapshot();

    const result = await getAirQuality(DELHI, {
      providers: [
        provider("cpcb", async () => partial),
        provider("open-meteo", async () => complete),
      ],
    });

    expect(result).toBe(complete);
  });

  it("skips a failing default provider during its cooldown", async () => {
    vi.stubEnv("CPCB_API_KEY", "");
    vi.stubEnv("WAQI_TOKEN", "");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn(async () => {
      throw new Error("offline");
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await getAirQuality(DELHI);
    const second = await getAirQuality(DELHI);

    expect(first.freshness).toBe("sample");
    expect(second.freshness).toBe("sample");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
