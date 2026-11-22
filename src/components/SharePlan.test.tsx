import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { buildDailyPlan } from "@/domain/plan";
import { getDictionary } from "@/lib/i18n";
import { TEST_PROFILE, makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { SharePlan } from "./SharePlan";

const en = getDictionary("en");

function renderShare() {
  const snapshot = makeSnapshot();
  const plan = buildDailyPlan({ snapshot, profile: TEST_PROFILE });
  return renderWithI18n(<SharePlan snapshot={snapshot} plan={plan} />);
}

describe("SharePlan", () => {
  it("copies a plain-text summary to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    const { container } = renderShare();

    await user.click(
      screen.getByRole("button", { name: en.share.button }),
    );

    expect(writeText).toHaveBeenCalledTimes(1);
    const copied = String(writeText.mock.calls[0]?.[0]);
    expect(copied).toContain("Delhi");
    expect(copied).toContain(en.footer.disclaimer);
    expect(await screen.findByText(en.share.copied)).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("shows the text for manual copying when the clipboard fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    renderShare();

    await user.click(
      screen.getByRole("button", { name: en.share.button }),
    );

    expect(await screen.findByText(en.share.failed)).toBeInTheDocument();
    const textarea = screen.getByRole("textbox", {
      name: en.share.title,
    }) as HTMLTextAreaElement;
    expect(textarea.value).toContain("Delhi");
  });

  it("disables sharing when there is no AQI", () => {
    renderWithI18n(
      <SharePlan snapshot={makeSnapshot({ aqi: null })} plan={null} />,
    );

    expect(
      screen.getByRole("button", { name: en.share.button }),
    ).toBeDisabled();
  });
});
