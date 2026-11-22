import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { ImpactCalculator } from "./ImpactCalculator";

const en = getDictionary("en");

describe("ImpactCalculator", () => {
  it("calculates an impact estimate from the default inputs", async () => {
    const user = userEvent.setup();
    const { container } = renderWithI18n(<ImpactCalculator />);

    await user.click(
      screen.getByRole("button", { name: en.impact.calculate }),
    );

    expect(
      screen.getByRole("heading", { name: en.impact.results }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.impact.baseline)).toBeInTheDocument();
    expect(
      screen.getAllByText(en.impact.alternativeLabel).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText(en.impact.savings)).toBeInTheDocument();
    expect(container.textContent).not.toContain("NaN");

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("validates distance before calculating", async () => {
    const user = userEvent.setup();
    renderWithI18n(<ImpactCalculator />);

    const distance = screen.getByLabelText(en.impact.distance);
    await user.clear(distance);
    await user.type(distance, "5000");
    await user.click(
      screen.getByRole("button", { name: en.impact.calculate }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      en.errors.invalidInput,
    );
  });

  it("lets the user change travel modes and occupants", async () => {
    const user = userEvent.setup();
    renderWithI18n(<ImpactCalculator />);

    const current = screen.getByLabelText(en.impact.currentMode);
    await user.selectOptions(current, "diesel-car");
    expect(current).toHaveValue("diesel-car");

    const alternative = screen.getByLabelText(en.impact.alternative);
    await user.selectOptions(alternative, "walk-cycle");
    expect(alternative).toHaveValue("walk-cycle");

    const occupants = screen.getByLabelText(en.impact.occupants);
    await user.clear(occupants);
    await user.type(occupants, "4");
    await user.click(
      screen.getByRole("button", { name: en.impact.calculate }),
    );

    expect(
      screen.getByRole("heading", { name: en.impact.results }),
    ).toBeInTheDocument();
  });
});
