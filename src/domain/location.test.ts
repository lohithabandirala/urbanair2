import { describe, expect, it } from "vitest";
import { DEFAULT_LOCATION } from "@/lib/config";
import { isValidLocation, normalizeLocation } from "./location";

describe("location validation and normalization", () => {
  it("validates well-formed location objects", () => {
    expect(
      isValidLocation({
        city: "Delhi",
        latitude: 28.6139,
        longitude: 77.209,
      }),
    ).toBe(true);
  });

  it("rejects non-objects or nulls", () => {
    expect(isValidLocation(null)).toBe(false);
    expect(isValidLocation(undefined)).toBe(false);
    expect(isValidLocation("Delhi")).toBe(false);
    expect(isValidLocation(123)).toBe(false);
  });

  it("rejects invalid coordinate bounds", () => {
    expect(
      isValidLocation({ city: "Bad", latitude: 95, longitude: 77 }),
    ).toBe(false);
    expect(
      isValidLocation({ city: "Bad", latitude: 28, longitude: 190 }),
    ).toBe(false);
    expect(
      isValidLocation({ city: "Bad", latitude: -95, longitude: 77 }),
    ).toBe(false);
    expect(
      isValidLocation({ city: "Bad", latitude: 28, longitude: -190 }),
    ).toBe(false);
  });

  it("rejects empty or overly long city names", () => {
    expect(
      isValidLocation({ city: "   ", latitude: 28, longitude: 77 }),
    ).toBe(false);
    expect(
      isValidLocation({ city: "a".repeat(81), latitude: 28, longitude: 77 }),
    ).toBe(false);
  });

  it("normalizes invalid input to DEFAULT_LOCATION", () => {
    expect(normalizeLocation(null)).toEqual(DEFAULT_LOCATION);
    expect(normalizeLocation({})).toEqual(DEFAULT_LOCATION);
    expect(normalizeLocation({ city: "" })).toEqual(DEFAULT_LOCATION);
  });

  it("normalizes valid input and preserves optional fields", () => {
    const valid = {
      city: "  Mumbai  ",
      region: "Maharashtra",
      country: "India",
      countryCode: "IN",
      latitude: 19.076,
      longitude: 72.8777,
      timezone: "Asia/Kolkata",
    };

    const normalized = normalizeLocation(valid);
    expect(normalized.city).toBe("Mumbai");
    expect(normalized.region).toBe("Maharashtra");
    expect(normalized.latitude).toBe(19.076);
    expect(normalized.longitude).toBe(72.8777);
  });
});
