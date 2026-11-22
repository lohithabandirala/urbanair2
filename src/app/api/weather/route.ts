import { ROUTE_CACHE_CONTROL } from "@/lib/config";
import { handleRouteError, jsonOk, queryObject } from "@/lib/http";
import { locationQuerySchema, parseOrThrow } from "@/lib/validation";
import { resolveLocation } from "@/services/geocode";
import { getWeather } from "@/services/weather";

export const dynamic = "force-dynamic";

/**
 * GET /api/weather?city=Delhi
 *
 * Weather is contextual. `data` may be null when every provider is down;
 * the client hides the conditions strip instead of failing the page.
 */
export async function GET(request: Request) {
  try {
    const query = parseOrThrow(locationQuerySchema, queryObject(request.url));
    const location = await resolveLocation({
      city: query.city,
      lat: query.lat,
      lon: query.lon,
      label: query.label,
    });
    const weather = await getWeather(location);

    return jsonOk(weather, { cacheControl: ROUTE_CACHE_CONTROL });
  } catch (error) {
    return handleRouteError(error);
  }
}
