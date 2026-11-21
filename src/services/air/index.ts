import type { AirQualitySnapshot, ResolvedLocation } from "@/domain/types";
import { CACHE_TTL } from "@/lib/config";
import { cached } from "@/lib/cache";
import { UpstreamError } from "../upstream";
import { fetchCpcbAir } from "./cpcb";
import { buildDemoAir } from "./demo";
import { fetchOpenMeteoAir } from "./openMeteo";
import { fetchWaqiAir } from "./waqi";

export interface AirProvider {
  id: "cpcb" | "waqi" | "open-meteo";
  fetch: (location: ResolvedLocation) => Promise<AirQualitySnapshot>;
}

/**
 * Provider order: official Indian stations first (when configured), then
 * station-level WAQI, then the keyless CAMS model. This means a reviewer with
 * no API keys still gets real live data, while an Indian deployment with a
 * CPCB key prefers official measurements.
 */
export function defaultAirProviders(): AirProvider[] {
  const providers: AirProvider[] = [];
  if (process.env.CPCB_API_KEY?.trim()) {
    providers.push({ id: "cpcb", fetch: fetchCpcbAir });
  }
  if (process.env.WAQI_TOKEN?.trim()) {
    providers.push({ id: "waqi", fetch: fetchWaqiAir });
  }
  providers.push({ id: "open-meteo", fetch: fetchOpenMeteoAir });
  return providers;
}

const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 5 * 60 * 1000;

/** Test helper: forget provider cooldowns between cases. */
export function resetAirProviderState(): void {
  cooldowns.clear();
}

export interface GetAirQualityOptions {
  providers?: AirProvider[];
  /** When false, throws instead of returning sample data. */
  allowDemo?: boolean;
}

export async function getAirQuality(
  location: ResolvedLocation,
  options: GetAirQualityOptions = {},
): Promise<AirQualitySnapshot> {
  const usingDefaults = options.providers === undefined;
  const providers = options.providers ?? defaultAirProviders();
  const errors: string[] = [];
  let partial: AirQualitySnapshot | null = null;

  for (const provider of providers) {
    if (usingDefaults && (cooldowns.get(provider.id) ?? 0) > Date.now()) {
      continue;
    }

    const cacheKey = `air:${provider.id}:${location.latitude.toFixed(
      3,
    )},${location.longitude.toFixed(3)}`;

    try {
      const { value, status } = await cached(
        cacheKey,
        { ttlMs: CACHE_TTL.airMs, staleMs: CACHE_TTL.airStaleMs },
        () => provider.fetch(location),
      );

      if (value.aqi === null) {
        partial ??= value;
        errors.push(`${provider.id}: no particulate reading`);
        continue;
      }

      if (status === "stale") {
        return {
          ...value,
          freshness: "cached",
          notes: [...new Set([...value.notes, "cached"])],
        };
      }
      return value;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown provider error";
      errors.push(`${provider.id}: ${message}`);
      console.warn(`[air] provider ${provider.id} failed: ${message}`);
      if (usingDefaults) {
        cooldowns.set(provider.id, Date.now() + COOLDOWN_MS);
      }
    }
  }

  if (partial) return partial;

  if (options.allowDemo !== false) {
    console.warn(
      `[air] all providers failed for ${location.city}; using sample data. ${errors.join(" | ")}`,
    );
    return buildDemoAir(location);
  }

  throw new UpstreamError(
    `No air quality provider succeeded for ${location.city}`,
    "air",
  );
}
