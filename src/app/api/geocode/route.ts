import { handleRouteError, jsonOk, queryObject } from "@/lib/http";
import { geocodeQuerySchema, parseOrThrow } from "@/lib/validation";
import { reverseGeocode, searchPlaces } from "@/services/geocode";

export const dynamic = "force-dynamic";

const GEO_CACHE =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

/**
 * GET /api/geocode?q=Delhi      — forward search
 * GET /api/geocode?lat=&lon=    — reverse lookup
 */
export async function GET(request: Request) {
  try {
    const query = parseOrThrow(geocodeQuerySchema, queryObject(request.url));

    if (query.q) {
      const results = await searchPlaces(query.q);
      return jsonOk({ query: query.q, results }, { cacheControl: GEO_CACHE });
    }

    const place = await reverseGeocode(query.lat as number, query.lon as number);
    return jsonOk(
      { query: null, results: place ? [place] : [] },
      { cacheControl: GEO_CACHE },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
