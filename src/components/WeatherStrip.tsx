"use client";

import type { WeatherSnapshot } from "@/domain/types";
import {
  compassDirection,
  formatNumber,
  localeFor,
} from "@/lib/format";
import { useI18n } from "./LanguageProvider";
import { IconWind } from "./icons";

export function WeatherStrip({ weather }: { weather: WeatherSnapshot | null }) {
  const { dict, language } = useI18n();
  if (!weather) return null;

  const locale = localeFor(language);
  const { current } = weather;

  return (
    <section
      aria-label={dict.weather.title}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600">
          <IconWind className="h-4 w-4" />
          {dict.weather.title}
        </h2>
        <span className="text-xs text-slate-500">{weather.sourceLabel}</span>
      </div>

      <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-xs text-slate-600">{dict.weather.temperature}</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {current.temperatureC === null
              ? "—"
              : `${formatNumber(current.temperatureC, locale, 1)} °C`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">{dict.weather.humidity}</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {current.humidityPct === null
              ? "—"
              : `${formatNumber(current.humidityPct, locale)}%`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-600">{dict.weather.wind}</dt>
          <dd className="font-semibold tabular-nums text-slate-900">
            {current.windSpeedKph === null
              ? "—"
              : `${formatNumber(current.windSpeedKph, locale, 1)} km/h ${compassDirection(current.windDirectionDeg)}`}
          </dd>
        </div>
      </dl>
    </section>
  );
}
