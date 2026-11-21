import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELHI, jsonResponse } from "@/test/fixtures";
import { fetchCpcbAir } from "./cpcb";
import { UpstreamError } from "../upstream";

interface RecordOverrides {
  station?: string;
  city?: string;
  latitude?: string | number;
  longitude?: string | number;
  pollutant_id?: string;
  pollutant_avg?: string | number | null;
  last_update?: string;
}

function record(overrides: RecordOverrides = {}) {
  return {
    station: "Anand Vihar",
    city: "Delhi",
    state: "Delhi",
    country: "India",
    latitude: "28.65",
    longitude: "77.31",
    pollutant_id: "PM2.5",
    pollutant_avg: "120",
    last_update: "21-11-2026 14:30",
    ...overrides,
  };
}

function stubResponse(records: unknown[]) {
  const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
    async () => jsonResponse({ records, count: records.length }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchCpcbAir", () => {
  beforeEach(() => {
    vi.stubEnv("CPCB_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("groups station records, recalculates AQI and prefers the most complete station", async () => {
    const fetchMock = stubResponse([
      record({ pollutant_id: "PM2.5", pollutant_avg: "120" }),
      record({ pollutant_id: "PM10", pollutant_avg: "210" }),
      record({ pollutant_id: "NO2", pollutant_avg: "60" }),
      record({ pollutant_id: "SO2", pollutant_avg: "12" }),
      record({ pollutant_id: "CO", pollutant_avg: "1.2" }),
      record({ pollutant_id: "O3", pollutant_avg: "90" }),
      record({ pollutant_id: "NH3", pollutant_avg: "5" }),
      record({
        station: "Lodhi Road",
        latitude: "28.59",
        longitude: "77.22",
        pollutant_id: "PM2.5",
        pollutant_avg: "80",
      }),
      record({
        station: "Lodhi Road",
        latitude: "28.59",
        longitude: "77.22",
        pollutant_id: "PM10",
        pollutant_avg: "140",
      }),
    ]);

    const snapshot = await fetchCpcbAir(DELHI);

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requested.searchParams.get("api-key")).toBe("test-key");
    expect(requested.searchParams.get("filters[city]")).toBe("Delhi");

    expect(snapshot.source).toBe("cpcb");
    expect(snapshot.sourceLabel).toBe("CPCB · Anand Vihar");
    expect(snapshot.isLive).toBe(true);
    expect(snapshot.observedAt).toBe("2026-11-21T14:30:00");
    expect(snapshot.aqi).not.toBeNull();
    expect(
      snapshot.readings.find((reading) => reading.key === "pm25")?.value,
    ).toBe(120);
    expect(snapshot.notes).toEqual(["cpcbOfficial", "noHourly"]);
  });

  it("breaks ties between equally complete stations by distance", async () => {
    stubResponse([
      record({
        station: "Far Station",
        latitude: "29.5",
        longitude: "78.5",
        pollutant_id: "PM2.5",
        pollutant_avg: "90",
      }),
      record({
        station: "Near Station",
        latitude: "28.6139",
        longitude: "77.209",
        pollutant_id: "PM2.5",
        pollutant_avg: "70",
      }),
    ]);

    const snapshot = await fetchCpcbAir(DELHI);

    expect(snapshot.sourceLabel).toBe("CPCB · Near Station");
    expect(snapshot.location.latitude).toBeCloseTo(28.6139);
  });

  it("ignores non-numeric and unknown pollutant rows", async () => {
    stubResponse([
      record({ pollutant_id: "PM2.5", pollutant_avg: "NA" }),
      record({ pollutant_id: "PM10", pollutant_avg: "150" }),
      record({ pollutant_id: "BENZENE", pollutant_avg: "5" }),
      record({ pollutant_id: "no2", pollutant_avg: "42" }),
    ]);

    const snapshot = await fetchCpcbAir(DELHI);

    expect(
      snapshot.readings.find((reading) => reading.key === "pm25")?.value,
    ).toBeNull();
    expect(
      snapshot.readings.find((reading) => reading.key === "pm10")?.value,
    ).toBe(150);
    expect(
      snapshot.readings.find((reading) => reading.key === "no2")?.value,
    ).toBe(42);
  });

  it("parses ISO-like timestamps without shifting the wall clock", async () => {
    stubResponse([
      record({ last_update: "2026-11-21 08:05" }),
    ]);

    const snapshot = await fetchCpcbAir(DELHI);

    expect(snapshot.observedAt).toBe("2026-11-21T08:05:00");
  });

  it("throws when the API key is missing", async () => {
    vi.stubEnv("CPCB_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchCpcbAir(DELHI)).rejects.toMatchObject({
      name: "UpstreamError",
      provider: "cpcb",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws when CPCB returns no records", async () => {
    stubResponse([]);

    await expect(fetchCpcbAir(DELHI)).rejects.toBeInstanceOf(UpstreamError);
  });

  it("throws when no record contains a usable numeric value", async () => {
    stubResponse([
      record({ pollutant_avg: "NA" }),
      record({ pollutant_id: "PM10", pollutant_avg: null }),
    ]);

    await expect(fetchCpcbAir(DELHI)).rejects.toThrow(/no numeric values/);
  });
});
