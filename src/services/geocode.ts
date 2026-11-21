import { z } from "zod";
import type { ResolvedLocation } from "@/domain/types";
import { CACHE_TTL } from "@/lib/config";
import { cached } from "@/lib/cache";
import { HttpError } from "@/lib/errors";
import { fetchJson, parseUpstream } from "./upstream";

export interface Place {
  id?: number;
  name: string;
  region?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
}

const geocodeResponseSchema = z
  .object({
    results: z
      .array(
        z
          .object({
            id: z.number().optional(),
            name: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            country_code: z.string().optional(),
            country: z.string().optional(),
            admin1: z.string().optional(),
            timezone: z.string().optional(),
            population: z.number().optional(),
          })
          .passthrough(),
      )
      .optional(),
  })
  .passthrough();

const reverseSchema = z
  .object({
    city: z.string().optional(),
    locality: z.string().optional(),
    principalSubdivision: z.string().optional(),
    countryName: z.string().optional(),
    countryCode: z.string().optional(),
  })
  .passthrough();

/**
 * A small offline fallback so city search still works when the geocoder is
 * unreachable (and during demo mode). Coordinates are city-centre points.
 */
const FALLBACK_CITIES: ReadonlyArray<Place> = [
  { name: "Delhi", region: "Delhi", country: "India", countryCode: "IN", latitude: 28.6139, longitude: 77.209, timezone: "Asia/Kolkata" },
  { name: "Mumbai", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 19.076, longitude: 72.8777, timezone: "Asia/Kolkata" },
  { name: "Bengaluru", region: "Karnataka", country: "India", countryCode: "IN", latitude: 12.9716, longitude: 77.5946, timezone: "Asia/Kolkata" },
  { name: "Chennai", region: "Tamil Nadu", country: "India", countryCode: "IN", latitude: 13.0827, longitude: 80.2707, timezone: "Asia/Kolkata" },
  { name: "Kolkata", region: "West Bengal", country: "India", countryCode: "IN", latitude: 22.5726, longitude: 88.3639, timezone: "Asia/Kolkata" },
  { name: "Hyderabad", region: "Telangana", country: "India", countryCode: "IN", latitude: 17.385, longitude: 78.4867, timezone: "Asia/Kolkata" },
  { name: "Pune", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 18.5204, longitude: 73.8567, timezone: "Asia/Kolkata" },
  { name: "Ahmedabad", region: "Gujarat", country: "India", countryCode: "IN", latitude: 23.0225, longitude: 72.5714, timezone: "Asia/Kolkata" },
  { name: "Jaipur", region: "Rajasthan", country: "India", countryCode: "IN", latitude: 26.9124, longitude: 75.7873, timezone: "Asia/Kolkata" },
  { name: "Lucknow", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 26.8467, longitude: 80.9462, timezone: "Asia/Kolkata" },
  { name: "Kanpur", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 26.4499, longitude: 80.3319, timezone: "Asia/Kolkata" },
  { name: "Varanasi", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 25.3176, longitude: 82.9739, timezone: "Asia/Kolkata" },
  { name: "Patna", region: "Bihar", country: "India", countryCode: "IN", latitude: 25.5941, longitude: 85.1376, timezone: "Asia/Kolkata" },
  { name: "Chandigarh", region: "Chandigarh", country: "India", countryCode: "IN", latitude: 30.7333, longitude: 76.7794, timezone: "Asia/Kolkata" },
  { name: "Gurugram", region: "Haryana", country: "India", countryCode: "IN", latitude: 28.4595, longitude: 77.0266, timezone: "Asia/Kolkata" },
  { name: "Noida", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 28.5355, longitude: 77.391, timezone: "Asia/Kolkata" },
  { name: "Faridabad", region: "Haryana", country: "India", countryCode: "IN", latitude: 28.4089, longitude: 77.3178, timezone: "Asia/Kolkata" },
  { name: "Ghaziabad", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 28.6692, longitude: 77.4538, timezone: "Asia/Kolkata" },
  { name: "Agra", region: "Uttar Pradesh", country: "India", countryCode: "IN", latitude: 27.1767, longitude: 78.0081, timezone: "Asia/Kolkata" },
  { name: "Amritsar", region: "Punjab", country: "India", countryCode: "IN", latitude: 31.634, longitude: 74.8723, timezone: "Asia/Kolkata" },
  { name: "Ludhiana", region: "Punjab", country: "India", countryCode: "IN", latitude: 30.901, longitude: 75.8573, timezone: "Asia/Kolkata" },
  { name: "Bhopal", region: "Madhya Pradesh", country: "India", countryCode: "IN", latitude: 23.2599, longitude: 77.4126, timezone: "Asia/Kolkata" },
  { name: "Indore", region: "Madhya Pradesh", country: "India", countryCode: "IN", latitude: 22.7196, longitude: 75.8577, timezone: "Asia/Kolkata" },
  { name: "Nagpur", region: "Maharashtra", country: "India", countryCode: "IN", latitude: 21.1458, longitude: 79.0882, timezone: "Asia/Kolkata" },
  { name: "Surat", region: "Gujarat", country: "India", countryCode: "IN", latitude: 21.1702, longitude: 72.8311, timezone: "Asia/Kolkata" },
  { name: "Kochi", region: "Kerala", country: "India", countryCode: "IN", latitude: 9.9312, longitude: 76.2673, timezone: "Asia/Kolkata" },
  { name: "Thiruvananthapuram", region: "Kerala", country: "India", countryCode: "IN", latitude: 8.5241, longitude: 76.9366, timezone: "Asia/Kolkata" },
  { name: "Guwahati", region: "Assam", country: "India", countryCode: "IN", latitude: 26.1445, longitude: 91.7362, timezone: "Asia/Kolkata" },
  { name: "Bhubaneswar", region: "Odisha", country: "India", countryCode: "IN", latitude: 20.2961, longitude: 85.8245, timezone: "Asia/Kolkata" },
  { name: "Visakhapatnam", region: "Andhra Pradesh", country: "India", countryCode: "IN", latitude: 17.6868, longitude: 83.2185, timezone: "Asia/Kolkata" },
];

function fallbackSearch(query: string): Place[] {
  const needle = query.trim().toLowerCase();
  return FALLBACK_CITIES.filter(
    (city) =>
      city.name.toLowerCase().includes(needle) ||
      needle.includes(city.name.toLowerCase()),
  ).slice(0, 6);
}

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

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<Place | null> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.searchParams.set("latitude", String(latitude));
  url.searchParams.set("longitude", String(longitude));
  url.searchParams.set("localityLanguage", "en");

  const cacheKey = `geo:r:${latitude.toFixed(3)},${longitude.toFixed(3)}`;

  try {
    const { value } = await cached(
      cacheKey,
      { ttlMs: CACHE_TTL.geocodeMs, staleMs: CACHE_TTL.geocodeStaleMs },
      async () => {
        const raw = await fetchJson(url.toString(), {
          provider: "reverse-geocoder",
        });
        const parsed = parseUpstream(reverseSchema, raw, "reverse-geocoder");
        const name =
          parsed.city ||
          parsed.locality ||
          parsed.principalSubdivision ||
          "";
        if (!name) return null;
        return {
          name,
          region: parsed.principalSubdivision,
          country: parsed.countryName,
          countryCode: parsed.countryCode,
          latitude,
          longitude,
        } satisfies Place;
      },
    );
    return value;
  } catch (error) {
    console.warn("[geocode] reverse lookup failed", error);
    return null;
  }
}

export interface LocationInput {
  city?: string;
  lat?: number;
  lon?: number;
  label?: string;
}

/** Turns a validated query into a fully resolved location. */
export async function resolveLocation(
  input: LocationInput,
): Promise<ResolvedLocation> {
  if (input.lat !== undefined && input.lon !== undefined) {
    if (input.city) {
      return {
        city: input.city,
        latitude: input.lat,
        longitude: input.lon,
      };
    }

    const place = await reverseGeocode(input.lat, input.lon);
    return {
      city: place?.name || input.label || "Current location",
      region: place?.region,
      country: place?.country,
      countryCode: place?.countryCode,
      latitude: input.lat,
      longitude: input.lon,
    };
  }

  if (!input.city) {
    throw new HttpError(
      400,
      "missing_location",
      "Provide a city, or both lat and lon.",
    );
  }

  const places = await searchPlaces(input.city);
  const place = places[0];
  if (!place) {
    throw new HttpError(
      404,
      "location_not_found",
      "We could not find that place. Try a nearby city.",
    );
  }

  return {
    city: place.name,
    region: place.region,
    country: place.country,
    countryCode: place.countryCode,
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
  };
}
