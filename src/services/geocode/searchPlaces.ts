import { CACHE_TTL } from "@/lib/config";
import { cached } from "@/lib/cache";
import { fetchJson, parseUpstream } from "../upstream";
import { fallbackSearch } from "./defaultCities";
import { geocodeResponseSchema } from "./schemas";
import type { Place } from "./types";

/**
 * Searches for places by name using the Open-Meteo geocoding API.
 * Falls back to a built-in city list when the upstream is unavailable.
 */
export async function searchPlaces(
  query: string,
  language: "en" | "hi" = "en",
): Promise<Place[]> {
  const normalized = query.trim().slice(0, 80);
  if (normalized.length < 2) return [];

  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", normalized);
  url.searchParams.set("count", "6");
  url.searchParams.set("language", language);
  url.searchParams.set("format", "json");

  const cacheKey = `geo:q:${language}:${normalized.toLowerCase()}`;

  try {
    const { value } = await cached(
      cacheKey,
      { ttlMs: CACHE_TTL.geocodeMs, staleMs: CACHE_TTL.geocodeStaleMs },
      async () => {
        try {
          const raw = await fetchJson(url.toString(), { provider: "geocoder" });
          const parsed = parseUpstream(
            geocodeResponseSchema,
            raw,
            "geocoder",
          );
          return (parsed.results ?? []).map((result) => ({
            id: result.id,
            name: result.name,
            region: result.admin1,
            country: result.country,
            countryCode: result.country_code,
            latitude: result.latitude,
            longitude: result.longitude,
            timezone: result.timezone,
            population: result.population,
          }));
        } catch (error) {
          console.warn(
            "[geocode] live search failed; using built-in city list",
            error,
          );
          return fallbackSearch(normalized);
        }
      },
    );
    return value;
  } catch {
    return fallbackSearch(normalized);
  }
}
