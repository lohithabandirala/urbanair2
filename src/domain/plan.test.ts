import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "./plan";
import { TEST_PROFILE, makeSnapshot } from "@/test/fixtures";
import type { HourlyAirPoint } from "./types";

const HOURLY: HourlyAirPoint[] = [
  { time: "2026-11-21T06:00", pm25: 30, pm10: 50 },
  { time: "2026-11-21T07:00", pm25: 30, pm10: 50 },
  { time: "2026-11-21T10:00", pm25: 60, pm10: 100 },
  { time: "2026-11-21T17:00", pm25: 90, pm10: 150 },
];

describe("buildDailyPlan", () => {
  it("builds windows from the hourly forecast and picks the cleanest one", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: TEST_PROFILE,
    });

    expect(plan.hasForecast).toBe(true);
    expect(plan.windows).toHaveLength(3);
    expect(plan.windows.map((window) => window.id)).toEqual([
      "morning",
      "midday",
      "evening",
    ]);

    const [morning, midday, evening] = plan.windows;
    expect(morning).toMatchObject({ aqi: 50, category: "good", verdict: "recommended" });
    expect(midday).toMatchObject({ aqi: 100, category: "satisfactory", verdict: "recommended" });
    expect(evening).toMatchObject({ aqi: 200, category: "moderate", verdict: "caution" });

    expect(plan.bestWindowId).toBe("morning");
    expect(plan.windows.find((window) => window.isBestWindow)?.id).toBe("morning");
    expect(plan.headline.key).toBe("plan.headline.good");
    expect(morning?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.goodOutdoor" }),
        expect.objectContaining({ key: "plan.notes.carCommute" }),
        expect.objectContaining({ key: "plan.notes.exerciseGood" }),
      ]),
    );
  });

  it("falls back to the current reading when there is no hourly forecast", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ aqi: 250, category: "poor", hourly: [] }),
      profile: TEST_PROFILE,
    });

    expect(plan.hasForecast).toBe(false);
    expect(plan.headline.key).toBe("plan.headline.noForecast");
    expect(plan.bestWindowId).toBe("morning");

    for (const window of plan.windows) {
      expect(window.aqi).toBe(250);
      expect(window.category).toBe("poor");
      expect(window.verdict).toBe("avoid");
      expect(window.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "plan.notes.currentOnly" }),
          expect.objectContaining({ key: "plan.notes.avoidOutdoor" }),
        ]),
      );
    }

    expect(plan.windows[0]?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.exerciseAvoid" }),
      ]),
    );
  });

  it("ignores windows that have already ended", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: TEST_PROFILE,
      nowHour: 15,
    });

    expect(plan.bestWindowId).toBe("evening");
    expect(plan.windows.find((window) => window.isBestWindow)?.id).toBe("evening");
    expect(plan.headline.key).toBe("plan.headline.caution");
  });

  it("falls back to all windows when every window has ended", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: TEST_PROFILE,
      nowHour: 23,
    });

    expect(plan.bestWindowId).toBe("morning");
  });

  it("adds profile-specific notes to the best window", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: {
        commuteMode: "two-wheeler",
        cookingFuel: "biomass",
        vulnerableGroups: ["children"],
        exercisesOutdoors: false,
      },
    });

    const best = plan.windows.find((window) => window.isBestWindow);
    expect(best?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.twoWheeler" }),
        expect.objectContaining({ key: "plan.notes.vulnerableGood" }),
      ]),
    );
    expect(best?.notes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.exerciseGood" }),
      ]),
    );

    const evening = plan.windows.find((window) => window.id === "evening");
    expect(evening?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.biomassCooking" }),
      ]),
    );
  });

  it("uses the vulnerable warning at moderate or worse categories", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: { ...TEST_PROFILE, vulnerableGroups: ["elderly"] },
    });

    const best = plan.windows.find((window) => window.isBestWindow);
    expect(best?.category).toBe("good");
    expect(best?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.vulnerableGood" }),
      ]),
    );

    const polluted = buildDailyPlan({
      snapshot: makeSnapshot({ aqi: 250, category: "poor", hourly: [] }),
      profile: { ...TEST_PROFILE, vulnerableGroups: ["elderly"] },
    });
    expect(polluted.windows[0]?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.vulnerable" }),
      ]),
    );
  });

  it("adds a kerosene cooking note only to the evening window", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: HOURLY }),
      profile: { ...TEST_PROFILE, cookingFuel: "kerosene" },
    });

    const evening = plan.windows.find((window) => window.id === "evening");
    expect(evening?.notes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.keroseneCooking" }),
      ]),
    );
    const morning = plan.windows.find((window) => window.id === "morning");
    expect(morning?.notes).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "plan.notes.keroseneCooking" }),
      ]),
    );
  });

  it("treats unusable hourly timestamps as no forecast", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({
        hourly: [{ time: "not-a-timestamp", pm25: 20, pm10: 30 }],
      }),
      profile: TEST_PROFILE,
    });

    expect(plan.hasForecast).toBe(true);
    for (const window of plan.windows) {
      expect(window.notes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ key: "plan.notes.currentOnly" }),
        ]),
      );
    }
  });
});
