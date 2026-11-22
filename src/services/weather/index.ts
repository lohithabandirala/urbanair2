import type { ResolvedLocation, WeatherSnapshot } from "@/domain/types";
import { CACHE_TTL } from "@/lib/config";
import { cached } from "@/lib/cache";
import { fetchOpenMeteoWeather } from "./openMeteo";
import { fetchOpenWeather } from "./openWeather";
import type { WeatherProvider } from "./types";

export type { WeatherProvider };
export { fetchOpenMeteoWeather, fetchOpenWeather };

export function defaultWeatherProviders(): WeatherProvider[] {
  const providers: WeatherProvider[] = [];
  if (process.env.OPENWEATHER_API_KEY?.trim()) {
    providers.push({ id: "openweather", fetch: fetchOpenWeather });
  }
  providers.push({ id: "open-meteo", fetch: fetchOpenMeteoWeather });
  return providers;
}

/**
 * Weather is contextual, not safety-critical. If every provider fails we
 * return null and the UI gracefully hides the conditions strip.
 */
export async function getWeather(
  location: ResolvedLocation,
  providers: WeatherProvider[] = defaultWeatherProviders(),
): Promise<WeatherSnapshot | null> {
  for (const provider of providers) {
    const key = `weather:${provider.id}:${location.latitude.toFixed(
      3,
    )},${location.longitude.toFixed(3)}`;
    try {
      const { value } = await cached(
        key,
        { ttlMs: CACHE_TTL.weatherMs, staleMs: CACHE_TTL.weatherStaleMs },
        () => provider.fetch(location),
      );
      return value;
    } catch (error) {
      console.warn(
        `[weather] provider ${provider.id} failed`,
        error instanceof Error ? error.message : error,
      );
    }
  }
  return null;
}
