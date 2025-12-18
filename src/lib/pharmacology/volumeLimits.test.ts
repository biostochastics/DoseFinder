/**
 * Tests for volumeLimits module
 *
 * Tests NC3Rs/IACUC volume limit validation functionality
 */

import { describe, expect, it } from "vitest";
import {
  getVolumeLimit,
  calculateVolume,
  calculateRequiredConcentration,
  validateVolume,
  validateDoseVolume,
  getSupportedSpeciesForVolumeLimits,
  getRoutesWithLimits,
  formatVolumeLimit,
} from "./volumeLimits";

describe("getVolumeLimit", () => {
  it("returns limit for mouse IV", () => {
    const limit = getVolumeLimit("mouse", "iv");
    expect(limit).not.toBeNull();
    expect(limit?.maxMlPerKg).toBe(5);
    expect(limit?.maxAbsoluteMl).toBe(0.1);
  });

  it("returns limit for rat oral (po)", () => {
    const limit = getVolumeLimit("rat", "po");
    expect(limit).not.toBeNull();
    expect(limit?.maxMlPerKg).toBe(10);
    expect(limit?.maxAbsoluteMl).toBe(5);
  });

  it("returns limit for dog IM with site limits", () => {
    const limit = getVolumeLimit("dog", "im");
    expect(limit).not.toBeNull();
    expect(limit?.maxMlPerKg).toBe(0.5);
    expect(limit?.maxMlPerSite).toBe(2);
    expect(limit?.maxSites).toBe(2);
  });

  it("returns null for unsupported species", () => {
    const limit = getVolumeLimit("unicorn", "iv");
    expect(limit).toBeNull();
  });

  it("returns null for unsupported route", () => {
    // Mouse doesn't have "other" route defined
    const limit = getVolumeLimit("mouse", "other");
    expect(limit).toBeNull();
  });

  it("handles case-insensitive species names", () => {
    const limit1 = getVolumeLimit("Mouse", "iv");
    const limit2 = getVolumeLimit("MOUSE", "iv");
    const limit3 = getVolumeLimit("mouse", "iv");
    expect(limit1).toEqual(limit3);
    expect(limit2).toEqual(limit3);
  });
});

describe("calculateVolume", () => {
  it("calculates volume from dose and concentration", () => {
    // 10 mg dose, 5 mg/mL concentration → 2 mL
    expect(calculateVolume(10, 5)).toBe(2);
  });

  it("handles small doses", () => {
    // 0.1 mg dose, 10 mg/mL concentration → 0.01 mL
    expect(calculateVolume(0.1, 10)).toBeCloseTo(0.01);
  });

  it("returns 0 for zero concentration", () => {
    expect(calculateVolume(10, 0)).toBe(0);
  });

  it("returns 0 for negative concentration", () => {
    expect(calculateVolume(10, -5)).toBe(0);
  });
});

describe("calculateRequiredConcentration", () => {
  it("calculates required concentration to meet volume limit", () => {
    // 10 mg dose in max 2 mL → need 5 mg/mL
    expect(calculateRequiredConcentration(10, 2)).toBe(5);
  });

  it("handles small volumes", () => {
    // 1 mg dose in max 0.1 mL → need 10 mg/mL
    expect(calculateRequiredConcentration(1, 0.1)).toBe(10);
  });

  it("returns Infinity for zero volume limit", () => {
    expect(calculateRequiredConcentration(10, 0)).toBe(Infinity);
  });
});

describe("validateVolume", () => {
  describe("within limits", () => {
    it("validates mouse IV within limits", () => {
      const result = validateVolume({
        species: "mouse",
        route: "iv",
        weightKg: 0.02,
        volumeMl: 0.05, // Well within 0.1 mL absolute limit
      });
      expect(result.isValid).toBe(true);
      expect(result.warnings.filter((w) => w.severity !== "info")).toHaveLength(
        0,
      );
    });

    it("validates rat oral within limits", () => {
      const result = validateVolume({
        species: "rat",
        route: "po",
        weightKg: 0.25,
        volumeMl: 2, // 8 mL/kg, within 10 mL/kg limit
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("exceeds per-kg limit", () => {
    it("warns when exceeding per-kg limit", () => {
      const result = validateVolume({
        species: "mouse",
        route: "po",
        weightKg: 0.02,
        volumeMl: 0.3, // 15 mL/kg, exceeds 10 mL/kg limit
      });
      expect(result.isValid).toBe(false);
      expect(
        result.warnings.some((w) => w.code === "EXCEEDS_PER_KG_LIMIT"),
      ).toBe(true);
    });

    it("generates suggestions for exceeding limit", () => {
      const result = validateVolume({
        species: "mouse",
        route: "po",
        weightKg: 0.02,
        volumeMl: 0.3,
      });
      const warning = result.warnings.find(
        (w) => w.code === "EXCEEDS_PER_KG_LIMIT",
      );
      expect(warning?.suggestions.length).toBeGreaterThan(0);
      // FIX: validateVolume no longer generates concentration suggestions without dose
      // Concentration suggestions are only available via validateDoseVolume
      expect(warning?.suggestions.some((s) => s.type === "reduce_volume")).toBe(
        true,
      );
    });
  });

  describe("exceeds absolute limit", () => {
    it("warns when exceeding absolute limit", () => {
      const result = validateVolume({
        species: "mouse",
        route: "iv",
        weightKg: 0.02,
        volumeMl: 0.15, // Exceeds 0.1 mL absolute limit
      });
      expect(result.isValid).toBe(false);
    });
  });

  describe("IM site limits", () => {
    it("warns when exceeding IM site limits", () => {
      const result = validateVolume({
        species: "dog",
        route: "im",
        weightKg: 10,
        volumeMl: 6, // Exceeds 2 mL/site × 2 sites = 4 mL total
      });
      expect(result.isValid).toBe(false);
      expect(
        result.warnings.some((w) => w.code === "EXCEEDS_IM_SITE_LIMIT"),
      ).toBe(true);
    });
  });

  describe("critical severity", () => {
    it("marks as critical when > 2× limit", () => {
      const result = validateVolume({
        species: "mouse",
        route: "iv",
        weightKg: 0.02,
        volumeMl: 0.3, // 3× the 0.1 mL absolute limit
      });
      expect(result.warnings.some((w) => w.severity === "critical")).toBe(true);
    });
  });

  describe("unsupported species/route", () => {
    it("returns info warning for unsupported species", () => {
      const result = validateVolume({
        species: "unknown",
        route: "iv",
        weightKg: 1,
        volumeMl: 5,
      });
      expect(result.isValid).toBe(true); // No limits = valid
      expect(result.warnings.some((w) => w.code === "NO_LIMIT_DEFINED")).toBe(
        true,
      );
    });
  });
});

describe("validateDoseVolume", () => {
  it("validates dose and calculates volume", () => {
    const result = validateDoseVolume({
      species: "mouse",
      route: "iv",
      weightKg: 0.02,
      doseMg: 0.5, // 0.5 mg dose
      concentrationMgMl: 10, // 10 mg/mL → 0.05 mL volume
    });
    expect(result.volume).toBeCloseTo(0.05);
    expect(result.isValid).toBe(true);
  });

  it("warns when calculated volume exceeds limits", () => {
    const result = validateDoseVolume({
      species: "mouse",
      route: "iv",
      weightKg: 0.02,
      doseMg: 2, // 2 mg dose
      concentrationMgMl: 10, // 10 mg/mL → 0.2 mL volume (exceeds 0.1 mL)
    });
    expect(result.volume).toBeCloseTo(0.2);
    expect(result.isValid).toBe(false);
  });

  it("updates concentration suggestions with actual dose", () => {
    const result = validateDoseVolume({
      species: "mouse",
      route: "iv",
      weightKg: 0.02,
      doseMg: 2,
      concentrationMgMl: 10,
    });
    const concSuggestion = result.warnings
      .flatMap((w) => w.suggestions)
      .find((s) => s.type === "increase_concentration");
    expect(concSuggestion).toBeDefined();
    expect(concSuggestion?.newValue).toBeGreaterThan(10); // Should suggest higher concentration
  });
});

describe("getSupportedSpeciesForVolumeLimits", () => {
  it("returns array of species with volume limits", () => {
    const species = getSupportedSpeciesForVolumeLimits();
    expect(species).toContain("mouse");
    expect(species).toContain("rat");
    expect(species).toContain("dog");
    expect(species).toContain("monkey");
    expect(species.length).toBeGreaterThan(0);
  });
});

describe("getRoutesWithLimits", () => {
  it("returns routes for mouse", () => {
    const routes = getRoutesWithLimits("mouse");
    expect(routes).toContain("iv");
    expect(routes).toContain("po");
    expect(routes).toContain("ip");
    expect(routes).toContain("sc");
    expect(routes).toContain("im");
  });

  it("returns empty array for unsupported species", () => {
    const routes = getRoutesWithLimits("unknown");
    expect(routes).toHaveLength(0);
  });
});

describe("formatVolumeLimit", () => {
  it("formats basic limit", () => {
    const limit = getVolumeLimit("mouse", "iv")!;
    const formatted = formatVolumeLimit(limit);
    expect(formatted).toContain("5 mL/kg");
    expect(formatted).toContain("0.1 mL absolute");
  });

  it("formats with weight calculation", () => {
    const limit = getVolumeLimit("rat", "po")!;
    const formatted = formatVolumeLimit(limit, 0.25);
    expect(formatted).toContain("10 mL/kg");
    expect(formatted).toContain("2.50 mL for 0.25 kg");
    expect(formatted).toContain("5 mL absolute");
  });

  it("formats IM limits with site information", () => {
    const limit = getVolumeLimit("dog", "im")!;
    const formatted = formatVolumeLimit(limit);
    expect(formatted).toContain("2 mL/site");
    expect(formatted).toContain("2 sites");
  });
});
