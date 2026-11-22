import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { jsonResponse, makeSnapshot } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { AppShell } from "./AppShell";

const en = getDictionary("en");

const SAMPLE = makeSnapshot({
  source: "demo",
  sourceLabel: "Built-in sample",
  freshness: "sample",
  isLive: false,
  notes: ["sample"],
  hourly: [],
});

function mockApi(air: () => Promise<Response>) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.startsWith("/api/air")) return air();
    if (url.startsWith("/api/weather")) {
      return jsonResponse({ ok: true, data: null });
    }
    throw new Error(`unexpected request: ${url}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AppShell", () => {
  it("loads air quality and renders every section with a sample-data warning", async () => {
    mockApi(async () => jsonResponse({ ok: true, data: SAMPLE }));

    const { container } = renderWithI18n(<AppShell />);

    expect(
      await screen.findByRole("heading", { name: en.dashboard.title }),
    ).toBeInTheDocument();

    // The sample banner is explicit and never claims to be live data.
    expect(screen.getAllByText(new RegExp(en.app.demoData)).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(en.source.notes.sample).length).toBeGreaterThan(0);

    for (const heading of [
      en.plan.title,
      en.indoor.title,
      en.impact.title,
      en.assistant.title,
      en.profile.title,
    ]) {
      expect(
        screen.getByRole("heading", { name: heading }),
      ).toBeInTheDocument();
    }

    expect(screen.getByText(SAMPLE.location.city)).toBeInTheDocument();
    expect(container.textContent).not.toContain("{aqi}");

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("refreshes both air quality and weather", async () => {
    const user = userEvent.setup();
    const fetchMock = mockApi(async () =>
      jsonResponse({ ok: true, data: SAMPLE }),
    );

    renderWithI18n(<AppShell />);
    await screen.findByRole("heading", { name: en.dashboard.title });

    const before = fetchMock.mock.calls.length;
    await user.click(screen.getByRole("button", { name: en.common.refresh }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(before + 2),
    );
  });

  it("shows a retryable error when air quality cannot load", async () => {
    mockApi(async () => {
      throw new Error("network down");
    });

    renderWithI18n(<AppShell />);

    expect(await screen.findByText(en.errors.generic)).toBeInTheDocument();
    expect(screen.getByText(/network down/)).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: en.common.retry }).length,
    ).toBeGreaterThan(0);
  });
});
