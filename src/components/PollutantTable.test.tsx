import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { PollutantTable } from "./PollutantTable";

const en = getDictionary("en");

describe("PollutantTable", () => {
  it("renders a described table with values, standards and status", async () => {
    const snapshot = makeSnapshot({
      readings: makeSnapshot().readings.map((reading) =>
        reading.key === "nh3" ? { ...reading, value: null } : reading,
      ),
    });

    const { container } = renderWithI18n(
      <PollutantTable snapshot={snapshot} />,
    );

    const table = screen.getByRole("table");
    expect(table).toHaveAccessibleDescription(en.dashboard.note);
    expect(screen.getByText(en.dashboard.tableCaption)).toBeInTheDocument();

    const pm25Row = screen.getByRole("row", {
      name: new RegExp(en.pollutants.pm25),
    });
    expect(within(pm25Row).getByText("80")).toBeInTheDocument();
    expect(within(pm25Row).getByText(en.dashboard.aboveStandard)).toBeInTheDocument();

    const nh3Row = screen.getByRole("row", {
      name: new RegExp(en.pollutants.nh3),
    });
    expect(within(nh3Row).getAllByText(en.dashboard.unavailable)).toHaveLength(
      3,
    );

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("marks readings below the CPCB standard", () => {
    renderWithI18n(
      <PollutantTable
        snapshot={makeSnapshot({
          readings: makeSnapshot().readings.map((reading) =>
            reading.key === "so2" ? { ...reading, value: 1 } : reading,
          ),
        })}
      />,
    );

    expect(screen.getAllByText(en.dashboard.belowStandard).length).toBeGreaterThan(
      0,
    );
  });
});
