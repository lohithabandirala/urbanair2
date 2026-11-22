"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { ResolvedLocation } from "@/domain/types";
import { formatNumber } from "@/lib/format";
import { useI18n } from "./LanguageProvider";
import { IconLocate, IconPin, IconSearch } from "./icons";
import { LocationSearchResults } from "./location/LocationSearchResults";
import type { LocationPickerStatus, LocationPlace } from "./location/types";

interface LocationPickerProps {
  location: ResolvedLocation;
  onChange: (location: ResolvedLocation) => void;
  showDefaultNote: boolean;
}

export function LocationPicker({
  location,
  onChange,
  showDefaultNote,
}: LocationPickerProps) {
  const { dict, language } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationPlace[]>([]);
  const [status, setStatus] = useState<LocationPickerStatus>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    setStatus("idle");
    setResults([]);
  }

  function choose(place: LocationPlace) {
    onChange({
      city: place.name,
      region: place.region,
      country: place.country,
      countryCode: place.countryCode,
      latitude: place.latitude,
      longitude: place.longitude,
      timezone: place.timezone,
    });
    setQuery("");
    close();
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (value.length < 2) {
      setStatus("empty");
      return;
    }

    setStatus("searching");
    try {
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(value)}`,
        { headers: { Accept: "application/json" } },
      );
      const body = (await response.json()) as {
        ok?: boolean;
        data?: { results?: LocationPlace[] };
      };
      if (!response.ok || body.ok !== true) throw new Error("search failed");
      const found = body.data?.results ?? [];
      setResults(found);
      setStatus(found.length > 0 ? "idle" : "empty");
    } catch {
      setResults([]);
      setStatus("error");
    }
  }

  function useMyLocation() {
    if (!("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `/api/geocode?lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const body = (await response.json()) as {
            ok?: boolean;
            data?: { results?: LocationPlace[] };
          };
          const place = body.data?.results?.[0];
          choose(
            place
              ? { ...place, latitude, longitude }
              : {
                  name: dict.location.current,
                  latitude,
                  longitude,
                },
          );
        } catch {
          choose({
            name: dict.location.current,
            latitude,
            longitude,
          });
        }
      },
      (error) => {
        setStatus(error.code === 1 ? "denied" : "unavailable");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }

  const statusText =
    status === "searching"
      ? dict.location.searching
      : status === "locating"
        ? dict.location.geolocating
        : status === "empty"
          ? dict.location.noResults
          : status === "error"
            ? dict.location.error
            : status === "denied"
              ? dict.location.permissionDenied
              : status === "unavailable"
                ? dict.location.unavailable
                : "";

  const statusIsError =
    status === "error" || status === "denied" || status === "unavailable";

  return (
    <section
      aria-labelledby="location-heading"
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:max-w-sm"
    >
      <h2
        id="location-heading"
        className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-600"
      >
        <IconPin className="h-4 w-4" />
        {dict.location.title}
      </h2>

      <div className="mt-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold leading-6 text-slate-900">
            {location.city}
          </p>
          <p className="text-xs leading-5 text-slate-600">
            {[location.region, location.country].filter(Boolean).join(", ")}
          </p>
          <p className="mt-1 text-xs tabular-nums text-slate-500">
            {dict.location.coordinates}:{" "}
            {formatNumber(location.latitude, language === "hi" ? "hi-IN" : "en-IN", 4)},{" "}
            {formatNumber(location.longitude, language === "hi" ? "hi-IN" : "en-IN", 4)}
          </p>
        </div>
        <button
          type="button"
          className="btn shrink-0 px-3 py-1.5 text-xs"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => (open ? close() : setOpen(true))}
        >
          {open ? dict.common.close : dict.location.change}
        </button>
      </div>

      {showDefaultNote ? (
        <p className="mt-2 rounded-lg bg-sky-50 p-2 text-xs leading-5 text-sky-950">
          {dict.location.defaultNote}
        </p>
      ) : null}

      {open ? (
        <div
          id={panelId}
          className="mt-3 border-t border-slate-200 pt-3"
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <form onSubmit={search} className="space-y-2" noValidate>
            <label
              htmlFor="location-search"
              className="block text-xs font-semibold text-slate-700"
            >
              {dict.location.label}
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                id="location-search"
                name="location"
                type="search"
                autoComplete="off"
                className="input"
                placeholder={dict.location.placeholder}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={80}
              />
              <button
                type="submit"
                className="btn btn-primary shrink-0 px-3"
                aria-label={dict.location.search}
              >
                <IconSearch className="h-4 w-4" />
              </button>
            </div>
          </form>

          <button
            type="button"
            className="btn mt-2 w-full text-xs"
            onClick={useMyLocation}
          >
            <IconLocate className="h-4 w-4" />
            {dict.location.useMyLocation}
          </button>

          {statusText ? (
            <p
              role={statusIsError ? "alert" : "status"}
              aria-live="polite"
              className={`mt-2 text-xs leading-5 ${
                statusIsError ? "text-red-800" : "text-slate-600"
              }`}
            >
              {statusText}
            </p>
          ) : null}

          <LocationSearchResults
            results={results}
            title={dict.location.results}
            onSelect={choose}
          />
        </div>
      ) : null}
    </section>
  );
}
