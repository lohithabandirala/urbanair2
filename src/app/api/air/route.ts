import { ROUTE_CACHE_CONTROL } from "@/lib/config";
import { handleRouteError, jsonOk, queryObject } from "@/lib/http";
import { locationQuerySchema, parseOrThrow } from "@/lib/validation";
import { getAirQuality } from "@/services/air";
import { resolveLocation } from "@/services/geocode";

export const dynamic = "force-dynamic";

/**
 * GET /api/air?city=Delhi
 * GET /api/air?lat=28.61&lon=77.20&label=Delhi
 *
 * Returns a provenance-tagged snapshot. If every live provider fails, the
 * service returns clearly labelled sample data rather than an error page.
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
    const snapshot = await getAirQuality(location);

    return jsonOk(snapshot, {
      cacheControl: ROUTE_CACHE_CONTROL,
      headers: {
        "X-Data-Source": snapshot.source,
        "X-Data-Freshness": snapshot.freshness,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
