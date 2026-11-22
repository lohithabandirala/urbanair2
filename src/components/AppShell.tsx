"use client";

import { useCallback, useMemo } from "react";
import type { ResolvedLocation } from "@/domain/types";
import { normalizeLocation } from "@/domain/location";
import { buildDailyPlan } from "@/domain/plan";
import { DEFAULT_LOCATION } from "@/lib/config";
import { localizeApiError } from "@/lib/errors";
import { formatObservedAt, localeFor } from "@/lib/format";
import { useAirQuality, useWeather } from "@/hooks/useAirQuality";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useNowHour } from "@/hooks/useNowHour";
import { useProfile } from "@/hooks/useProfile";
import { AdvisoryBanner } from "./AdvisoryBanner";
import { AQIGauge } from "./AQIGauge";
import { ChatAssistant } from "./ChatAssistant";
import { DayPlan } from "./DayPlan";
import { ImpactCalculator } from "./ImpactCalculator";
import { IndoorChecklist } from "./IndoorChecklist";
import { LocationPicker } from "./LocationPicker";
import { PollutantTable } from "./PollutantTable";
import { ProfilePanel } from "./ProfilePanel";
import { SampleDataBanner } from "./SampleDataBanner";
import { SharePlan } from "./SharePlan";
import { SmogAlert } from "./SmogAlert";
import { SourceBadge } from "./SourceBadge";
import { WeatherStrip } from "./WeatherStrip";
import { useI18n } from "./LanguageProvider";
import { IconAlert, IconRefresh, IconWind } from "./icons";

const LOCATION_KEY = "saaf-hawa.location.v1";

export function AppShell() {
  const { dict, language } = useI18n();
  const locale = localeFor(language);

  const {
    value: storedLocation,
    setValue: setStoredLocation,
    hydrated: locationHydrated,
    hadStoredValue,
  } = useLocalStorage<ResolvedLocation>(LOCATION_KEY, DEFAULT_LOCATION);

  const location = useMemo(() => normalizeLocation(storedLocation), [storedLocation]);
  const { profile, updateProfile, resetProfile } = useProfile();

  const air = useAirQuality(location);
  const weather = useWeather(location);
  const nowHour = useNowHour(location.timezone ?? air.data?.location.timezone);

  const snapshot = air.data;
  const airErrorText = air.error
    ? localizeApiError(dict, air.errorCode, air.error, language === "en")
    : null;
  const plan = useMemo(
    () =>
      snapshot
        ? buildDailyPlan({ snapshot, profile, nowHour })
        : null,
    [snapshot, profile, nowHour],
  );

  const handleLocationChange = useCallback(
    (next: ResolvedLocation) => setStoredLocation(normalizeLocation(next)),
    [setStoredLocation],
  );

  const refreshAir = air.refresh;
  const refreshWeather = weather.refresh;
  const refreshAll = useCallback(() => {
    refreshAir();
    refreshWeather();
  }, [refreshAir, refreshWeather]);

  const freshnessBadge = snapshot
    ? snapshot.freshness === "sample"
      ? { label: dict.app.demoData, className: "bg-rose-100 text-rose-950" }
      : snapshot.freshness === "cached"
        ? { label: dict.source.cached, className: "bg-amber-100 text-amber-950" }
        : { label: dict.app.liveData, className: "bg-emerald-100 text-emerald-950" }
    : null;

  return (
    <div className="space-y-10">
      <section
        aria-labelledby="hero-heading"
        className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-6 sm:p-8"
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge bg-sky-800 text-white">
            <IconWind className="h-3.5 w-3.5" />
            {dict.app.name}
          </span>
          {freshnessBadge ? (
            <span className={`badge ${freshnessBadge.className}`}>
              {freshnessBadge.label}
            </span>
          ) : null}
        </div>
        <h1
          id="hero-heading"
          className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl"
        >
          {dict.app.tagline}
        </h1>
        <p className="mt-2 max-w-3xl text-base leading-7 text-slate-700">
          {dict.app.description}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <LocationPicker
          location={location}
          onChange={handleLocationChange}
          showDefaultNote={locationHydrated && !hadStoredValue}
        />
        <WeatherStrip weather={weather.data} />
      </div>

      <section
        id="dashboard"
        aria-labelledby="dashboard-heading"
        className="scroll-mt-24"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="dashboard-heading" className="section-title">
              {dict.dashboard.title}
            </h2>
            <p className="section-subtitle">{dict.dashboard.subtitle}</p>
          </div>
          {snapshot ? (
            <button
              type="button"
              className="btn px-3 py-2 text-xs"
              onClick={refreshAll}
              disabled={air.loading}
            >
              <IconRefresh className="h-4 w-4" />
              {air.loading ? dict.common.refreshing : dict.common.refresh}
            </button>
          ) : null}
        </div>

        <span role="status" aria-live="polite" className="sr-only">
          {air.loading ? dict.common.refreshing : ""}
        </span>

        {snapshot ? (
          <div className="mt-4 space-y-4">
            {snapshot.freshness === "sample" ? (
              <SampleDataBanner snapshot={snapshot} />
            ) : null}

            {air.error ? (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950"
              >
                <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{airErrorText}</span>
              </p>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
              <div className="card">
                <AQIGauge aqi={snapshot.aqi} category={snapshot.category} />

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {dict.dashboard.dominant}
                    </dt>
                    <dd className="mt-0.5 font-bold text-slate-900">
                      {snapshot.dominantPollutant
                        ? dict.pollutants[snapshot.dominantPollutant]
                        : dict.dashboard.unavailable}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {dict.dashboard.lastUpdated}
                    </dt>
                    <dd className="mt-0.5 font-semibold text-slate-900">
                      <time dateTime={snapshot.fetchedAt}>
                        {formatObservedAt(
                          snapshot.fetchedAt,
                          locale,
                          snapshot.location.timezone,
                        )}
                      </time>
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <SourceBadge snapshot={snapshot} />
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-bold text-slate-900">
                  {dict.dashboard.readings}
                </h3>
                <div className="mt-2">
                  <PollutantTable snapshot={snapshot} />
                </div>
                {snapshot.aqi === null ? (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm font-medium text-amber-950">
                    {dict.dashboard.noData}. {dict.dashboard.noDataDetail}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4">
              <SmogAlert category={snapshot.category} />
              <AdvisoryBanner category={snapshot.category} />
            </div>
          </div>
        ) : air.error ? (
          <div
            role="alert"
            className="card mt-4 border-red-300 bg-red-50 text-red-950"
          >
            <div className="flex items-start gap-3">
              <IconAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-bold">{dict.errors.generic}</p>
                <p className="mt-1 text-sm">{airErrorText}</p>
                <button
                  type="button"
                  className="btn mt-3 px-3 py-1.5 text-xs"
                  onClick={refreshAll}
                >
                  <IconRefresh className="h-4 w-4" />
                  {dict.common.retry}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            role="status"
            aria-live="polite"
            className="card mt-4"
          >
            <p className="text-sm font-semibold text-slate-700">
              {dict.common.loading}
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
              <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
            </div>
          </div>
        )}
      </section>

      {plan ? (
        <DayPlan plan={plan} />
      ) : (
        <section
          id="plan"
          aria-labelledby="plan-heading"
          className="scroll-mt-24"
        >
          <h2 id="plan-heading" className="section-title">
            {dict.plan.title}
          </h2>
          <p className="section-subtitle">{dict.plan.subtitle}</p>
          <div className="card mt-4" role="status" aria-live="polite">
            <p className="text-sm font-medium text-slate-700">
              {air.loading ? dict.common.loading : dict.errors.upstream}
            </p>
            {!air.loading ? (
              <button
                type="button"
                className="btn mt-3 px-3 py-1.5 text-xs"
                onClick={refreshAll}
              >
                <IconRefresh className="h-4 w-4" />
                {dict.common.retry}
              </button>
            ) : null}
          </div>
        </section>
      )}

      {snapshot ? (
        <SharePlan snapshot={snapshot} plan={plan} />
      ) : null}

      <IndoorChecklist
        category={snapshot?.category ?? "unknown"}
        cookingFuel={profile.cookingFuel}
      />

      <ImpactCalculator />

      <ChatAssistant
        location={location}
        profile={profile}
        currentAqi={snapshot?.aqi ?? null}
        currentCategory={snapshot?.category ?? "unknown"}
      />

      <ProfilePanel
        profile={profile}
        onChange={updateProfile}
        onReset={resetProfile}
      />
    </div>
  );
}
