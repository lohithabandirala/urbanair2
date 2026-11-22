"use client";

import type { AirQualitySnapshot } from "@/domain/types";
import { formatObservedAt, localeFor } from "@/lib/format";
import { useI18n } from "./LanguageProvider";

const FRESHNESS_STYLES = {
  live: "bg-emerald-100 text-emerald-950",
  cached: "bg-amber-100 text-amber-950",
  sample: "bg-rose-100 text-rose-950",
} as const;

export function SourceBadge({ snapshot }: { snapshot: AirQualitySnapshot }) {
  const { dict, language } = useI18n();

  const freshnessLabel =
    snapshot.freshness === "live"
      ? dict.source.live
      : snapshot.freshness === "cached"
        ? dict.source.cached
        : dict.source.sample;

  const sourceName =
    snapshot.source === "cpcb"
      ? dict.source.cpcb
      : snapshot.source === "waqi"
        ? dict.source.waqi
        : snapshot.source === "open-meteo"
          ? dict.source.openMeteo
          : dict.source.demo;

  const noteLookup = dict.source.notes as Record<string, string | undefined>;
  const notes = snapshot.notes
    .map((note) => noteLookup[note])
    .filter((note): note is string => Boolean(note));

  // Provider labels already contain the network name ("CPCB — Anand Vihar").
  // Show the translated network once, followed only by the station detail.
  const station = snapshot.sourceLabel
    .replace(/^(CPCB|WAQI)\s*[·—–-]\s*/, "")
    .trim();
  const showStation =
    Boolean(station) &&
    station !== sourceName &&
    station !== snapshot.sourceLabel;

  return (
    <div className="text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`badge ${FRESHNESS_STYLES[snapshot.freshness]}`}>
          {freshnessLabel}
        </span>
        <span className="text-slate-600">
          {dict.source.label}:{" "}
          <span className="font-semibold text-slate-900">
            {sourceName}
            {showStation ? ` · ${station}` : ""}
          </span>
        </span>
        <span className="text-slate-600">
          {dict.source.observed}:{" "}
          <time dateTime={snapshot.observedAt} className="font-medium text-slate-900">
            {formatObservedAt(
              snapshot.observedAt,
              localeFor(language),
              snapshot.location.timezone,
            )}
          </time>
        </span>
      </div>

      {notes.length > 0 ? (
        <ul className="mt-1.5 space-y-0.5 text-slate-600">
          {notes.map((note) => (
            <li key={note} className="flex gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
