import { z } from "zod";
import { buildReadings, calculateAqi } from "@/domain/aqi";
import type {
  AirQualitySnapshot,
  PollutantKey,
  ResolvedLocation,
} from "@/domain/types";
import { fetchJson, parseUpstream, UpstreamError } from "../upstream";

const iaqiEntry = z
  .object({ v: z.union([z.number(), z.string()]) })
  .passthrough();

const responseSchema = z
  .object({
    status: z.string(),
    data: z
      .object({
        city: z
          .object({
            name: z.string().optional(),
            geo: z.array(z.number()).optional(),
          })
          .passthrough()
          .optional(),
        time: z
          .object({
            s: z.string().optional(),
            iso: z.string().optional(),
          })
          .passthrough()
          .optional(),
        iaqi: z.record(z.string(), iaqiEntry).optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

const IAQI_MAP: Record<string, PollutantKey> = {
  pm25: "pm25",
  pm10: "pm10",
  no2: "no2",
  so2: "so2",
  co: "co",
  o3: "o3",
  nh3: "nh3",
};

function iaqiNumber(
  iaqi: Record<string, z.infer<typeof iaqiEntry>> | undefined,
  key: string,
): number | null {
  const entry = iaqi?.[key];
  if (!entry) return null;
  const value = Number(entry.v);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * WAQI supplies station-level data worldwide. Its own AQI number uses a
 * mixed scale, so we deliberately ignore it and recalculate from raw
 * concentrations using CPCB breakpoints.
 */
export async function fetchWaqiAir(
  location: ResolvedLocation,
): Promise<AirQualitySnapshot> {
  const token = process.env.WAQI_TOKEN?.trim();
  if (!token) {
    throw new UpstreamError("WAQI token is not configured", "waqi");
  }

  const url = new URL(
    `https://api.waqi.info/feed/geo:${location.latitude};${location.longitude}/`,
  );
  url.searchParams.set("token", token);

  const raw = await fetchJson(url.toString(), { provider: "waqi" });
  const parsed = parseUpstream(responseSchema, raw, "waqi");

  if (parsed.status !== "ok" || !parsed.data) {
    throw new UpstreamError("WAQI returned no station for this location", "waqi");
  }

  const concentrations: Partial<Record<PollutantKey, number | null>> = {};
  for (const [key, pollutant] of Object.entries(IAQI_MAP)) {
    concentrations[pollutant] = iaqiNumber(parsed.data.iaqi, key);
  }

  const aqi = calculateAqi(concentrations);
  const geo = parsed.data.city?.geo;

  return {
    location: {
      ...location,
      city: parsed.data.city?.name?.split(",")[0]?.trim() || location.city,
      latitude: geo?.[0] ?? location.latitude,
      longitude: geo?.[1] ?? location.longitude,
    },
    aqi: aqi.aqi,
    category: aqi.category,
    dominantPollutant: aqi.dominantPollutant,
    readings: buildReadings(concentrations),
    hourly: [],
    observedAt:
      parsed.data.time?.iso ?? parsed.data.time?.s ?? new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    source: "waqi",
    sourceLabel: `WAQI · ${parsed.data.city?.name ?? location.city}`,
    freshness: "live",
    isLive: true,
    notes: ["waqiUnvalidated", "noHourly"],
  };
}
