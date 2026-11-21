import {
  AQI_BREAKS,
  POLLUTANTS,
  POLLUTANT_ORDER,
} from "./breakpoints";
import type {
  AqiCategory,
  AqiResult,
  PollutantKey,
  PollutantReading,
} from "./types";

/**
 * Converts one pollutant concentration into its CPCB sub-index (0–500).
 * Returns `null` for missing, non-finite or negative values.
 */
export function calculateSubIndex(
  pollutant: PollutantKey,
  concentration: number | null | undefined,
): number | null {
  if (
    concentration === null ||
    concentration === undefined ||
    !Number.isFinite(concentration) ||
    concentration < 0
  ) {
    return null;
  }

  const breaks = POLLUTANTS[pollutant].concentrationBreaks;
  const lastIndex = breaks.length - 1;
  const lastConcentration = breaks[lastIndex];
  const maxAqi = AQI_BREAKS[lastIndex];

  if (lastConcentration === undefined || maxAqi === undefined) {
    return null;
  }
  if (concentration >= lastConcentration) {
    return 500;
  }

  for (let i = 1; i <= lastIndex; i += 1) {
    const cHigh = breaks[i];
    const cLow = breaks[i - 1];
    if (cHigh === undefined || cLow === undefined) {
      continue;
    }
    if (concentration <= cHigh) {
      const aqiLow = AQI_BREAKS[i - 1];
      const aqiHigh = AQI_BREAKS[i];
      if (aqiLow === undefined || aqiHigh === undefined) {
        return null;
      }
      const ratio = (concentration - cLow) / (cHigh - cLow);
      const value = aqiLow + ratio * (aqiHigh - aqiLow);
      return Math.min(500, Math.max(0, Math.round(value)));
    }
  }

  return 500;
}

/** CPCB NAQI category for an index value. */
export function categoryForAqi(aqi: number | null | undefined): AqiCategory {
  if (aqi === null || aqi === undefined || !Number.isFinite(aqi)) {
    return "unknown";
  }
  if (aqi <= 50) return "good";
  if (aqi <= 100) return "satisfactory";
  if (aqi <= 200) return "moderate";
  if (aqi <= 300) return "poor";
  if (aqi <= 400) return "very-poor";
  return "severe";
}

/** Numeric rank used for comparisons and for sorting checklist items. */
export function categoryRank(category: AqiCategory): number {
  switch (category) {
    case "good":
      return 0;
    case "satisfactory":
      return 1;
    case "moderate":
      return 2;
    case "poor":
      return 3;
    case "very-poor":
      return 4;
    case "severe":
      return 5;
    default:
      return -1;
  }
}

export function isAtLeast(
  category: AqiCategory,
  threshold: AqiCategory,
): boolean {
  const rank = categoryRank(category);
  const limit = categoryRank(threshold);
  return rank >= 0 && limit >= 0 && rank >= limit;
}

/**
 * Calculates the CPCB National AQI from concentrations.
 *
 * At least PM2.5 or PM10 must be present, mirroring CPCB's rule that the
 * index needs a particulate measurement. The overall AQI is the maximum
 * sub-index; the dominant pollutant is the one that produced it.
 */
export function calculateAqi(
  concentrations: Partial<Record<PollutantKey, number | null | undefined>>,
): AqiResult {
  const subIndices: Partial<Record<PollutantKey, number>> = {};

  for (const key of POLLUTANT_ORDER) {
    const value = calculateSubIndex(key, concentrations[key]);
    if (value !== null) {
      subIndices[key] = value;
    }
  }

  const hasParticulate =
    subIndices.pm25 !== undefined || subIndices.pm10 !== undefined;

  if (!hasParticulate) {
    return {
      aqi: null,
      category: "unknown",
      dominantPollutant: null,
      subIndices,
    };
  }

  let aqi = 0;
  let dominantPollutant: PollutantKey | null = null;

  for (const key of POLLUTANT_ORDER) {
    const value = subIndices[key];
    if (value !== undefined && value > aqi) {
      aqi = value;
      dominantPollutant = key;
    }
  }

  return {
    aqi,
    category: categoryForAqi(aqi),
    dominantPollutant,
    subIndices,
  };
}

/** Builds the display-ready reading list from a concentration map. */
export function buildReadings(
  concentrations: Partial<Record<PollutantKey, number | null | undefined>>,
): PollutantReading[] {
  return POLLUTANT_ORDER.map((key) => {
    const raw = concentrations[key];
    const value =
      raw === null || raw === undefined || !Number.isFinite(raw) ? null : raw;
    return {
      key,
      value,
      unit: POLLUTANTS[key].unit,
      subIndex: calculateSubIndex(key, value),
    };
  });
}

/**
 * Converts Open-Meteo's µg/m³ CO value to the mg/m³ unit used by CPCB.
 */
export function coMicrogramsToMilligrams(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }
  return Math.round((value / 1000) * 1000) / 1000;
}

/** True when a reading is above its CPCB 24h/8h standard. */
export function exceedsCpcbStandard(
  pollutant: PollutantKey,
  value: number | null,
): boolean {
  if (value === null) return false;
  return value > POLLUTANTS[pollutant].cpcbStandard;
}
