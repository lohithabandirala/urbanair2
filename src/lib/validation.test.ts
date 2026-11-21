import { describe, expect, it } from "vitest";
import { isHttpError } from "./errors";
import {
  assistantRequestSchema,
  geocodeQuerySchema,
  locationQuerySchema,
  locationSchema,
  parseOrThrow,
  profileSchema,
} from "./validation";

describe("locationQuerySchema", () => {
  it("accepts a city name", () => {
    expect(locationQuerySchema.parse({ city: "New Delhi" })).toEqual({
      city: "New Delhi",
    });
  });

  it("accepts a coordinate pair", () => {
    expect(locationQuerySchema.parse({ lat: "28.61", lon: "77.20" })).toEqual({
      lat: 28.61,
      lon: 77.2,
    });
  });

  it("rejects a missing location", () => {
    expect(locationQuerySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a lone coordinate", () => {
    expect(locationQuerySchema.safeParse({ lat: 28.6 }).success).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    expect(locationQuerySchema.safeParse({ lat: 91, lon: 77 }).success).toBe(false);
    expect(locationQuerySchema.safeParse({ lat: 28, lon: 181 }).success).toBe(false);
  });

  it("rejects markup in city names", () => {
    expect(
      locationQuerySchema.safeParse({ city: "Delhi<script>alert(1)</script>" })
        .success,
    ).toBe(false);
  });

  it("accepts Hindi city names and punctuation", () => {
    expect(locationQuerySchema.safeParse({ city: "नई दिल्ली" }).success).toBe(true);
    expect(locationQuerySchema.safeParse({ city: "St. John's" }).success).toBe(true);
  });

  it("rejects unknown query keys", () => {
    expect(
      locationQuerySchema.safeParse({ city: "Delhi", extra: "1" }).success,
    ).toBe(false);
  });
});

describe("geocodeQuerySchema", () => {
  it("accepts a search query or a coordinate pair", () => {
    expect(geocodeQuerySchema.safeParse({ q: "Delhi" }).success).toBe(true);
    expect(geocodeQuerySchema.safeParse({ lat: 28.6, lon: 77.2 }).success).toBe(
      true,
    );
  });

  it("rejects an empty query and lone coordinates", () => {
    expect(geocodeQuerySchema.safeParse({}).success).toBe(false);
    expect(geocodeQuerySchema.safeParse({ lat: 28.6 }).success).toBe(false);
  });
});

describe("locationSchema and profileSchema", () => {
  it("accepts a full resolved location", () => {
    expect(
      locationSchema.safeParse({
        city: "Delhi",
        region: "Delhi",
        country: "India",
        countryCode: "IN",
        latitude: 28.6139,
        longitude: 77.209,
        timezone: "Asia/Kolkata",
      }).success,
    ).toBe(true);
  });

  it("requires a two-letter country code", () => {
    expect(
      locationSchema.safeParse({
        city: "Delhi",
        countryCode: "IND",
        latitude: 28.6,
        longitude: 77.2,
      }).success,
    ).toBe(false);
  });

  it("validates profile enums", () => {
    expect(
      profileSchema.safeParse({
        commuteMode: "car",
        cookingFuel: "lpg",
        vulnerableGroups: ["children"],
        exercisesOutdoors: true,
      }).success,
    ).toBe(true);

    expect(
      profileSchema.safeParse({
        commuteMode: "rocket",
        cookingFuel: "lpg",
        vulnerableGroups: [],
        exercisesOutdoors: true,
      }).success,
    ).toBe(false);
  });
});

describe("assistantRequestSchema", () => {
  const location = {
    city: "Delhi",
    latitude: 28.6139,
    longitude: 77.209,
  };

  it("defaults the language to English", () => {
    const parsed = assistantRequestSchema.parse({
      question: "Is it safe to run?",
      location,
    });
    expect(parsed.language).toBe("en");
  });

  it("accepts a profile and Hindi", () => {
    const parsed = assistantRequestSchema.parse({
      question: "क्या बाहर दौड़ना सुरक्षित है?",
      language: "hi",
      location,
      profile: {
        commuteMode: "public-transport",
        cookingFuel: "electric",
        vulnerableGroups: [],
        exercisesOutdoors: false,
      },
    });
    expect(parsed.language).toBe("hi");
  });

  it("rejects short or overlong questions", () => {
    expect(
      assistantRequestSchema.safeParse({ question: "a", location }).success,
    ).toBe(false);
    expect(
      assistantRequestSchema.safeParse({
        question: "a".repeat(501),
        location,
      }).success,
    ).toBe(false);
  });

  it("rejects client-supplied readings", () => {
    expect(
      assistantRequestSchema.safeParse({
        question: "Is it safe?",
        location,
        aqi: 12,
      }).success,
    ).toBe(false);
  });
});

describe("parseOrThrow", () => {
  it("returns the parsed value", () => {
    expect(parseOrThrow(locationQuerySchema, { city: "Delhi" })).toEqual({
      city: "Delhi",
    });
  });

  it("throws a typed 400 error with details", () => {
    try {
      parseOrThrow(locationQuerySchema, {});
      throw new Error("expected parseOrThrow to throw");
    } catch (error) {
      expect(isHttpError(error)).toBe(true);
      if (isHttpError(error)) {
        expect(error.status).toBe(400);
        expect(error.code).toBe("invalid_input");
        expect(error.details).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ path: "city" }),
          ]),
        );
      }
    }
  });
});
