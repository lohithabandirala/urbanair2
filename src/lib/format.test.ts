import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clampAqi,
  compassDirection,
  dateKey,
  formatNumber,
  formatObservedAt,
  gaugeAngle,
  hourInTimeZone,
  localeFor,
} from "./format";

describe("formatNumber", () => {
  it("formats finite numbers with the requested locale", () => {
    expect(formatNumber(1234.56, "en-US", 1)).toBe("1,234.6");
    expect(formatNumber(42, "en-IN")).toBe("42");
  });

  it("never throws on missing data", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
  });

  it("falls back to String when the locale is invalid", () => {
    expect(formatNumber(12.5, "not a locale", 1)).toBe("12.5");
  });
});

describe("formatObservedAt", () => {
  it("preserves the provider's wall-clock time for offset-less strings", () => {
    const formatted = formatObservedAt("2026-11-21T14:30", "en-GB", "UTC");
    expect(formatted).toContain("21 Nov 2026");
    expect(formatted).toContain("14:30");
  });

  it("formats absolute timestamps in the location timezone", () => {
    const formatted = formatObservedAt(
      "2026-11-21T09:00:00.000Z",
      "en-GB",
      "Asia/Kolkata",
    );
    expect(formatted).toContain("14:30");
  });

  it("returns the input for empty or invalid values", () => {
    expect(formatObservedAt("")).toBe("—");
    expect(formatObservedAt("not-a-date")).toBe("not-a-date");
  });
});

describe("gauge helpers", () => {
  it("clamps the AQI to 0–500", () => {
    expect(clampAqi(null)).toBe(0);
    expect(clampAqi(-5)).toBe(0);
    expect(clampAqi(123)).toBe(123);
    expect(clampAqi(900)).toBe(500);
  });

  it("maps the AQI to a -90°..90° needle angle", () => {
    expect(gaugeAngle(0)).toBe(-90);
    expect(gaugeAngle(250)).toBe(0);
    expect(gaugeAngle(500)).toBe(90);
  });
});

describe("compassDirection", () => {
  it("maps degrees to the eight compass points", () => {
    expect(compassDirection(0)).toBe("N");
    expect(compassDirection(45)).toBe("NE");
    expect(compassDirection(90)).toBe("E");
    expect(compassDirection(180)).toBe("S");
    expect(compassDirection(270)).toBe("W");
    expect(compassDirection(360)).toBe("N");
    expect(compassDirection(350)).toBe("N");
  });

  it("returns a dash for missing values", () => {
    expect(compassDirection(null)).toBe("—");
    expect(compassDirection(Number.NaN)).toBe("—");
  });
});

describe("date and locale helpers", () => {
  it("builds a local calendar date key", () => {
    expect(dateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("maps languages to Intl locales", () => {
    expect(localeFor("en")).toBe("en-IN");
    expect(localeFor("hi")).toBe("hi-IN");
  });
});

describe("hourInTimeZone", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the hour in a named timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T00:00:00.000Z"));
    expect(hourInTimeZone("Asia/Kolkata")).toBe(5);
  });

  it("falls back to the local hour for an invalid timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T12:00:00.000Z"));
    const hour = hourInTimeZone("Not/AZone");
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
  });
});
