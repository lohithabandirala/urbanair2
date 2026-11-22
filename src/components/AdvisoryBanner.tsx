"use client";

import { getAdviceMeta, resolveSources } from "@/domain/advice";
import type { AqiCategory } from "@/domain/types";
import { useI18n } from "./LanguageProvider";
import { SEVERITY_STYLES } from "./categoryStyles";
import { IconAlert, IconCheck, IconInfo, IconMask } from "./icons";

export function AdvisoryBanner({ category }: { category: AqiCategory }) {
  const { dict } = useI18n();
  const meta = getAdviceMeta(category);
  const style = SEVERITY_STYLES[meta.severity];
  const advice = dict.advice[category];
  const sources = resolveSources(meta.sourceIds);
  const Icon = meta.severity === "info" ? IconInfo : IconAlert;
  const headingId = `advisory-${category}`;

  return (
    <section
      role={meta.urgent ? "alert" : "status"}
      aria-live={meta.urgent ? "assertive" : "polite"}
      aria-atomic="true"
      aria-labelledby={headingId}
      className={`card border ${style.panel} ${style.border}`}
    >
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-6 w-6 shrink-0 ${style.icon}`} />
        <div className="min-w-0">
          <h2 id={headingId} className={`text-lg font-bold leading-7 ${style.label}`}>
            {advice.headline}
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-800">
            {advice.detail}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-800">
            <span className="font-semibold">
              {dict.adviceLabels.sensitive}:
            </span>{" "}
            {advice.sensitive}
          </p>

          <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-white/70 px-2 py-1 text-sm font-medium text-slate-900">
            <IconMask className="mt-0.5 h-4 w-4 shrink-0" />
            {advice.mask}
          </p>

          <ul className="mt-3 space-y-1.5">
            {advice.actions.map((action) => (
              <li key={action} className="flex gap-2 text-sm leading-6 text-slate-800">
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />
                <span>{action}</span>
              </li>
            ))}
          </ul>

          <details className="mt-3 rounded-lg border border-white/80 bg-white/70 p-2">
            <summary className="cursor-pointer text-xs font-semibold text-slate-800">
              {dict.common.viewSources}
            </summary>
            <ul className="mt-2 space-y-1 text-xs">
              {sources.map((source) => (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
                  >
                    {source.title}
                    <span className="sr-only">
                      {" "}
                      ({dict.common.opensInNewTab})
                    </span>
                  </a>{" "}
                  <span className="text-slate-500">— {source.publisher}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      </div>
    </section>
  );
}
