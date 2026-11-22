"use client";

import type { DailyPlan, PlanNote, PlanWindow } from "@/domain/types";
import { formatNumber, localeFor } from "@/lib/format";
import { interpolate } from "@/lib/i18n";
import { CATEGORY_STYLES } from "./categoryStyles";
import { useI18n } from "./LanguageProvider";
import { IconAlert, IconCheck, IconClock, IconInfo } from "./icons";

const VERDICT_ICONS = {
  recommended: IconCheck,
  caution: IconInfo,
  avoid: IconAlert,
} as const;

type HeadlineKey = "good" | "caution" | "avoid" | "noForecast";

const HEADLINE_KEYS: Record<string, HeadlineKey> = {
  "plan.headline.good": "good",
  "plan.headline.caution": "caution",
  "plan.headline.avoid": "avoid",
  "plan.headline.noForecast": "noForecast",
};

interface DayPlanProps {
  plan: DailyPlan;
}

export function DayPlan({ plan }: DayPlanProps) {
  const { dict, language } = useI18n();
  const locale = localeFor(language);

  const headlineKey = HEADLINE_KEYS[plan.headline.key] ?? "noForecast";

  const noteText = (note: PlanNote) => {
    const key = note.key.replace("plan.notes.", "");
    const notes = dict.plan.notes as Record<string, string>;
    return interpolate(notes[key] ?? note.key, note.vars);
  };

  return (
    <section
      id="plan"
      aria-labelledby="plan-heading"
      className="scroll-mt-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plan-heading" className="section-title">
            {dict.plan.title}
          </h2>
          <p className="section-subtitle">{dict.plan.subtitle}</p>
        </div>
        <a href="#profile" className="btn text-xs">
          {dict.plan.editProfile}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-3">
        <p
          aria-live="polite"
          className="text-sm font-semibold text-sky-950"
        >
          {dict.plan.headline[headlineKey]}
        </p>
        {plan.bestWindowId ? (
          <p className="badge bg-sky-800 text-white">
            <IconClock className="h-3.5 w-3.5" />
            {dict.plan.bestWindow}: {dict.plan.windows[plan.bestWindowId]}
          </p>
        ) : (
          <p className="text-xs font-medium text-sky-900">{dict.plan.noBest}</p>
        )}
      </div>

      <ol className="mt-4 grid gap-4 md:grid-cols-3">
        {plan.windows.map((window) => (
          <PlanCard
            key={window.id}
            window={window}
            locale={locale}
            noteText={noteText}
          />
        ))}
      </ol>

      <p className="mt-3 text-xs leading-5 text-slate-600">
        {dict.plan.profileHint}{" "}
        <a
          href="#profile"
          className="font-semibold text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
        >
          {dict.plan.editProfile}
        </a>
      </p>

    </section>
  );
}

function PlanCard({
  window,
  locale,
  noteText,
}: {
  window: PlanWindow;
  locale: string;
  noteText: (note: PlanNote) => string;
}) {
  const { dict } = useI18n();
  const style = CATEGORY_STYLES[window.category];
  const VerdictIcon = VERDICT_ICONS[window.verdict];

  return (
    <li
      className={`card flex h-full flex-col ${
        window.isBestWindow ? "ring-2 ring-sky-700" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-bold text-slate-900">
          {dict.plan.windows[window.id]}
        </h3>
        <span className="inline-flex items-center gap-1 text-xs tabular-nums text-slate-600">
          <IconClock className="h-3.5 w-3.5" />
          {interpolate(dict.plan.timeRange, {
            start: window.startHour,
            end: window.endHour,
          })}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`badge ${style.badge}`}>
          {dict.categories[window.category]}
        </span>
        <span className="text-2xl font-bold tabular-nums text-slate-900">
          {window.aqi === null ? "—" : formatNumber(window.aqi, locale)}
        </span>
        {window.isBestWindow ? (
          <span className="badge bg-sky-800 text-white">
            {dict.common.best}
          </span>
        ) : null}
      </div>

      <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
        <VerdictIcon className="h-4 w-4 shrink-0" />
        {dict.plan.verdicts[window.verdict]}
      </p>

      {window.notes.length > 0 ? (
        <ul className="mt-3 space-y-2 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-700">
          {window.notes.map((note, index) => (
            <li key={`${note.key}-${index}`} className="flex gap-1.5">
              <span aria-hidden="true" className="text-slate-400">
                •
              </span>
              <span>{noteText(note)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
