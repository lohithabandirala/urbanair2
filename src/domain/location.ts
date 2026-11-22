import type { ResolvedLocation } from "./types";
import { DEFAULT_LOCATION } from "@/lib/config";

/**
 * Validates whether an untrusted value matches the structural requirements
 * of a ResolvedLocation.
 */
export function isValidLocation(value: unknown): value is ResolvedLocation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ResolvedLocation>;
  return (
    typeof candidate.city === "string" &&
    candidate.city.trim().length > 0 &&
    candidate.city.length <= 80 &&
    typeof candidate.latitude === "number" &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === "number" &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

/**
 * Stored locations come from untrusted sources (e.g. localStorage),
 * so sanitize and fallback to DEFAULT_LOCATION if invalid.
 */
export function normalizeLocation(value: unknown): ResolvedLocation {
  if (!isValidLocation(value)) return DEFAULT_LOCATION;
  return {
    city: value.city.trim(),
    region: typeof value.region === "string" ? value.region : undefined,
    country: typeof value.country === "string" ? value.country : undefined,
    countryCode:
      typeof value.countryCode === "string" ? value.countryCode : undefined,
    latitude: value.latitude,
    longitude: value.longitude,
    timezone: typeof value.timezone === "string" ? value.timezone : undefined,
  };
}
