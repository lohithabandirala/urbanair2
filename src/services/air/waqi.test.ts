import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAqi } from "@/domain/aqi";
import { DELHI, jsonResponse } from "@/test/fixtures";
import { fetchWaqiAir } from "./waqi";
import { UpstreamError } from "../upstream";

const WAQI_PAYLOAD = {
  status: "ok",
  data: {
    // WAQI's own index is deliberately wrong for CPCB purposes; we ignore it.
    aqi: 999,
    city: { name: "Delhi, India", geo: [28.61, 77.2] },
    time: { iso: "2026-11-21T14:00:00+05:30" },
    iaqi: {
      pm25: { v: 80 },
      pm10: { v: "90" },
      no2: { v: 41 },
      so2: { v: 12 },
      co: { v: 0.632 },
      o3: { v: 194 },
      nh3: { v: 5 },
    },
  },
};

describe("fetchWaqiAir", () => {
  beforeEach(() => {
    vi.stubEnv("WAQI_TOKEN", "test-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("recalculates AQI from raw concentrations instead of trusting WAQI", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () => jsonResponse(WAQI_PAYLOAD),
    );
    vi.stubGlobal("fetch", fetchMock);

    const snapshot = await fetchWaqiAir(DELHI);

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requested.pathname).toContain(
      "/feed/geo:28.6139;77.209/",
    );
    expect(requested.searchParams.get("token")).toBe("test-token");

    const expected = calculateAqi({
      pm25: 80,
      pm10: 90,
      no2: 41,
      so2: 12,
      co: 0.632,
      o3: 194,
      nh3: 5,
    });

    expect(snapshot.aqi).toBe(expected.aqi);
    expect(snapshot.aqi).not.toBe(999);
    expect(snapshot.category).toBe(expected.category);
    expect(snapshot.dominantPollutant).toBe(expected.dominantPollutant);
    expect(snapshot.location.city).toBe("Delhi");
    expect(snapshot.location.latitude).toBe(28.61);
    expect(snapshot.location.longitude).toBe(77.2);
    expect(snapshot.observedAt).toBe("2026-11-21T14:00:00+05:30");
    expect(snapshot.sourceLabel).toBe("WAQI · Delhi, India");
    expect(snapshot.notes).toEqual(["waqiUnvalidated", "noHourly"]);
  });

  it("treats a non-ok status as an upstream failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ status: "error" })),
    );

    await expect(fetchWaqiAir(DELHI)).rejects.toBeInstanceOf(UpstreamError);
  });

  it("throws when the token is missing", async () => {
    vi.stubEnv("WAQI_TOKEN", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWaqiAir(DELHI)).rejects.toMatchObject({
      name: "UpstreamError",
      provider: "waqi",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a null AQI when no particulate reading is present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          status: "ok",
          data: { iaqi: { no2: { v: 30 }, o3: { v: 90 } } },
        }),
      ),
    );

    const snapshot = await fetchWaqiAir(DELHI);

    expect(snapshot.aqi).toBeNull();
    expect(snapshot.category).toBe("unknown");
    expect(snapshot.location.city).toBe("Delhi");
  });
});
