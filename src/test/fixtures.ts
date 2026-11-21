import { buildReadings, calculateAqi } from "@/domain/aqi";
import type {
  AirQualitySnapshot,
  ResolvedLocation,
  UserProfile,
} from "@/domain/types";

export const DELHI: ResolvedLocation = {
  city: "Delhi",
  region: "National Capital Territory of Delhi",
  country: "India",
  countryCode: "IN",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

export const TEST_PROFILE: UserProfile = {
  commuteMode: "car",
  cookingFuel: "lpg",
  vulnerableGroups: [],
  exercisesOutdoors: true,
};

const DEFAULT_CONCENTRATIONS = {
  pm25: 80,
  pm10: 90,
  no2: 41,
  so2: 12,
  co: 0.632,
  o3: 194,
  nh3: 5,
} as const;

export function makeSnapshot(
  overrides: Partial<AirQualitySnapshot> = {},
): AirQualitySnapshot {
  const aqi = calculateAqi(DEFAULT_CONCENTRATIONS);

  return {
    location: DELHI,
    aqi: aqi.aqi,
    category: aqi.category,
    dominantPollutant: aqi.dominantPollutant,
    readings: buildReadings(DEFAULT_CONCENTRATIONS),
    hourly: [],
    observedAt: "2026-11-21T14:30",
    fetchedAt: "2026-11-21T09:05:00.000Z",
    source: "open-meteo",
    sourceLabel: "Open-Meteo / CAMS model",
    freshness: "live",
    isLive: true,
    notes: ["modelled"],
    ...overrides,
  };
}

export function jsonResponse(
  data: unknown,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}
