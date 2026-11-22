import { SOURCES } from "@/domain/advice";
import type { Dictionary } from "@/lib/i18n";
import { ASSUMPTION_KEYS } from "./constants";

interface AssumptionsDetailsProps {
  dict: Dictionary;
}

export function AssumptionsDetails({ dict }: AssumptionsDetailsProps) {
  const defra = SOURCES.ukDefra;

  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
      <summary className="cursor-pointer font-semibold text-slate-800">
        {dict.impact.assumptionsTitle}
      </summary>
      <ul className="mt-2 space-y-1.5 leading-5 text-slate-700">
        {ASSUMPTION_KEYS.map((key) => (
          <li key={key} className="flex gap-1.5">
            <span aria-hidden="true">•</span>
            <span>{dict.impact.assumptions[key]}</span>
          </li>
        ))}
        {defra ? (
          <li>
            <a
              href={defra.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-800 underline decoration-sky-300 underline-offset-2 hover:text-sky-950"
            >
              {defra.title}
            </a>
          </li>
        ) : null}
      </ul>
    </details>
  );
}
