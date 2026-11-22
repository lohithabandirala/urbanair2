"use client";

import { SOURCES } from "@/domain/advice";
import { useI18n } from "./LanguageProvider";

const SOURCE_IDS = [
  "cpcbNaqi",
  "who2021",
  "whoHousehold",
  "epaIndoor",
  "epaActions",
  "openMeteo",
  "waqi",
] as const;

export function Footer() {
  const { dict } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {dict.app.name}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {dict.footer.about}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {dict.footer.builtWith}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {dict.footer.sources}
          </h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {SOURCE_IDS.map((id) => {
              const source = SOURCES[id];
              if (!source) return null;
              return (
                <li key={id}>
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
                  </a>
                  <span className="block text-xs text-slate-500">
                    {source.publisher}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900">
            {dict.footer.privacy}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {dict.footer.privacyBody}
          </p>
          <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
            {dict.footer.disclaimer}
          </p>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {dict.footer.dataNote}
          </p>
        </div>
      </div>
    </footer>
  );
}
