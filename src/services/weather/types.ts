import type { ResolvedLocation, WeatherSnapshot } from "@/domain/types";

export interface WeatherProvider {
  id: "openweather" | "open-meteo";
  fetch: (location: ResolvedLocation) => Promise<WeatherSnapshot>;
}
