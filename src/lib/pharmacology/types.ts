/**
 * Type definitions for DoseFinder pharmacological calculations
 */

export type ScalingMethod =
  | "allometric"
  | "direct"
  | "metabolic"
  | "brainWeight"
  | "lifeSpan"
  | "hepaticFlow"
  | "bsa";

export type DoseUnit = "mg" | "mg/kg" | "mcg" | "mcg/kg";

export type BioavailabilityMethod = "manual" | "iv" | "oral" | "other";

export type KidneyFunctionMethod = "none" | "manual" | "cockcroft";

export type PatientSex = "male" | "female";

/**
 * Species data interface for pharmacological calculations
 * Contains all required physiological parameters for dose scaling
 */
export interface Species {
  name: string;
  weight: number; // kg
  brainWeight: number; // g
  lifeSpan: number; // years
  hepaticFlow: number; // mL/min/kg
  allometricExponent: number;
  hepaticClearance: number; // mL/min/kg
  renalClearance: number; // mL/min/kg
  bsa: number; // m²
}

export interface CalculationParameters {
  proteinBinding: number; // percentage (0-100)
  bioavailability: number; // percentage (0-100)
  bioavailabilityMethod: BioavailabilityMethod;
  kidneyFunctionMethod: KidneyFunctionMethod;
  kidneyFunction: number; // percentage (0-100)
  fractionExcretedRenal: number; // fe - fraction excreted unchanged in urine (0-1)
  patientAge: number; // years
  patientCreatinine: number; // mg/dL
  creatinineUnit: CreatinineUnit; // mg/dL or µmol/L
  patientSex: PatientSex;
  volumeDistribution: number; // L/kg
  molecularWeight: number; // g/mol
  logP: number; // partition coefficient
  scalingExponent: number;
}

export type CreatinineUnit = "mg/dL" | "umol/L";

export interface CalculationResult {
  dose: number;
  scalingFactor: number;
  methodDescription: string;
  steps: string[];
  warnings?: string[];
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DoseRange {
  min: number;
  max: number;
  unit: DoseUnit;
}

export interface ChartDataPoint {
  name: string;
  weight: number;
  dose: number;
  isAnimal: boolean;
  label: string;
}

// Constants for validation
export const VALIDATION_LIMITS = {
  weight: { min: 0.001, max: 10000 }, // kg
  dose: { min: 0.00001, max: 100000 }, // mg
  age: { min: 0, max: 150 }, // years
  creatinine: { min: 0.1, max: 20 }, // mg/dL (or 8.8-1768 µmol/L)
  proteinBinding: { min: 0, max: 99.9 }, // percentage
  bioavailability: { min: 0.1, max: 100 }, // percentage
  kidneyFunction: { min: 0, max: 100 }, // percentage
  fractionExcretedRenal: { min: 0, max: 1 }, // fe - fraction (0 = none, 1 = 100% renal)
  molecularWeight: { min: 0, max: 100000 }, // g/mol
  logP: { min: -10, max: 10 }, // partition coefficient
  scalingExponent: { min: 0, max: 2 }, // dimensionless
} as const;

// Creatinine unit conversion factor
// 1 mg/dL = 88.4 µmol/L (based on molecular weight of creatinine: 113.12 g/mol)
export const CREATININE_CONVERSION = {
  mgdL_to_umolL: 88.4,
  umolL_to_mgdL: 1 / 88.4,
} as const;

// GFR thresholds for kidney function adjustment
export const GFR_THRESHOLDS = {
  normal: 60,
  mild: 30,
  moderate: 15,
  severe: 0,
} as const;

// Cockcroft-Gault formula constants
export const COCKCROFT_CONSTANTS = {
  ageFactor: 140,
  creatinineMultiplier: 72,
  femaleAdjustment: 0.85,
} as const;
