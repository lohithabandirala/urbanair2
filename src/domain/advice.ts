import type { AqiCategory } from "./types";

export type AdviceSeverity = "info" | "caution" | "warning" | "danger";

export interface AdviceMeta {
  category: AqiCategory;
  severity: AdviceSeverity;
  /** Who should wear a mask outdoors. */
  mask: "none" | "sensitive" | "everyone";
  outdoor: "fine" | "reduce" | "avoid";
  /** Source IDs resolved against SOURCES. */
  sourceIds: string[];
  /** Whether the banner should use role="alert" (urgent, announced immediately). */
  urgent: boolean;
}

export interface SourceReference {
  id: string;
  publisher: string;
  title: string;
  url: string;
}

/**
 * Authoritative references used by the advisory copy and the README.
 * All URLs are public, stable landing pages rather than deep PDF links.
 */
export const SOURCES: Record<string, SourceReference> = {
  cpcbNaqi: {
    id: "cpcbNaqi",
    publisher: "Central Pollution Control Board (India)",
    title: "National Air Quality Index",
    url: "https://cpcb.nic.in/national-air-quality-index/",
  },
  cpcbNaaqs: {
    id: "cpcbNaaqs",
    publisher: "Central Pollution Control Board (India)",
    title: "National Ambient Air Quality Standards (2009)",
    url: "https://cpcb.nic.in/National-Ambient-Air-Quality-Standards/",
  },
  who2021: {
    id: "who2021",
    publisher: "World Health Organization",
    title: "WHO global air quality guidelines (2021)",
    url: "https://www.who.int/publications/i/item/9789240034228",
  },
  whoAirHealth: {
    id: "whoAirHealth",
    publisher: "World Health Organization",
    title: "Ambient (outdoor) air pollution — fact sheet",
    url: "https://www.who.int/news-room/fact-sheets/detail/ambient-(outdoor)-air-quality-and-health",
  },
  whoHousehold: {
    id: "whoHousehold",
    publisher: "World Health Organization",
    title: "Household air pollution and health",
    url: "https://www.who.int/news-room/fact-sheets/detail/household-air-pollution-and-health",
  },
  delhiDpcc: {
    id: "delhiDpcc",
    publisher: "Delhi Pollution Control Committee",
    title: "Delhi air quality advisories",
    url: "https://dpcc.delhi.gov.in/",
  },
  epaIndoor: {
    id: "epaIndoor",
    publisher: "US Environmental Protection Agency",
    title: "Indoor Air Quality — improving indoor air quality",
    url: "https://www.epa.gov/indoor-air-quality-iaq/improving-indoor-air-quality",
  },
  epaActions: {
    id: "epaActions",
    publisher: "US Environmental Protection Agency",
    title: "Actions you can take to reduce air pollution",
    url: "https://www.epa.gov/air-research/actions-you-can-take-reduce-air-pollution",
  },
  openMeteo: {
    id: "openMeteo",
    publisher: "Open-Meteo",
    title: "Air quality API (CAMS global forecasts)",
    url: "https://open-meteo.com/en/docs/air-quality-api",
  },
  waqi: {
    id: "waqi",
    publisher: "World Air Quality Index project",
    title: "WAQI API",
    url: "https://aqicn.org/api/",
  },
  cpcbData: {
    id: "cpcbData",
    publisher: "data.gov.in",
    title: "Real-time air quality data (CPCB)",
    url: "https://www.data.gov.in/catalog/real-time-air-quality-data-india",
  },
  ukDefra: {
    id: "ukDefra",
    publisher: "UK Department for Environment, Food & Rural Affairs",
    title: "Greenhouse gas reporting: conversion factors",
    url: "https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting",
  },
};

const ADVICE: Record<AqiCategory, AdviceMeta> = {
  good: {
    category: "good",
    severity: "info",
    mask: "none",
    outdoor: "fine",
    sourceIds: ["cpcbNaqi", "who2021"],
    urgent: false,
  },
  satisfactory: {
    category: "satisfactory",
    severity: "info",
    mask: "none",
    outdoor: "fine",
    sourceIds: ["cpcbNaqi"],
    urgent: false,
  },
  moderate: {
    category: "moderate",
    severity: "caution",
    mask: "sensitive",
    outdoor: "reduce",
    sourceIds: ["cpcbNaqi", "who2021"],
    urgent: false,
  },
  poor: {
    category: "poor",
    severity: "warning",
    mask: "everyone",
    outdoor: "avoid",
    sourceIds: ["cpcbNaqi", "delhiDpcc", "whoAirHealth"],
    urgent: false,
  },
  "very-poor": {
    category: "very-poor",
    severity: "danger",
    mask: "everyone",
    outdoor: "avoid",
    sourceIds: ["cpcbNaqi", "delhiDpcc", "whoAirHealth"],
    urgent: true,
  },
  severe: {
    category: "severe",
    severity: "danger",
    mask: "everyone",
    outdoor: "avoid",
    sourceIds: ["cpcbNaqi", "delhiDpcc", "whoAirHealth"],
    urgent: true,
  },
  unknown: {
    category: "unknown",
    severity: "info",
    mask: "none",
    outdoor: "reduce",
    sourceIds: ["openMeteo"],
    urgent: false,
  },
};

export function getAdviceMeta(category: AqiCategory): AdviceMeta {
  return ADVICE[category];
}

/** Severe smog alert threshold used by the in-app banner. */
export function isSmogAlert(category: AqiCategory): boolean {
  return category === "very-poor" || category === "severe";
}

export function resolveSources(ids: string[]): SourceReference[] {
  return ids
    .map((id) => SOURCES[id])
    .filter((source): source is SourceReference => Boolean(source));
}
