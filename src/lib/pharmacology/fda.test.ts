/**
 * Unit tests for FDA FIH calculations
 */

import { describe, it, expect } from "vitest";
import {
  calculateFdaFihDose,
  calculateHED,
  calculateHEDWithValidation,
  calculateMRSD,
  getKmFactor,
  getSupportedSpecies,
  validateFihInput,
  validateKmFactor,
  formatFihResultSummary,
  isFdaValidatedSpecies,
} from "./fda";
import { FDA_KM_FACTORS, KM_VALIDATION_RANGES } from "./constants";

// ============================================================================
// Km Factor Tests
// ============================================================================

describe("FDA Km Factors", () => {
  it("returns correct Km for mouse", () => {
    expect(getKmFactor("mouse")).toBe(3);
  });

  it("returns correct Km for rat", () => {
    expect(getKmFactor("rat")).toBe(6);
  });

  it("returns correct Km for dog", () => {
    expect(getKmFactor("dog")).toBe(20);
  });

  it("returns correct Km for monkey", () => {
    expect(getKmFactor("monkey")).toBe(12);
  });

  it("returns correct Km for human", () => {
    expect(getKmFactor("human")).toBe(37);
  });

  it("handles case-insensitive species names", () => {
    expect(getKmFactor("Mouse")).toBe(3);
    expect(getKmFactor("MOUSE")).toBe(3);
    expect(getKmFactor("MoUsE")).toBe(3);
  });

  it("returns null for unknown species", () => {
    expect(getKmFactor("unicorn")).toBeNull();
    expect(getKmFactor("")).toBeNull();
  });

  it("Km values match FDA 2005 guidance exactly", () => {
    // Critical validation - these MUST match FDA 2005 Table 1
    // NOTE: Keys are lowercase to match normalization in fda.ts getKmFactor()
    expect(FDA_KM_FACTORS.mouse).toBe(3);
    expect(FDA_KM_FACTORS.rat).toBe(6);
    expect(FDA_KM_FACTORS.hamster).toBe(5);
    expect(FDA_KM_FACTORS.guineapig).toBe(8);
    expect(FDA_KM_FACTORS.rabbit).toBe(12);
    expect(FDA_KM_FACTORS.monkey).toBe(12);
    expect(FDA_KM_FACTORS.dog).toBe(20);
    expect(FDA_KM_FACTORS.minipig).toBe(35); // FDA Table 1: 40 kg mini-pig
    expect(FDA_KM_FACTORS.micropig).toBe(27); // FDA Table 1: 20 kg micro-pig
    expect(FDA_KM_FACTORS.human).toBe(37);
  });
});

// ============================================================================
// FDA Validated Species Tests
// ============================================================================

describe("FDA Validated Species", () => {
  it("identifies FDA Table 1 species as validated", () => {
    // NOTE: Keys are normalized to lowercase in FDA_VALIDATED_SPECIES
    expect(isFdaValidatedSpecies("mouse")).toBe(true);
    expect(isFdaValidatedSpecies("rat")).toBe(true);
    expect(isFdaValidatedSpecies("hamster")).toBe(true);
    expect(isFdaValidatedSpecies("guineapig")).toBe(true);
    expect(isFdaValidatedSpecies("rabbit")).toBe(true);
    expect(isFdaValidatedSpecies("monkey")).toBe(true);
    expect(isFdaValidatedSpecies("dog")).toBe(true);
    expect(isFdaValidatedSpecies("minipig")).toBe(true);
    expect(isFdaValidatedSpecies("micropig")).toBe(true);
    expect(isFdaValidatedSpecies("human")).toBe(true);
  });

  it("identifies estimated species as not FDA validated", () => {
    expect(isFdaValidatedSpecies("ferret")).toBe(false);
    expect(isFdaValidatedSpecies("marmoset")).toBe(false);
    expect(isFdaValidatedSpecies("beagle")).toBe(false);
    expect(isFdaValidatedSpecies("cynomolgus")).toBe(false);
    expect(isFdaValidatedSpecies("rhesus")).toBe(false);
  });

  it("handles case-insensitive species names", () => {
    expect(isFdaValidatedSpecies("Mouse")).toBe(true);
    expect(isFdaValidatedSpecies("MOUSE")).toBe(true);
    expect(isFdaValidatedSpecies("guineapig")).toBe(true);
    expect(isFdaValidatedSpecies("GUINEAPIG")).toBe(true);
  });

  it("returns false for unknown species", () => {
    expect(isFdaValidatedSpecies("unicorn")).toBe(false);
    expect(isFdaValidatedSpecies("")).toBe(false);
  });
});

// ============================================================================
// HED Calculation Tests
// ============================================================================

describe("HED Calculation", () => {
  it("calculates HED correctly for mouse", () => {
    // HED = NOAEL × (Animal Km / Human Km)
    // HED = 100 × (3 / 37) = 8.108 mg/kg
    const hed = calculateHED(100, 3, 37);
    expect(hed).toBeCloseTo(8.108, 2);
  });

  it("calculates HED correctly for rat", () => {
    // HED = 100 × (6 / 37) = 16.216 mg/kg
    const hed = calculateHED(100, 6, 37);
    expect(hed).toBeCloseTo(16.216, 2);
  });

  it("calculates HED correctly for dog", () => {
    // HED = 100 × (20 / 37) = 54.054 mg/kg
    const hed = calculateHED(100, 20, 37);
    expect(hed).toBeCloseTo(54.054, 2);
  });

  it("calculates HED correctly for monkey", () => {
    // HED = 100 × (12 / 37) = 32.432 mg/kg
    const hed = calculateHED(100, 12, 37);
    expect(hed).toBeCloseTo(32.432, 2);
  });

  it("handles very small NOAEL values", () => {
    const hed = calculateHED(0.1, 3, 37);
    expect(hed).toBeCloseTo(0.00811, 4);
  });

  it("handles very large NOAEL values", () => {
    const hed = calculateHED(10000, 3, 37);
    expect(hed).toBeCloseTo(810.8, 1);
  });

  describe("with validation", () => {
    it("validates Km values when validateKm is true", () => {
      // Valid Km values should still calculate correctly
      const hed = calculateHED(100, 3, 37, {
        validateKm: true,
        species: "mouse",
      });
      expect(hed).toBeCloseTo(8.108, 2);
    });

    it("returns NaN for biologically implausible low Km", () => {
      const hed = calculateHED(100, 0.3, 37, { validateKm: true });
      expect(hed).toBeNaN();
    });

    it("returns NaN for biologically implausible high Km", () => {
      const hed = calculateHED(100, 50, 37, { validateKm: true });
      expect(hed).toBeNaN();
    });

    it("throws error for invalid Km when throwOnInvalidKm is true", () => {
      expect(() =>
        calculateHED(100, 0.3, 37, {
          validateKm: true,
          throwOnInvalidKm: true,
        }),
      ).toThrow("Invalid animal Km factor");
    });

    it("throws error for invalid human Km when throwOnInvalidKm is true", () => {
      expect(() =>
        calculateHED(100, 3, 50, { validateKm: true, throwOnInvalidKm: true }),
      ).toThrow("Invalid human Km factor");
    });
  });
});

// ============================================================================
// Km Validation Tests
// ============================================================================

describe("Km Factor Validation", () => {
  describe("validateKmFactor", () => {
    describe("basic validation", () => {
      it("rejects negative Km values", () => {
        const result = validateKmFactor(-3);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
      });

      it("rejects zero Km value", () => {
        const result = validateKmFactor(0);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
      });

      it("rejects NaN Km value", () => {
        const result = validateKmFactor(NaN);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
      });

      it("rejects Infinity Km value", () => {
        const result = validateKmFactor(Infinity);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
      });
    });

    describe("biological plausibility ranges", () => {
      it("rejects Km below minimum (0.3 for mouse)", () => {
        const result = validateKmFactor(0.3, "mouse");
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
        expect(result.message).toContain("below minimum");
      });

      it("rejects Km above maximum (50)", () => {
        const result = validateKmFactor(50, "dog");
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
        expect(result.message).toContain("above maximum");
      });

      it("accepts valid Km within range", () => {
        const result = validateKmFactor(3, "mouse");
        expect(result.isValid).toBe(true);
        expect(result.severity).toBe("none");
      });

      it("uses correct MIN_ANIMAL_KM constant", () => {
        expect(KM_VALIDATION_RANGES.MIN_ANIMAL_KM).toBe(2);
      });

      it("uses correct MAX_ANIMAL_KM constant", () => {
        expect(KM_VALIDATION_RANGES.MAX_ANIMAL_KM).toBe(40);
      });
    });

    describe("species-specific validation", () => {
      it("validates mouse Km within species range (2.5-4)", () => {
        const valid = validateKmFactor(3, "mouse");
        expect(valid.isValid).toBe(true);
        expect(valid.isWithinSpeciesRange).toBe(true);
      });

      it("warns when mouse Km is outside species range but biologically valid", () => {
        const result = validateKmFactor(10, "mouse");
        expect(result.isValid).toBe(true); // Still biologically plausible
        expect(result.isWithinSpeciesRange).toBe(false);
        expect(result.severity).toBe("warning");
      });

      it("validates rat Km within species range (5-7)", () => {
        const result = validateKmFactor(6, "rat");
        expect(result.isValid).toBe(true);
        expect(result.isWithinSpeciesRange).toBe(true);
      });

      it("validates dog Km within species range (18-22)", () => {
        const result = validateKmFactor(20, "dog");
        expect(result.isValid).toBe(true);
        expect(result.isWithinSpeciesRange).toBe(true);
      });

      it("validates monkey Km within species range (10-14)", () => {
        const result = validateKmFactor(12, "monkey");
        expect(result.isValid).toBe(true);
        expect(result.isWithinSpeciesRange).toBe(true);
      });

      it("validates minipig Km within species range (32-38)", () => {
        const result = validateKmFactor(35, "minipig");
        expect(result.isValid).toBe(true);
        expect(result.isWithinSpeciesRange).toBe(true);
      });
    });

    describe("human Km validation", () => {
      it("validates correct human Km (37)", () => {
        const result = validateKmFactor(37, undefined, true);
        expect(result.isValid).toBe(true);
        expect(result.isWithinSpeciesRange).toBe(true);
      });

      it("rejects human Km outside tolerance range", () => {
        const result = validateKmFactor(30, undefined, true);
        expect(result.isValid).toBe(false);
        expect(result.severity).toBe("error");
        expect(result.message).toContain("Human Km factor");
      });

      it("accepts human Km within 5% tolerance", () => {
        // 37 ± 5% = 35.15 - 38.85
        const result = validateKmFactor(36, undefined, true);
        expect(result.isValid).toBe(true);
      });
    });

    describe("provides helpful recommendations", () => {
      it("includes recommendation for implausibly low Km", () => {
        const result = validateKmFactor(0.5);
        expect(result.recommendation).toContain("Mouse has the lowest Km at 3");
      });

      it("includes recommendation for implausibly high Km", () => {
        const result = validateKmFactor(50);
        expect(result.recommendation).toContain(
          "Mini-pig has the highest animal Km at 35",
        );
      });

      it("includes recommendation for species-specific Km mismatch", () => {
        const result = validateKmFactor(10, "mouse");
        expect(result.recommendation).toContain("FDA 2005 Table 1");
        expect(result.recommendation).toContain("mouse");
      });
    });
  });

  describe("calculateHEDWithValidation", () => {
    it("returns HED and validation results for valid Km values", () => {
      const result = calculateHEDWithValidation(100, 3, 37, "mouse");
      expect(result.hed).toBeCloseTo(8.108, 2);
      expect(result.animalKmValidation?.isValid).toBe(true);
      expect(result.humanKmValidation?.isValid).toBe(true);
    });

    it("returns NaN HED for invalid animal Km", () => {
      const result = calculateHEDWithValidation(100, 0.3, 37, "mouse");
      expect(result.hed).toBeNaN();
      expect(result.animalKmValidation?.isValid).toBe(false);
    });

    it("returns NaN HED for invalid human Km", () => {
      const result = calculateHEDWithValidation(100, 3, 50);
      expect(result.hed).toBeNaN();
      expect(result.humanKmValidation?.isValid).toBe(false);
    });

    it("includes expected range in validation results", () => {
      const result = calculateHEDWithValidation(100, 3, 37, "mouse");
      expect(result.animalKmValidation?.expectedRange).toBeDefined();
      expect(result.animalKmValidation?.expectedRange?.expected).toBe(3);
    });
  });
});

// ============================================================================
// MRSD Calculation Tests
// ============================================================================

describe("MRSD Calculation", () => {
  it("calculates MRSD with 10× safety factor", () => {
    const mrsd = calculateMRSD(10, 10);
    expect(mrsd).toBe(1);
  });

  it("calculates MRSD with 3× safety factor", () => {
    const mrsd = calculateMRSD(10, 3);
    expect(mrsd).toBeCloseTo(3.333, 2);
  });

  it("calculates MRSD with 30× safety factor", () => {
    const mrsd = calculateMRSD(10, 30);
    expect(mrsd).toBeCloseTo(0.333, 2);
  });

  it("throws error for zero safety factor", () => {
    expect(() => calculateMRSD(10, 0)).toThrow();
  });

  it("throws error for negative safety factor", () => {
    expect(() => calculateMRSD(10, -1)).toThrow();
  });
});

// ============================================================================
// Complete FIH Workflow Tests
// ============================================================================

describe("Complete FIH Calculation", () => {
  describe("Basic calculations", () => {
    it("calculates MRSD for mouse with 10× safety factor", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      // HED = 100 × (3/37) = 8.108
      // MRSD = 8.108 / 10 = 0.811
      expect(result.hed).toBeCloseTo(8.108, 2);
      expect(result.mrsd).toBeCloseTo(0.811, 2);
      expect(result.mrsdTotal).toBeCloseTo(48.65, 1); // 0.811 × 60 kg
      expect(result.animalKm).toBe(3);
      expect(result.humanKm).toBe(37);
    });

    it("calculates MRSD for rat", () => {
      const result = calculateFdaFihDose({
        noael: 50,
        animalSpecies: "rat",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      // HED = 50 × (6/37) = 8.108
      // MRSD = 8.108 / 10 = 0.811
      expect(result.hed).toBeCloseTo(8.108, 2);
      expect(result.mrsd).toBeCloseTo(0.811, 2);
    });

    it("calculates MRSD for dog", () => {
      const result = calculateFdaFihDose({
        noael: 10,
        animalSpecies: "dog",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      // HED = 10 × (20/37) = 5.405
      // MRSD = 5.405 / 10 = 0.541
      expect(result.hed).toBeCloseTo(5.405, 2);
      expect(result.mrsd).toBeCloseTo(0.541, 2);
    });

    it("calculates MRSD for monkey", () => {
      const result = calculateFdaFihDose({
        noael: 30,
        animalSpecies: "monkey",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      // HED = 30 × (12/37) = 9.730
      // MRSD = 9.730 / 10 = 0.973
      expect(result.hed).toBeCloseTo(9.73, 2);
      expect(result.mrsd).toBeCloseTo(0.973, 2);
    });
  });

  describe("Safety factor variations", () => {
    it("uses 3× safety factor correctly", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 3,
        modality: "small_molecule",
      });

      expect(result.mrsd).toBeCloseTo(2.703, 2); // 8.108 / 3
    });

    it("uses 30× safety factor correctly", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 30,
        modality: "small_molecule",
      });

      expect(result.mrsd).toBeCloseTo(0.27, 2); // 8.108 / 30
    });

    it("accepts custom safety factor", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 15,
        modality: "small_molecule",
      });

      expect(result.mrsd).toBeCloseTo(0.541, 2); // 8.108 / 15
      expect(
        result.warnings.some((w) => w.code === "CUSTOM_SAFETY_FACTOR"),
      ).toBe(true);
    });
  });

  describe("Calculation steps", () => {
    it("provides detailed calculation steps", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      expect(result.steps.length).toBeGreaterThan(0);
      expect(result.steps.some((s) => s.description.includes("Km"))).toBe(true);
      expect(result.steps.some((s) => s.description.includes("HED"))).toBe(
        true,
      );
      expect(result.steps.some((s) => s.description.includes("MRSD"))).toBe(
        true,
      );
    });

    it("includes formulas in steps", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      const hedStep = result.steps.find((s) =>
        s.description.includes("Human Equivalent Dose"),
      );
      expect(hedStep?.formula).toContain("NOAEL");
      expect(hedStep?.formula).toContain("Km");
    });
  });

  describe("Biologic warnings", () => {
    it("warns for biologics about MABEL requirement", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "monkey",
        safetyFactor: 10,
        modality: "biologic",
      });

      expect(
        result.warnings.some((w) => w.code === "BIOLOGIC_MABEL_REQUIRED"),
      ).toBe(true);
    });

    it("provides MABEL recommendation for biologics", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "monkey",
        safetyFactor: 10,
        modality: "biologic",
      });

      const mabelWarning = result.warnings.find(
        (w) => w.code === "BIOLOGIC_MABEL_REQUIRED",
      );
      expect(mabelWarning?.recommendation).toContain("MABEL");
    });
  });

  describe("Unknown species handling", () => {
    it("handles unknown species gracefully", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "unicorn",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      expect(result.hed).toBe(0);
      expect(result.mrsd).toBe(0);
      expect(result.warnings.some((w) => w.code === "UNKNOWN_SPECIES")).toBe(
        true,
      );
    });
  });

  describe("Estimated species handling", () => {
    it("warns when using estimated species (ferret)", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "ferret",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      // Calculation should still work
      expect(result.mrsd).toBeGreaterThan(0);
      // But should include warning about estimated Km
      expect(
        result.warnings.some((w) => w.code === "ESTIMATED_SPECIES_KM"),
      ).toBe(true);
    });

    it("warns when using estimated species (marmoset)", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "marmoset",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      expect(result.mrsd).toBeGreaterThan(0);
      expect(
        result.warnings.some((w) => w.code === "ESTIMATED_SPECIES_KM"),
      ).toBe(true);
    });

    it("does not warn for FDA-validated species", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      expect(
        result.warnings.some((w) => w.code === "ESTIMATED_SPECIES_KM"),
      ).toBe(false);
    });
  });

  describe("Multi-species support", () => {
    it("calculates for multiple species", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
        additionalSpeciesData: [
          { species: "rat", noael: 50 },
          { species: "dog", noael: 10 },
        ],
      });

      expect(result.multiSpeciesResults).toBeDefined();
      expect(result.multiSpeciesResults?.length).toBe(3); // mouse + rat + dog
    });

    it("recommends most conservative MRSD", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
        additionalSpeciesData: [{ species: "dog", noael: 5 }],
      });

      // Dog with NOAEL 5: HED = 5 × (20/37) = 2.703, MRSD = 0.270
      // Mouse with NOAEL 100: MRSD = 0.811
      // Dog should be more conservative
      expect(result.recommendedMrsd?.source).toBe("dog");
      expect(result.recommendedMrsd?.value).toBeCloseTo(0.27, 2);
    });
  });

  describe("Custom human weight", () => {
    it("uses custom human weight for total dose", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
        humanWeight: 70,
      });

      expect(result.humanWeight).toBe(70);
      expect(result.mrsdTotal).toBeCloseTo(result.mrsd * 70, 2);
    });
  });
});

// ============================================================================
// Utility Function Tests
// ============================================================================

describe("Utility Functions", () => {
  describe("getSupportedSpecies", () => {
    it("returns only FDA-validated species", () => {
      const species = getSupportedSpecies();
      // FDA 2005 Table 1 has 9 animal species (excluding human)
      expect(species.length).toBe(9);
      expect(species.some((s) => s.id === "mouse")).toBe(true);
      expect(species.some((s) => s.id === "rat")).toBe(true);
      expect(species.some((s) => s.id === "dog")).toBe(true);
      expect(species.some((s) => s.id === "minipig")).toBe(true);
      expect(species.some((s) => s.id === "micropig")).toBe(true);
    });

    it("does not include human", () => {
      const species = getSupportedSpecies();
      expect(species.some((s) => s.id === "human")).toBe(false);
    });

    it("does not include estimated species", () => {
      const species = getSupportedSpecies();
      // These species are not in FDA 2005 Table 1
      expect(species.some((s) => s.id === "ferret")).toBe(false);
      expect(species.some((s) => s.id === "marmoset")).toBe(false);
      expect(species.some((s) => s.id === "beagle")).toBe(false);
      expect(species.some((s) => s.id === "cynomolgus")).toBe(false);
    });

    it("includes Km values matching FDA guidance", () => {
      const species = getSupportedSpecies();
      const mouse = species.find((s) => s.id === "mouse");
      expect(mouse?.km).toBe(3);
      const minipig = species.find((s) => s.id === "minipig");
      expect(minipig?.km).toBe(35); // FDA Table 1: 40 kg mini-pig
      const micropig = species.find((s) => s.id === "micropig");
      expect(micropig?.km).toBe(27); // FDA Table 1: 20 kg micro-pig
    });

    it("marks all species as FDA validated", () => {
      const species = getSupportedSpecies();
      expect(species.every((s) => s.isFdaValidated)).toBe(true);
    });
  });

  describe("validateFihInput", () => {
    it("validates positive NOAEL", () => {
      const errors = validateFihInput({ noael: -1 });
      expect(errors).toContain("NOAEL must be a positive number");
    });

    it("validates species is provided", () => {
      const errors = validateFihInput({ animalSpecies: "" });
      expect(errors).toContain("Animal species is required");
    });

    it("validates safety factor >= 1", () => {
      const errors = validateFihInput({ safetyFactor: 0.5 });
      expect(errors).toContain("Safety factor must be at least 1");
    });

    it("validates modality is provided", () => {
      const errors = validateFihInput({ modality: undefined });
      expect(errors).toContain("Drug modality is required");
    });

    it("returns empty array for valid input", () => {
      const errors = validateFihInput({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });
      expect(errors).toHaveLength(0);
    });
  });

  describe("formatFihResultSummary", () => {
    it("formats result summary", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 10,
        modality: "small_molecule",
      });

      const summary = formatFihResultSummary(result);
      expect(summary).toContain("HED");
      expect(summary).toContain("MRSD");
      expect(summary).toContain("Safety Factor");
    });

    it("includes warnings in summary", () => {
      const result = calculateFdaFihDose({
        noael: 100,
        animalSpecies: "mouse",
        safetyFactor: 15, // Custom - will trigger warning
        modality: "small_molecule",
      });

      const summary = formatFihResultSummary(result);
      expect(summary).toContain("Warnings");
    });
  });
});
