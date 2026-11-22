import type { ResolvedLocation } from "@/domain/types";
import { HttpError } from "@/lib/errors";
import { reverseGeocode } from "./reverseGeocode";
import { searchPlaces } from "./searchPlaces";

/** Raw location input accepted by the geocode API route. */
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
