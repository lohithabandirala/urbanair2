import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildDailyPlan } from "@/domain/plan";
import { getDictionary } from "@/lib/i18n";
import { TEST_PROFILE, makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { DayPlan } from "./DayPlan";

const en = getDictionary("en");

function forecastSnapshot() {
  return makeSnapshot({
    hourly: [
      { time: "2026-11-21T06:00", pm25: 40, pm10: 60 },
      { time: "2026-11-21T08:00", pm25: 45, pm10: 65 },
      { time: "2026-11-21T10:00", pm25: 90, pm10: 120 },
      { time: "2026-11-21T12:00", pm25: 95, pm10: 130 },
      { time: "2026-11-21T17:00", pm25: 140, pm10: 190 },
      { time: "2026-11-21T19:00", pm25: 150, pm10: 200 },
    ],
  });
}

describe("DayPlan", () => {
  it("renders each window, the best window and interpolated notes", async () => {
    const plan = buildDailyPlan({
      snapshot: forecastSnapshot(),
      profile: TEST_PROFILE,
      nowHour: 8,
    });

    const { container } = renderWithI18n(<DayPlan plan={plan} />);

    expect(
      screen.getByRole("heading", { name: en.plan.title }),
    ).toBeInTheDocument();
    for (const id of ["morning", "midday", "evening"] as const) {
      expect(
        screen.getByRole("heading", { name: en.plan.windows[id] }),
      ).toBeInTheDocument();
    }

    expect(screen.getByText(en.common.best)).toBeInTheDocument();
    expect(container.textContent).not.toContain("{aqi}");
    expect(screen.getAllByRole("link", { name: en.plan.editProfile })[0]).toHaveAttribute(
      "href",
      "#profile",
    );

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("states clearly when only the current reading is available", () => {
    const plan = buildDailyPlan({
      snapshot: makeSnapshot({ hourly: [] }),
      profile: TEST_PROFILE,
    });

    renderWithI18n(<DayPlan plan={plan} />);

    expect(
      screen.getByText(en.plan.headline.noForecast),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(en.plan.notes.currentOnly).length,
    ).toBe(3);
  });
});
