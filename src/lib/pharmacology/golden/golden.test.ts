/**
 * GOLDEN VALIDATION RUNNER
 *
 * Executes the frozen scientific reference cases in goldenCases.ts against the
 * live calculation engine. A failure here means a calculation-affecting change
 * diverged from an externally-cited ground truth — investigate the CHANGE, do
 * not "fix" the expected value without checking the citation.
 */

import { describe, it, expect } from "vitest";
import { calculateDose, calculateCockcroftCrCl } from "../calculations";
import { calculateFdaFihDose, calculateHED, calculateMRSD } from "../fda";
import { getKmFactor } from "../fda";
import {
  GOLDEN_HED_CASES,
  GOLDEN_CRCL_CASES,
  GOLDEN_SCALING_CASES,
  GOLDEN_FIH_GUARD_CASES,
  GOLDEN_BIOAVAILABILITY_GUARD_CASES,
} from "./goldenCases";

describe("GOLDEN — FDA 2005 HED / MRSD (assay controls)", () => {
  GOLDEN_HED_CASES.forEach((c) => {
    it(`${c.id}: ${c.citation}`, () => {
      const km = getKmFactor(c.species);
      expect(km, `Km factor for ${c.species}`).not.toBeNull();
      const hed = calculateHED(c.noael, km as number);
      const mrsd = calculateMRSD(hed, c.safetyFactor);
      expect(hed).toBeCloseTo(c.expectedHed, decimalsFromTol(c.tol));
      expect(mrsd).toBeCloseTo(c.expectedMrsd, decimalsFromTol(c.tol));

      // Full-engine path must agree with the primitives
      const engine = calculateFdaFihDose({
        noael: c.noael,
        animalSpecies: c.species,
        safetyFactor: c.safetyFactor,
        modality: "small_molecule",
      });
      expect(engine.hed).toBeCloseTo(c.expectedHed, decimalsFromTol(c.tol));
      expect(engine.mrsd).toBeCloseTo(c.expectedMrsd, decimalsFromTol(c.tol));
    });
  });
});

describe("GOLDEN — Cockcroft-Gault CrCl (assay controls)", () => {
  GOLDEN_CRCL_CASES.forEach((c) => {
    it(`${c.id}: ${c.citation}`, () => {
      const crcl = calculateCockcroftCrCl(
        c.weightKg,
        c.age,
        c.creatinine,
        c.sex,
        c.unit,
      );
      expect(crcl).toBeCloseTo(c.expected, decimalsFromTol(c.tol));
    });
  });
});

describe("GOLDEN — cross-species scaling (assay controls)", () => {
  GOLDEN_SCALING_CASES.forEach((c) => {
    it(`${c.id}: ${c.citation}`, () => {
      const result = calculateDose(
        c.sourceWeight,
        c.targetWeight,
        c.baseDose,
        c.method,
        c.sourceKey,
        c.targetKey,
      );
      expect(result.error).toBeUndefined();
      expect(result.dose).toBeCloseTo(c.expectedDose, decimalsFromTol(c.tol));
    });
  });
});

describe("GOLDEN — intentional invalid-input guards (must REFUSE)", () => {
  GOLDEN_FIH_GUARD_CASES.forEach((c) => {
    it(`${c.id}: ${c.description}`, () => {
      const result = calculateFdaFihDose(c.input);
      if (c.expectMrsdZero) {
        expect(result.mrsd).toBe(0);
      }
      expect(
        result.warnings.some((w) => w.code === c.expectWarningCode),
        `expected warning code ${c.expectWarningCode}`,
      ).toBe(true);
    });
  });

  GOLDEN_BIOAVAILABILITY_GUARD_CASES.forEach((c) => {
    it(`${c.id}: ${c.description}`, () => {
      const unadjusted = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "iv" },
      );
      const clamped = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailability: c.bioavailability },
      );
      // Safety invariant: an impossible F must never AMPLIFY the dose. Clamping
      // to 100% (== unadjusted) or rejecting (dose 0) both satisfy this.
      expect(Number.isFinite(clamped.dose)).toBe(true);
      expect(clamped.dose).toBeLessThanOrEqual(unadjusted.dose + c.tol);
    });
  });
});

/** Convert an absolute tolerance to vitest's decimal-places arg for toBeCloseTo. */
function decimalsFromTol(tol: number): number {
  // toBeCloseTo passes when |a-b| < 0.5 × 10^-decimals. Pick decimals so that
  // 0.5×10^-decimals <= tol, i.e. decimals = floor(-log10(2×tol)).
  const d = Math.floor(-Math.log10(2 * tol));
  return Math.max(0, d);
}
