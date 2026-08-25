/**
 * GOLDEN SCIENTIFIC VALIDATION CASES ("assay controls")
 *
 * Frozen, externally-checkable reference cases for DoseFinder's calculation
 * engine. These are the scientific ground-truth controls: if any value here
 * changes, a calculation-affecting change was made and MUST be reviewed against
 * the cited source before the change ships.
 *
 * Each case carries an explicit citation. Expected values are pinned to the
 * app's documented method (e.g. FDA Km-ratio HED), and are cross-checked
 * against the primary source in the citation. Tolerances are tight (assay
 * controls, not fuzzy assertions).
 *
 * Categories:
 *  - hed:        FDA 2005 NOAEL → HED → MRSD (Km-ratio method)
 *  - crcl:       Cockcroft-Gault creatinine clearance reference cases
 *  - scaling:    cross-species dose scaling (allometric / BSA / exploratory)
 *  - guard:      INTENTIONAL invalid-input cases — the engine must REFUSE or
 *                clamp, not silently produce a plausible-looking dose.
 *
 * DO NOT edit an expected value to make a test pass. If a value here is wrong,
 * fix it against the cited source in a dedicated, reviewed commit.
 */

import type { PatientSex, CreatinineUnit, ScalingMethod } from "../types";
import type { DrugModality } from "../constants";

// ============================================================================
// FDA 2005 HED / MRSD cases (Km-ratio method: HED = NOAEL × Km_animal / Km_human)
// ============================================================================

export interface GoldenHedCase {
  id: string;
  citation: string;
  species: string;
  noael: number; // mg/kg
  safetyFactor: number;
  expectedHed: number; // mg/kg
  expectedMrsd: number; // mg/kg
  tol: number;
}

/**
 * FDA Km factors (Table 1): mouse 3, rat 6, monkey 12, rabbit 12, dog 20,
 * mini-pig 35, human 37. HED = NOAEL × Km_animal / 37.
 * Canonical anchor: mouse NOAEL 100 mg/kg → HED 8.11 mg/kg (FDA 2005 worked example).
 */
export const GOLDEN_HED_CASES: GoldenHedCase[] = [
  {
    id: "hed-mouse-100",
    citation:
      "FDA 2005 Guidance Table 1 (mouse Km=3, human Km=37); canonical worked example",
    species: "mouse",
    noael: 100,
    safetyFactor: 10,
    expectedHed: 8.1081, // 100 × 3/37
    expectedMrsd: 0.81081, // HED / 10
    tol: 1e-3,
  },
  {
    id: "hed-rat-100",
    citation: "FDA 2005 Guidance Table 1 (rat Km=6, human Km=37)",
    species: "rat",
    noael: 100,
    safetyFactor: 10,
    expectedHed: 16.2162, // 100 × 6/37
    expectedMrsd: 1.62162,
    tol: 1e-3,
  },
  {
    id: "hed-dog-10",
    citation: "FDA 2005 Guidance Table 1 (dog Km=20, human Km=37)",
    species: "dog",
    noael: 10,
    safetyFactor: 10,
    expectedHed: 5.4054, // 10 × 20/37
    expectedMrsd: 0.54054,
    tol: 1e-3,
  },
  {
    id: "hed-monkey-20",
    citation: "FDA 2005 Guidance Table 1 (monkey Km=12, human Km=37)",
    species: "monkey",
    noael: 20,
    safetyFactor: 10,
    expectedHed: 6.4865, // 20 × 12/37
    expectedMrsd: 0.64865,
    tol: 1e-3,
  },
  {
    id: "hed-minipig-40-sf30",
    citation:
      "FDA 2005 Guidance Table 1 (mini-pig Km=35, human Km=37); SF=30 high-risk tier",
    species: "minipig",
    noael: 40,
    safetyFactor: 30,
    expectedHed: 37.8378, // 40 × 35/37
    expectedMrsd: 1.26126, // HED / 30
    tol: 1e-3,
  },
];

// ============================================================================
// Cockcroft-Gault CrCl cases  CrCl = ((140-age)×W)/(72×SCr) [×0.85 female]
// ============================================================================

export interface GoldenCrClCase {
  id: string;
  citation: string;
  weightKg: number;
  age: number;
  creatinine: number;
  sex: PatientSex;
  unit: CreatinineUnit;
  expected: number; // mL/min
  tol: number;
}

export const GOLDEN_CRCL_CASES: GoldenCrClCase[] = [
  {
    id: "crcl-male-70-40-1",
    citation: "Cockcroft & Gault, Nephron 1976 — standard male reference",
    weightKg: 70,
    age: 40,
    creatinine: 1,
    sex: "male",
    unit: "mg/dL",
    expected: 97.2222, // (140-40)*70/(72*1)
    tol: 1e-2,
  },
  {
    id: "crcl-female-70-40-1",
    citation: "Cockcroft & Gault 1976 — female ×0.85 adjustment",
    weightKg: 70,
    age: 40,
    creatinine: 1,
    sex: "female",
    unit: "mg/dL",
    expected: 82.6389, // 97.2222 × 0.85
    tol: 1e-2,
  },
  {
    id: "crcl-male-70-80-1-elderly",
    citation: "Cockcroft & Gault 1976 — age effect (80 yo)",
    weightKg: 70,
    age: 80,
    creatinine: 1,
    sex: "male",
    unit: "mg/dL",
    expected: 58.3333, // (140-80)*70/72
    tol: 1e-2,
  },
  {
    id: "crcl-umol-equivalence",
    citation:
      "Unit equivalence: 1 mg/dL = 88.4 µmol/L; same patient must match mg/dL case",
    weightKg: 70,
    age: 40,
    creatinine: 88.4,
    sex: "male",
    unit: "umol/L",
    expected: 97.2222,
    tol: 0.5,
  },
];

// ============================================================================
// Cross-species scaling cases (calculateDose, no advanced adjustments)
// ============================================================================

export interface GoldenScalingCase {
  id: string;
  citation: string;
  method: ScalingMethod;
  sourceWeight: number;
  targetWeight: number;
  sourceKey: string;
  targetKey: string;
  baseDose: number; // mg/kg
  expectedDose: number; // mg/kg
  tol: number;
}

export const GOLDEN_SCALING_CASES: GoldenScalingCase[] = [
  {
    id: "allometric-mouse-human",
    citation:
      "Allometric mg/kg: (W_t/W_s)^(b-1), b=0.75 → exponent -0.25; (70/0.02)^-0.25",
    method: "allometric",
    sourceWeight: 0.02,
    targetWeight: 70,
    sourceKey: "mouse",
    targetKey: "human",
    baseDose: 1,
    expectedDose: 0.130017,
    tol: 1e-4,
  },
  {
    id: "allometric-human-mouse-reverse",
    citation:
      "Allometric reverse: (0.02/70)^-0.25 → larger mg/kg for smaller animal",
    method: "allometric",
    sourceWeight: 70,
    targetWeight: 0.02,
    sourceKey: "human",
    targetKey: "mouse",
    baseDose: 1,
    expectedDose: 7.6913, // exp(-0.25 × ln(0.02/70))
    tol: 1e-2,
  },
  {
    id: "bsa-mouse-human-km",
    citation:
      "BSA Km method: dose × (Km_source/Km_target), Km=W/BSA; mouse 0.02/0.006, human 70/1.9",
    method: "bsa",
    sourceWeight: 0.02,
    targetWeight: 70,
    sourceKey: "mouse",
    targetKey: "human",
    baseDose: 1,
    expectedDose: 0.090476,
    tol: 1e-4,
  },
  {
    id: "direct-mouse-human-identity",
    citation:
      "Direct/linear scaling: exponent 1 → mg/kg unchanged across species",
    method: "direct",
    sourceWeight: 0.02,
    targetWeight: 70,
    sourceKey: "mouse",
    targetKey: "human",
    baseDose: 1,
    expectedDose: 1.0,
    tol: 1e-6,
  },
  {
    id: "lifespan-collapse-mouse-human",
    citation:
      "Exploratory collapse: lifeSpan reduces to Dose × (life_target/life_source) = 1 × (80/2)",
    method: "lifeSpan",
    sourceWeight: 0.02,
    targetWeight: 70,
    sourceKey: "mouse",
    targetKey: "human",
    baseDose: 1,
    expectedDose: 40.0,
    tol: 1e-2,
  },
  {
    id: "hepaticflow-flow-ratio-mouse-human",
    citation:
      "Exploratory: hepaticFlow reduces to Dose × (q_target/q_source) = 1 × (20.7/131)",
    method: "hepaticFlow",
    sourceWeight: 0.02,
    targetWeight: 70,
    sourceKey: "mouse",
    targetKey: "human",
    baseDose: 1,
    expectedDose: 0.158015,
    tol: 1e-4,
  },
];

// ============================================================================
// INTENTIONAL invalid-input guard cases — engine must refuse/clamp, not
// silently emit a plausible dose. Encoded as expectations checked by the runner.
// ============================================================================

export interface GoldenFihGuardCase {
  id: string;
  description: string;
  input: {
    noael: number;
    animalSpecies: string;
    safetyFactor: number;
    modality: DrugModality;
  };
  expectMrsdZero: boolean;
  expectWarningCode: string;
}

export const GOLDEN_FIH_GUARD_CASES: GoldenFihGuardCase[] = [
  {
    id: "guard-noael-zero",
    description: "NOAEL of 0 must halt with INVALID_NOAEL and mrsd=0",
    input: {
      noael: 0,
      animalSpecies: "mouse",
      safetyFactor: 10,
      modality: "small_molecule",
    },
    expectMrsdZero: true,
    expectWarningCode: "INVALID_NOAEL",
  },
  {
    id: "guard-noael-negative",
    description: "Negative NOAEL must halt with INVALID_NOAEL",
    input: {
      noael: -5,
      animalSpecies: "rat",
      safetyFactor: 10,
      modality: "small_molecule",
    },
    expectMrsdZero: true,
    expectWarningCode: "INVALID_NOAEL",
  },
  {
    id: "guard-unknown-species",
    description: "Unknown species must halt with UNKNOWN_SPECIES",
    input: {
      noael: 100,
      animalSpecies: "dragon",
      safetyFactor: 10,
      modality: "small_molecule",
    },
    expectMrsdZero: true,
    expectWarningCode: "UNKNOWN_SPECIES",
  },
  {
    id: "guard-safety-factor-below-one",
    description:
      "Safety factor <1 would inflate the dose; must halt with INVALID_SAFETY_FACTOR",
    input: {
      noael: 100,
      animalSpecies: "mouse",
      safetyFactor: 0.5,
      modality: "small_molecule",
    },
    expectMrsdZero: true,
    expectWarningCode: "INVALID_SAFETY_FACTOR",
  },
];

// ============================================================================
// Bioavailability clamp guard (calculateDose) — F>100% must clamp, not amplify
// ============================================================================

export interface GoldenBioavailabilityGuardCase {
  id: string;
  description: string;
  bioavailability: number; // target F (%)
  /**
   * Safety invariant: an impossible F must NEVER amplify the dose above the
   * un-adjusted (F=100%) baseline. The engine may satisfy this by clamping to
   * 100% OR by rejecting the input (dose 0) — either is acceptable; amplifying
   * is not.
   */
  tol: number;
}

export const GOLDEN_BIOAVAILABILITY_GUARD_CASES: GoldenBioavailabilityGuardCase[] =
  [
    {
      id: "guard-bioavailability-over-100",
      description:
        "Target F=150% is impossible; engine must clamp or reject — never amplify the dose",
      bioavailability: 150,
      tol: 1e-6,
    },
  ];

// ============================================================================
// MABEL / receptor-occupancy dose (Batch 4) — worked reference + guard
// ============================================================================

export interface GoldenMabelCase {
  id: string;
  citation: string;
  bindingConstantNM: number;
  targetOccupancyPct: number;
  vdLPerKg: number;
  molecularWeightGPerMol: number;
  bioavailabilityPct: number;
  expectedConcentrationNM: number;
  expectedDoseMgPerKg: number;
  tol: number;
}

export const GOLDEN_MABEL_CASES: GoldenMabelCase[] = [
  {
    id: "mabel-mab-10pct-ro",
    citation:
      "MABEL worked example (mAb): C=Kd×RO/(1−RO); Dose=C×Vd×MW/1e6. Kd 1 nM, RO 10%, Vd 0.07 L/kg, MW 150000, IV",
    bindingConstantNM: 1,
    targetOccupancyPct: 10,
    vdLPerKg: 0.07,
    molecularWeightGPerMol: 150000,
    bioavailabilityPct: 100,
    expectedConcentrationNM: 0.111111, // 1 × 0.1/0.9
    expectedDoseMgPerKg: 0.0011667, // 0.1111 × 0.07 × 150000 / 1e6 ≈ 1.17 µg/kg
    tol: 1e-5,
  },
];
