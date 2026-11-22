import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getDictionary } from "@/lib/i18n";
import { DELHI, jsonResponse } from "@/test/fixtures";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { LocationPicker } from "./LocationPicker";

const en = getDictionary("en");

const MUMBAI = {
  name: "Mumbai",
  region: "Maharashtra",
  country: "India",
  countryCode: "IN",
  latitude: 19.076,
  longitude: 72.8777,
  timezone: "Asia/Kolkata",
};

function renderPicker(onChange = vi.fn()) {
  const result = renderWithI18n(
    <LocationPicker
      location={DELHI}
      onChange={onChange}
      showDefaultNote
    />,
  );
  return { ...result, onChange };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LocationPicker", () => {
  it("opens the panel, focuses the input and selects a search result", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn(async () =>
      jsonResponse({ ok: true, data: { query: "Mumbai", results: [MUMBAI] } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const { container, onChange } = renderPicker();

    expect(screen.getByText(en.location.defaultNote)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: en.location.change }),
    );

    const input = screen.getByLabelText(en.location.label);
    await waitFor(() => expect(input).toHaveFocus());

    await user.type(input, "Mumbai");
    await user.click(
      screen.getByRole("button", { name: en.location.search }),
    );

    await screen.findByText("Mumbai");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/geocode?q=Mumbai",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );

    await user.click(
      screen.getByRole("button", { name: /Mumbai/ }),
    );

    expect(onChange).toHaveBeenCalledWith({
      city: "Mumbai",
      region: "Maharashtra",
      country: "India",
      countryCode: "IN",
      latitude: 19.076,
      longitude: 72.8777,
      timezone: "Asia/Kolkata",
    });
    expect(screen.queryByLabelText(en.location.label)).not.toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("reports an empty search and closes on Escape", async () => {
    const user = userEvent.setup();
    renderPicker();

    await user.click(
      screen.getByRole("button", { name: en.location.change }),
    );
    await user.click(
      screen.getByRole("button", { name: en.location.search }),
    );

    expect(await screen.findByText(en.location.noResults)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByLabelText(en.location.label)).not.toBeInTheDocument();
  });

  it("explains when location permission is denied", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        getCurrentPosition: (
          _success: PositionCallback,
          error: PositionErrorCallback,
        ) => error({ code: 1 } as GeolocationPositionError),
      },
    });

    renderPicker();

    await user.click(
      screen.getByRole("button", { name: en.location.change }),
    );
    await user.click(
      screen.getByRole("button", { name: en.location.useMyLocation }),
    );

    expect(
      await screen.findByText(en.location.permissionDenied),
    ).toBeInTheDocument();
  });

  it("shows a search error when the API fails", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ ok: false }, { status: 500 })),
    );

    renderPicker();

    await user.click(
      screen.getByRole("button", { name: en.location.change }),
    );
    await user.type(screen.getByLabelText(en.location.label), "Delhi");
    await user.click(
      screen.getByRole("button", { name: en.location.search }),
    );

    expect(await screen.findByText(en.location.error)).toBeInTheDocument();
  });
});
