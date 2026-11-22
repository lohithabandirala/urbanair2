import { expect, test } from "@playwright/test";
import { en, mockApis } from "./helpers";

test.describe("impact calculator", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();
  });

  test("calculates a cleaner commute from the form", async ({ page }) => {
    const section = page.locator("#impact");

    await section.getByLabel(en.impact.distance).fill("24");
    await section.getByLabel(en.impact.days).fill("6");
    await section.getByLabel(en.impact.currentMode).selectOption("petrol-car");
    await section.getByLabel(en.impact.alternative).selectOption("metro");
    await section
      .getByRole("button", { name: en.impact.calculate })
      .click();

    await expect(
      section.getByRole("heading", { name: en.impact.results }),
    ).toBeVisible();
    await expect(section.getByText(en.impact.baseline)).toBeVisible();
    await expect(section.getByText(en.impact.savings)).toBeVisible();
    await expect(section.getByText(/kg CO₂/).first()).toBeVisible();
  });

  test("rejects an out-of-range distance with an inline error", async ({
    page,
  }) => {
    const section = page.locator("#impact");

    await section.getByLabel(en.impact.distance).fill("5000");
    await section
      .getByRole("button", { name: en.impact.calculate })
      .click();

    await expect(section.getByRole("alert")).toHaveText(
      en.errors.invalidInput,
    );
    await expect(
      section.getByRole("heading", { name: en.impact.results }),
    ).toHaveCount(0);
  });

  test("shows the assumptions and provenance disclosure", async ({ page }) => {
    const section = page.locator("#impact");

    await section.getByText(en.impact.assumptionsTitle).click();
    await expect(
      section.getByText(en.impact.assumptions.indicative),
    ).toBeVisible();
    await expect(section.getByText(en.impact.disclaimer)).toBeVisible();
  });
});
