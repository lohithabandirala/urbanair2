import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { SmogAlert } from "./SmogAlert";

const en = getDictionary("en");

describe("SmogAlert", () => {
  it("renders nothing for clean or moderate air", () => {
    renderWithI18n(<SmogAlert category="moderate" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("raises an assertive alert with the translated category", async () => {
    const { container } = renderWithI18n(<SmogAlert category="severe" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent(en.smogAlert.title);
    expect(alert).toHaveTextContent(en.categories.severe);

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });
});
