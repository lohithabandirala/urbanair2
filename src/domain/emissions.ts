import type {
  ImpactEstimate,
  ImpactInput,
  ImpactResult,
  TravelMode,
} from "./types";

interface TravelModeFactor {
  labelKey: string;
  /** kg CO₂ per vehicle-km, or per passenger-km for bus/metro. */
  co2KgPerKm: number;
  pm25GPerKm: number;
  noxGPerKm: number;
  /** Whether the factor is per passenger and should be divided by occupants. */
  perVehicle: boolean;
}

/**
 * Indicative emission factors.
 *
 * These are deliberately rounded, order-of-magnitude values for *relative*
 * comparison, not a certified emissions inventory. CO₂ factors are in the
 * range published by UK DEFRA/BEIS conversion factors; particulate and NOx
 * factors are typical Euro-6/BS-VI tailpipe figures and vary widely with
 * fuel, age, speed and maintenance.
 */
export const TRAVEL_MODES: Record<TravelMode, TravelModeFactor> = {
  "petrol-car": {
    labelKey: "impact.modes.petrolCar",
    co2KgPerKm: 0.15,
    pm25GPerKm: 0.005,
    noxGPerKm: 0.04,
    perVehicle: true,
  },
  "diesel-car": {
    labelKey: "impact.modes.dieselCar",
    co2KgPerKm: 0.17,
    pm25GPerKm: 0.02,
    noxGPerKm: 0.25,
    perVehicle: true,
  },
  "cng-car": {
    labelKey: "impact.modes.cngCar",
    co2KgPerKm: 0.12,
    pm25GPerKm: 0.003,
    noxGPerKm: 0.05,
    perVehicle: true,
  },
  "electric-car": {
    labelKey: "impact.modes.electricCar",
    co2KgPerKm: 0.05,
    pm25GPerKm: 0.002,
    noxGPerKm: 0.01,
    perVehicle: true,
  },
  "two-wheeler": {
    labelKey: "impact.modes.twoWheeler",
    co2KgPerKm: 0.05,
    pm25GPerKm: 0.01,
    noxGPerKm: 0.02,
    perVehicle: true,
  },
  bus: {
    labelKey: "impact.modes.bus",
    co2KgPerKm: 0.04,
    pm25GPerKm: 0.003,
    noxGPerKm: 0.05,
    perVehicle: false,
  },
  metro: {
    labelKey: "impact.modes.metro",
    co2KgPerKm: 0.02,
    pm25GPerKm: 0.001,
    noxGPerKm: 0.01,
    perVehicle: false,
  },
  "walk-cycle": {
    labelKey: "impact.modes.walkCycle",
    co2KgPerKm: 0,
    pm25GPerKm: 0,
    noxGPerKm: 0,
    perVehicle: false,
  },
};

/** Average weeks per calendar month (365.25 / 7 / 12). */
export const WEEKS_PER_MONTH = 4.345;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function factorFor(mode: TravelMode, occupants: number) {
  const factor = TRAVEL_MODES[mode];
  const divisor = factor.perVehicle ? clamp(occupants, 1, 8) : 1;
  return {
    co2KgPerKm: factor.co2KgPerKm / divisor,
    pm25GPerKm: factor.pm25GPerKm / divisor,
    noxGPerKm: factor.noxGPerKm / divisor,
  };
}

function estimate(
  distanceKmPerDay: number,
  daysPerWeek: number,
  mode: TravelMode,
  occupants: number,
): ImpactEstimate {
  const factor = factorFor(mode, occupants);
  const co2KgPerDay = distanceKmPerDay * factor.co2KgPerKm;
  const pm25GPerDay = distanceKmPerDay * factor.pm25GPerKm;
  const noxGPerDay = distanceKmPerDay * factor.noxGPerKm;
  const monthlyDays = daysPerWeek * WEEKS_PER_MONTH;

  return {
    co2KgPerDay: round(co2KgPerDay),
    pm25GPerDay: round(pm25GPerDay),
    noxGPerDay: round(noxGPerDay),
    co2KgPerMonth: round(co2KgPerDay * monthlyDays),
    pm25GPerMonth: round(pm25GPerDay * monthlyDays),
  };
}

/**
 * Compares the user's current travel mode with an alternative.
 * Savings are positive when the alternative is cleaner; negative values
 * mean the alternative emits more (the UI states this explicitly).
 */
export function estimateImpact(input: ImpactInput): ImpactResult {
  const distanceKmPerDay = clamp(input.distanceKmPerDay, 0, 1000);
  const daysPerWeek = clamp(input.daysPerWeek, 0, 7);
  const occupants = clamp(input.occupants, 1, 8);

  const baseline = estimate(
    distanceKmPerDay,
    daysPerWeek,
    input.currentMode,
    occupants,
  );
  const alternative = estimate(
    distanceKmPerDay,
    daysPerWeek,
    input.alternativeMode,
    occupants,
  );

  return {
    baseline,
    alternative,
    savings: {
      co2KgPerDay: round(baseline.co2KgPerDay - alternative.co2KgPerDay),
      pm25GPerDay: round(baseline.pm25GPerDay - alternative.pm25GPerDay),
      noxGPerDay: round(baseline.noxGPerDay - alternative.noxGPerDay),
      co2KgPerMonth: round(
        baseline.co2KgPerMonth - alternative.co2KgPerMonth,
      ),
      pm25GPerMonth: round(
        baseline.pm25GPerMonth - alternative.pm25GPerMonth,
      ),
    },
    daysPerWeek,
  };
}

export const IMPACT_ASSUMPTION_KEYS = [
  "impact.assumptions.indicative",
  "impact.assumptions.carpool",
  "impact.assumptions.grid",
  "impact.assumptions.notLocalAqi",
] as const;
