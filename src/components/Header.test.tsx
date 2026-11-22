import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { Header } from "./Header";

const en = getDictionary("en");
const hi = getDictionary("hi");

describe("Header", () => {
  it("switches language and exposes the active state", async () => {
    const user = userEvent.setup();
    const { container } = renderWithI18n(<Header />);

    const english = screen.getByRole("button", { name: "English" });
    const hindi = screen.getByRole("button", { name: "हिन्दी" });
    expect(english).toHaveAttribute("aria-pressed", "true");
    expect(hindi).toHaveAttribute("aria-pressed", "false");

    await user.click(hindi);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "हिन्दी" }),
      ).toHaveAttribute("aria-pressed", "true"),
    );
    expect(
      screen.getByRole("link", { name: hi.nav.dashboard }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(document.documentElement.lang).toBe("hi"),
    );

    await user.click(screen.getByRole("button", { name: "English" }));
    expect(
      await screen.findByRole("link", { name: en.nav.dashboard }),
    ).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });
});
