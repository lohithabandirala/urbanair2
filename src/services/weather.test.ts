import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { WeatherSnapshot } from "@/domain/types";
import { clearCache } from "@/lib/cache";
import { DELHI, jsonResponse } from "@/test/fixtures";
import { getWeather } from "./weather";

const OPEN_METEO_PAYLOAD = {
  current: {
    time: "2026-11-21T14:30",
    temperature_2m: 24.5,
    relative_humidity_2m: 55,
    wind_speed_10m: 8,
    wind_direction_10m: 270,
    weather_code: 1,
  },
  hourly: {
    time: ["2026-11-21T14:00", "2026-11-21T15:00", "2026-11-21T16:00"],
    temperature_2m: [24, 25],
    relative_humidity_2m: [55, 56, 57],
    wind_speed_10m: [8, 9, 10],
    precipitation_probability: [10, 20],
  },
};

function sampleWeather(): WeatherSnapshot {
  return {
    current: {
      temperatureC: 20,
      humidityPct: 50,
      windSpeedKph: 5,
      windDirectionDeg: 180,
      weatherCode: 800,
      observedAt: "2026-11-21T09:00:00.000Z",
    },
    hourly: [],
    source: "open-meteo",
    sourceLabel: "Open-Meteo",
    fetchedAt: "2026-11-21T09:05:00.000Z",
  };
}

describe("getWeather", () => {
  beforeEach(() => {
    clearCache();
    vi.stubEnv("OPENWEATHER_API_KEY", "");
  });

  afterEach(() => {
    clearCache();
    vi.unstubAllEnvs();
  });

  it("maps Open-Meteo current conditions and zips the hourly series", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(OPEN_METEO_PAYLOAD));
    vi.stubGlobal("fetch", fetchMock);

    const weather = await getWeather(DELHI);

    expect(weather?.source).toBe("open-meteo");
    expect(weather?.current.temperatureC).toBe(24.5);
    expect(weather?.current.humidityPct).toBe(55);
    expect(weather?.current.windSpeedKph).toBe(8);
    expect(weather?.current.weatherCode).toBe(1);
    expect(weather?.hourly).toHaveLength(3);
    expect(weather?.hourly[2]).toEqual({
      time: "2026-11-21T16:00",
      temperatureC: null,
      humidityPct: 57,
      windSpeedKph: 10,
      precipitationProbability: null,
    });
  });

  it("caches weather so repeated calls do not hit the network", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(OPEN_METEO_PAYLOAD));
    vi.stubGlobal("fetch", fetchMock);

    await getWeather(DELHI);
    await getWeather(DELHI);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses OpenWeatherMap when configured and converts its units", async () => {
    vi.stubEnv("OPENWEATHER_API_KEY", "owm-key");

    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/forecast")) {
        return jsonResponse({
          list: [
            {
              dt: 1763725800,
              main: { temp: 21, humidity: 62 },
              wind: { speed: 4, deg: 90 },
              pop: 0.5,
            },
            {
              dt: 1763736600,
              main: { temp: 20 },
            },
          ],
        });
      }
      return jsonResponse({
        dt: 1763725800,
        main: { temp: 22, humidity: 60 },
        wind: { speed: 10, deg: 180 },
        weather: [{ id: 800 }],
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const weather = await getWeather(DELHI);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(weather?.source).toBe("openweather");
    expect(weather?.sourceLabel).toBe("OpenWeatherMap");
    expect(weather?.current.temperatureC).toBe(22);
    expect(weather?.current.windSpeedKph).toBe(36);
    expect(weather?.hourly).toHaveLength(2);
    expect(weather?.hourly[0]).toEqual({
      time: new Date(1763725800 * 1000).toISOString(),
      temperatureC: 21,
      humidityPct: 62,
      windSpeedKph: 14.4,
      precipitationProbability: 50,
    });
  });

  it("falls back to the next provider after a failure", async () => {
    const failing = vi.fn(async () => {
      throw new Error("down");
    });
    const healthy = vi.fn(async () => sampleWeather());

    const weather = await getWeather(DELHI, [
      { id: "openweather", fetch: failing },
      { id: "open-meteo", fetch: healthy },
    ]);

    expect(failing).toHaveBeenCalledTimes(1);
    expect(weather).toEqual(sampleWeather());
  });

  it("returns null when every weather provider fails", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const weather = await getWeather(DELHI, [
      {
        id: "openweather",
        fetch: async () => {
          throw new Error("down");
        },
      },
    ]);

    expect(weather).toBeNull();
    warn.mockRestore();
  });

  it("returns null when the upstream payload is malformed", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ current: {} })),
    );

    expect(await getWeather(DELHI)).toBeNull();
    warn.mockRestore();
  });
});
