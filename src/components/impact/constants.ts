import type { TravelMode } from "@/domain/types";
import type { Dictionary } from "@/lib/i18n";

export const MODE_ORDER: TravelMode[] = [
  "petrol-car",
  "diesel-car",
  "cng-car",
  "electric-car",
  "two-wheeler",
  "bus",
  "metro",
  "walk-cycle",
];

export const MODE_LABEL_KEYS: Record<
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

export const ASSUMPTION_KEYS = [
  "indicative",
  "carpool",
  "grid",
  "notLocalAqi",
] as const;
