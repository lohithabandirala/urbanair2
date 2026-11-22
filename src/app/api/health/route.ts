import { APP_VERSION, getProviderConfig } from "@/lib/config";
import { jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — deployment/CI probe. Exposes only booleans, never keys.
 */
export async function GET() {
  return jsonOk(
    {
      status: "ok",
      version: APP_VERSION,
      time: new Date().toISOString(),
      providers: getProviderConfig(),
    },
    { cacheControl: "no-store" },
  );
}
