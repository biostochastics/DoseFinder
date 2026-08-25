import { describe, it, expect } from "vitest";
import { calculateOccupancyDose } from "./mabel";

const mAb = {
  bindingConstantNM: 1,
  targetOccupancyPct: 10,
  vdLPerKg: 0.07,
  molecularWeightGPerMol: 150000,
  bioavailabilityPct: 100,
};

describe("calculateOccupancyDose (MABEL / PAD)", () => {
  it("computes a MABEL dose for a mAb worked example", () => {
    // C = 1 × 0.1/0.9 = 0.1111 nM; dose = 0.1111 × 0.07 × 150000 / 1e6 ≈ 0.0011667 mg/kg
    const r = calculateOccupancyDose(mAb);
    expect(r.valid).toBe(true);
    expect(r.concentrationNM).toBeCloseTo(0.1111, 3);
    expect(r.doseMgPerKg).toBeCloseTo(0.0011667, 6);
  });

  it("gives a higher PAD dose at higher target occupancy", () => {
    const pad = calculateOccupancyDose({ ...mAb, targetOccupancyPct: 50 });
    // C = 1 nM; dose = 1 × 0.07 × 150000 / 1e6 = 0.0105 mg/kg
    expect(pad.doseMgPerKg).toBeCloseTo(0.0105, 5);
    expect(pad.doseMgPerKg).toBeGreaterThan(
      calculateOccupancyDose(mAb).doseMgPerKg,
    );
  });

  it("scales inversely with bioavailability", () => {
    const iv = calculateOccupancyDose(mAb).doseMgPerKg;
    const oral = calculateOccupancyDose({
      ...mAb,
      bioavailabilityPct: 50,
    }).doseMgPerKg;
    expect(oral).toBeCloseTo(iv * 2, 6);
  });

  it("rejects impossible occupancy (0% or 100%)", () => {
    expect(
      calculateOccupancyDose({ ...mAb, targetOccupancyPct: 0 }).valid,
    ).toBe(false);
    expect(
      calculateOccupancyDose({ ...mAb, targetOccupancyPct: 100 }).valid,
    ).toBe(false);
  });

  it("rejects non-positive Kd, Vd, MW and out-of-range F", () => {
    expect(calculateOccupancyDose({ ...mAb, bindingConstantNM: 0 }).valid).toBe(
      false,
    );
    expect(calculateOccupancyDose({ ...mAb, vdLPerKg: 0 }).valid).toBe(false);
    expect(
      calculateOccupancyDose({ ...mAb, molecularWeightGPerMol: -1 }).valid,
    ).toBe(false);
    expect(
      calculateOccupancyDose({ ...mAb, bioavailabilityPct: 150 }).valid,
    ).toBe(false);
  });

  it("emits a unit-sanity warning for an out-of-window Kd (likely pM/nM mix-up)", () => {
    const r = calculateOccupancyDose({ ...mAb, bindingConstantNM: 0.0001 });
    expect(r.warnings.some((w) => /units \(nM expected\)/i.test(w))).toBe(true);
  });

  it("emits a warning for an implausible molecular weight", () => {
    const r = calculateOccupancyDose({ ...mAb, molecularWeightGPerMol: 50 });
    expect(r.warnings.some((w) => /Molecular weight/i.test(w))).toBe(true);
  });
});
