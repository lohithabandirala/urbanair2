"use client";

import { useMemo, useState } from "react";
import { getIndoorChecklist, type IndoorPriority } from "@/domain/indoor";
import { SOURCES } from "@/domain/advice";
import type { AqiCategory, CookingFuel } from "@/domain/types";
import { dateKey } from "@/lib/format";
import { interpolate } from "@/lib/i18n";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useI18n } from "./LanguageProvider";
import { IconCheck } from "./icons";

const PRIORITY_STYLES: Record<IndoorPriority, string> = {
  essential: "bg-red-100 text-red-950",
  recommended: "bg-amber-100 text-amber-950",
  optional: "bg-slate-200 text-slate-900",
};

interface IndoorChecklistProps {
  category: AqiCategory;
  cookingFuel: CookingFuel;
}

export function IndoorChecklist({
  category,
  cookingFuel,
}: IndoorChecklistProps) {
  const { dict } = useI18n();
  const [day] = useState(() => dateKey());
  const { value: checked, setValue: setChecked } = useLocalStorage<
    Record<string, boolean>
  >(`saaf-hawa.indoor.${day}`, {});

  const items = useMemo(
    () => getIndoorChecklist({ category, cookingFuel }),
    [category, cookingFuel],
  );

  const copy = dict.indoor.items as Record<
    string,
    { title: string; detail: string }
  >;
  const done = items.filter((item) => checked[item.id]).length;
  const total = items.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  function toggle(id: string, value: boolean) {
    setChecked((previous) => ({ ...previous, [id]: value }));
  }

  return (
    <section
      id="indoor"
      aria-labelledby="indoor-heading"
      className="card scroll-mt-24"
    >
      <h2 id="indoor-heading" className="text-xl font-bold text-slate-900">
        {dict.indoor.title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {dict.indoor.subtitle}
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-slate-700">
          <span>
            {interpolate(dict.indoor.progress, { done, total })}
          </span>
          <span>{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-label={interpolate(dict.indoor.progress, { done, total })}
          className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
        >
          <div
            className="h-2 rounded-full bg-emerald-700 transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => {
          const content = copy[item.id] ?? {
            title: item.id,
            detail: "",
          };
          const inputId = `indoor-${item.id}`;
          const detailId = `${inputId}-detail`;

          return (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-3"
            >
              <div className="flex gap-2.5">
                <input
                  id={inputId}
                  type="checkbox"
                  checked={Boolean(checked[item.id])}
                  onChange={(event) => toggle(item.id, event.target.checked)}
                  aria-describedby={detailId}
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-800"
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor={inputId}
                      className="text-sm font-semibold text-slate-900"
                    >
                      {content.title}
                    </label>
                    <span className={`badge ${PRIORITY_STYLES[item.priority]}`}>
                      {dict.indoor.priority[item.priority]}
                    </span>
                    {checked[item.id] ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900">
                        <IconCheck className="h-3.5 w-3.5" />
                        {dict.indoor.done}
                      </span>
                    ) : null}
                  </div>
                  <p
                    id={detailId}
                    className="mt-1 text-sm leading-6 text-slate-600"
                  >
                    {content.detail}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <details className="text-xs text-slate-700">
          <summary className="cursor-pointer font-semibold">
            {dict.indoor.sources}
          </summary>
          <ul className="mt-1 space-y-1">
            {[SOURCES.whoHousehold, SOURCES.epaIndoor].map((source) =>
              source ? (
                <li key={source.id}>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
                  >
                    {source.title}
                  </a>
                </li>
              ) : null,
            )}
          </ul>
        </details>
        <button
          type="button"
          className="btn px-3 py-1.5 text-xs"
          onClick={() => setChecked({})}
        >
          {dict.indoor.reset}
        </button>
      </div>
    </section>
  );
}
