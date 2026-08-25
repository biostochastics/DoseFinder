import { describe, it, expect } from "vitest";
import {
  buildSafetyFactorRange,
  type SafetyFactorInput,
} from "./safetyFactorBuilder";

const base: SafetyFactorInput = {
  novelty: 0,
  pdCharacteristics: 0,
  animalModelRelevance: 0,
  safetyFindings: 0,
  estimationUncertainty: 0,
  clinicalMonitorability: 0,
};

describe("buildSafetyFactorRange", () => {
  it("returns the standard 10× range when no factor is elevated", () => {
    const r = buildSafetyFactorRange(base);
    expect(r.low).toBe(10);
    expect(r.high).toBe(10);
    expect(r.band).toBe("standard");
    expect(r.score).toBe(0);
  });

  it("never emits a single 'answer' — always a range object with rationale", () => {
    const r = buildSafetyFactorRange({
      ...base,
      novelty: 2,
      estimationUncertainty: 2,
    });
    expect(r).toHaveProperty("low");
    expect(r).toHaveProperty("high");
    expect(Array.isArray(r.rationale)).toBe(true);
    expect(r.rationale.length).toBeGreaterThan(0);
  });

  it("elevates the range as factors rise (monotonic)", () => {
    const mild = buildSafetyFactorRange({ ...base, novelty: 1 });
    const strong = buildSafetyFactorRange({
      ...base,
      novelty: 2,
      pdCharacteristics: 2,
      animalModelRelevance: 2,
    });
    expect(mild.high).toBeGreaterThanOrEqual(10);
    expect(strong.high).toBeGreaterThan(mild.high);
  });

  it("reaches the high band with several elevated factors", () => {
    const r = buildSafetyFactorRange({
      ...base,
      novelty: 2,
      pdCharacteristics: 2,
      animalModelRelevance: 2,
      safetyFindings: 1,
    });
    expect(r.score).toBe(7);
    expect(r.band).toBe("high");
    expect(r.low).toBe(30);
    expect(r.high).toBe(100);
  });

  it("reaches the extreme band when everything is maxed", () => {
    const r = buildSafetyFactorRange({
      novelty: 2,
      pdCharacteristics: 2,
      animalModelRelevance: 2,
      safetyFindings: 2,
      estimationUncertainty: 2,
      clinicalMonitorability: 2,
    });
    expect(r.score).toBe(12);
    expect(r.band).toBe("extreme");
    expect(r.high).toBe(1000);
    expect(r.summary).toMatch(/reconsider the FIH strategy/i);
  });

  it("allows a sub-10 range ONLY for a well-characterized class with low score", () => {
    const r = buildSafetyFactorRange({ ...base, wellCharacterizedClass: true });
    expect(r.low).toBe(3);
    expect(r.high).toBe(10);
    expect(r.band).toBe("reduced");
    expect(r.summary).toMatch(/well-characterized/i);
  });

  it("does NOT reduce below 10 for a well-characterized class once risk is elevated", () => {
    const r = buildSafetyFactorRange({
      ...base,
      wellCharacterizedClass: true,
      pdCharacteristics: 2,
      safetyFindings: 2,
    });
    expect(r.low).toBeGreaterThanOrEqual(10);
  });

  it("lists each elevated factor in the rationale trail", () => {
    const r = buildSafetyFactorRange({
      ...base,
      novelty: 2,
      clinicalMonitorability: 1,
    });
    expect(r.rationale.some((x) => /Novelty/i.test(x) && /\+2/.test(x))).toBe(
      true,
    );
    expect(
      r.rationale.some((x) => /monitorability/i.test(x) && /\+1/.test(x)),
    ).toBe(true);
  });
});
