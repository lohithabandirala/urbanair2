import { z } from "zod";
import { buildReadings, calculateAqi } from "@/domain/aqi";
import type {
  AirQualitySnapshot,
  PollutantKey,
  ResolvedLocation,
} from "@/domain/types";
import { fetchJson, parseUpstream, UpstreamError } from "../upstream";

const recordSchema = z
  .object({
    station: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    latitude: z.union([z.string(), z.number()]).optional(),
    longitude: z.union([z.string(), z.number()]).optional(),
    pollutant_id: z.string(),
    pollutant_avg: z.union([z.string(), z.number(), z.null()]).optional(),
    last_update: z.string().optional(),
  })
  .passthrough();

const responseSchema = z
  .object({
    records: z.array(recordSchema).default([]),
    count: z.number().optional(),
  })
  .passthrough();

const CPCB_RESOURCE_ID =
  process.env.CPCB_RESOURCE_ID?.trim() ||
  "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69";

const POLLUTANT_MAP: Record<string, PollutantKey> = {
  "PM2.5": "pm25",
  PM25: "pm25",
  PM10: "pm10",
  NO2: "no2",
  SO2: "so2",
  CO: "co",
  O3: "o3",
  OZONE: "o3",
  NH3: "nh3",
};

function normalizePollutantId(id: string): PollutantKey | null {
  const normalized = id.toUpperCase().replace(/\s+/g, "");
  return POLLUTANT_MAP[normalized] ?? null;
}

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseTimestamp(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const trimmed = value.trim();

  const dayFirst = /^(\d{2})-(\d{2})-(\d{4})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    trimmed,
  );
  if (dayFirst) {
    const [, day, month, year, hour, minute, second] = dayFirst;
    return `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}`;
  }

  const isoLike = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
    trimmed,
  );
  if (isoLike) {
    const [, year, month, day, hour, minute, second] = isoLike;
    return `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

function distanceSquared(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = lat1 - lat2;
  const dLon = (lon1 - lon2) * Math.cos((lat1 * Math.PI) / 180);
  return dLat * dLat + dLon * dLon;
}

/**
 * India CPCB real-time station data via data.gov.in.
 * Requires CPCB_API_KEY. Values are already hourly/24h averages; CO is mg/m³.
 */
export async function fetchCpcbAir(
  location: ResolvedLocation,
): Promise<AirQualitySnapshot> {
  const apiKey = process.env.CPCB_API_KEY?.trim();
  if (!apiKey) {
    throw new UpstreamError("CPCB API key is not configured", "cpcb");
  }

  const url = new URL(
    `https://api.data.gov.in/resource/${CPCB_RESOURCE_ID}`,
  );
  url.searchParams.set("api-key", apiKey);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1000");
  url.searchParams.set("filters[city]", location.city);

  const raw = await fetchJson(url.toString(), { provider: "cpcb" });
  const parsed = parseUpstream(responseSchema, raw, "cpcb");
  if (parsed.records.length === 0) {
    throw new UpstreamError(
      `CPCB returned no records for ${location.city}`,
      "cpcb",
    );
  }

  interface StationGroup {
    station: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    observedAt: string;
    values: Partial<Record<PollutantKey, number>>;
  }

  const groups = new Map<string, StationGroup>();

  for (const record of parsed.records) {
    const key = `${record.station ?? "unknown"}|${record.latitude ?? ""}|${record.longitude ?? ""}`;
    let group = groups.get(key);
    if (!group) {
      group = {
        station: record.station?.trim() || location.city,
        city: record.city?.trim() || location.city,
        latitude: toNumber(record.latitude),
        longitude: toNumber(record.longitude),
        observedAt: parseTimestamp(record.last_update),
        values: {},
      };
      groups.set(key, group);
    }

    const pollutant = normalizePollutantId(record.pollutant_id);
    const value = toNumber(record.pollutant_avg);
    if (pollutant && value !== null) {
      group.values[pollutant] = value;
    }
    if (record.last_update) {
      group.observedAt = parseTimestamp(record.last_update);
    }
  }

  const ranked = [...groups.values()]
    .map((group) => {
      const count = Object.keys(group.values).length;
      const distance =
        group.latitude !== null && group.longitude !== null
          ? distanceSquared(
              location.latitude,
              location.longitude,
              group.latitude,
              group.longitude,
            )
          : Number.POSITIVE_INFINITY;
      return { group, count, distance };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count || a.distance - b.distance);

  const best = ranked[0]?.group;
  if (!best) {
    throw new UpstreamError(
      `CPCB records for ${location.city} contained no numeric values`,
      "cpcb",
    );
  }

  const aqi = calculateAqi(best.values);

  return {
    location: {
      ...location,
      city: best.city,
      latitude: best.latitude ?? location.latitude,
      longitude: best.longitude ?? location.longitude,
    },
    aqi: aqi.aqi,
    category: aqi.category,
    dominantPollutant: aqi.dominantPollutant,
    readings: buildReadings(best.values),
    hourly: [],
    observedAt: best.observedAt,
    fetchedAt: new Date().toISOString(),
    source: "cpcb",
    sourceLabel: `CPCB · ${best.station}`,
    freshness: "live",
    isLive: true,
    notes: ["cpcbOfficial", "noHourly"],
  };
}
