import type { PollutantKey, ReadingUnit } from "./types";

/**
 * CPCB National Air Quality Index (NAQI) breakpoints.
 *
 * Source: Central Pollution Control Board, "National Air Quality Index"
 * https://cpcb.nic.in/national-air-quality-index/
 *
 * The official table is printed as inclusive integer bands (e.g. PM2.5
 * 31–60). For linear interpolation we use the continuous boundaries
 * (30, 60, 90 …), which is the standard interpretation and makes the
 * band edges exact: PM2.5 = 60 → sub-index 100.
 *
 * Units: every pollutant is µg/m³ except CO, which CPCB expresses in mg/m³.
 */
export interface PollutantMeta {
  key: PollutantKey;
  /** Translation key under `pollutants.*` in the i18n dictionaries. */
  labelKey: string;
  unit: ReadingUnit;
  /** Averaging period used by CPCB for the sub-index. */
  averaging: "24h" | "8h";
  /** CPCB NAAQS limit for that averaging period. */
  cpcbStandard: number;
  /** WHO 2021 guideline for that averaging period, where one exists. */
  whoStandard: number | null;
  /** Continuous concentration boundaries, ascending. */
  concentrationBreaks: readonly number[];
}

export const AQI_BREAKS = [0, 50, 100, 200, 300, 400, 500] as const;

export const POLLUTANTS: Record<PollutantKey, PollutantMeta> = {
  pm25: {
    key: "pm25",
    labelKey: "pollutants.pm25",
    unit: "µg/m³",
    averaging: "24h",
    cpcbStandard: 60,
    whoStandard: 15,
    concentrationBreaks: [0, 30, 60, 90, 120, 250, 500],
  },
  pm10: {
    key: "pm10",
    labelKey: "pollutants.pm10",
    unit: "µg/m³",
    averaging: "24h",
    cpcbStandard: 100,
    whoStandard: 45,
    concentrationBreaks: [0, 50, 100, 250, 350, 430, 600],
  },
  no2: {
    key: "no2",
    labelKey: "pollutants.no2",
    unit: "µg/m³",
    averaging: "24h",
    cpcbStandard: 80,
    whoStandard: 25,
    concentrationBreaks: [0, 40, 80, 180, 280, 400, 600],
  },
  so2: {
    key: "so2",
    labelKey: "pollutants.so2",
    unit: "µg/m³",
    averaging: "24h",
    cpcbStandard: 80,
    whoStandard: 40,
    concentrationBreaks: [0, 40, 80, 380, 800, 1600, 2000],
  },
  co: {
    key: "co",
    labelKey: "pollutants.co",
    unit: "mg/m³",
    averaging: "8h",
    cpcbStandard: 2,
    whoStandard: 4,
    concentrationBreaks: [0, 1, 2, 10, 17, 34, 50],
  },
  o3: {
    key: "o3",
    labelKey: "pollutants.o3",
    unit: "µg/m³",
    averaging: "8h",
    cpcbStandard: 100,
    whoStandard: 100,
    concentrationBreaks: [0, 50, 100, 168, 208, 748, 1000],
  },
  nh3: {
    key: "nh3",
    labelKey: "pollutants.nh3",
    unit: "µg/m³",
    averaging: "24h",
    cpcbStandard: 400,
    whoStandard: null,
    concentrationBreaks: [0, 200, 400, 800, 1200, 1800, 2500],
  },
};

export const POLLUTANT_ORDER: readonly PollutantKey[] = [
  "pm25",
  "pm10",
  "no2",
  "so2",
  "co",
  "o3",
  "nh3",
];
