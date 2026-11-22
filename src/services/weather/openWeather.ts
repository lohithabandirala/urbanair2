import { z } from "zod";
import type { ResolvedLocation, WeatherSnapshot } from "@/domain/types";
import { fetchJson, parseUpstream } from "../upstream";

export const owmCurrentSchema = z
  .object({
    dt: z.number(),
    main: z
      .object({
        temp: z.number().optional(),
        humidity: z.number().optional(),
      })
      .passthrough(),
    wind: z
      .object({
        speed: z.number().optional(),
        deg: z.number().optional(),
      })
      .passthrough()
      .optional(),
    weather: z
      .array(z.object({ id: z.number() }).passthrough())
      .optional(),
  })
  .passthrough();

export const owmForecastSchema = z
  .object({
    list: z.array(
      z
        .object({
          dt: z.number(),
          main: z
            .object({
              temp: z.number().optional(),
              humidity: z.number().optional(),
            })
            .passthrough(),
          wind: z
            .object({
              speed: z.number().optional(),
              deg: z.number().optional(),
            })
            .passthrough()
            .optional(),
          pop: z.number().optional(),
        })
        .passthrough(),
    ),
  })
  .passthrough();

export async function fetchOpenWeather(
  location: ResolvedLocation,
): Promise<WeatherSnapshot> {
  const key = process.env.OPENWEATHER_API_KEY?.trim();
  if (!key) throw new Error("OpenWeatherMap key is not configured");

  const base = "https://api.openweathermap.org/data/2.5";
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    appid: key,
    units: "metric",
  });

  // Current conditions and the 3-hour forecast are independent: fetch in parallel.
  const [currentRaw, forecastRaw] = await Promise.all([
    fetchJson(`${base}/weather?${params.toString()}`, {
      provider: "openweather",
    }),
    fetchJson(`${base}/forecast?${params.toString()}`, {
      provider: "openweather",
    }),
  ]);

  const current = parseUpstream(owmCurrentSchema, currentRaw, "openweather");
  const forecast = parseUpstream(
    owmForecastSchema,
    forecastRaw,
    "openweather",
  );

  return {
    current: {
      temperatureC: current.main.temp ?? null,
      humidityPct: current.main.humidity ?? null,
      windSpeedKph:
        current.wind?.speed !== undefined
          ? Math.round(current.wind.speed * 3.6 * 10) / 10
          : null,
      windDirectionDeg: current.wind?.deg ?? null,
      weatherCode: current.weather?.[0]?.id ?? null,
      observedAt: new Date(current.dt * 1000).toISOString(),
    },
    hourly: forecast.list.slice(0, 16).map((entry) => ({
      time: new Date(entry.dt * 1000).toISOString(),
      temperatureC: entry.main.temp ?? null,
      humidityPct: entry.main.humidity ?? null,
      windSpeedKph:
        entry.wind?.speed !== undefined
          ? Math.round(entry.wind.speed * 3.6 * 10) / 10
          : null,
      precipitationProbability:
        entry.pop !== undefined ? Math.round(entry.pop * 100) : null,
    })),
    source: "openweather",
    sourceLabel: "OpenWeatherMap",
    fetchedAt: new Date().toISOString(),
  };
}
