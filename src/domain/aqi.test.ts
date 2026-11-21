import { describe, expect, it } from "vitest";
import {
  buildReadings,
  calculateAqi,
  calculateSubIndex,
  categoryForAqi,
  categoryRank,
  coMicrogramsToMilligrams,
  exceedsCpcbStandard,
  isAtLeast,
} from "./aqi";

describe("categoryForAqi", () => {
  it.each([
    [null, "unknown"],
    [undefined, "unknown"],
    [Number.NaN, "unknown"],
    [0, "good"],
    [50, "good"],
    [51, "satisfactory"],
    [100, "satisfactory"],
    [101, "moderate"],
    [200, "moderate"],
    [201, "poor"],
    [300, "poor"],
    [301, "very-poor"],
    [400, "very-poor"],
    [401, "severe"],
    [500, "severe"],
  ])("maps %s to %s", (value, expected) => {
    expect(categoryForAqi(value as number | null)).toBe(expected);
  });
});

describe("categoryRank and isAtLeast", () => {
  it("ranks every category and keeps unknown below good", () => {
    expect(categoryRank("good")).toBe(0);
    expect(categoryRank("satisfactory")).toBe(1);
    expect(categoryRank("moderate")).toBe(2);
    expect(categoryRank("poor")).toBe(3);
    expect(categoryRank("very-poor")).toBe(4);
    expect(categoryRank("severe")).toBe(5);
    expect(categoryRank("unknown")).toBe(-1);
  });

  it("compares categories safely", () => {
    expect(isAtLeast("poor", "moderate")).toBe(true);
    expect(isAtLeast("moderate", "poor")).toBe(false);
    expect(isAtLeast("unknown", "good")).toBe(false);
  });
});

describe("calculateSubIndex", () => {
  it("returns null for missing, negative or non-finite concentrations", () => {
    expect(calculateSubIndex("pm25", null)).toBeNull();
    expect(calculateSubIndex("pm25", undefined)).toBeNull();
    expect(calculateSubIndex("pm25", -1)).toBeNull();
    expect(calculateSubIndex("pm25", Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("interpolates CPCB breakpoints exactly", () => {
    expect(calculateSubIndex("pm25", 0)).toBe(0);
    expect(calculateSubIndex("pm25", 30)).toBe(50);
    expect(calculateSubIndex("pm25", 60)).toBe(100);
    expect(calculateSubIndex("pm25", 90)).toBe(200);
    expect(calculateSubIndex("pm25", 120)).toBe(300);
    expect(calculateSubIndex("pm25", 35)).toBe(58);
    expect(calculateSubIndex("pm10", 100)).toBe(100);
    expect(calculateSubIndex("co", 0.5)).toBe(25);
    expect(calculateSubIndex("co", 1)).toBe(50);
    expect(calculateSubIndex("co", 2)).toBe(100);
    expect(calculateSubIndex("o3", 194)).toBe(265);
    expect(calculateSubIndex("nh3", 200)).toBe(50);
  });

  it("caps values at the top of the scale", () => {
    expect(calculateSubIndex("pm25", 500)).toBe(500);
    expect(calculateSubIndex("pm25", 9999)).toBe(500);
  });
});

describe("calculateAqi", () => {
  it("requires a particulate reading", () => {
    const result = calculateAqi({ no2: 400, o3: 200 });
    expect(result.aqi).toBeNull();
    expect(result.category).toBe("unknown");
    expect(result.dominantPollutant).toBeNull();
    expect(result.subIndices.no2).toBe(400);
  });

  it("returns an unknown result when nothing is reported", () => {
    expect(calculateAqi({})).toEqual({
      aqi: null,
      category: "unknown",
      dominantPollutant: null,
      subIndices: {},
    });
  });

  it("uses the maximum sub-index as the AQI", () => {
    const result = calculateAqi({ pm25: 35, pm10: 100 });
    expect(result.subIndices.pm25).toBe(58);
    expect(result.subIndices.pm10).toBe(100);
    expect(result.aqi).toBe(100);
    expect(result.category).toBe("satisfactory");
    expect(result.dominantPollutant).toBe("pm10");
  });

  it("breaks ties using the CPCB pollutant order", () => {
    const result = calculateAqi({ pm25: 60, pm10: 100 });
    expect(result.aqi).toBe(100);
    expect(result.dominantPollutant).toBe("pm25");
  });

  it("ignores non-finite and negative values", () => {
    const result = calculateAqi({
      pm25: Number.NaN,
      pm10: 100,
      no2: -5,
    });
    expect(result.aqi).toBe(100);
    expect(result.dominantPollutant).toBe("pm10");
    expect(result.subIndices.no2).toBeUndefined();
  });
});

describe("buildReadings", () => {
  it("returns every pollutant in a stable order with units and sub-indices", () => {
    const readings = buildReadings({ pm25: 35, co: 0.5 });
    expect(readings).toHaveLength(7);
    expect(readings.map((reading) => reading.key)).toEqual([
      "pm25",
      "pm10",
      "no2",
      "so2",
      "co",
      "o3",
      "nh3",
    ]);

    const pm25 = readings.find((reading) => reading.key === "pm25");
    expect(pm25).toMatchObject({ value: 35, unit: "µg/m³", subIndex: 58 });

    const co = readings.find((reading) => reading.key === "co");
    expect(co).toMatchObject({ value: 0.5, unit: "mg/m³", subIndex: 25 });

    const missing = readings.find((reading) => reading.key === "pm10");
    expect(missing).toMatchObject({ value: null, subIndex: null });
  });

  it("treats non-finite values as missing", () => {
    const readings = buildReadings({ pm25: Number.NaN });
    expect(readings[0]).toMatchObject({ value: null, subIndex: null });
  });
});

describe("unit conversion and standards", () => {
  it("converts Open-Meteo CO from µg/m³ to mg/m³", () => {
    expect(coMicrogramsToMilligrams(632)).toBe(0.632);
    expect(coMicrogramsToMilligrams(1234)).toBe(1.234);
    expect(coMicrogramsToMilligrams(null)).toBeNull();
    expect(coMicrogramsToMilligrams(Number.NaN)).toBeNull();
  });

  it("flags values strictly above the CPCB standard", () => {
    expect(exceedsCpcbStandard("pm25", 60)).toBe(false);
    expect(exceedsCpcbStandard("pm25", 61)).toBe(true);
    expect(exceedsCpcbStandard("pm25", null)).toBe(false);
    expect(exceedsCpcbStandard("co", 2)).toBe(false);
    expect(exceedsCpcbStandard("co", 2.1)).toBe(true);
  });
});
