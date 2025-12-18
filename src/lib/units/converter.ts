/**
 * Unit conversion functions for DoseFinder
 *
 * Provides type-safe conversions between different unit systems for mass,
 * volume, and concentration calculations.
 */

import {
  MassUnit,
  VolumeUnit,
  ConcentrationUnit,
  PercentType,
  MassValue,
  VolumeValue,
  ConcentrationValue,
  MASS_TO_MG,
  VOLUME_TO_ML,
} from "./types";

// ============================================================================
// Mass Conversions
// ============================================================================

/**
 * Convert mass from one unit to another
 *
 * @param from - Source mass value with unit
 * @param toUnit - Target unit
 * @returns Converted mass value
 *
 * @example
 * convertMass({ value: 1000, unit: 'mg' }, 'g') // { value: 1, unit: 'g' }
 */
export function convertMass(from: MassValue, toUnit: MassUnit): MassValue {
  const valueInMg = from.value * MASS_TO_MG[from.unit];
  return {
    value: valueInMg / MASS_TO_MG[toUnit],
    unit: toUnit,
  };
}

/**
 * Convert mass value to milligrams
 *
 * @param from - Source mass value with unit
 * @returns Value in milligrams
 */
export function toMg(from: MassValue): number {
  return from.value * MASS_TO_MG[from.unit];
}

/**
 * Convert milligrams to target unit
 *
 * @param mg - Value in milligrams
 * @param toUnit - Target unit
 * @returns Mass value with target unit
 */
export function fromMg(mg: number, toUnit: MassUnit): MassValue {
  return {
    value: mg / MASS_TO_MG[toUnit],
    unit: toUnit,
  };
}

// ============================================================================
// Volume Conversions
// ============================================================================

/**
 * Convert volume from one unit to another
 *
 * @param from - Source volume value with unit
 * @param toUnit - Target unit
 * @returns Converted volume value
 *
 * @example
 * convertVolume({ value: 1000, unit: 'uL' }, 'mL') // { value: 1, unit: 'mL' }
 */
export function convertVolume(
  from: VolumeValue,
  toUnit: VolumeUnit,
): VolumeValue {
  const valueInMl = from.value * VOLUME_TO_ML[from.unit];
  return {
    value: valueInMl / VOLUME_TO_ML[toUnit],
    unit: toUnit,
  };
}

/**
 * Convert volume value to milliliters
 *
 * @param from - Source volume value with unit
 * @returns Value in milliliters
 */
export function toMl(from: VolumeValue): number {
  return from.value * VOLUME_TO_ML[from.unit];
}

/**
 * Convert milliliters to target unit
 *
 * @param ml - Value in milliliters
 * @param toUnit - Target unit
 * @returns Volume value with target unit
 */
export function fromMl(ml: number, toUnit: VolumeUnit): VolumeValue {
  return {
    value: ml / VOLUME_TO_ML[toUnit],
    unit: toUnit,
  };
}

// ============================================================================
// Concentration Conversions
// ============================================================================

/**
 * Convert percent concentration to mg/mL
 *
 * SCIENTIFIC FORMULAS:
 * - % w/v: mg/mL = % × 10 (g/100mL → mg/mL)
 * - % w/w: mg/mL = % × density × 10 (g/100g → mg/mL)
 *
 * @param percent - Percentage value (e.g., 5 for 5%)
 * @param type - Percent type ('wv' for weight/volume, 'ww' for weight/weight)
 * @param density - Solution density in g/mL (only used for w/w, defaults to 1.0)
 * @returns Concentration in mg/mL
 *
 * @example
 * percentToMgMl(5, 'wv') // 50 mg/mL
 * percentToMgMl(5, 'ww', 1.2) // 60 mg/mL
 */
export function percentToMgMl(
  percent: number,
  type: PercentType,
  density: number = 1.0,
): number {
  if (type === "wv") {
    // % w/v means g per 100 mL
    // 5% w/v = 5 g / 100 mL = 50 mg/mL
    return percent * 10;
  } else {
    // % w/w means g per 100 g
    // Convert to mg/mL using density
    // 5% w/w at density 1.2 g/mL = 5 g/100g × 1.2 g/mL = 6 g/100mL = 60 mg/mL
    return percent * density * 10;
  }
}

/**
 * Convert percent concentration to ConcentrationValue
 *
 * @param percent - Percentage value
 * @param type - Percent type
 * @param density - Solution density in g/mL
 * @returns ConcentrationValue in mg/mL
 */
export function percentToConcentration(
  percent: number,
  type: PercentType,
  density: number = 1.0,
): ConcentrationValue {
  return {
    value: percentToMgMl(percent, type, density),
    unit: "mg/mL",
  };
}

/**
 * Convert concentration to mg/mL
 *
 * @param from - Source concentration value with unit
 * @param density - Solution density (for percent conversions)
 * @returns Value in mg/mL
 */
export function concentrationToMgMl(
  from: ConcentrationValue,
  density: number = 1.0,
): number {
  switch (from.unit) {
    case "mcg/mL":
      return from.value / 1000;
    case "mg/mL":
      return from.value;
    case "g/mL":
      return from.value * 1000;
    case "percent_wv":
      return percentToMgMl(from.value, "wv");
    case "percent_ww":
      return percentToMgMl(from.value, "ww", density);
    default:
      return from.value;
  }
}

/**
 * Convert stock concentration string to mg/mL
 * (Legacy compatibility function for StudyPlanner)
 *
 * @param value - Numeric concentration value
 * @param unit - Unit string from legacy system
 * @param density - Density for percent conversions
 * @returns Concentration in mg/mL
 */
export function stockConcentrationToMgMl(
  value: number,
  unit: string,
  density: number = 1.0,
): number {
  switch (unit) {
    case "mcg/ml":
      return value / 1000;
    case "mg/ml":
      return value;
    case "mg/g":
      // mg/g requires density conversion: mg/g × density (g/mL) = mg/mL
      return value * density;
    case "percent":
      // Legacy: assumes % w/v
      return percentToMgMl(value, "wv");
    case "g/ml":
      return value * 1000;
    default:
      return value;
  }
}

// ============================================================================
// Dose Conversions
// ============================================================================

/**
 * Convert dose per kg to total dose for a given weight
 *
 * @param dosePerKg - Dose in mg/kg
 * @param weightKg - Body weight in kg
 * @returns Total dose in mg
 */
export function dosePerKgToTotal(dosePerKg: number, weightKg: number): number {
  return dosePerKg * weightKg;
}

/**
 * Convert total dose to dose per kg
 *
 * @param totalDose - Total dose in mg
 * @param weightKg - Body weight in kg
 * @returns Dose in mg/kg
 */
export function totalToDosePerKg(totalDose: number, weightKg: number): number {
  if (weightKg === 0) return 0;
  return totalDose / weightKg;
}

/**
 * Convert legacy dose units to mg
 *
 * @param value - Dose value
 * @param unit - Legacy dose unit
 * @param weightKg - Body weight (for per-kg conversions)
 * @returns Dose in mg
 */
export function legacyDoseToMg(
  value: number,
  unit: string,
  weightKg: number = 1,
): number {
  switch (unit) {
    case "mg":
      return value;
    case "mg/kg":
      return value * weightKg;
    case "mcg":
      return value / 1000;
    case "mcg/kg":
      return (value * weightKg) / 1000;
    default:
      return value;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Determine the best unit for displaying a mass value
 * (auto-scales to most readable unit)
 *
 * @param mg - Value in milligrams
 * @returns Mass value in most appropriate unit
 */
export function autoScaleMass(mg: number): MassValue {
  const absMg = Math.abs(mg);

  if (absMg >= 1000000) {
    return { value: mg / 1000000, unit: "kg" };
  } else if (absMg >= 1000) {
    return { value: mg / 1000, unit: "g" };
  } else if (absMg >= 1) {
    return { value: mg, unit: "mg" };
  } else {
    return { value: mg * 1000, unit: "mcg" };
  }
}

/**
 * Determine the best unit for displaying a volume value
 *
 * @param ml - Value in milliliters
 * @returns Volume value in most appropriate unit
 */
export function autoScaleVolume(ml: number): VolumeValue {
  const absMl = Math.abs(ml);

  if (absMl >= 1000) {
    return { value: ml / 1000, unit: "L" };
  } else if (absMl >= 1) {
    return { value: ml, unit: "mL" };
  } else {
    return { value: ml * 1000, unit: "uL" };
  }
}

/**
 * Type guard to check if a unit is a valid mass unit
 */
export function isMassUnit(unit: string): unit is MassUnit {
  return ["mcg", "mg", "g", "kg"].includes(unit);
}

/**
 * Type guard to check if a unit is a valid volume unit
 */
export function isVolumeUnit(unit: string): unit is VolumeUnit {
  return ["uL", "mL", "L"].includes(unit);
}

/**
 * Type guard to check if a unit is a valid concentration unit
 */
export function isConcentrationUnit(unit: string): unit is ConcentrationUnit {
  return ["mcg/mL", "mg/mL", "g/mL", "percent_wv", "percent_ww"].includes(unit);
}
