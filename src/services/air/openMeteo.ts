import { z } from "zod";
import { calculateAqi, buildReadings, coMicrogramsToMilligrams } from "@/domain/aqi";
import type { AirQualitySnapshot, ResolvedLocation } from "@/domain/types";
import { fetchJson, parseUpstream } from "../upstream";

const currentSchema = z
  .object({
    time: z.string(),
    pm2_5: z.number().nullable().optional(),
    pm10: z.number().nullable().optional(),
    carbon_monoxide: z.number().nullable().optional(),
    nitrogen_dioxide: z.number().nullable().optional(),
    sulphur_dioxide: z.number().nullable().optional(),
    ozone: z.number().nullable().optional(),
    ammonia: z.number().nullable().optional(),
  })
  .passthrough();

const hourlySchema = z
  .object({
    time: z.array(z.string()),
    pm2_5: z.array(z.number().nullable()).optional(),
    pm10: z.array(z.number().nullable()).optional(),
  })
  .passthrough();

const responseSchema = z
  .object({
    current: currentSchema,
    hourly: hourlySchema.optional(),
    timezone: z.string().optional(),
  })
  .passthrough();

export const OPEN_METEO_AIR_URL =
  "https://air-quality-api.open-meteo.com/v1/air-quality";

/**
 * Open-Meteo's air quality API is keyless and global. It serves CAMS model
 * output (not a single physical monitor), which the UI labels honestly.
 * All pollutant values arrive in µg/m³; CO is converted for CPCB breakpoints.
 */
export async function fetchOpenMeteoAir(
  location: ResolvedLocation,
): Promise<AirQualitySnapshot> {
  const url = new URL(OPEN_METEO_AIR_URL);
  url.searchParams.set("latitude", String(location.latitude));
  url.searchParams.set("longitude", String(location.longitude));
  url.searchParams.set(
    "current",
    "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,ammonia",
  );
  url.searchParams.set("hourly", "pm10,pm2_5");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "2");

  const raw = await fetchJson(url.toString(), { provider: "open-meteo" });
  const parsed = parseUpstream(responseSchema, raw, "open-meteo");
  const { current } = parsed;

  const concentrations = {
    pm25: current.pm2_5 ?? null,
    pm10: current.pm10 ?? null,
    no2: current.nitrogen_dioxide ?? null,
    so2: current.sulphur_dioxide ?? null,
    co: coMicrogramsToMilligrams(current.carbon_monoxide),
    o3: current.ozone ?? null,
    nh3: current.ammonia ?? null,
  };

  const aqi = calculateAqi(concentrations);
  const hourly = zipHourly(parsed.hourly);

  return {
    location: {
      ...location,
      timezone: parsed.timezone ?? location.timezone,
    },
    aqi: aqi.aqi,
    category: aqi.category,
    dominantPollutant: aqi.dominantPollutant,
    readings: buildReadings(concentrations),
    hourly,
    observedAt: current.time,
    fetchedAt: new Date().toISOString(),
    source: "open-meteo",
    sourceLabel: "Open-Meteo / CAMS model",
    freshness: "live",
    isLive: true,
    notes: ["modelled", "coConverted"],
  };
}

function zipHourly(
  hourly: z.infer<typeof hourlySchema> | undefined,
): AirQualitySnapshot["hourly"] {
  if (!hourly) return [];
  const pm25 = hourly.pm2_5 ?? [];
  const pm10 = hourly.pm10 ?? [];
  const length = Math.min(hourly.time.length, Math.max(pm25.length, pm10.length));

  const points: AirQualitySnapshot["hourly"] = [];
  for (let i = 0; i < length; i += 1) {
    const time = hourly.time[i];
    if (!time) continue;
    points.push({
      time,
      pm25: pm25[i] ?? null,
      pm10: pm10[i] ?? null,
    });
  }
  return points;
}
