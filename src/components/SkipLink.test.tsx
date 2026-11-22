import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { SkipLink } from "./SkipLink";

const en = getDictionary("en");
const hi = getDictionary("hi");

describe("SkipLink", () => {
  it("renders a translated link that targets the main landmark", async () => {
    const { container } = renderWithI18n(<SkipLink />, { language: "hi" });

    const link = await screen.findByRole("link", {
      name: hi.app.skipToContent,
    });
    expect(link).toHaveAttribute("href", "#main");
    expect(link).toHaveClass("skip-link");

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("uses the English label by default", async () => {
    renderWithI18n(<SkipLink />);

    expect(
      await screen.findByRole("link", { name: en.app.skipToContent }),
    ).toBeInTheDocument();
  });
});
