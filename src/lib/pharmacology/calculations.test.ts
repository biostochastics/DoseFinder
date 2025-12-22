import { describe, it, expect } from "vitest";
import {
  calculateDose,
  calculateCockcroftGFR,
  gfrToDoseAdjustment,
  generateChartData,
  convertCreatinine,
} from "./calculations";
import { CalculationParameters } from "./types";

describe("DoseFinder Calculation Tests", () => {
  describe("calculateCockcroftGFR", () => {
    it("should calculate GFR correctly for standard male patient", () => {
      // Formula: ((140 - age) * weight) / (72 * creatinine)
      // ((140 - 40) * 70) / (72 * 1) = 97.22
      const gfr = calculateCockcroftGFR(70, 40, 1, "male");
      expect(gfr).toBeCloseTo(97.22, 1);
    });

    it("should apply female adjustment factor", () => {
      // 97.22 * 0.85 = 82.64
      const gfr = calculateCockcroftGFR(70, 40, 1, "female");
      expect(gfr).toBeCloseTo(82.64, 1);
    });

    it("should return 0 for invalid inputs", () => {
      expect(calculateCockcroftGFR(0, 40, 1, "male")).toBe(0);
      expect(calculateCockcroftGFR(70, 0, 1, "male")).toBe(0);
      expect(calculateCockcroftGFR(70, 40, 0, "male")).toBe(0);
      expect(calculateCockcroftGFR(-70, 40, 1, "male")).toBe(0);
    });

    it("should handle edge case where age equals 140", () => {
      const gfr = calculateCockcroftGFR(70, 140, 1, "male");
      expect(gfr).toBe(0);
    });

    it("should handle very high creatinine values", () => {
      const gfr = calculateCockcroftGFR(70, 40, 10, "male");
      expect(gfr).toBeCloseTo(9.72, 1);
    });
  });

  describe("convertCreatinine", () => {
    it("should convert mg/dL to µmol/L correctly", () => {
      // 1 mg/dL = 88.4 µmol/L
      expect(convertCreatinine(1, "mg/dL", "umol/L")).toBeCloseTo(88.4, 1);
      expect(convertCreatinine(2, "mg/dL", "umol/L")).toBeCloseTo(176.8, 1);
    });

    it("should convert µmol/L to mg/dL correctly", () => {
      expect(convertCreatinine(88.4, "umol/L", "mg/dL")).toBeCloseTo(1, 2);
      expect(convertCreatinine(176.8, "umol/L", "mg/dL")).toBeCloseTo(2, 2);
    });

    it("should return same value when units match", () => {
      expect(convertCreatinine(1.5, "mg/dL", "mg/dL")).toBe(1.5);
      expect(convertCreatinine(100, "umol/L", "umol/L")).toBe(100);
    });
  });

  describe("calculateCockcroftGFR with creatinine units", () => {
    it("should handle µmol/L input correctly", () => {
      // Same patient: 70kg, 40yo, creatinine 1 mg/dL = 88.4 µmol/L
      const gfrMgDL = calculateCockcroftGFR(70, 40, 1, "male", "mg/dL");
      const gfrUmolL = calculateCockcroftGFR(70, 40, 88.4, "male", "umol/L");
      expect(gfrUmolL).toBeCloseTo(gfrMgDL, 0);
    });

    it("should default to mg/dL when unit not specified", () => {
      const gfrDefault = calculateCockcroftGFR(70, 40, 1, "male");
      const gfrExplicit = calculateCockcroftGFR(70, 40, 1, "male", "mg/dL");
      expect(gfrDefault).toBe(gfrExplicit);
    });
  });

  describe("gfrToDoseAdjustment", () => {
    it("should use proper formula with fe parameter", () => {
      // With fe=1.0 (100% renal), GFR 60/120 = 0.5 renal function
      // Factor = 1 - 1.0 * (1 - 0.5) = 0.5
      expect(gfrToDoseAdjustment(60, 1.0, 120)).toBeCloseTo(0.5, 2);

      // With fe=0.5 (50% renal), same GFR
      // Factor = 1 - 0.5 * (1 - 0.5) = 0.75
      expect(gfrToDoseAdjustment(60, 0.5, 120)).toBeCloseTo(0.75, 2);

      // With fe=0 (no renal clearance), should be 1.0 regardless of GFR
      expect(gfrToDoseAdjustment(30, 0, 120)).toBe(1.0);
      expect(gfrToDoseAdjustment(0, 0, 120)).toBe(1.0);
    });

    it("should return 1.0 for normal GFR regardless of fe", () => {
      // GFR >= normal means renal function ratio = 1, so factor = 1
      expect(gfrToDoseAdjustment(120, 1.0, 120)).toBe(1.0);
      expect(gfrToDoseAdjustment(150, 0.8, 120)).toBe(1.0);
    });

    it("should clamp fe to valid range", () => {
      // fe > 1 should be clamped to 1
      expect(gfrToDoseAdjustment(60, 2.0, 120)).toBeCloseTo(0.5, 2);
      // fe < 0 should be clamped to 0
      expect(gfrToDoseAdjustment(60, -0.5, 120)).toBe(1.0);
    });

    it("should apply configurable minimum adjustment factor floor", () => {
      // With minAdjustmentFactor=0.1, floor is enforced
      expect(gfrToDoseAdjustment(0, 1.0, 120, 0.1)).toBe(0.1);
      // Without floor (default=0), allows full reduction
      expect(gfrToDoseAdjustment(0, 1.0, 120)).toBe(0);
      expect(gfrToDoseAdjustment(0, 1.0, 120, 0)).toBe(0);
    });

    it("should default to fe=0 for safe opt-in behavior", () => {
      // Without fe parameter, defaults to 0 (no renal adjustment)
      // This prevents incorrect dose reductions for hepatically-cleared drugs
      const withDefault = gfrToDoseAdjustment(60);
      expect(withDefault).toBe(1.0); // No adjustment when fe=0
      // With explicit fe=1.0, adjustment is applied
      const withExplicit = gfrToDoseAdjustment(60, 1.0, 120);
      expect(withExplicit).toBeCloseTo(0.5, 2); // 50% adjustment for GFR=60
    });
  });

  describe("calculateDose - Input Validation", () => {
    it("should return error for zero or negative weights", () => {
      const result = calculateDose(0, 70, 1, "allometric", "mouse", "human");
      expect(result.dose).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.steps).toContain(
        "Source weight: Weight must be greater than 0",
      );
    });

    it("should return error for invalid species", () => {
      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "dragon",
      );
      expect(result.dose).toBe(0);
      expect(result.error).toBe("Invalid species selection");
    });

    it("should return error for zero dose", () => {
      const result = calculateDose(0.02, 70, 0, "allometric", "mouse", "human");
      expect(result.dose).toBe(0);
      expect(result.error).toBeDefined();
    });

    it("should handle extremely large weights with warning", () => {
      const result = calculateDose(5000, 70, 1, "allometric", "human", "human");
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain(
        "Source weight: Very large weight detected. Please verify the value is correct",
      );
    });
  });

  describe("calculateDose - Allometric Scaling", () => {
    it("should calculate standard allometric scaling (mouse to human)", () => {
      // Corrected formula for mg/kg to mg/kg conversion:
      // (mg/kg)_target = (mg/kg)_source × (W_target/W_source)^(b-1)
      // With b = 0.75, exponent = -0.25
      // 1 * (70 / 0.02) ^ -0.25 = 1 * 3500 ^ -0.25 ≈ 0.130
      // This correctly shows larger animals need LOWER mg/kg doses
      const result = calculateDose(0.02, 70, 1, "allometric", "mouse", "human");
      expect(result.dose).toBeCloseTo(0.13, 2);
      expect(result.methodDescription).toContain("Allometric scaling");
      expect(result.methodDescription).toContain(
        "dose conversion exponent -0.25",
      );
    });

    it("should scale doses correctly in reverse (human to mouse)", () => {
      // Human to mouse: larger mg/kg dose needed for smaller animals
      // 1 * (0.02 / 70) ^ -0.25 = 1 * (0.000286)^-0.25 ≈ 7.69
      const result = calculateDose(70, 0.02, 1, "allometric", "human", "mouse");
      expect(result.dose).toBeCloseTo(7.69, 1);
    });

    it("should use custom scaling exponent", () => {
      // Custom exponent 0.67 → dose conversion exponent = -0.33
      const params: Partial<CalculationParameters> = { scalingExponent: 0.67 };
      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );
      expect(result.dose).toBeGreaterThan(0);
      expect(result.methodDescription).toContain(
        "dose conversion exponent -0.33",
      );
    });

    it("should handle direct scaling (exponent 1.0) correctly", () => {
      // Direct scaling: exponent 1.0 → dose conversion exponent = 0.0
      // Same mg/kg dose regardless of species weight
      const result = calculateDose(0.02, 70, 1, "direct", "mouse", "human");
      expect(result.dose).toBeCloseTo(1.0, 4); // Same dose
      expect(result.methodDescription).toContain("Direct");
    });
  });

  describe("calculateDose - BSA Scaling", () => {
    it("should calculate BSA-based scaling correctly using Km method", () => {
      // FDA Km method: Target Dose = Source Dose × (Source Km / Target Km)
      // Mouse: weight = 0.02 kg, bsa = 0.006 m², Km = 0.02/0.006 = 3.333
      // Human: weight = 70 kg, bsa = 1.9 m², Km = 70/1.9 = 36.842
      // Target Dose = 1 × (3.333 / 36.842) ≈ 0.0905
      const result = calculateDose(0.02, 70, 1, "bsa", "mouse", "human");
      expect(result.dose).toBeCloseTo(0.0905, 3);
      expect(result.methodDescription).toBe(
        "BSA-based scaling using Km factors (FDA method)",
      );
    });

    it("should handle same species BSA calculation", () => {
      const result = calculateDose(70, 70, 10, "bsa", "human", "human");
      expect(result.dose).toBe(10);
    });
  });

  describe("calculateDose - Brain Weight Scaling", () => {
    it("should calculate brain weight scaling", () => {
      const result = calculateDose(
        0.02,
        70,
        1,
        "brainWeight",
        "mouse",
        "human",
      );
      expect(result.dose).toBeGreaterThan(0);
      expect(result.methodDescription).toBe(
        "Brain weight scaling (experimental)",
      );
    });

    it("should handle equal weights gracefully with warning", () => {
      const result = calculateDose(70, 70, 1, "brainWeight", "human", "human");
      // Should handle the edge case without crashing
      expect(result).toBeDefined();
      expect(result.dose).toBe(1); // Factor = 0, so dose = baseDose * weightRatio^0 = baseDose * 1 = 1
      expect(isFinite(result.dose)).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain(
        "Source and target weights are nearly equal; scaling factor set to 0",
      );
    });
  });

  describe("calculateDose - Life-Span Scaling", () => {
    it("should calculate life-span scaling", () => {
      const result = calculateDose(0.02, 70, 1, "lifeSpan", "mouse", "human");
      expect(result.dose).toBeGreaterThan(0);
      expect(result.methodDescription).toBe("Life-span scaling (experimental)");
    });

    it("should handle equal weights gracefully with warning", () => {
      const result = calculateDose(70, 70, 1, "lifeSpan", "human", "human");
      // Should handle the edge case without crashing
      expect(result).toBeDefined();
      expect(result.dose).toBe(1); // Factor = 0, so dose = baseDose * weightRatio^0 = baseDose * 1 = 1
      expect(isFinite(result.dose)).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain(
        "Source and target weights are nearly equal; scaling factor set to 0",
      );
    });

    it("should produce finite doses for typical species pairs", () => {
      const result = calculateDose(0.15, 70, 10, "lifeSpan", "rat", "human");
      expect(isFinite(result.dose)).toBe(true);
      expect(result.dose).toBeGreaterThan(0);
    });
  });

  describe("calculateDose - Hepatic Flow Scaling", () => {
    it("should calculate hepatic clearance scaling", () => {
      const result = calculateDose(
        0.02,
        70,
        1,
        "hepaticFlow",
        "mouse",
        "human",
      );
      expect(result.dose).toBeGreaterThan(0);
      expect(result.methodDescription).toBe(
        "Hepatic clearance scaling (experimental)",
      );
    });

    it("should handle equal weights gracefully with warning", () => {
      const result = calculateDose(70, 70, 1, "hepaticFlow", "human", "human");
      // Should handle the edge case without crashing
      expect(result).toBeDefined();
      expect(result.dose).toBe(1); // Factor = 0, so dose = baseDose * weightRatio^0 = baseDose * 1 = 1
      expect(isFinite(result.dose)).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain(
        "Source and target weights are nearly equal; scaling factor set to 0",
      );
    });

    it("should produce finite doses for typical species pairs", () => {
      const result = calculateDose(0.15, 70, 10, "hepaticFlow", "rat", "human");
      expect(isFinite(result.dose)).toBe(true);
      expect(result.dose).toBeGreaterThan(0);
    });
  });

  describe("calculateDose - Advanced Parameters", () => {
    // Note: Protein binding, Vd, and LogP adjustments were removed in v0.8.0
    // as they lacked proper scientific citation. Only bioavailability and
    // kidney function adjustments are retained as scientifically valid.

    it("should apply bioavailability adjustment", () => {
      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
      );
      const params: Partial<CalculationParameters> = { bioavailability: 50 };
      const adjustedResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      // 50% bioavailability means dose should be doubled
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 2, 2);
    });

    it("should handle bioavailability method presets", () => {
      const ivParams: Partial<CalculationParameters> = {
        bioavailabilityMethod: "iv",
      };
      const oralParams: Partial<CalculationParameters> = {
        bioavailabilityMethod: "oral",
      };

      const ivResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        ivParams,
      );
      const oralResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        oralParams,
      );

      // Oral should be double IV (50% vs 100% bioavailability)
      expect(oralResult.dose).toBeCloseTo(ivResult.dose * 2, 2);
    });

    it("should handle all bioavailability route presets with literature-based defaults", () => {
      // Test all routes: IV=100%, IM=85%, SC=70%, Oral=50%, Rectal=65%, Sublingual=70%, Transdermal=35%, Inhalation=25%, Other=75%
      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "iv" },
      );

      // IM: 85% bioavailability → factor = 100/85 ≈ 1.176
      const imResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "im" },
      );
      expect(imResult.dose).toBeCloseTo(baseResult.dose * (100 / 85), 2);

      // SC: 70% bioavailability → factor = 100/70 ≈ 1.429
      const scResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "sc" },
      );
      expect(scResult.dose).toBeCloseTo(baseResult.dose * (100 / 70), 2);

      // Rectal: 65% bioavailability → factor = 100/65 ≈ 1.538
      const rectalResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "rectal" },
      );
      expect(rectalResult.dose).toBeCloseTo(baseResult.dose * (100 / 65), 2);

      // Sublingual: 70% bioavailability → factor = 100/70 ≈ 1.429
      const sublingualResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "sublingual" },
      );
      expect(sublingualResult.dose).toBeCloseTo(
        baseResult.dose * (100 / 70),
        2,
      );

      // Transdermal: 35% bioavailability → factor = 100/35 ≈ 2.857
      const transdermalResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "transdermal" },
      );
      expect(transdermalResult.dose).toBeCloseTo(
        baseResult.dose * (100 / 35),
        2,
      );

      // Inhalation: 25% bioavailability → factor = 100/25 = 4
      const inhalationResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "inhalation" },
      );
      expect(inhalationResult.dose).toBeCloseTo(baseResult.dose * 4, 2);

      // Other: 75% bioavailability → factor = 100/75 ≈ 1.333
      const otherResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "other" },
      );
      expect(otherResult.dose).toBeCloseTo(baseResult.dose * (100 / 75), 2);
    });

    it("should include route source in calculation steps", () => {
      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        { bioavailabilityMethod: "oral" },
      );

      // Check that steps include literature range information
      const bioavailabilityStep = result.steps.find((step) =>
        step.includes("Bioavailability"),
      );
      expect(bioavailabilityStep).toBeDefined();
      expect(bioavailabilityStep).toContain("oral route");
      expect(bioavailabilityStep).toContain("literature default");
    });

    it("should apply kidney function adjustment with fe=1 (100% renal)", () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: "manual",
        kidneyFunction: 50,
        fractionExcretedRenal: 1.0, // 100% renally cleared
      };
      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
      );
      const adjustedResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      // With fe=1.0 and 50% renal function: factor = 1 - 1*(1-0.5) = 0.5
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 0.5, 2);
    });

    it("should apply kidney function adjustment with fe=0.5 (50% renal)", () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: "manual",
        kidneyFunction: 50,
        fractionExcretedRenal: 0.5, // 50% renally cleared
      };
      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
      );
      const adjustedResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      // With fe=0.5 and 50% renal function: factor = 1 - 0.5*(1-0.5) = 0.75
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 0.75, 2);
    });

    it("should not adjust for fe=0 (hepatically cleared drug)", () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: "manual",
        kidneyFunction: 20, // Severe renal impairment
        fractionExcretedRenal: 0, // Hepatically cleared
      };
      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
      );
      const adjustedResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      // With fe=0: factor = 1 - 0*(1-0.2) = 1.0 (no adjustment)
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose, 2);
    });

    it("should apply Cockcroft-Gault kidney adjustment", () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: "cockcroft",
        patientAge: 70,
        patientCreatinine: 2,
        patientSex: "male",
      };
      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      expect(result.steps.some((s) => s.includes("Cockcroft-Gault"))).toBe(
        true,
      );
      expect(result.dose).toBeGreaterThan(0);
    });

    it("should apply multiple adjustments correctly", () => {
      const params: Partial<CalculationParameters> = {
        bioavailability: 50, // Double dose (÷ 0.5)
        kidneyFunctionMethod: "manual",
        kidneyFunction: 80, // 80% kidney function
        fractionExcretedRenal: 1.0, // Must specify fe for renal adjustment (fe defaults to 0)
      };

      const baseResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
      );
      const adjustedResult = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );

      // Expected: base * 2 (bioavailability) * 0.8 (kidney with fe=1.0) = base * 1.6
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 1.6, 2);
    });
  });

  describe("generateChartData", () => {
    it("should generate chart data points", () => {
      const data = generateChartData(0.02, 1, "allometric", "mouse", {}, 10);

      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data.some((p) => p.isAnimal)).toBe(true);
      expect(data.some((p) => !p.isAnimal)).toBe(true);
    });

    it("should sort data points by weight", () => {
      const data = generateChartData(0.02, 1, "allometric", "mouse", {}, 10);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].weight).toBeGreaterThanOrEqual(data[i - 1].weight);
      }
    });

    it("should include all species as data points", () => {
      const data = generateChartData(0.02, 1, "allometric", "mouse", {}, 10);
      const animalPoints = data.filter((p) => p.isAnimal);

      expect(animalPoints.length).toBeGreaterThan(10); // Should have all species
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle division by zero in logarithmic calculations", () => {
      // When weights are equal, log(1) = 0, which could cause division by zero
      // All log-based methods (brainWeight, lifeSpan, hepaticFlow) are protected
      const result = calculateDose(70, 70, 1, "lifeSpan", "human", "human");
      expect(result).toBeDefined();
      expect(isFinite(result.dose)).toBe(true);
      expect(result.dose).toBe(1); // Factor = 0 when weights are equal
    });

    it("should handle scaling from large to small species", () => {
      // Human to mouse: with corrected formula, dose should increase
      // 1000 mg/kg * (0.02/70)^-0.25 ≈ 7690 mg/kg
      const result = calculateDose(
        70,
        0.02,
        1000,
        "allometric",
        "human",
        "mouse",
      );
      expect(result.dose).toBeGreaterThan(1000); // Should increase for smaller species
      expect(isFinite(result.dose)).toBe(true);
    });

    it("should handle extreme scaling factors", () => {
      // Exponent 2.0 → dose conversion exponent = 1.0
      const params: Partial<CalculationParameters> = { scalingExponent: 2 };
      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );
      expect(result.dose).toBeGreaterThan(0);
      expect(isFinite(result.dose)).toBe(true);
    });

    it("should validate against mathematical errors", () => {
      // Test with extreme bioavailability values
      const params: Partial<CalculationParameters> = {
        bioavailability: 0.1, // Very low, should cause large dose increase
      };

      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );
      expect(isFinite(result.dose)).toBe(true);
      expect(result.dose).not.toBeNaN();
    });

    it("should provide warnings for unusual parameters", () => {
      const params: Partial<CalculationParameters> = {
        bioavailability: 5, // Very low bioavailability
      };

      const result = calculateDose(
        0.02,
        70,
        1,
        "allometric",
        "mouse",
        "human",
        params,
      );
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });
});
