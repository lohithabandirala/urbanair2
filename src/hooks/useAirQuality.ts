"use client";

import { useMemo } from "react";
import type {
  AirQualitySnapshot,
  ResolvedLocation,
  WeatherSnapshot,
} from "@/domain/types";
import { useApiResource } from "./useApiResource";

function locationQuery(location: ResolvedLocation): string {
  const params = new URLSearchParams({
    lat: location.latitude.toFixed(5),
    lon: location.longitude.toFixed(5),
    label: location.city,
  });
  return params.toString();
}

export function useAirQuality(location: ResolvedLocation) {
  const url = useMemo(
    () => `/api/air?${locationQuery(location)}`,
    [location],
  );
  return useApiResource<AirQualitySnapshot>(url);
}

export function useWeather(location: ResolvedLocation) {
  const url = useMemo(
    () => `/api/weather?${locationQuery(location)}`,
    [location],
  );
  return useApiResource<WeatherSnapshot | null>(url);
}
