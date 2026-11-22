import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { WeatherSnapshot } from "@/domain/types";
import { getDictionary } from "@/lib/i18n";
import { expectNoA11yViolations, renderWithI18n } from "@/test/render";
import { WeatherStrip } from "./WeatherStrip";

const en = getDictionary("en");

const WEATHER: WeatherSnapshot = {
  current: {
    temperatureC: 24.5,
    humidityPct: 55,
    windSpeedKph: 8,
    windDirectionDeg: 270,
    weatherCode: 1,
    observedAt: "2026-11-21T14:30",
  },
  hourly: [],
  source: "open-meteo",
  sourceLabel: "Open-Meteo",
  fetchedAt: "2026-11-21T09:05:00.000Z",
};

describe("WeatherStrip", () => {
  it("renders nothing when weather is unavailable", () => {
    renderWithI18n(<WeatherStrip weather={null} />);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("shows temperature, humidity and compass wind", async () => {
    const { container } = renderWithI18n(<WeatherStrip weather={WEATHER} />);

    expect(screen.getByText("24.5 °C")).toBeInTheDocument();
    expect(screen.getByText("55%")).toBeInTheDocument();
    expect(screen.getByText("8 km/h W")).toBeInTheDocument();
    expect(screen.getByText("Open-Meteo")).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: en.weather.title }),
    ).toBeInTheDocument();

    expect(await expectNoA11yViolations(container)).toEqual([]);
  });

  it("uses dashes for missing measurements", () => {
    renderWithI18n(
      <WeatherStrip
        weather={{
          ...WEATHER,
          current: {
            ...WEATHER.current,
            temperatureC: null,
            humidityPct: null,
            windSpeedKph: null,
          },
        }}
      />,
    );

    expect(screen.getAllByText("—")).toHaveLength(3);
  });
});
