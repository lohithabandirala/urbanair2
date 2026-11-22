"use client";

import { POLLUTANTS } from "@/domain/breakpoints";
import { exceedsCpcbStandard } from "@/domain/aqi";
import type { AirQualitySnapshot } from "@/domain/types";
import { formatNumber, localeFor } from "@/lib/format";
import { useI18n } from "./LanguageProvider";
import { IconAlert, IconCheck } from "./icons";

export function PollutantTable({ snapshot }: { snapshot: AirQualitySnapshot }) {
  const { dict, language } = useI18n();
  const locale = localeFor(language);
  const noteId = "pollutant-table-note";

  return (
    <div>
      <div className="overflow-x-auto">
        <table
          aria-describedby={noteId}
          className="w-full min-w-[640px] border-collapse text-left text-sm"
        >
          <caption className="sr-only">{dict.dashboard.tableCaption}</caption>
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-600">
              <th scope="col" className="px-2 py-2 font-semibold">
                {dict.dashboard.pollutant}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">
                {dict.dashboard.value}
              </th>
              <th scope="col" className="px-2 py-2 font-semibold">
                {dict.dashboard.unit}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">
                {dict.dashboard.subIndex}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">
                {dict.dashboard.standard}
              </th>
              <th scope="col" className="px-2 py-2 text-right font-semibold">
                {dict.dashboard.who}
              </th>
              <th scope="col" className="px-2 py-2 font-semibold">
                {dict.dashboard.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.readings.map((reading) => {
              const meta = POLLUTANTS[reading.key];
              const digits = reading.key === "co" ? 3 : 1;
              const above = exceedsCpcbStandard(reading.key, reading.value);

              return (
                <tr
                  key={reading.key}
                  className="border-b border-slate-100 last:border-0"
                >
                  <th scope="row" className="px-2 py-2 font-semibold text-slate-900">
                    {dict.pollutants[reading.key]}
                    <span className="ml-1 text-xs font-normal text-slate-500">
                      {meta.averaging}
                    </span>
                  </th>
                  <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900">
                    {reading.value === null
                      ? dict.dashboard.unavailable
                      : formatNumber(reading.value, locale, digits)}
                  </td>
                  <td className="px-2 py-2 text-slate-600">{reading.unit}</td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-700">
                    {reading.subIndex === null
                      ? dict.dashboard.unavailable
                      : formatNumber(reading.subIndex, locale)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-700">
                    {formatNumber(meta.cpcbStandard, locale, digits)} {meta.unit}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-700">
                    {meta.whoStandard === null
                      ? dict.dashboard.unavailable
                      : `${formatNumber(meta.whoStandard, locale, digits)} ${meta.unit}`}
                  </td>
                  <td className="px-2 py-2">
                    {reading.value === null ? (
                      <span className="text-slate-500">
                        {dict.dashboard.unavailable}
                      </span>
                    ) : above ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-900">
                        <IconAlert className="h-4 w-4 shrink-0" />
                        {dict.dashboard.aboveStandard}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900">
                        <IconCheck className="h-4 w-4 shrink-0" />
                        {dict.dashboard.belowStandard}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p id={noteId} className="mt-3 text-xs leading-5 text-slate-600">
        {dict.dashboard.note}
      </p>
    </div>
  );
}
