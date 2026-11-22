"use client";

import { useId, useState, type FormEvent } from "react";
import { estimateImpact } from "@/domain/emissions";
import { SOURCES } from "@/domain/advice";
import type {
  ImpactEstimate,
  ImpactResult,
  TravelMode,
} from "@/domain/types";
import { formatNumber, localeFor } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import { useI18n } from "./LanguageProvider";
import { IconLeaf } from "./icons";

const MODE_ORDER: TravelMode[] = [
  "petrol-car",
  "diesel-car",
  "cng-car",
  "electric-car",
  "two-wheeler",
  "bus",
  "metro",
  "walk-cycle",
];

const MODE_LABEL_KEYS: Record<
  TravelMode,
  keyof Dictionary["impact"]["modes"]
> = {
  "petrol-car": "petrolCar",
  "diesel-car": "dieselCar",
  "cng-car": "cngCar",
  "electric-car": "electricCar",
  "two-wheeler": "twoWheeler",
  bus: "bus",
  metro: "metro",
  "walk-cycle": "walkCycle",
};

const ASSUMPTION_KEYS = [
  "indicative",
  "carpool",
  "grid",
  "notLocalAqi",
] as const;

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-xs text-slate-600">{label}</dt>
      <dd className="font-semibold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

function EstimateCard({
  title,
  estimate,
  dict,
  locale,
}: {
  title: string;
  estimate: ImpactEstimate;
  dict: Dictionary;
  locale: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <dl className="mt-2 space-y-1.5 text-sm">
        <Metric
          label={dict.impact.co2Day}
          value={`${formatNumber(estimate.co2KgPerDay, locale, 2)} kg`}
        />
        <Metric
          label={dict.impact.pmDay}
          value={`${formatNumber(estimate.pm25GPerDay, locale, 2)} g`}
        />
        <Metric
          label={dict.impact.co2Month}
          value={`${formatNumber(estimate.co2KgPerMonth, locale, 2)} kg`}
        />
      </dl>
    </div>
  );
}

export function ImpactCalculator() {
  const { dict, language } = useI18n();
  const locale = localeFor(language);
  const distanceId = useId();
  const daysId = useId();
  const currentId = useId();
  const alternativeId = useId();
  const occupantsId = useId();

  const [distance, setDistance] = useState("10");
  const [days, setDays] = useState("5");
  const [currentMode, setCurrentMode] = useState<TravelMode>("petrol-car");
  const [alternativeMode, setAlternativeMode] = useState<TravelMode>("metro");
  const [occupants, setOccupants] = useState("1");
  const [result, setResult] = useState<ImpactResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const distanceValue = Number(distance);
    const daysValue = Number(days);
    const occupantsValue = Number(occupants);

    if (
      !Number.isFinite(distanceValue) ||
      distanceValue < 0 ||
      distanceValue > 1000 ||
      !Number.isFinite(daysValue) ||
      daysValue < 0 ||
      daysValue > 7 ||
      !Number.isFinite(occupantsValue) ||
      occupantsValue < 1 ||
      occupantsValue > 8
    ) {
      setError(dict.errors.invalidInput);
      setResult(null);
      return;
    }

    setError(null);
    setResult(
      estimateImpact({
        distanceKmPerDay: distanceValue,
        daysPerWeek: daysValue,
        currentMode,
        alternativeMode,
        occupants: occupantsValue,
      }),
    );
  }

  const savingsPositive = (result?.savings.co2KgPerDay ?? 0) >= 0;
  const defra = SOURCES.ukDefra;

  return (
    <section
      id="impact"
      aria-labelledby="impact-heading"
      className="card scroll-mt-24"
    >
      <h2
        id="impact-heading"
        className="flex items-center gap-2 text-xl font-bold text-slate-900"
      >
        <IconLeaf className="h-5 w-5 text-emerald-800" />
        {dict.impact.title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        {dict.impact.subtitle}
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <div>
          <label
            htmlFor={distanceId}
            className="block text-sm font-semibold text-slate-800"
          >
            {dict.impact.distance}
          </label>
          <input
            id={distanceId}
            type="number"
            min={0}
            max={1000}
            step={1}
            inputMode="decimal"
            className="input mt-1"
            value={distance}
            onChange={(event) => setDistance(event.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={daysId}
            className="block text-sm font-semibold text-slate-800"
          >
            {dict.impact.days}
          </label>
          <input
            id={daysId}
            type="number"
            min={0}
            max={7}
            step={1}
            inputMode="numeric"
            className="input mt-1"
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>

        <div>
          <label
            htmlFor={currentId}
            className="block text-sm font-semibold text-slate-800"
          >
            {dict.impact.currentMode}
          </label>
          <select
            id={currentId}
            className="input mt-1"
            value={currentMode}
            onChange={(event) =>
              setCurrentMode(event.target.value as TravelMode)
            }
          >
            {MODE_ORDER.map((mode) => (
              <option key={mode} value={mode}>
                {dict.impact.modes[MODE_LABEL_KEYS[mode]]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={alternativeId}
            className="block text-sm font-semibold text-slate-800"
          >
            {dict.impact.alternative}
          </label>
          <select
            id={alternativeId}
            className="input mt-1"
            value={alternativeMode}
            onChange={(event) =>
              setAlternativeMode(event.target.value as TravelMode)
            }
          >
            {MODE_ORDER.map((mode) => (
              <option key={mode} value={mode}>
                {dict.impact.modes[MODE_LABEL_KEYS[mode]]}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor={occupantsId}
            className="block text-sm font-semibold text-slate-800"
          >
            {dict.impact.occupants}
          </label>
          <input
            id={occupantsId}
            type="number"
            min={1}
            max={8}
            step={1}
            inputMode="numeric"
            className="input mt-1 sm:max-w-xs"
            value={occupants}
            onChange={(event) => setOccupants(event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary">
            {dict.impact.calculate}
          </button>
          {error ? (
            <p role="alert" className="mt-2 text-sm font-medium text-red-800">
              {error}
            </p>
          ) : null}
        </div>
      </form>

      <div aria-live="polite" aria-atomic="true" className="mt-5">
        {result ? (
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-700">
              {dict.impact.results}
            </h3>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <EstimateCard
                title={dict.impact.baseline}
                estimate={result.baseline}
                dict={dict}
                locale={locale}
              />
              <EstimateCard
                title={dict.impact.alternativeLabel}
                estimate={result.alternative}
                dict={dict}
                locale={locale}
              />
            </div>

            <div
              className={`mt-3 rounded-xl border p-3 ${
                savingsPositive
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-rose-300 bg-rose-50"
              }`}
            >
              <p className="text-sm font-bold text-slate-900">
                {savingsPositive
                  ? dict.impact.savings
                  : dict.impact.increase}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">
                {formatNumber(
                  Math.abs(result.savings.co2KgPerDay),
                  locale,
                  2,
                )}{" "}
                kg CO₂ ·{" "}
                {formatNumber(
                  Math.abs(result.savings.pm25GPerDay),
                  locale,
                  2,
                )}{" "}
                g PM2.5 ·{" "}
                {formatNumber(
                  Math.abs(result.savings.noxGPerDay),
                  locale,
                  2,
                )}{" "}
                g NOx {dict.common.today.toLowerCase()}
              </p>
              <p className="mt-1 text-xs text-slate-700">
                {dict.impact.co2Month}:{" "}
                {formatNumber(
                  Math.abs(result.savings.co2KgPerMonth),
                  locale,
                  2,
                )}{" "}
                kg
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{dict.impact.subtitle}</p>
        )}
      </div>

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

      <p className="mt-2 text-xs text-slate-600">{dict.impact.disclaimer}</p>
    </section>
  );
}
