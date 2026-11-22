import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/geocode", () => ({
  searchPlaces: vi.fn(),
  reverseGeocode: vi.fn(),
}));

import { reverseGeocode, searchPlaces } from "@/services/geocode";
import { GET } from "./route";

const searchMock = vi.mocked(searchPlaces);
const reverseMock = vi.mocked(reverseGeocode);

const DELHI_PLACE = {
  name: "Delhi",
  region: "Delhi",
  country: "India",
  countryCode: "IN",
  latitude: 28.6139,
  longitude: 77.209,
};

describe("GET /api/geocode", () => {
  beforeEach(() => {
    searchMock.mockReset();
    reverseMock.mockReset();
    searchMock.mockResolvedValue([DELHI_PLACE]);
    reverseMock.mockResolvedValue(DELHI_PLACE);
  });

  it("searches by query", async () => {
    const response = await GET(
      new Request("http://localhost/api/geocode?q=Delhi"),
    );

    expect(searchMock).toHaveBeenCalledWith("Delhi");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("s-maxage=86400");
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { query: "Delhi", results: [DELHI_PLACE] },
    });
  });

  it("reverse-geocodes coordinates", async () => {
    const response = await GET(
      new Request("http://localhost/api/geocode?lat=28.6139&lon=77.209"),
    );

    expect(reverseMock).toHaveBeenCalledWith(28.6139, 77.209);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { query: null, results: [DELHI_PLACE] },
    });
  });

  it("returns an empty list when reverse lookup finds nothing", async () => {
    reverseMock.mockResolvedValue(null);

    const response = await GET(
      new Request("http://localhost/api/geocode?lat=0&lon=0"),
    );

    await expect(response.json()).resolves.toEqual({
      ok: true,
      data: { query: null, results: [] },
    });
  });

  it("requires either a query or a coordinate pair", async () => {
    const response = await GET(
      new Request("http://localhost/api/geocode?lat=28.6"),
    );

    expect(response.status).toBe(400);
    expect(searchMock).not.toHaveBeenCalled();
    expect(reverseMock).not.toHaveBeenCalled();
  });
});
