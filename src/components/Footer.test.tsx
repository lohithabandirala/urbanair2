import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { Footer } from "./Footer";

const en = getDictionary("en");

describe("Footer", () => {
  it("lists sources with safe external links and a disclaimer", async () => {
    const { container } = renderWithI18n(<Footer />);

    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }

    expect(screen.getByText(en.footer.disclaimer)).toBeInTheDocument();
    expect(screen.getByText(en.footer.privacyBody)).toBeInTheDocument();
    expect(screen.getByText(en.footer.dataNote)).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });
});
