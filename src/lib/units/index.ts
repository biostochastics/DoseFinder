/**
 * DoseFinder Unit System
 *
 * Centralized unit handling for mass, volume, concentration, and dose calculations.
 * Provides type-safe conversions and consistent formatting throughout the application.
 *
 * @module units
 */

// ============================================================================
// Types
// ============================================================================

export type {
  MassUnit,
  VolumeUnit,
  ConcentrationUnit,
  DoseUnit,
  TimeUnit,
  UnitValue,
  MassValue,
  VolumeValue,
  ConcentrationValue,
  DoseValue,
  PercentType,
  RoundingDirection,
  DoseRoundingIncrement,
  VolumeRoundingIncrement,
  RoundingOptions,
} from "./types";

export {
  MASS_TO_MG,
  VOLUME_TO_ML,
  TIME_TO_DAYS,
  UNIT_DISPLAY_MAP,
} from "./types";

// ============================================================================
// Converter Functions
// ============================================================================

export {
  // Mass conversions
  convertMass,
  toMg,
  fromMg,
  // Volume conversions
  convertVolume,
  toMl,
  fromMl,
  // Concentration conversions
  percentToMgMl,
  percentToConcentration,
  concentrationToMgMl,
  stockConcentrationToMgMl,
  // Dose conversions
  dosePerKgToTotal,
  totalToDosePerKg,
  legacyDoseToMg,
  // Auto-scaling
  autoScaleMass,
  autoScaleVolume,
  // Type guards
  isMassUnit,
  isVolumeUnit,
  isConcentrationUnit,
} from "./converter";

// ============================================================================
// Formatter Functions
// ============================================================================

export {
  // Core formatting
  formatUnit,
  format,
  formatNumber,
  // Rounding
  roundToIncrement,
  formatWithRounding,
  // Specialized formatters
  formatMass,
  formatVolume,
  formatDose,
  formatConcentration,
  // Bench-ready formatting
  getBenchReadyValues,
  formatRange,
  formatUncertainty,
  generateBenchCard,
} from "./formatter";

export type { BenchReadyValues } from "./formatter";

// ============================================================================
// Convenience Class (Optional Usage Pattern)
// ============================================================================

import {
  convertMass,
  convertVolume,
  percentToConcentration,
  autoScaleMass,
  autoScaleVolume,
} from "./converter";
import {
  format,
  formatUnit,
  formatWithRounding,
  roundToIncrement,
} from "./formatter";
import type {
  MassUnit,
  VolumeUnit,
  MassValue,
  VolumeValue,
  ConcentrationValue,
  PercentType,
  RoundingDirection,
} from "./types";

/**
 * UnitConverter class providing a convenient object-oriented interface
 * for unit conversions and formatting.
 *
 * All methods are also available as standalone functions.
 *
 * @example
 * const converter = new UnitConverter();
 * const result = converter.convertMass({ value: 1000, unit: 'mg' }, 'g');
 * console.log(converter.format(result)); // "1.000 g"
 */
export class UnitConverter {
  /**
   * Convert mass from one unit to another
   */
  convertMass(from: MassValue, toUnit: MassUnit): MassValue {
    return convertMass(from, toUnit);
  }

  /**
   * Convert volume from one unit to another
   */
  convertVolume(from: VolumeValue, toUnit: VolumeUnit): VolumeValue {
    return convertVolume(from, toUnit);
  }

  /**
   * Convert percent concentration to mg/mL
   */
  percentToConcentration(
    percent: number,
    type: PercentType,
    density?: number,
  ): ConcentrationValue {
    return percentToConcentration(percent, type, density);
  }

  /**
   * Auto-scale mass to most readable unit
   */
  autoScaleMass(mg: number): MassValue {
    return autoScaleMass(mg);
  }

  /**
   * Auto-scale volume to most readable unit
   */
  autoScaleVolume(ml: number): VolumeValue {
    return autoScaleVolume(ml);
  }

  /**
   * Format a unit value for display
   */
  format(
    value: MassValue | VolumeValue | ConcentrationValue,
    precision?: number,
  ): string {
    return format(value, precision);
  }

  /**
   * Get display-friendly unit string
   */
  formatUnit(unit: string): string {
    return formatUnit(unit);
  }

  /**
   * Round value to increment and format
   */
  formatWithRounding(
    value: number,
    unit: string,
    increment: number,
    direction?: RoundingDirection,
    precision?: number,
  ): string {
    return formatWithRounding(value, unit, increment, direction, precision);
  }

  /**
   * Round a value to specified increment
   */
  round(
    value: number,
    increment: number,
    direction?: RoundingDirection,
  ): number {
    return roundToIncrement(value, increment, direction);
  }
}

// Default instance for convenience
export const unitConverter = new UnitConverter();
