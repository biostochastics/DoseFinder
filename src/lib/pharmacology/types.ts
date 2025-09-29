/**
 * Type definitions for DoseFinder pharmacological calculations
 */

export type ScalingMethod =
  | "allometric"
  | "brainWeight"
  | "lifeSpan"
  | "hepaticFlow"
  | "bsa";

export type DoseUnit = "mg" | "mg/kg" | "mcg" | "mcg/kg";

export type BioavailabilityMethod = "manual" | "iv" | "oral" | "other";

export type KidneyFunctionMethod = "none" | "manual" | "cockcroft";

export type PatientSex = "male" | "female";

export interface Animal {
  name: string;
  weight: number; // kg
  brainWeight: number; // g
  lifeSpan: number; // years
  hepaticFlow: number; // mL/min/kg
  allometricExponent: number;
  km?: number;
  clearanceData?: {
    renal: number;
    hepatic: number;
    total: number;
  };
}

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
  patientAge: number; // years
  patientCreatinine: number; // mg/dL
  patientSex: PatientSex;
  volumeDistribution: number; // L/kg
  molecularWeight: number; // g/mol
  logP: number; // partition coefficient
  scalingExponent: number;
}

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
  creatinine: { min: 0.1, max: 20 }, // mg/dL
  proteinBinding: { min: 0, max: 99.9 }, // percentage
  bioavailability: { min: 0.1, max: 100 }, // percentage
  kidneyFunction: { min: 0, max: 100 }, // percentage
  molecularWeight: { min: 0, max: 100000 }, // g/mol
  logP: { min: -10, max: 10 }, // partition coefficient
  scalingExponent: { min: 0, max: 2 }, // dimensionless
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
