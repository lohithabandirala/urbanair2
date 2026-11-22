import { CACHE_TTL } from "@/lib/config";
import { cached } from "@/lib/cache";
import { fetchJson, parseUpstream } from "../upstream";
import { reverseSchema } from "./schemas";
import type { Place } from "./types";

/**
 * Reverse-geocodes a coordinate pair into a named place.
 * Returns `null` if the lookup fails or yields no usable name.
 */
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
