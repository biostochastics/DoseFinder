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

/**
 * Route of administration for bioavailability estimation
 *
 * Literature-based default values:
 * - iv: 100% (by definition)
 * - im: 85% (range 75-100%, avoids first-pass)
 * - sc: 70% (range 50-100%, varies by drug class)
 * - oral: 50% (highly variable 5-99%, first-pass dependent)
 * - rectal: 65% (range 30-80%, partial first-pass bypass)
 * - sublingual: 70% (range 60-80%, bypasses first-pass)
 * - transdermal: 35% (range 10-50%, limited to small molecules)
 * - inhalation: 25% (range 10-40%, depends on particle size)
 * - other: 75% (conservative estimate for unspecified routes)
 *
 * References:
 * - StatPearls NBK557852: Drug Bioavailability
 * - StatPearls NBK551679: First-Pass Effect
 * - PMC10745386: The Bioavailability of Drugs - Current State of Knowledge
 * - PMC6182494: Subcutaneous Administration of Biotherapeutics
 * - PMC6805701: Physiological Considerations for Rectal Drug Formulations
 */
export type BioavailabilityMethod =
  | "manual"
  | "iv"
  | "im"
  | "sc"
  | "oral"
  | "rectal"
  | "sublingual"
  | "transdermal"
  | "inhalation"
  | "other";

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

/**
 * Literature-based bioavailability defaults by route of administration
 *
 * These values represent conservative estimates based on published pharmacokinetic
 * literature. Actual bioavailability varies significantly by drug, formulation,
 * and patient factors. Use compound-specific values when available.
 *
 * IMPORTANT: Oral bioavailability is highly variable (5-99%) due to first-pass
 * metabolism. The 50% default is a conservative middle estimate.
 *
 * References:
 * - IV: 100% by definition (StatPearls NBK557852)
 * - IM: 75-100% range (PMC10745386, howMed Bioavailability)
 * - SC: 50-100% range, 50-80% for biologics (PMC6182494)
 * - Oral: 5-99% range depending on drug (StatPearls NBK551679)
 * - Rectal: 30-80% range, ~50% first-pass bypass (PMC6805701, PubMed 498711)
 * - Sublingual: 60-80% range (Springer 10.1023/A:1016345504153)
 * - Transdermal: 10-50% range (Wikipedia Bioavailability)
 * - Inhalation: 10-40% lung deposition (StatPearls NBK568677)
 */
export const BIOAVAILABILITY_DEFAULTS: Record<
  Exclude<BioavailabilityMethod, "manual">,
  {
    value: number;
    range: { min: number; max: number };
    description: string;
    caveat: string;
  }
> = {
  iv: {
    value: 100,
    range: { min: 100, max: 100 },
    description: "Intravenous - complete systemic availability",
    caveat: "Reference standard; 100% by definition",
  },
  im: {
    value: 85,
    range: { min: 75, max: 100 },
    description: "Intramuscular - near-complete absorption",
    caveat:
      "Absorption may vary with injection site, blood flow, and drug solubility",
  },
  sc: {
    value: 70,
    range: { min: 50, max: 100 },
    description: "Subcutaneous - variable absorption",
    caveat: "Lower for biologics (50-80%); small molecules may approach 100%",
  },
  oral: {
    value: 50,
    range: { min: 5, max: 99 },
    description: "Oral - subject to first-pass metabolism",
    caveat:
      "HIGHLY VARIABLE (5-99%). Use drug-specific values when available. First-pass metabolism is the primary limiting factor.",
  },
  rectal: {
    value: 65,
    range: { min: 30, max: 80 },
    description: "Rectal - partial first-pass bypass",
    caveat:
      "~50% of absorbed drug bypasses hepatic first-pass. Absorption depends on formulation and positioning.",
  },
  sublingual: {
    value: 70,
    range: { min: 60, max: 80 },
    description: "Sublingual - bypasses first-pass via oral mucosa",
    caveat:
      "Requires drug to remain under tongue; swallowed portion subject to first-pass",
  },
  transdermal: {
    value: 35,
    range: { min: 10, max: 50 },
    description: "Transdermal - slow absorption through skin",
    caveat:
      "Limited to small lipophilic molecules (<500 Da). Absorption varies with skin condition and site.",
  },
  inhalation: {
    value: 25,
    range: { min: 10, max: 40 },
    description: "Inhalation - lung deposition dependent",
    caveat:
      "Only 10-40% reaches lungs with conventional devices. Depends on particle size (1-10 µm optimal) and technique.",
  },
  other: {
    value: 75,
    range: { min: 50, max: 100 },
    description: "Other routes - conservative estimate",
    caveat:
      "Use for routes not specifically listed. Consider using manual entry with drug-specific data.",
  },
} as const;

// ============================================================================
// FDA FIH Types (defined inline to avoid circular dependencies)
// ============================================================================

// Note: Full FIH functionality is in ./fda.ts
// Type-only re-exports from constants
export type { DrugModality, AdminRoute, VolumeLimit } from "./constants";

// ============================================================================
// Material Requirements (for Study Planner)
// ============================================================================

/**
 * Detailed material requirements with base and buffer breakdown
 */
export interface MaterialRequirement {
  /** Number of doses for base study period */
  baseDoses: number;
  /** Additional doses for stability buffer period */
  bufferDoses: number;
  /** Total doses including buffer */
  totalDoses: number;
  /** Product needed for base study (mg) */
  baseProduct: number;
  /** Additional product for buffer period (mg) */
  bufferProduct: number;
  /** Total product before waste allowance (mg) */
  totalProduct: number;
  /** Additional product for waste/overage (mg) */
  wasteAllowance: number;
  /** Grand total product needed (mg) */
  grandTotal: number;
}
