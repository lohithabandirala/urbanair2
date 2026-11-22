import { expect, test } from "@playwright/test";
import { getDictionary } from "../src/lib/i18n";
import { en, mockApis } from "./helpers";

const hi = getDictionary("hi");

const ANSWER =
  "Today's PM2.5 is the dominant pollutant. Keep outdoor activity short and prefer the metro.";

test.describe("grounded assistant", () => {
  test.beforeEach(async ({ page }) => {
    await mockApis(page);
  });

  test("answers a question and shows its provider and sources", async ({
    page,
  }) => {
    await page.route("**/api/assistant", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ok: true,
          data: {
            answer: ANSWER,
            provider: "grounded-fallback",
            noticeKey: "assistant.fallbackNotice",
            sources: [
              {
                id: "cpcb",
                publisher: "CPCB",
                title: "Central Pollution Control Board",
                url: "https://cpcb.nic.in/",
              },
            ],
          },
        }),
      }),
    );

    await page.goto("/");
    const section = page.locator("#assistant");
    await expect(section).toBeVisible();

    await section
      .getByPlaceholder(en.assistant.placeholder)
      .fill("Is it safe to run outside this evening?");
    await section.getByRole("button", { name: en.assistant.send }).click();

    await expect(section.getByText(ANSWER)).toBeVisible();
    await expect(
      section.getByText(en.assistant.providerGrounded),
    ).toBeVisible();
    await expect(section.getByText(en.assistant.fallbackNotice)).toBeVisible();
    await expect(
      section.getByRole("link", { name: /Central Pollution Control Board/ }),
    ).toHaveAttribute("rel", /noopener/);
  });

  test("sends the selected language and shows a focused error on failure", async ({
    page,
  }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route("**/api/assistant", async (route) => {
      requestBody = route.request().postDataJSON();
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          error: { code: "assistant_error", message: "Model unavailable" },
        }),
      });
    });

    await page.goto("/");
    await page.getByRole("button", { name: "हिन्दी" }).click();

    const section = page.locator("#assistant");
    await section
      .getByPlaceholder(hi.assistant.placeholder)
      .fill("AQI क्या है?");
    await section.getByRole("button", { name: hi.assistant.send }).click();

    await expect(section.getByRole("alert")).toContainText(hi.assistant.error);
    await expect(section.getByRole("alert")).toBeFocused();
    expect(requestBody).toMatchObject({ language: "hi" });
  });

  test("refuses to send an empty question", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("#assistant");

    await expect(
      section.getByRole("button", { name: en.assistant.send }),
    ).toBeDisabled();
  });
});
