import type { Page, Route } from "@playwright/test";
import { getDictionary } from "../src/lib/i18n";
import type {
  AirQualitySnapshot,
  WeatherSnapshot,
} from "../src/domain/types";

export const en = getDictionary("en");

const DELHI = {
  city: "Delhi",
  region: "National Capital Territory of Delhi",
  country: "India",
  countryCode: "IN",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

export const LIVE_SNAPSHOT: AirQualitySnapshot = {
  location: DELHI,
  aqi: 265,
  category: "poor",
  dominantPollutant: "pm25",
  readings: [
    { key: "pm25", value: 80, unit: "µg/m³", subIndex: 265 },
    { key: "pm10", value: 90, unit: "µg/m³", subIndex: 90 },
    { key: "no2", value: 41, unit: "µg/m³", subIndex: 41 },
    { key: "so2", value: 12, unit: "µg/m³", subIndex: 12 },
    { key: "co", value: 0.632, unit: "mg/m³", subIndex: 632 },
    { key: "o3", value: 194, unit: "µg/m³", subIndex: 194 },
    { key: "nh3", value: 5, unit: "µg/m³", subIndex: 5 },
  ],
  hourly: [],
  observedAt: "2026-11-21T14:30",
  fetchedAt: "2026-11-21T09:05:00.000Z",
  source: "open-meteo",
  sourceLabel: "Open-Meteo / CAMS model",
  freshness: "live",
  isLive: true,
  notes: ["modelled"],
};

export const SAMPLE_SNAPSHOT: AirQualitySnapshot = {
  ...LIVE_SNAPSHOT,
  source: "demo",
  sourceLabel: "Built-in sample",
  freshness: "sample",
  isLive: false,
  notes: ["sample"],
};

export const WEATHER: WeatherSnapshot = {
  current: {
    temperatureC: 24,
    humidityPct: 41,
    windSpeedKph: 9,
    windDirectionDeg: 270,
    weatherCode: 0,
    observedAt: "2026-11-21T14:30",
  },
  hourly: [],
  source: "open-meteo",
  sourceLabel: "Open-Meteo",
  fetchedAt: "2026-11-21T09:05:00.000Z",
};

interface MockOptions {
  air?: AirQualitySnapshot;
  airStatus?: number;
  airDelayMs?: number;
  weather?: WeatherSnapshot | null;
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

/**
 * Replaces the network with deterministic fixtures so E2E never depends on a
 * live upstream. The provenance fields are still exercised end to end.
 */
export async function mockApis(page: Page, options: MockOptions = {}) {
  const {
    air = LIVE_SNAPSHOT,
    airStatus = 200,
    airDelayMs = 0,
    weather = WEATHER,
  } = options;

  await page.route("**/api/air?*", async (route) => {
    if (airDelayMs) await new Promise((resolve) => setTimeout(resolve, airDelayMs));
    await json(
      route,
      airStatus === 200
        ? { ok: true, data: air }
        : { ok: false, error: { message: "Upstream unavailable" } },
      airStatus,
    );
  });

  await page.route("**/api/weather?*", (route) =>
    json(route, { ok: true, data: weather }),
  );
}
