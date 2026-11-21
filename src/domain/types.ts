/**
 * Shared domain types.
 *
 * Everything the UI renders about air quality is derived from these objects,
 * which in turn are produced by deterministic parsers and calculators. The
 * language model never creates or mutates a reading.
 */

export const AQI_CATEGORIES = [
  "good",
  "satisfactory",
  "moderate",
  "poor",
  "very-poor",
  "severe",
  "unknown",
] as const;

export type AqiCategory = (typeof AQI_CATEGORIES)[number];

export const POLLUTANT_KEYS = [
  "pm25",
  "pm10",
  "no2",
  "so2",
  "co",
  "o3",
  "nh3",
] as const;

export type PollutantKey = (typeof POLLUTANT_KEYS)[number];

export type ReadingUnit = "µg/m³" | "mg/m³";

export interface PollutantReading {
  key: PollutantKey;
  /** Concentration in the unit declared below. `null` means "not reported". */
  value: number | null;
  unit: ReadingUnit;
  /** CPCB sub-index for this pollutant, if calculable. */
  subIndex: number | null;
}

export interface AqiResult {
  aqi: number | null;
  category: AqiCategory;
  dominantPollutant: PollutantKey | null;
  subIndices: Partial<Record<PollutantKey, number>>;
}

export interface ResolvedLocation {
  city: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
}

export type DataSourceId = "cpcb" | "waqi" | "open-meteo" | "demo";

/** How trustworthy/fresh the current payload is. Shown prominently in the UI. */
export type DataFreshness = "live" | "cached" | "sample";

export interface HourlyAirPoint {
  /** ISO timestamp local to the location, e.g. 2026-11-21T15:00. */
  time: string;
  pm25: number | null;
  pm10: number | null;
}

export interface AirQualitySnapshot {
  location: ResolvedLocation;
  aqi: number | null;
  category: AqiCategory;
  dominantPollutant: PollutantKey | null;
  readings: PollutantReading[];
  hourly: HourlyAirPoint[];
  observedAt: string;
  fetchedAt: string;
  source: DataSourceId;
  sourceLabel: string;
  freshness: DataFreshness;
  isLive: boolean;
  notes: string[];
}

export interface WeatherCurrent {
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedKph: number | null;
  windDirectionDeg: number | null;
  weatherCode: number | null;
  observedAt: string;
}

export interface WeatherHour {
  time: string;
  temperatureC: number | null;
  humidityPct: number | null;
  windSpeedKph: number | null;
  precipitationProbability: number | null;
}

export interface WeatherSnapshot {
  current: WeatherCurrent;
  hourly: WeatherHour[];
  source: "open-meteo" | "openweather" | "demo";
  sourceLabel: string;
  fetchedAt: string;
}

export const COMMUTE_MODES = [
  "car",
  "two-wheeler",
  "public-transport",
  "walk-cycle",
  "work-from-home",
] as const;

export type CommuteMode = (typeof COMMUTE_MODES)[number];

export const COOKING_FUELS = ["lpg", "electric", "biomass", "kerosene"] as const;

export type CookingFuel = (typeof COOKING_FUELS)[number];

export const VULNERABLE_GROUPS = [
  "children",
  "elderly",
  "pregnant",
  "respiratory",
] as const;

export type VulnerableGroup = (typeof VULNERABLE_GROUPS)[number];

export interface UserProfile {
  commuteMode: CommuteMode;
  cookingFuel: CookingFuel;
  vulnerableGroups: VulnerableGroup[];
  exercisesOutdoors: boolean;
}

export const DEFAULT_PROFILE: UserProfile = {
  commuteMode: "car",
  cookingFuel: "lpg",
  vulnerableGroups: [],
  exercisesOutdoors: true,
};

export type PlanWindowId = "morning" | "midday" | "evening";

export type OutdoorVerdict = "recommended" | "caution" | "avoid";

export interface PlanNote {
  key: string;
  vars?: Record<string, string | number>;
}

export interface PlanWindow {
  id: PlanWindowId;
  startHour: number;
  endHour: number;
  aqi: number | null;
  category: AqiCategory;
  verdict: OutdoorVerdict;
  isBestWindow: boolean;
  notes: PlanNote[];
}

export interface DailyPlan {
  windows: PlanWindow[];
  bestWindowId: PlanWindowId | null;
  headline: PlanNote;
  hasForecast: boolean;
}

export type TravelMode =
  | "petrol-car"
  | "diesel-car"
  | "cng-car"
  | "electric-car"
  | "two-wheeler"
  | "bus"
  | "metro"
  | "walk-cycle";

export interface ImpactInput {
  distanceKmPerDay: number;
  daysPerWeek: number;
  currentMode: TravelMode;
  alternativeMode: TravelMode;
  occupants: number;
}

export interface ImpactEstimate {
  co2KgPerDay: number;
  pm25GPerDay: number;
  noxGPerDay: number;
  co2KgPerMonth: number;
  pm25GPerMonth: number;
}

export interface ImpactResult {
  baseline: ImpactEstimate;
  alternative: ImpactEstimate;
  savings: ImpactEstimate;
  daysPerWeek: number;
}

export type AssistantProvider = "gemini" | "grounded-fallback" | "guard";
