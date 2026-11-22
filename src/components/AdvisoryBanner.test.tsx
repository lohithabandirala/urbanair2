import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { AdvisoryBanner } from "./AdvisoryBanner";

const en = getDictionary("en");

describe("AdvisoryBanner", () => {
  it("announces non-urgent advice politely with actions and sources", async () => {
    const { container } = renderWithI18n(
      <AdvisoryBanner category="moderate" />,
    );

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(
      screen.getByRole("heading", { name: en.advice.moderate.headline }),
    ).toBeInTheDocument();
    expect(screen.getByText(en.advice.moderate.detail)).toBeInTheDocument();
    expect(screen.getByText(en.advice.moderate.sensitive)).toBeInTheDocument();

    for (const action of en.advice.moderate.actions) {
      expect(screen.getByText(action)).toBeInTheDocument();
    }

    const sourceLink = screen.getByRole("link", {
      name: /National Air Quality Index/,
    });
    expect(sourceLink).toHaveAttribute("target", "_blank");
    expect(sourceLink).toHaveAttribute("rel", "noopener noreferrer");

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("uses an assertive alert for severe categories", () => {
    renderWithI18n(<AdvisoryBanner category="severe" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent(en.advice.severe.headline);
  });
});
