import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { IndoorChecklist } from "./IndoorChecklist";

const en = getDictionary("en");

describe("IndoorChecklist", () => {
  it("tracks checked actions and resets the list", async () => {
    const user = userEvent.setup();
    const { container } = renderWithI18n(
      <IndoorChecklist category="poor" cookingFuel="lpg" />,
    );

    const progress = screen.getByRole("progressbar");
    expect(progress).toHaveAttribute("aria-valuenow", "0");
    const total = Number(progress.getAttribute("aria-valuemax"));
    expect(total).toBeGreaterThan(0);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBe(total);

    await user.click(checkboxes[0]!);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );
    expect(screen.getByText(en.indoor.done)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: en.indoor.reset }));
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("shows category-specific actions with priorities", () => {
    renderWithI18n(<IndoorChecklist category="satisfactory" cookingFuel="lpg" />);

    const items = en.indoor.items as Record<
      string,
      { title: string; detail: string }
    >;
    expect(screen.getByText(items.ventilate!.title)).toBeInTheDocument();
    expect(
      screen.queryByText(items["close-windows"]!.title),
    ).not.toBeInTheDocument();
  });
});
