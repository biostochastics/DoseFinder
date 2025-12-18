/**
 * Type definitions for the DoseFinder unit system
 *
 * Provides type-safe units for mass, volume, concentration, and dose calculations.
 * These types ensure consistent unit handling throughout the application.
 */

// ============================================================================
// Mass Units
// ============================================================================

export type MassUnit = "mcg" | "mg" | "g" | "kg";

// ============================================================================
// Volume Units
// ============================================================================

export type VolumeUnit = "uL" | "mL" | "L";

// ============================================================================
// Concentration Units
// ============================================================================

export type ConcentrationUnit =
  | "mcg/mL"
  | "mg/mL"
  | "g/mL"
  | "percent_wv"
  | "percent_ww";

// ============================================================================
// Dose Units
// ============================================================================

export type DoseUnit = "mg/kg" | "mg/m2" | "mg" | "mcg/kg" | "mcg";

// ============================================================================
// Time Units
// ============================================================================

export type TimeUnit = "days" | "weeks" | "months";

// ============================================================================
// Generic Value Interface
// ============================================================================

/**
 * Generic interface for a value with associated unit
 */
export interface UnitValue<T extends string = string> {
  value: number;
  unit: T;
}

// ============================================================================
// Specific Value Types
// ============================================================================

export type MassValue = UnitValue<MassUnit>;
export type VolumeValue = UnitValue<VolumeUnit>;
export type ConcentrationValue = UnitValue<ConcentrationUnit>;
export type DoseValue = UnitValue<DoseUnit>;

// ============================================================================
// Percent Type (w/v vs w/w)
// ============================================================================

/**
 * Percent type selector for concentration calculations
 * - wv: weight/volume (g/100mL) - default for liquid formulations
 * - ww: weight/weight (g/100g) - for solid/semi-solid formulations
 */
export type PercentType = "wv" | "ww";

// ============================================================================
// Rounding Options
// ============================================================================

/**
 * Rounding direction for dose calculations
 */
export type RoundingDirection = "nearest" | "up" | "down";

/**
 * Standard rounding increments for doses
 */
export type DoseRoundingIncrement = 0.01 | 0.1 | 0.5 | 1 | 5 | 10;

/**
 * Standard rounding increments for volumes
 */
export type VolumeRoundingIncrement = 0.001 | 0.01 | 0.05 | 0.1 | 0.5;

/**
 * Configuration for rounding behavior
 */
export interface RoundingOptions {
  doseIncrement: DoseRoundingIncrement;
  volumeIncrement: VolumeRoundingIncrement;
  direction: RoundingDirection;
}

// ============================================================================
// Conversion Constants
// ============================================================================

/**
 * Conversion factors for mass units (relative to mg)
 */
export const MASS_TO_MG: Record<MassUnit, number> = {
  mcg: 0.001,
  mg: 1,
  g: 1000,
  kg: 1000000,
} as const;

/**
 * Conversion factors for volume units (relative to mL)
 */
export const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  uL: 0.001,
  mL: 1,
  L: 1000,
} as const;

/**
 * Time unit conversion to days
 */
export const TIME_TO_DAYS: Record<TimeUnit, number> = {
  days: 1,
  weeks: 7,
  months: 30.44, // Average month length
} as const;

// ============================================================================
// Display Mapping
// ============================================================================

/**
 * Maps internal unit codes to display-friendly strings
 */
export const UNIT_DISPLAY_MAP: Record<string, string> = {
  // Mass
  mcg: "μg",
  mg: "mg",
  g: "g",
  kg: "kg",
  // Volume
  uL: "μL",
  mL: "mL",
  L: "L",
  // Concentration
  "mcg/mL": "μg/mL",
  "mg/mL": "mg/mL",
  "g/mL": "g/mL",
  percent_wv: "% w/v",
  percent_ww: "% w/w",
  // Dose
  "mg/kg": "mg/kg",
  "mg/m2": "mg/m²",
  "mcg/kg": "μg/kg",
} as const;
