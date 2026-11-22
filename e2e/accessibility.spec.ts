import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { en, mockApis } from "./helpers";

const axeSource = readFileSync(
  path.join(process.cwd(), "node_modules", "axe-core", "axe.min.js"),
  "utf8",
);

interface AxeViolation {
  id: string;
  impact?: string;
  nodes: Array<{ target: string[] }>;
}

test.describe("keyboard and accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
  });

  test("skip link is the first stop and moves focus to main", async ({
    page,
  }) => {
    await page.goto("/");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /skip to main/i });
    await expect(skip).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("the impact form is fully keyboard operable", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#impact");

    const distance = section.getByLabel(en.impact.distance);
    await distance.focus();
    await distance.fill("12");
    await distance.press("Enter");

    await expect(
      section.getByRole("heading", { name: en.impact.results }),
    ).toBeVisible();
  });

  test("language switch works with the keyboard and exposes state", async ({
    page,
  }) => {
    await page.goto("/");

    const hindi = page.getByRole("button", { name: "हिन्दी" });
    await hindi.focus();
    await expect(hindi).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(
      page.getByRole("button", { name: "हिन्दी" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("has one h1 and no WCAG A/AA violations", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();

    await expect(page.locator("h1")).toHaveCount(1);

    await page.addScriptTag({ content: axeSource });
    const results = await page.evaluate(async () => {
      const axe = (
        window as unknown as {
          axe: {
            run: (
              context: Document,
              options: unknown,
            ) => Promise<{ violations: AxeViolation[] }>;
          };
        }
      ).axe;

      return axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
        // jsdom-free browser run still cannot judge gradient backgrounds
        // reliably; colour contrast is covered by the design tokens instead.
        rules: { "color-contrast": { enabled: false } },
      });
    });

    const summary = results.violations.map(
      (violation) => `${violation.id}: ${violation.nodes.length} node(s)`,
    );
    expect(summary).toEqual([]);
  });
});
