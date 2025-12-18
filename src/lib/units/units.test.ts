/**
 * Unit tests for the DoseFinder unit system
 */

import { describe, it, expect } from "vitest";
import {
  // Converter functions
  convertMass,
  convertVolume,
  percentToMgMl,
  percentToConcentration,
  toMg,
  toMl,
  autoScaleMass,
  autoScaleVolume,
  dosePerKgToTotal,
  totalToDosePerKg,
  legacyDoseToMg,
  stockConcentrationToMgMl,
  // Formatter functions
  format,
  formatUnit,
  roundToIncrement,
  formatWithRounding,
  formatMass,
  formatDose,
  getBenchReadyValues,
  formatRange,
  formatUncertainty,
  // Constants
  MASS_TO_MG,
  VOLUME_TO_ML,
} from "./index";

// ============================================================================
// Mass Conversion Tests
// ============================================================================

describe("Mass Conversions", () => {
  it("converts mg to g", () => {
    const result = convertMass({ value: 1000, unit: "mg" }, "g");
    expect(result.value).toBe(1);
    expect(result.unit).toBe("g");
  });

  it("converts g to mg", () => {
    const result = convertMass({ value: 1, unit: "g" }, "mg");
    expect(result.value).toBe(1000);
    expect(result.unit).toBe("mg");
  });

  it("converts mcg to mg", () => {
    const result = convertMass({ value: 1000, unit: "mcg" }, "mg");
    expect(result.value).toBe(1);
    expect(result.unit).toBe("mg");
  });

  it("converts kg to mg", () => {
    const result = convertMass({ value: 1, unit: "kg" }, "mg");
    expect(result.value).toBe(1000000);
    expect(result.unit).toBe("mg");
  });

  it("toMg returns correct value", () => {
    expect(toMg({ value: 5, unit: "g" })).toBe(5000);
    expect(toMg({ value: 500, unit: "mcg" })).toBe(0.5);
    expect(toMg({ value: 100, unit: "mg" })).toBe(100);
  });
});

// ============================================================================
// Volume Conversion Tests
// ============================================================================

describe("Volume Conversions", () => {
  it("converts uL to mL", () => {
    const result = convertVolume({ value: 1000, unit: "uL" }, "mL");
    expect(result.value).toBe(1);
    expect(result.unit).toBe("mL");
  });

  it("converts mL to L", () => {
    const result = convertVolume({ value: 1000, unit: "mL" }, "L");
    expect(result.value).toBe(1);
    expect(result.unit).toBe("L");
  });

  it("converts L to mL", () => {
    const result = convertVolume({ value: 1, unit: "L" }, "mL");
    expect(result.value).toBe(1000);
    expect(result.unit).toBe("mL");
  });

  it("toMl returns correct value", () => {
    expect(toMl({ value: 500, unit: "uL" })).toBe(0.5);
    expect(toMl({ value: 2, unit: "L" })).toBe(2000);
  });
});

// ============================================================================
// Percent to Concentration Tests (Critical Scientific Validation)
// ============================================================================

describe("Percent to Concentration (Critical)", () => {
  describe("% w/v (weight/volume)", () => {
    it("converts 5% w/v to 50 mg/mL", () => {
      // 5% w/v = 5 g per 100 mL = 50 mg/mL
      const result = percentToMgMl(5, "wv");
      expect(result).toBe(50);
    });

    it("converts 1% w/v to 10 mg/mL", () => {
      const result = percentToMgMl(1, "wv");
      expect(result).toBe(10);
    });

    it("converts 0.5% w/v to 5 mg/mL", () => {
      const result = percentToMgMl(0.5, "wv");
      expect(result).toBe(5);
    });

    it("% w/v is NOT affected by density", () => {
      // Key validation: density parameter should be ignored for w/v
      const result1 = percentToMgMl(5, "wv", 1.0);
      const result2 = percentToMgMl(5, "wv", 1.2);
      expect(result1).toBe(50);
      expect(result2).toBe(50); // Same result regardless of density
    });
  });

  describe("% w/w (weight/weight)", () => {
    it("converts 5% w/w at density 1.0 to 50 mg/mL", () => {
      const result = percentToMgMl(5, "ww", 1.0);
      expect(result).toBe(50);
    });

    it("converts 5% w/w at density 1.2 to 60 mg/mL", () => {
      // 5% w/w at density 1.2 g/mL = 5 g/100g × 1.2 g/mL = 60 mg/mL
      const result = percentToMgMl(5, "ww", 1.2);
      expect(result).toBe(60);
    });

    it("converts 10% w/w at density 0.9 to 90 mg/mL", () => {
      const result = percentToMgMl(10, "ww", 0.9);
      expect(result).toBe(90);
    });
  });

  describe("percentToConcentration returns UnitValue", () => {
    it("returns mg/mL unit value for w/v", () => {
      const result = percentToConcentration(5, "wv");
      expect(result.value).toBe(50);
      expect(result.unit).toBe("mg/mL");
    });

    it("returns mg/mL unit value for w/w", () => {
      const result = percentToConcentration(5, "ww", 1.2);
      expect(result.value).toBe(60);
      expect(result.unit).toBe("mg/mL");
    });
  });
});

// ============================================================================
// Stock Concentration Legacy Conversion
// ============================================================================

describe("Stock Concentration Legacy Conversion", () => {
  it("converts mg/ml correctly", () => {
    expect(stockConcentrationToMgMl(10, "mg/ml")).toBe(10);
  });

  it("converts mcg/ml correctly", () => {
    expect(stockConcentrationToMgMl(1000, "mcg/ml")).toBe(1);
  });

  it("converts percent (legacy w/v) correctly", () => {
    expect(stockConcentrationToMgMl(5, "percent")).toBe(50);
  });

  it("converts g/ml correctly", () => {
    expect(stockConcentrationToMgMl(1, "g/ml")).toBe(1000);
  });
});

// ============================================================================
// Dose Conversion Tests
// ============================================================================

describe("Dose Conversions", () => {
  it("converts dose per kg to total dose", () => {
    expect(dosePerKgToTotal(10, 0.02)).toBeCloseTo(0.2); // Mouse 20g
    expect(dosePerKgToTotal(10, 70)).toBe(700); // Human 70kg
  });

  it("converts total dose to dose per kg", () => {
    expect(totalToDosePerKg(700, 70)).toBe(10);
    expect(totalToDosePerKg(0, 70)).toBe(0);
  });

  it("handles zero weight gracefully", () => {
    expect(totalToDosePerKg(100, 0)).toBe(0);
  });

  describe("Legacy dose unit conversion", () => {
    it("converts mg correctly", () => {
      expect(legacyDoseToMg(10, "mg")).toBe(10);
    });

    it("converts mg/kg correctly", () => {
      expect(legacyDoseToMg(10, "mg/kg", 0.02)).toBeCloseTo(0.2);
    });

    it("converts mcg correctly", () => {
      expect(legacyDoseToMg(1000, "mcg")).toBe(1);
    });

    it("converts mcg/kg correctly", () => {
      expect(legacyDoseToMg(1000, "mcg/kg", 0.02)).toBeCloseTo(0.02);
    });
  });
});

// ============================================================================
// Auto-Scaling Tests
// ============================================================================

describe("Auto-Scaling", () => {
  describe("Mass auto-scaling", () => {
    it("scales small values to mcg", () => {
      const result = autoScaleMass(0.001);
      expect(result.value).toBe(1);
      expect(result.unit).toBe("mcg");
    });

    it("keeps reasonable values in mg", () => {
      const result = autoScaleMass(100);
      expect(result.value).toBe(100);
      expect(result.unit).toBe("mg");
    });

    it("scales large values to g", () => {
      const result = autoScaleMass(5000);
      expect(result.value).toBe(5);
      expect(result.unit).toBe("g");
    });

    it("scales very large values to kg", () => {
      const result = autoScaleMass(2000000);
      expect(result.value).toBe(2);
      expect(result.unit).toBe("kg");
    });
  });

  describe("Volume auto-scaling", () => {
    it("scales small values to uL", () => {
      const result = autoScaleVolume(0.1);
      expect(result.value).toBe(100);
      expect(result.unit).toBe("uL");
    });

    it("keeps reasonable values in mL", () => {
      const result = autoScaleVolume(50);
      expect(result.value).toBe(50);
      expect(result.unit).toBe("mL");
    });

    it("scales large values to L", () => {
      const result = autoScaleVolume(2000);
      expect(result.value).toBe(2);
      expect(result.unit).toBe("L");
    });
  });
});

// ============================================================================
// Formatter Tests
// ============================================================================

describe("Formatting", () => {
  describe("formatUnit", () => {
    it("formats mcg as μg", () => {
      expect(formatUnit("mcg")).toBe("μg");
    });

    it("formats mg/m2 as mg/m²", () => {
      expect(formatUnit("mg/m2")).toBe("mg/m²");
    });

    it("formats uL as μL", () => {
      expect(formatUnit("uL")).toBe("μL");
    });

    it("formats percent_wv as % w/v", () => {
      expect(formatUnit("percent_wv")).toBe("% w/v");
    });
  });

  describe("format", () => {
    it("formats value with unit", () => {
      expect(format({ value: 10, unit: "mg/kg" })).toBe("10.000 mg/kg");
    });

    it("respects precision parameter", () => {
      expect(format({ value: 10.123456, unit: "mg" }, 2)).toBe("10.12 mg");
    });

    it("uses scientific notation for very small values", () => {
      const result = format({ value: 0.00001, unit: "mg" });
      expect(result).toMatch(/e/);
    });
  });

  describe("formatDose", () => {
    it("formats dose with mg/kg unit", () => {
      expect(formatDose(10.5)).toBe("10.5000 mg/kg");
    });
  });

  describe("formatMass", () => {
    it("formats mass in mg by default", () => {
      expect(formatMass(100)).toBe("100.000 mg");
    });

    it("auto-scales when enabled", () => {
      expect(formatMass(5000, true)).toBe("5.000 g");
    });
  });
});

// ============================================================================
// Rounding Tests
// ============================================================================

describe("Rounding", () => {
  describe("roundToIncrement", () => {
    it("rounds to nearest 0.1", () => {
      expect(roundToIncrement(0.123, 0.1, "nearest")).toBeCloseTo(0.1);
      expect(roundToIncrement(0.167, 0.1, "nearest")).toBeCloseTo(0.2);
    });

    it("rounds up to increment", () => {
      expect(roundToIncrement(0.11, 0.1, "up")).toBeCloseTo(0.2);
      expect(roundToIncrement(0.1, 0.1, "up")).toBeCloseTo(0.1);
    });

    it("rounds down to increment", () => {
      expect(roundToIncrement(0.19, 0.1, "down")).toBeCloseTo(0.1);
    });

    it("handles zero/negative increment", () => {
      expect(roundToIncrement(0.123, 0, "nearest")).toBe(0.123);
    });
  });

  describe("formatWithRounding", () => {
    it("formats with rounding applied", () => {
      const result = formatWithRounding(0.123, "mL", 0.1, "nearest", 2);
      expect(result).toBe("0.10 mL");
    });
  });
});

// ============================================================================
// Bench-Ready Values Tests
// ============================================================================

describe("Bench-Ready Values", () => {
  it("calculates values for mouse dosing", () => {
    // 10 mg/kg dose for 20g mouse with 3 mg/mL stock
    const result = getBenchReadyValues(10, 0.02, 3);

    // Total dose = 10 mg/kg × 0.02 kg = 0.2 mg
    expect(result.doseRaw).toBeCloseTo(0.2);

    // Volume = 0.2 mg / 3 mg/mL = 0.0667 mL
    expect(result.volumeRaw).toBeCloseTo(0.0667, 3);

    // Check rounded values are present
    expect(result.doseRounded).toBeDefined();
    expect(result.volumeRounded).toBeDefined();
  });

  it("handles zero concentration gracefully", () => {
    const result = getBenchReadyValues(10, 0.02, 0);
    expect(result.volumeRaw).toBe(0);
  });
});

// ============================================================================
// Uncertainty Formatting
// ============================================================================

describe("Uncertainty Formatting", () => {
  it("calculates ±30% bounds", () => {
    const result = formatUncertainty(100, "mg/kg", 0.3);
    expect(result.lower).toBe("70.000 mg/kg");
    expect(result.upper).toBe("130.000 mg/kg");
  });

  it("formats range correctly", () => {
    const result = formatRange(70, 130, "mg/kg");
    expect(result).toBe("70.000 - 130.000 mg/kg");
  });
});

// ============================================================================
// Constants Validation
// ============================================================================

describe("Constants", () => {
  it("MASS_TO_MG has correct conversion factors", () => {
    expect(MASS_TO_MG.mcg).toBe(0.001);
    expect(MASS_TO_MG.mg).toBe(1);
    expect(MASS_TO_MG.g).toBe(1000);
    expect(MASS_TO_MG.kg).toBe(1000000);
  });

  it("VOLUME_TO_ML has correct conversion factors", () => {
    expect(VOLUME_TO_ML.uL).toBe(0.001);
    expect(VOLUME_TO_ML.mL).toBe(1);
    expect(VOLUME_TO_ML.L).toBe(1000);
  });
});
