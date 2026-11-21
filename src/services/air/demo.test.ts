import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAqi } from "@/domain/aqi";
import { DELHI } from "@/test/fixtures";
import { buildDemoAir } from "./demo";

describe("buildDemoAir", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-21T09:05:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is deterministic for the same city", () => {
    const first = buildDemoAir(DELHI);
    const second = buildDemoAir(DELHI);

    expect(second.aqi).toBe(first.aqi);
    expect(second.category).toBe(first.category);
    expect(second.readings).toEqual(first.readings);
    expect(second.hourly).toEqual(first.hourly);
  });

  it("varies the sample between cities", () => {
    const delhi = buildDemoAir(DELHI);
    const mumbai = buildDemoAir({ ...DELHI, city: "Mumbai" });

    expect(mumbai.aqi).not.toBe(delhi.aqi);
  });

  it("labels itself as sample data and never claims to be live", () => {
    const snapshot = buildDemoAir(DELHI);

    expect(snapshot.source).toBe("demo");
    expect(snapshot.sourceLabel).toBe("Built-in sample");
    expect(snapshot.freshness).toBe("sample");
    expect(snapshot.isLive).toBe(false);
    expect(snapshot.notes).toEqual(["sample"]);
  });

  it("produces a consistent AQI and 24 hourly points", () => {
    const snapshot = buildDemoAir(DELHI);

    const pm25 = snapshot.readings.find(
      (reading) => reading.key === "pm25",
    )?.value;
    const pm10 = snapshot.readings.find(
      (reading) => reading.key === "pm10",
    )?.value;
    expect(snapshot.aqi).toBe(calculateAqi({ pm25, pm10 }).aqi);

    expect(snapshot.hourly).toHaveLength(24);
    expect(snapshot.hourly[0]?.time).toBe(snapshot.observedAt);
    expect(snapshot.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:00$/);
    expect(snapshot.hourly.every((point) => point.pm25 !== null)).toBe(true);
  });
});
