import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { DELHI, TEST_PROFILE, jsonResponse } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { ChatAssistant } from "./ChatAssistant";

const en = getDictionary("en");

const SOURCE = {
  id: "cpcbNaqi",
  publisher: "Central Pollution Control Board (India)",
  title: "National Air Quality Index",
  url: "https://cpcb.nic.in/national-air-quality-index/",
};

function renderChat() {
  return renderWithI18n(
    <ChatAssistant
      location={DELHI}
      profile={TEST_PROFILE}
      currentAqi={250}
      currentCategory="poor"
    />,
  );
}

describe("ChatAssistant", () => {
  it("fills the input from a suggestion and renders a grounded answer", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        ok: true,
        data: {
          answer: "Keep the windows closed and run a purifier.",
          provider: "grounded-fallback",
          noticeKey: "assistant.offlineNotice",
          sources: [SOURCE],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { container } = renderChat();

    const input = screen.getByRole("textbox", {
      name: en.assistant.placeholder,
    });
    await user.click(
      screen.getByRole("button", {
        name: en.assistant.suggestions[0],
      }),
    );
    expect(input).toHaveValue(en.assistant.suggestions[0]);

    await user.click(
      screen.getByRole("button", { name: en.assistant.send }),
    );

    expect(
      await screen.findByText("Keep the windows closed and run a purifier."),
    ).toBeInTheDocument();
    expect(screen.getByText(en.assistant.you)).toBeInTheDocument();
    expect(screen.getAllByText(en.assistant.aura).length).toBeGreaterThan(0);
    expect(screen.getByText(en.assistant.providerGrounded)).toBeInTheDocument();
    expect(screen.getByText(en.assistant.offlineNotice)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: SOURCE.title }),
    ).toBeInTheDocument();

    const request = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const body = JSON.parse(String(request[1].body)) as Record<string, unknown>;
    expect(body.question).toBe(en.assistant.suggestions[0]);
    expect(body.location).toEqual(DELHI);
    expect(body.profile).toEqual(TEST_PROFILE);
    expect(body).not.toHaveProperty("aqi");

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("shows and focuses an error when the API fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse(
          { ok: false, error: { message: "Service unavailable" } },
          { status: 503 },
        ),
      ),
    );

    renderChat();

    await user.type(
      screen.getByRole("textbox", { name: en.assistant.placeholder }),
      "Is it safe to go outside?",
    );
    await user.click(
      screen.getByRole("button", { name: en.assistant.send }),
    );

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Service unavailable");
    expect(alert).toHaveFocus();
  });

  it("clears the conversation", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          ok: true,
          data: {
            answer: "Wear an N95.",
            provider: "gemini",
            sources: [],
          },
        }),
      ),
    );

    renderChat();

    await user.type(
      screen.getByRole("textbox", { name: en.assistant.placeholder }),
      "Do I need a mask?",
    );
    await user.click(
      screen.getByRole("button", { name: en.assistant.send }),
    );
    await screen.findByText("Wear an N95.");

    await user.click(
      screen.getByRole("button", { name: en.assistant.clear }),
    );

    expect(screen.getByText(en.assistant.empty)).toBeInTheDocument();
    expect(screen.queryByText("Wear an N95.")).not.toBeInTheDocument();
  });
});
