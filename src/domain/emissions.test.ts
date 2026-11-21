import { describe, expect, it } from "vitest";
import { estimateImpact, TRAVEL_MODES, WEEKS_PER_MONTH } from "./emissions";

describe("estimateImpact", () => {
  it("compares a petrol car with the metro", () => {
    const result = estimateImpact({
      distanceKmPerDay: 10,
      daysPerWeek: 5,
      currentMode: "petrol-car",
      alternativeMode: "metro",
      occupants: 1,
    });

    expect(result.daysPerWeek).toBe(5);
    expect(result.baseline).toMatchObject({
      co2KgPerDay: 1.5,
      pm25GPerDay: 0.05,
      noxGPerDay: 0.4,
      co2KgPerMonth: 32.59,
      pm25GPerMonth: 1.09,
    });
    expect(result.alternative).toMatchObject({
      co2KgPerDay: 0.2,
      pm25GPerDay: 0.01,
      noxGPerDay: 0.1,
      co2KgPerMonth: 4.35,
      pm25GPerMonth: 0.22,
    });
    expect(result.savings).toMatchObject({
      co2KgPerDay: 1.3,
      pm25GPerDay: 0.04,
      noxGPerDay: 0.3,
      co2KgPerMonth: 28.24,
      pm25GPerMonth: 0.87,
    });
  });

  it("divides car emissions by occupants but not bus or metro factors", () => {
    const carpool = estimateImpact({
      distanceKmPerDay: 10,
      daysPerWeek: 5,
      currentMode: "petrol-car",
      alternativeMode: "bus",
      occupants: 2,
    });

    expect(carpool.baseline.co2KgPerDay).toBe(0.75);
    expect(carpool.baseline.pm25GPerDay).toBe(0.03);
    expect(carpool.baseline.noxGPerDay).toBe(0.2);

    expect(carpool.alternative.co2KgPerDay).toBe(0.4);
    expect(carpool.alternative.pm25GPerDay).toBe(0.03);
    expect(carpool.alternative.noxGPerDay).toBe(0.5);
  });

  it("clamps out-of-range inputs to safe bounds", () => {
    const result = estimateImpact({
      distanceKmPerDay: 5000,
      daysPerWeek: 12,
      currentMode: "diesel-car",
      alternativeMode: "walk-cycle",
      occupants: 99,
    });

    expect(result.daysPerWeek).toBe(7);
    // Distance clamps to 1000 km and occupants clamp to 8, so the
    // per-vehicle diesel factor is shared between eight people.
    expect(result.baseline.co2KgPerDay).toBe(21.25);
    expect(result.alternative.co2KgPerDay).toBe(0);
  });

  it("treats negative distance as zero", () => {
    const result = estimateImpact({
      distanceKmPerDay: -10,
      daysPerWeek: -1,
      currentMode: "petrol-car",
      alternativeMode: "metro",
      occupants: 0,
    });

    expect(result.daysPerWeek).toBe(0);
    expect(result.baseline.co2KgPerDay).toBe(0);
    expect(result.savings.co2KgPerDay).toBe(0);
  });

  it("reports negative savings when the alternative is dirtier", () => {
    const result = estimateImpact({
      distanceKmPerDay: 10,
      daysPerWeek: 5,
      currentMode: "walk-cycle",
      alternativeMode: "diesel-car",
      occupants: 1,
    });

    expect(result.savings.co2KgPerDay).toBe(-1.7);
    expect(result.savings.noxGPerDay).toBe(-2.5);
    expect(result.savings.co2KgPerMonth).toBeLessThan(0);
  });

  it("exposes the assumption constants used by the UI", () => {
    expect(WEEKS_PER_MONTH).toBeCloseTo(4.345);
    expect(TRAVEL_MODES["walk-cycle"].co2KgPerKm).toBe(0);
    expect(TRAVEL_MODES.bus.perVehicle).toBe(false);
    expect(TRAVEL_MODES["petrol-car"].perVehicle).toBe(true);
  });
});
