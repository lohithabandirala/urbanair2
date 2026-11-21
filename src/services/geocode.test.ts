import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearCache } from "@/lib/cache";
import { HttpError } from "@/lib/errors";
import { jsonResponse } from "@/test/fixtures";
import {
  resolveLocation,
  reverseGeocode,
  searchPlaces,
} from "./geocode";

describe("searchPlaces", () => {
  beforeEach(() => {
    clearCache();
  });

  it("returns an empty list without a request for very short queries", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchPlaces("d")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps geocoder results to places", async () => {
    const fetchMock = vi.fn<(input: RequestInfo | URL) => Promise<Response>>(
      async () => jsonResponse({
        results: [
          {
            id: 1261481,
            name: "New Delhi",
            latitude: 28.63576,
            longitude: 77.22445,
            country_code: "IN",
            country: "India",
            admin1: "Delhi",
            timezone: "Asia/Kolkata",
            population: 317797,
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const places = await searchPlaces("New Delhi", "en");

    const requested = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(requested.searchParams.get("name")).toBe("New Delhi");
    expect(requested.searchParams.get("language")).toBe("en");

    expect(places).toEqual([
      {
        id: 1261481,
        name: "New Delhi",
        region: "Delhi",
        country: "India",
        countryCode: "IN",
        latitude: 28.63576,
        longitude: 77.22445,
        timezone: "Asia/Kolkata",
        population: 317797,
      },
    ]);
  });

  it("uses the built-in city list when the geocoder is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    const places = await searchPlaces("delhi");

    expect(places[0]).toMatchObject({
      name: "Delhi",
      countryCode: "IN",
      latitude: 28.6139,
    });
  });

  it("matches fallback cities by partial input", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ results: [] })),
    );

    // An empty live result is authoritative; the fallback is only for errors.
    await expect(searchPlaces("mum")).resolves.toEqual([]);
    clearCache();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const places = await searchPlaces("mum");
    expect(places.map((place) => place.name)).toContain("Mumbai");
  });
});

describe("reverseGeocode", () => {
  beforeEach(() => {
    clearCache();
  });

  it("maps a reverse lookup to a place", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          city: "Pune",
          principalSubdivision: "Maharashtra",
          countryName: "India",
          countryCode: "IN",
        }),
      ),
    );

    const place = await reverseGeocode(18.5204, 73.8567);

    expect(place).toMatchObject({
      name: "Pune",
      region: "Maharashtra",
      country: "India",
      countryCode: "IN",
      latitude: 18.5204,
      longitude: 73.8567,
    });
  });

  it("returns null when the service fails or has no city name", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    await expect(reverseGeocode(1, 2)).resolves.toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({})),
    );
    await expect(reverseGeocode(3, 4)).resolves.toBeNull();

    warn.mockRestore();
  });
});

describe("resolveLocation", () => {
  beforeEach(() => {
    clearCache();
  });

  it("accepts explicit coordinates without a network call", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const location = await resolveLocation({
      city: "Custom",
      lat: 12.34,
      lon: 56.78,
    });

    expect(location).toEqual({
      city: "Custom",
      latitude: 12.34,
      longitude: 56.78,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("names explicit coordinates via reverse geocoding", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          city: "Pune",
          principalSubdivision: "Maharashtra",
          countryName: "India",
          countryCode: "IN",
        }),
      ),
    );

    const location = await resolveLocation({ lat: 18.5204, lon: 73.8567 });

    expect(location).toMatchObject({
      city: "Pune",
      region: "Maharashtra",
      country: "India",
      countryCode: "IN",
      latitude: 18.5204,
      longitude: 73.8567,
    });
  });

  it("resolves a city name through the geocoder", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          results: [
            {
              name: "Mumbai",
              latitude: 19.076,
              longitude: 72.8777,
              country_code: "IN",
              country: "India",
              admin1: "Maharashtra",
              timezone: "Asia/Kolkata",
            },
          ],
        }),
      ),
    );

    const location = await resolveLocation({ city: "Mumbai" });

    expect(location).toEqual({
      city: "Mumbai",
      region: "Maharashtra",
      country: "India",
      countryCode: "IN",
      latitude: 19.076,
      longitude: 72.8777,
      timezone: "Asia/Kolkata",
    });
  });

  it("rejects a request with neither a city nor coordinates", async () => {
    await expect(resolveLocation({})).rejects.toMatchObject({
      name: "HttpError",
      status: 400,
      code: "missing_location",
    });
  });

  it("rejects an unknown city with a 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ results: [] })),
    );

    await expect(resolveLocation({ city: "Atlantis" })).rejects.toBeInstanceOf(
      HttpError,
    );
    await expect(resolveLocation({ city: "Atlantis" })).rejects.toMatchObject({
      status: 404,
      code: "location_not_found",
    });
  });
});
