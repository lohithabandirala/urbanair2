import { calculateAqi, categoryForAqi, categoryRank } from "./aqi";
import type {
  AirQualitySnapshot,
  DailyPlan,
  OutdoorVerdict,
  PlanNote,
  PlanWindow,
  PlanWindowId,
  UserProfile,
} from "./types";

const WINDOW_DEFINITIONS: ReadonlyArray<{
  id: PlanWindowId;
  startHour: number;
  endHour: number;
}> = [
  { id: "morning", startHour: 6, endHour: 10 },
  { id: "midday", startHour: 10, endHour: 14 },
  { id: "evening", startHour: 17, endHour: 21 },
];

function hourOf(isoLocal: string): number | null {
  // Open-Meteo returns location-local wall-clock strings (no timezone suffix),
  // so slicing is safer than parsing into the server's timezone.
  const match = /T(\d{2}):/.exec(isoLocal);
  if (!match?.[1]) return null;
  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function verdictFor(category: ReturnType<typeof categoryForAqi>): OutdoorVerdict {
  const rank = categoryRank(category);
  if (rank < 0) return "caution";
  if (rank <= 1) return "recommended";
  if (rank === 2) return "caution";
  return "avoid";
}

function verdictNote(
  verdict: OutdoorVerdict,
  aqi: number | null,
): PlanNote | null {
  if (aqi === null) return null;
  if (verdict === "recommended") {
    return { key: "plan.notes.goodOutdoor", vars: { aqi } };
  }
  if (verdict === "caution") {
    return { key: "plan.notes.cautionOutdoor", vars: { aqi } };
  }
  return { key: "plan.notes.avoidOutdoor", vars: { aqi } };
}

function profileNotes(
  profile: UserProfile,
  bestCategory: ReturnType<typeof categoryForAqi>,
): PlanNote[] {
  const notes: PlanNote[] = [];

  switch (profile.commuteMode) {
    case "car":
      notes.push({ key: "plan.notes.carCommute" });
      break;
    case "two-wheeler":
      notes.push({ key: "plan.notes.twoWheeler" });
      break;
    case "public-transport":
      notes.push({ key: "plan.notes.publicTransport" });
      break;
    case "walk-cycle":
      notes.push({ key: "plan.notes.walkCycle" });
      break;
    case "work-from-home":
      notes.push({ key: "plan.notes.workFromHome" });
      break;
  }

  if (profile.exercisesOutdoors) {
    notes.push({
      key:
        categoryRank(bestCategory) >= 3
          ? "plan.notes.exerciseAvoid"
          : "plan.notes.exerciseGood",
    });
  }

  if (profile.vulnerableGroups.length > 0) {
    notes.push({
      key:
        categoryRank(bestCategory) >= 2
          ? "plan.notes.vulnerable"
          : "plan.notes.vulnerableGood",
    });
  }

  return notes;
}

function cookingNote(profile: UserProfile): PlanNote | null {
  if (profile.cookingFuel === "biomass") {
    return { key: "plan.notes.biomassCooking" };
  }
  if (profile.cookingFuel === "kerosene") {
    return { key: "plan.notes.keroseneCooking" };
  }
  return null;
}

export interface BuildPlanInput {
  snapshot: AirQualitySnapshot;
  profile: UserProfile;
  /** Current local hour (0–23). When provided, past windows are flagged. */
  nowHour?: number | null;
}

/**
 * Builds a deterministic, profile-aware day plan.
 *
 * When hourly forecast data exists it averages PM2.5/PM10 per window and
 * recalculates the CPCB index. When it does not, the current index is reused
 * and every window carries an explicit "current reading only" note — we never
 * present a forecast we do not have.
 */
export function buildDailyPlan({
  snapshot,
  profile,
  nowHour = null,
}: BuildPlanInput): DailyPlan {
  const hasHourly = snapshot.hourly.length > 0;
  const currentAqi = snapshot.aqi;
  const currentCategory = snapshot.category;

  const windows: PlanWindow[] = WINDOW_DEFINITIONS.map((definition) => {
    const points = hasHourly
      ? snapshot.hourly.filter((point) => {
          const hour = hourOf(point.time);
          return (
            hour !== null &&
            hour >= definition.startHour &&
            hour < definition.endHour
          );
        })
      : [];

    const pm25 = average(
      points
        .map((point) => point.pm25)
        .filter((value): value is number => value !== null),
    );
    const pm10 = average(
      points
        .map((point) => point.pm10)
        .filter((value): value is number => value !== null),
    );

    const hasWindowForecast =
      points.length > 0 && (pm25 !== null || pm10 !== null);

    const aqi = hasWindowForecast
      ? calculateAqi({ pm25, pm10 }).aqi
      : currentAqi;
    const category = hasWindowForecast
      ? categoryForAqi(aqi)
      : currentCategory;
    const verdict = verdictFor(category);

    const notes: PlanNote[] = [];
    if (!hasWindowForecast) {
      notes.push({ key: "plan.notes.currentOnly" });
    }
    const note = verdictNote(verdict, aqi);
    if (note) notes.push(note);

    return {
      id: definition.id,
      startHour: definition.startHour,
      endHour: definition.endHour,
      aqi,
      category,
      verdict,
      isBestWindow: false,
      notes,
    };
  });

  const isPast = (window: PlanWindow) =>
    nowHour !== null && nowHour >= 0 && window.endHour <= nowHour;

  const comparable = windows.filter(
    (window) => window.aqi !== null && !isPast(window),
  );
  const pool = comparable.length > 0 ? comparable : windows.filter((w) => w.aqi !== null);

  let best: PlanWindow | null = null;
  for (const window of pool) {
    if (window.aqi === null) continue;
    if (best === null || (best.aqi !== null && window.aqi < best.aqi)) {
      best = window;
    }
  }

  if (best) {
    best.isBestWindow = true;
    best.notes.push(...profileNotes(profile, best.category));
  } else {
    const anchor = windows[0];
    anchor?.notes.push(...profileNotes(profile, currentCategory));
  }

  const evening = windows.find((window) => window.id === "evening");
  const cooking = cookingNote(profile);
  if (evening && cooking) {
    evening.notes.push(cooking);
  }

  const headline = !hasHourly
    ? { key: "plan.headline.noForecast" }
    : best && best.aqi !== null && best.aqi <= 100
      ? { key: "plan.headline.good" }
      : best && best.aqi !== null && best.aqi <= 200
        ? { key: "plan.headline.caution" }
        : { key: "plan.headline.avoid" };

  return {
    windows,
    bestWindowId: best?.id ?? null,
    headline,
    hasForecast: hasHourly,
  };
}
