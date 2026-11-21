import { buildReadings, calculateAqi } from "@/domain/aqi";
import type { AirQualitySnapshot, ResolvedLocation } from "@/domain/types";
import { dateKey } from "@/lib/format";

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function wallClock(date: Date): string {
  return `${dateKey(date)}T${String(date.getHours()).padStart(2, "0")}:00`;
}

/**
 * Deterministic sample data used only when every live provider fails.
 * It is explicitly labelled `sample` everywhere it appears; it is never
 * presented as a live reading.
 */
export function buildDemoAir(location: ResolvedLocation): AirQualitySnapshot {
  const hash = hashString(location.city.toLowerCase());
  const pm25 = 35 + (hash % 110);
  const pm10 = Math.round(pm25 * 1.6 + (hash % 20));
  const no2 = 18 + (hash % 55);
  const so2 = 8 + (hash % 35);
  const co = Math.round((0.5 + (hash % 20) / 10) * 1000) / 1000;
  const o3 = 35 + (hash % 120);

  const concentrations = { pm25, pm10, no2, so2, co, o3, nh3: null };
  const aqi = calculateAqi(concentrations);

  const now = new Date();
  const hourly = Array.from({ length: 24 }, (_, index) => {
    const point = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + index,
    );
    const wave = 1 + 0.25 * Math.sin((index / 24) * Math.PI * 2);
    return {
      time: wallClock(point),
      pm25: Math.round(pm25 * wave),
      pm10: Math.round(pm10 * wave),
    };
  });

  return {
    location,
    aqi: aqi.aqi,
    category: aqi.category,
    dominantPollutant: aqi.dominantPollutant,
    readings: buildReadings(concentrations),
    hourly,
    observedAt: wallClock(now),
    fetchedAt: new Date().toISOString(),
    source: "demo",
    sourceLabel: "Built-in sample",
    freshness: "sample",
    isLive: false,
    notes: ["sample"],
  };
}
