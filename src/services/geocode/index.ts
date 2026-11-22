/**
 * Geocoding service barrel — re-exports all public symbols from submodules.
 *
 * @module services/geocode
 */
export type { Place } from "./types";
export { FALLBACK_CITIES, fallbackSearch } from "./defaultCities";
export { searchPlaces } from "./searchPlaces";
export { reverseGeocode } from "./reverseGeocode";
export { resolveLocation } from "./resolveLocation";
export type { LocationInput } from "./resolveLocation";
