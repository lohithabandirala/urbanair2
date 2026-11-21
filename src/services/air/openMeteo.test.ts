import { describe, expect, it, vi } from "vitest";
import { DELHI, jsonResponse } from "@/test/fixtures";
import { fetchOpenMeteoAir, OPEN_METEO_AIR_URL } from "./openMeteo";
import { UpstreamError } from "../upstream";

const LIVE_PAYLOAD = {
  timezone: "Asia/Kolkata",
  current: {
    time: "2026-11-21T14:30",
    pm2_5: 68.7,
    pm10: 73.3,
    carbon_monoxide: 632,
    nitrogen_dioxide: 41,
    sulphur_dioxide: 12,
    ozone: 194,
    ammonia: 5,
  },
  hourly: {
    time: [
      "2026-11-21T14:00",
      "2026-11-21T15:00",
      "2026-11-21T16:00",
    ],
    pm2_5: [68, 70, null],
    pm10: [73, null],
  },
};

describe("fetchOpenMeteoAir", () => {
  it("maps live CAMS values, converts CO and zips the hourly forecast", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () => jsonResponse(LIVE_PAYLOAD),
    );
    vi.stubGlobal("fetch", fetchMock);

    const snapshot = await fetchOpenMeteoAir(DELHI);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(`${requested.origin}${requested.pathname}`).toBe(OPEN_METEO_AIR_URL);
    expect(requested.searchParams.get("latitude")).toBe("28.6139");
    expect(requested.searchParams.get("longitude")).toBe("77.209");
    expect(requested.searchParams.get("timezone")).toBe("auto");
    expect(requested.searchParams.get("current")).toContain("pm2_5");

    expect(snapshot.source).toBe("open-meteo");
    expect(snapshot.isLive).toBe(true);
    expect(snapshot.freshness).toBe("live");
    expect(snapshot.observedAt).toBe("2026-11-21T14:30");
    expect(snapshot.location.timezone).toBe("Asia/Kolkata");
    expect(snapshot.aqi).not.toBeNull();
    expect(snapshot.category).not.toBe("unknown");

    const co = snapshot.readings.find((reading) => reading.key === "co");
    expect(co?.value).toBe(0.632);
    expect(co?.unit).toBe("mg/m³");

    const pm25 = snapshot.readings.find((reading) => reading.key === "pm25");
    expect(pm25?.value).toBe(68.7);

    expect(snapshot.hourly).toHaveLength(3);
    expect(snapshot.hourly[2]).toEqual({
      time: "2026-11-21T16:00",
      pm25: null,
      pm10: null,
    });
    expect(snapshot.notes).toEqual(["modelled", "coConverted"]);
  });

  it("keeps missing pollutants null instead of inventing values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          current: { time: "2026-11-21T14:30", pm2_5: null },
        }),
      ),
    );

    const snapshot = await fetchOpenMeteoAir(DELHI);

    expect(snapshot.aqi).toBeNull();
    expect(snapshot.category).toBe("unknown");
    expect(snapshot.dominantPollutant).toBeNull();
    expect(snapshot.hourly).toEqual([]);
    expect(snapshot.readings.every((reading) => reading.value === null)).toBe(
      true,
    );
  });

  it("rejects a payload that does not match the expected shape", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ current: {} })),
    );

    await expect(fetchOpenMeteoAir(DELHI)).rejects.toBeInstanceOf(
      UpstreamError,
    );
  });
});
