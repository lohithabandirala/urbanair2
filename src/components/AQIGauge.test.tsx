import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { AQIGauge } from "./AQIGauge";

const en = getDictionary("en");

describe("AQIGauge", () => {
  it("shows the index, category and an accessible label", async () => {
    const { container } = renderWithI18n(
      <AQIGauge aqi={250} category="poor" />,
    );

    expect(screen.getByRole("img", { name: /250/ })).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getAllByText(en.categories.poor).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("list", { name: en.dashboard.scale }),
    ).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("renders a dash and an explanatory label when the AQI is missing", () => {
    renderWithI18n(<AQIGauge aqi={null} category="unknown" />);

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: en.dashboard.gaugeUnknown }),
    ).toBeInTheDocument();
  });
});
