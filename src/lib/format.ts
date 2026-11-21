/** Locale-aware formatting that never throws on missing data. */

export function formatNumber(
  value: number | null | undefined,
  locale = "en-IN",
  maxFractionDigits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return String(value);
  }
}

const WALL_CLOCK = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Formats a timestamp for display.
 *
 * Open-Meteo returns location-local wall-clock strings without an offset
 * (e.g. 2026-11-21T14:30). Parsing those directly would shift them into the
 * viewer's timezone, so we format them as UTC — which preserves the wall
 * clock the provider reported.
 */
export function formatObservedAt(
  iso: string,
  locale = "en-IN",
  timeZone?: string,
): string {
  if (!iso) return "—";

  const wallClock = WALL_CLOCK.exec(iso);
  if (wallClock) {
    const [, y, m, d, h, min, sec] = wallClock;
    const date = new Date(
      Date.UTC(
        Number(y),
        Number(m) - 1,
        Number(d),
        Number(h),
        Number(min),
        Number(sec ?? 0),
      ),
    );
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "UTC",
      }).format(date);
    } catch {
      return iso;
    }
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }
}

/** Clamps the AQI to the gauge's 0–500 domain. */
export function clampAqi(aqi: number | null | undefined): number {
  if (aqi === null || aqi === undefined || !Number.isFinite(aqi)) return 0;
  return Math.min(500, Math.max(0, aqi));
}

/** Needle angle for a semicircular gauge: -90° (0) to +90° (500). */
export function gaugeAngle(aqi: number | null | undefined): number {
  return -90 + (clampAqi(aqi) / 500) * 180;
}

export function compassDirection(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return "—";
  const points = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return points[index] ?? "—";
}

/** Local calendar date key (used to reset the daily checklist). */
export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localeFor(language: "en" | "hi"): string {
  return language === "hi" ? "hi-IN" : "en-IN";
}

/** Current hour (0–23) in a specific IANA timezone, with a local fallback. */
export function hourInTimeZone(timeZone?: string): number {
  if (!timeZone) return new Date().getHours();
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      hour12: false,
      timeZone,
    }).formatToParts(new Date());
    const value = parts.find((part) => part.type === "hour")?.value;
    const hour = value ? Number(value) % 24 : NaN;
    return Number.isFinite(hour) ? hour : new Date().getHours();
  } catch {
    return new Date().getHours();
  }
}
