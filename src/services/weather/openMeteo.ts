import { z } from "zod";
import type { ResolvedLocation, WeatherHour, WeatherSnapshot } from "@/domain/types";
import { fetchJson, parseUpstream } from "../upstream";

export const openMeteoSchema = z
  .object({
    current: z
      .object({
        time: z.string(),
        temperature_2m: z.number().nullable().optional(),
        relative_humidity_2m: z.number().nullable().optional(),
        wind_speed_10m: z.number().nullable().optional(),
        wind_direction_10m: z.number().nullable().optional(),
        weather_code: z.number().nullable().optional(),
      })
      .passthrough(),
    hourly: z
      .object({
        time: z.array(z.string()),
        temperature_2m: z.array(z.number().nullable()).optional(),
        relative_humidity_2m: z.array(z.number().nullable()).optional(),
        wind_speed_10m: z.array(z.number().nullable()).optional(),
        precipitation_probability: z.array(z.number().nullable()).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export function zipHourly(
  hourly: z.infer<typeof openMeteoSchema>["hourly"],
): WeatherHour[] {
  if (!hourly) return [];
  const temperature = hourly.temperature_2m ?? [];
  const humidity = hourly.relative_humidity_2m ?? [];
  const wind = hourly.wind_speed_10m ?? [];
  const precipitation = hourly.precipitation_probability ?? [];
  const length = Math.min(
    hourly.time.length,
    Math.max(temperature.length, humidity.length, wind.length, 1),
  );

  const points: WeatherHour[] = [];
  for (let i = 0; i < length; i += 1) {
    const time = hourly.time[i];
    if (!time) continue;
    points.push({
      time,
      temperatureC: temperature[i] ?? null,
      humidityPct: humidity[i] ?? null,
      windSpeedKph: wind[i] ?? null,
      precipitationProbability: precipitation[i] ?? null,
    });
  }
  return points;
}

export async function fetchOpenMeteoWeather(
  location: ResolvedLocation,
): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code",
  );
  url.searchParams.set(
    "hourly",
    "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability",
  );
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "2");

  const raw = await fetchJson(url.toString(), { provider: "open-meteo-weather" });
  const parsed = parseUpstream(openMeteoSchema, raw, "open-meteo-weather");
  const { current, hourly } = parsed;

  return {
    current: {
      temperatureC: current.temperature_2m ?? null,
      humidityPct: current.relative_humidity_2m ?? null,
      windSpeedKph: current.wind_speed_10m ?? null,
      windDirectionDeg: current.wind_direction_10m ?? null,
      weatherCode: current.weather_code ?? null,
      observedAt: current.time,
    },
    hourly: zipHourly(hourly),
    source: "open-meteo",
    sourceLabel: "Open-Meteo",
    fetchedAt: new Date().toISOString(),
  };
}
