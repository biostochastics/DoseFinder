/**
 * Unit formatting functions for DoseFinder
 *
 * Provides consistent formatting for display of values with units,
 * including rounding options for bench-ready instructions.
 */

import {
  UnitValue,
  RoundingDirection,
  RoundingOptions,
  UNIT_DISPLAY_MAP,
} from "./types";
import { autoScaleMass, autoScaleVolume } from "./converter";

// ============================================================================
// Core Formatting
// ============================================================================

/**
 * Get display-friendly unit string
 *
 * @param unit - Internal unit code
 * @returns Display string with proper symbols (μ, ², etc.)
 *
 * @example
 * formatUnit('mcg') // 'μg'
 * formatUnit('mg/m2') // 'mg/m²'
 */
export function formatUnit(unit: string): string {
  return UNIT_DISPLAY_MAP[unit] || unit;
}

/**
 * Format a value with its unit for display
 *
 * @param unitValue - Value with unit
 * @param precision - Number of decimal places (default: 3)
 * @returns Formatted string like "10.000 mg/kg"
 */
export function format(unitValue: UnitValue, precision: number = 3): string {
  const formattedValue = formatNumber(unitValue.value, precision);
  return `${formattedValue} ${formatUnit(unitValue.unit)}`;
}

/**
 * Format a number with specified precision
 *
 * @param value - Numeric value
 * @param precision - Number of decimal places
 * @returns Formatted number string
 */
export function formatNumber(value: number, precision: number = 3): string {
  // Handle very small or very large numbers with scientific notation
  if (value !== 0 && (Math.abs(value) < 0.0001 || Math.abs(value) >= 1000000)) {
    return value.toExponential(precision);
  }
  return value.toFixed(precision);
}

// ============================================================================
// Rounding Functions
// ============================================================================

/**
 * Round a value to the specified increment
 *
 * @param value - Value to round
 * @param increment - Rounding increment (e.g., 0.1, 0.5, 1)
 * @param direction - Rounding direction ('nearest', 'up', 'down')
 * @returns Rounded value
 *
 * @example
 * roundToIncrement(0.123, 0.1, 'nearest') // 0.1
 * roundToIncrement(0.123, 0.1, 'up') // 0.2
 * roundToIncrement(0.123, 0.1, 'down') // 0.1
 */
export function roundToIncrement(
  value: number,
  increment: number,
  direction: RoundingDirection = "nearest",
): number {
  if (increment <= 0) return value;

  switch (direction) {
    case "up":
      return Math.ceil(value / increment) * increment;
    case "down":
      return Math.floor(value / increment) * increment;
    case "nearest":
    default:
      return Math.round(value / increment) * increment;
  }
}

/**
 * Format a value with rounding applied
 *
 * @param value - Numeric value
 * @param unit - Unit string
 * @param increment - Rounding increment
 * @param direction - Rounding direction
 * @param precision - Display precision
 * @returns Formatted string with rounded value
 */
export function formatWithRounding(
  value: number,
  unit: string,
  increment: number,
  direction: RoundingDirection = "nearest",
  precision: number = 3,
): string {
  const rounded = roundToIncrement(value, increment, direction);
  return format({ value: rounded, unit }, precision);
}

// ============================================================================
// Specialized Formatters
// ============================================================================

/**
 * Format a mass value, optionally auto-scaling to appropriate unit
 *
 * @param mg - Value in milligrams
 * @param autoScale - Whether to auto-select best unit
 * @param precision - Decimal places
 * @returns Formatted mass string
 */
export function formatMass(
  mg: number,
  autoScale: boolean = false,
  precision: number = 3,
): string {
  if (autoScale) {
    const scaled = autoScaleMass(mg);
    return format(scaled, precision);
  }
  return format({ value: mg, unit: "mg" }, precision);
}

/**
 * Format a volume value, optionally auto-scaling to appropriate unit
 *
 * @param ml - Value in milliliters
 * @param autoScale - Whether to auto-select best unit
 * @param precision - Decimal places
 * @returns Formatted volume string
 */
export function formatVolume(
  ml: number,
  autoScale: boolean = false,
  precision: number = 3,
): string {
  if (autoScale) {
    const scaled = autoScaleVolume(ml);
    return format(scaled, precision);
  }
  return format({ value: ml, unit: "mL" }, precision);
}

/**
 * Format a dose value (always mg/kg for pharmacological calculations)
 *
 * @param dosePerKg - Dose in mg/kg
 * @param precision - Decimal places
 * @returns Formatted dose string
 */
export function formatDose(dosePerKg: number, precision: number = 4): string {
  return format({ value: dosePerKg, unit: "mg/kg" }, precision);
}

/**
 * Format a concentration value
 *
 * @param mgPerMl - Concentration in mg/mL
 * @param precision - Decimal places
 * @returns Formatted concentration string
 */
export function formatConcentration(
  mgPerMl: number,
  precision: number = 3,
): string {
  return format({ value: mgPerMl, unit: "mg/mL" }, precision);
}

// ============================================================================
// Bench-Ready Formatting
// ============================================================================

/**
 * Format values for bench-ready dosing instructions
 * Applies practical rounding for pipetting accuracy
 */
export interface BenchReadyValues {
  dose: string;
  doseRaw: number;
  doseRounded: number;
  volume: string;
  volumeRaw: number;
  volumeRounded: number;
  concentration: string;
}

/**
 * Generate bench-ready formatted values with appropriate rounding
 *
 * @param dosePerKg - Dose in mg/kg
 * @param weightKg - Subject weight in kg
 * @param concentrationMgMl - Stock concentration in mg/mL
 * @param options - Rounding options
 * @returns BenchReadyValues with both raw and rounded values
 */
export function getBenchReadyValues(
  dosePerKg: number,
  weightKg: number,
  concentrationMgMl: number,
  options: RoundingOptions = {
    doseIncrement: 0.01,
    volumeIncrement: 0.01,
    direction: "nearest",
  },
): BenchReadyValues {
  // Calculate raw values
  const totalDoseMg = dosePerKg * weightKg;
  const volumeMl = concentrationMgMl > 0 ? totalDoseMg / concentrationMgMl : 0;

  // Apply rounding
  const roundedDose = roundToIncrement(
    totalDoseMg,
    options.doseIncrement,
    options.direction,
  );
  const roundedVolume = roundToIncrement(
    volumeMl,
    options.volumeIncrement,
    options.direction,
  );

  return {
    dose: formatMass(roundedDose, false, 2),
    doseRaw: totalDoseMg,
    doseRounded: roundedDose,
    volume: formatVolume(roundedVolume, false, 2),
    volumeRaw: volumeMl,
    volumeRounded: roundedVolume,
    concentration: formatConcentration(concentrationMgMl),
  };
}

/**
 * Format a range of values (e.g., for uncertainty)
 *
 * @param lower - Lower bound value
 * @param upper - Upper bound value
 * @param unit - Unit for both values
 * @param precision - Decimal places
 * @returns Formatted range string
 */
export function formatRange(
  lower: number,
  upper: number,
  unit: string,
  precision: number = 3,
): string {
  return `${formatNumber(lower, precision)} - ${formatNumber(upper, precision)} ${formatUnit(unit)}`;
}

/**
 * Format uncertainty bounds (±30% as per standard)
 *
 * @param value - Central value
 * @param unit - Unit string
 * @param factor - Uncertainty factor (default 0.3 for ±30%)
 * @param precision - Decimal places
 * @returns Object with formatted lower/upper bounds
 */
export function formatUncertainty(
  value: number,
  unit: string,
  factor: number = 0.3,
  precision: number = 3,
): { lower: string; upper: string; range: string } {
  const lower = value * (1 - factor);
  const upper = value * (1 + factor);

  return {
    lower: format({ value: lower, unit }, precision),
    upper: format({ value: upper, unit }, precision),
    range: formatRange(lower, upper, unit, precision),
  };
}

// ============================================================================
// Bench Card Template
// ============================================================================

/**
 * Generate text for a printable dosing card
 *
 * @param params - Parameters for the dosing card
 * @returns Multi-line string formatted for printing
 */
export function generateBenchCard(params: {
  subjectId: string;
  date: string;
  dosePerKg: number;
  weightKg: number;
  concentrationMgMl: number;
  roundingOptions?: RoundingOptions;
}): string {
  const benchValues = getBenchReadyValues(
    params.dosePerKg,
    params.weightKg,
    params.concentrationMgMl,
    params.roundingOptions,
  );

  return `DOSING INSTRUCTIONS
═══════════════════════════════════════════════════
Subject ID: ${params.subjectId}    Date: ${params.date}

Calculated Dose: ${formatDose(params.dosePerKg)}
Subject Weight: ${params.weightKg < 1 ? (params.weightKg * 1000).toFixed(1) + " g" : params.weightKg.toFixed(1) + " kg"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actual Dose:     ${benchValues.dose}    (raw: ${formatNumber(benchValues.doseRaw, 4)} mg)
Draw Volume:     ${benchValues.volume}    (raw: ${formatNumber(benchValues.volumeRaw, 4)} mL)
Stock Conc:      ${benchValues.concentration}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Dose administered    Time: ___________
□ Technician initials: ___________
`;
}
