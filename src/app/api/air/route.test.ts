import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/errors";
import { DELHI, makeSnapshot } from "@/test/fixtures";

vi.mock("@/services/air", () => ({ getAirQuality: vi.fn() }));
vi.mock("@/services/geocode", () => ({ resolveLocation: vi.fn() }));

import { getAirQuality } from "@/services/air";
import { resolveLocation } from "@/services/geocode";
import { GET } from "./route";

const resolveMock = vi.mocked(resolveLocation);
const airMock = vi.mocked(getAirQuality);

describe("GET /api/air", () => {
  beforeEach(() => {
    resolveMock.mockReset();
    airMock.mockReset();
    resolveMock.mockResolvedValue(DELHI);
    airMock.mockResolvedValue(makeSnapshot());
  });

  it("resolves a city and returns a provenance-tagged snapshot", async () => {
    const response = await GET(
      new Request("http://localhost/api/air?city=Delhi"),
    );

    expect(response.status).toBe(200);
    expect(resolveMock).toHaveBeenCalledWith({
      city: "Delhi",
      lat: undefined,
      lon: undefined,
      label: undefined,
    });
    expect(airMock).toHaveBeenCalledWith(DELHI);
    expect(response.headers.get("x-data-source")).toBe("open-meteo");
    expect(response.headers.get("x-data-freshness")).toBe("live");
    expect(response.headers.get("cache-control")).toContain("s-maxage=300");

    const body = (await response.json()) as {
      ok: boolean;
      data: { aqi: number; source: string };
    };
    expect(body.ok).toBe(true);
    expect(body.data.aqi).toBe(makeSnapshot().aqi);
    expect(body.data.source).toBe("open-meteo");
  });

  it("accepts coordinates and a label", async () => {
    await GET(
      new Request("http://localhost/api/air?lat=28.61&lon=77.2&label=Delhi"),
    );

    expect(resolveMock).toHaveBeenCalledWith({
      city: undefined,
      lat: 28.61,
      lon: 77.2,
      label: "Delhi",
    });
  });

  it("rejects a request with no location", async () => {
    const response = await GET(new Request("http://localhost/api/air"));

    expect(response.status).toBe(400);
    expect(resolveMock).not.toHaveBeenCalled();
    const body = (await response.json()) as {
      ok: boolean;
      error: { code: string };
    };
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("invalid_input");
  });

  it("rejects unsupported query parameters", async () => {
    const response = await GET(
      new Request("http://localhost/api/air?city=Delhi&aqi=10"),
    );

    expect(response.status).toBe(400);
  });

  it("passes typed errors through", async () => {
    airMock.mockRejectedValue(
      new HttpError(503, "providers_down", "No provider succeeded"),
    );

    const response = await GET(
      new Request("http://localhost/api/air?city=Delhi"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "providers_down" },
    });
  });

  it("hides unexpected error details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    airMock.mockRejectedValue(new Error("secret upstream token"));

    const response = await GET(
      new Request("http://localhost/api/air?city=Delhi"),
    );

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("secret upstream token");
    expect(text).toContain("internal_error");
    log.mockRestore();
  });
});
