import { expect, test } from "@playwright/test";
import { getDictionary } from "../src/lib/i18n";
import { LIVE_SNAPSHOT, SAMPLE_SNAPSHOT, en, mockApis } from "./helpers";

const hi = getDictionary("hi");

test.describe("home dashboard", () => {
  test("renders live AQI and every major section", async ({ page }) => {
    await mockApis(page);
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();

    for (const heading of [
      en.plan.title,
      en.indoor.title,
      en.impact.title,
      en.assistant.title,
      en.profile.title,
    ]) {
      await expect(
        page.getByRole("heading", { name: heading, exact: true }),
      ).toBeVisible();
    }

    await expect(
      page.getByText(LIVE_SNAPSHOT.location.city, { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("img", { name: /265/ }),
    ).toBeVisible();
    await expect(page.getByText(en.app.liveData).first()).toBeVisible();
    await expect(
      page
        .locator("#dashboard .badge")
        .filter({ hasText: en.categories.poor })
        .first(),
    ).toBeVisible();
  });

  test("labels sample data explicitly and never as live", async ({ page }) => {
    await mockApis(page, { air: SAMPLE_SNAPSHOT });
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();

    const banner = page.getByText(new RegExp(en.app.demoData)).first();
    await expect(banner).toBeVisible();
    await expect(page.getByText(en.source.notes.sample).first()).toBeVisible();
    await expect(page.getByText(en.app.liveData)).toHaveCount(0);
  });

  test("refreshes air quality on demand", async ({ page }) => {
    let airCalls = 0;
    page.on("request", (request) => {
      if (request.url().includes("/api/air?")) airCalls += 1;
    });

    await mockApis(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();

    const before = airCalls;
    await page.getByRole("button", { name: en.common.refresh }).click();
    await expect.poll(() => airCalls).toBeGreaterThan(before);
  });

  test("switches the whole interface to Hindi and back", async ({ page }) => {
    await mockApis(page);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "हिन्दी" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(
      page.getByRole("heading", { name: hi.dashboard.title, exact: true }),
    ).toBeVisible();

    await page.getByRole("button", { name: "English" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: en.dashboard.title, exact: true }),
    ).toBeVisible();
  });

  test("shows a retryable error when the air API fails", async ({ page }) => {
    await mockApis(page, { airStatus: 500 });
    await page.goto("/");

    await expect(page.getByText(en.errors.generic).first()).toBeVisible();
    await expect(page.getByText(/Upstream unavailable/).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: en.common.retry }).first(),
    ).toBeVisible();
  });
});
