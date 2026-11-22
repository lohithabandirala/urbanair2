import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELHI, makeSnapshot } from "@/test/fixtures";

vi.mock("@/services/geocode", () => ({ resolveLocation: vi.fn() }));
vi.mock("@/services/weather", () => ({ getWeather: vi.fn() }));

import { resolveLocation } from "@/services/geocode";
import { getWeather } from "@/services/weather";
import { GET } from "./route";

const resolveMock = vi.mocked(resolveLocation);
const weatherMock = vi.mocked(getWeather);

describe("GET /api/weather", () => {
  beforeEach(() => {
    resolveMock.mockReset();
    weatherMock.mockReset();
    resolveMock.mockResolvedValue(DELHI);
  });

  it("returns weather for a resolved city", async () => {
    const weather = {
      current: {
        temperatureC: 24,
        humidityPct: 50,
        windSpeedKph: 8,
        windDirectionDeg: 270,
        weatherCode: 1,
        observedAt: "2026-11-21T14:30",
      },
      hourly: [],
      source: "open-meteo" as const,
      sourceLabel: "Open-Meteo",
      fetchedAt: makeSnapshot().fetchedAt,
    };
    weatherMock.mockResolvedValue(weather);

    const response = await GET(
      new Request("http://localhost/api/weather?city=Delhi"),
    );

    expect(response.status).toBe(200);
    expect(weatherMock).toHaveBeenCalledWith(DELHI);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: weather,
    });
  });

  it("returns a successful null payload when every provider is down", async () => {
    weatherMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/weather?city=Delhi"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: null,
    });
  });

  it("validates the location query", async () => {
    const response = await GET(
      new Request("http://localhost/api/weather?lat=28.6"),
    );

    expect(response.status).toBe(400);
    expect(resolveMock).not.toHaveBeenCalled();
  });
});
