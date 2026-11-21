import type { ResolvedLocation } from "@/domain/types";

export const APP_NAME = "Saaf Hawa";
export const APP_VERSION = "1.0.0";

/**
 * Delhi is the default so the app has something meaningful to show on first
 * load. The UI states this explicitly and lets the user change it immediately.
 */
export const DEFAULT_LOCATION: ResolvedLocation = {
  city: "Delhi",
  region: "National Capital Territory of Delhi",
  country: "India",
  countryCode: "IN",
  latitude: 28.6139,
  longitude: 77.209,
  timezone: "Asia/Kolkata",
};

export const CACHE_TTL = {
  /** Air quality updates hourly at the source; 10 minutes is plenty. */
  airMs: 10 * 60 * 1000,
  airStaleMs: 6 * 60 * 60 * 1000,
  weatherMs: 10 * 60 * 1000,
  weatherStaleMs: 3 * 60 * 60 * 1000,
  geocodeMs: 24 * 60 * 60 * 1000,
  geocodeStaleMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export const FETCH_TIMEOUT_MS = 7000;
export const MAX_QUESTION_LENGTH = 500;
export const MAX_BODY_BYTES = 8 * 1024;

export const RATE_LIMIT = {
  limit: 10,
  windowMs: 60 * 1000,
} as const;

/** Route cache headers: browser 0, CDN 5 min, serve stale for an hour. */
export const ROUTE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=300, stale-while-revalidate=3600";

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

/**
 * Reads provider configuration at call time (not module load) so tests and
 * serverless cold starts see the current environment.
 */
export function getProviderConfig() {
  return {
    cpcb: Boolean(process.env.CPCB_API_KEY?.trim()),
    waqi: Boolean(process.env.WAQI_TOKEN?.trim()),
    openWeather: Boolean(process.env.OPENWEATHER_API_KEY?.trim()),
    gemini: Boolean(process.env.GEMINI_API_KEY?.trim()),
  };
}
