"use client";

import { useI18n } from "./LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";
import { IconWind } from "./icons";

const LINKS = [
  { href: "#dashboard", key: "dashboard" },
  { href: "#plan", key: "plan" },
  { href: "#indoor", key: "indoor" },
  { href: "#impact", key: "impact" },
  { href: "#assistant", key: "assistant" },
  { href: "#profile", key: "profile" },
] as const;

export function Header() {
  const { dict, language, setLanguage } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="#main"
          className="flex items-center gap-2 rounded-lg text-slate-900"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-800 text-white">
            <IconWind className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight">
            {dict.app.name}
          </span>
        </a>

        <nav
          aria-label={dict.nav.label}
          className="order-3 w-full overflow-x-auto sm:order-2 sm:w-auto"
        >
          <ul className="flex items-center gap-1 whitespace-nowrap text-sm">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-block rounded-lg px-2.5 py-2 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                >
                  {dict.nav[link.key]}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className="order-2 flex items-center gap-1 rounded-xl border border-slate-300 bg-white p-0.5 sm:order-3"
          role="group"
          aria-label={dict.common.language}
        >
          {LANGUAGES.map((option) => {
            const active = language === option.code;
            return (
              <button
                key={option.code}
                type="button"
                lang={option.htmlLang}
                aria-pressed={active}
                onClick={() => setLanguage(option.code)}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
