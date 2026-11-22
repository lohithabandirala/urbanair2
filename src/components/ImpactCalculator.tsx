"use client";

import { useId, useState, type FormEvent } from "react";
import { estimateImpact } from "@/domain/emissions";
import type {
  ImpactResult,
  TravelMode,
} from "@/domain/types";
import { formatNumber, localeFor } from "@/lib/format";
import { useI18n } from "./LanguageProvider";
import { IconLeaf } from "./icons";
import { AssumptionsDetails } from "./impact/AssumptionsDetails";
import { MODE_LABEL_KEYS, MODE_ORDER } from "./impact/constants";
import { EstimateCard } from "./impact/EstimateCard";

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

      <AssumptionsDetails dict={dict} />

      <p className="mt-2 text-xs text-slate-600">{dict.impact.disclaimer}</p>
    </section>
  );
}
