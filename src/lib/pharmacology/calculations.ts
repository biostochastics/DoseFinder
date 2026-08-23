/**
 * Core pharmacological calculation engine
 * Implements various dose scaling methods based on allometric principles
 */

import {
  Species,
  ScalingMethod,
  CalculationParameters,
  CalculationResult,
  ChartDataPoint,
  COCKCROFT_CONSTANTS,
  GFR_THRESHOLDS,
  CREATININE_CONVERSION,
  BIOAVAILABILITY_DEFAULTS,
  PatientSex,
  CreatinineUnit,
  BioavailabilityMethod,
  BodyWeightBasis,
} from "./types";
import { SPECIES_DATABASE } from "./species";
import { validateCalculationInputs } from "./validators";
import { SCALING_EXPONENTS } from "./constants";

/**
 * Warning attached to exploratory/historical scaling methods that reduce to a
 * trivial physiological ratio and are NOT validated dose estimators.
 */
export const EXPLORATORY_METHOD_WARNING =
  "Exploratory/historical method: this reduces to a simple physiological ratio " +
  "and is not a validated dose estimator. Do not use for dose selection — " +
  "prefer allometric (clearance) or BSA/Km scaling.";

/**
 * Convert creatinine between mg/dL and µmol/L
 * Standard conversion: 1 mg/dL = 88.4 µmol/L
 * Based on creatinine molecular weight: 113.12 g/mol
 */
export function convertCreatinine(
  value: number,
  fromUnit: CreatinineUnit,
  toUnit: CreatinineUnit,
): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "mg/dL" && toUnit === "umol/L") {
    return value * CREATININE_CONVERSION.mgdL_to_umolL;
  }
  // umol/L to mg/dL
  return value * CREATININE_CONVERSION.umolL_to_mgdL;
}

/**
 * Estimate creatinine clearance (CrCl) via the Cockcroft-Gault equation.
 *
 * IMPORTANT: Cockcroft-Gault estimates CREATININE CLEARANCE (CrCl), NOT
 * measured or estimated GFR. CrCl slightly overestimates true GFR (tubular
 * secretion of creatinine). Many drug labels specify dose adjustments in
 * terms of Cockcroft-Gault CrCl, so this estimator is appropriate for
 * label-based renal dosing — but do not conflate its output with eGFR
 * (e.g. CKD-EPI/MDRD), which is indexed to 1.73 m² BSA.
 *
 * Formula: CrCl (mL/min) = ((140 - age) × weight) / (72 × creatinine)
 *                          [× 0.85 if female]
 *
 * Body weight: pass the weight basis appropriate to the patient. In obesity,
 * actual body weight over-estimates CrCl; ideal (IBW) or adjusted (AdjBW)
 * body weight is commonly substituted. Callers should resolve the basis with
 * resolveBodyWeight() before calling this function.
 *
 * Creatinine must be in mg/dL. If provided in µmol/L, use the creatinineUnit
 * parameter to auto-convert.
 *
 * Reference: Cockcroft DW, Gault MH. Prediction of creatinine clearance
 * from serum creatinine. Nephron. 1976;16(1):31-41.
 */
export function calculateCockcroftCrCl(
  weightKg: number,
  age: number,
  creatinine: number,
  sex: PatientSex,
  creatinineUnit: CreatinineUnit = "mg/dL",
): number {
  try {
    if (weightKg <= 0 || age <= 0 || creatinine <= 0) {
      return 0;
    }

    // Convert creatinine to mg/dL if provided in µmol/L
    const creatinineInMgDL =
      creatinineUnit === "umol/L"
        ? convertCreatinine(creatinine, "umol/L", "mg/dL")
        : creatinine;

    const { ageFactor, creatinineMultiplier, femaleAdjustment } =
      COCKCROFT_CONSTANTS;

    let gfr =
      ((ageFactor - age) * weightKg) /
      (creatinineMultiplier * creatinineInMgDL);

    if (sex === "female") {
      gfr *= femaleAdjustment;
    }

    return Math.max(0, gfr);
  } catch (error) {
    console.error("Error calculating CrCl:", error);
    return 0;
  }
}

/**
 * Estimate ideal body weight (IBW) using the Devine formula.
 *
 * IBW (kg) = base + 2.3 × (height_inches − 60)
 *   base = 50 (male) or 45.5 (female)
 *
 * The Devine formula is defined for heights ≥ 60 inches (152.4 cm). Below
 * that, it under-predicts, so this returns the base value as a floor rather
 * than an implausibly small/negative weight.
 *
 * Reference: Devine BJ. Gentamicin therapy. Drug Intell Clin Pharm. 1974.
 */
export function calculateIdealBodyWeight(
  heightCm: number,
  sex: PatientSex,
): number {
  if (!isFinite(heightCm) || heightCm <= 0) return 0;
  const heightInches = heightCm / 2.54;
  const base = sex === "female" ? 45.5 : 50;
  return base + 2.3 * Math.max(0, heightInches - 60);
}

/**
 * Resolve the body weight to use for Cockcroft-Gault CrCl per the selected basis.
 *
 * - "actual":   actual body weight as entered (Cockcroft-Gault's original basis)
 * - "ideal":    IBW (Devine); requires height. If actual < IBW, actual is used
 *               (using IBW would over-estimate CrCl for underweight patients).
 * - "adjusted": AdjBW = IBW + 0.4 × (actual − IBW); requires height. Used for
 *               obesity. Falls back to actual when actual ≤ IBW.
 *
 * If height is missing/invalid for ideal/adjusted, falls back to actual weight.
 */
export function resolveBodyWeight(
  actualKg: number,
  heightCm: number | undefined,
  sex: PatientSex,
  basis: BodyWeightBasis = "actual",
): number {
  if (basis === "actual") return actualKg;
  if (!heightCm || !isFinite(heightCm) || heightCm <= 0) return actualKg;

  const ibw = calculateIdealBodyWeight(heightCm, sex);
  if (ibw <= 0) return actualKg;

  if (basis === "ideal") {
    // Do not use IBW if the patient is lighter than ideal (avoids over-estimating CrCl)
    return Math.min(actualKg, ibw);
  }
  // adjusted: only meaningful when actual exceeds ideal (obesity)
  if (actualKg <= ibw) return actualKg;
  return ibw + 0.4 * (actualKg - ibw);
}

/**
 * Convert GFR to dose adjustment factor using proper renal adjustment formula
 *
 * Formula: Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))
 *
 * Where:
 * - fe = fraction excreted unchanged in urine (0 to 1)
 *   - fe = 1.0: 100% renally cleared (e.g., aminoglycosides)
 *   - fe = 0.5: 50% renally cleared
 *   - fe = 0.0: no renal clearance (hepatically cleared)
 * - RenalFunctionRatio = patient GFR / normal GFR (capped at 1.0)
 *
 * When fe = 1.0 (default), this matches traditional GFR-based adjustments.
 *
 * IMPORTANT: The minAdjustmentFactor parameter sets a floor on dose reduction.
 * Default is 0 (no floor) for accurate pharmacokinetic calculations.
 * Some clinical contexts may require a safety floor (e.g., 0.1 for 90% max reduction).
 * For drugs requiring >90% dose reduction in severe renal impairment, ensure
 * minAdjustmentFactor is set appropriately or left at 0.
 *
 * References:
 * - Rowland M, Tozer TN. Clinical Pharmacokinetics. 4th ed. Lippincott Williams & Wilkins; 2011.
 * - Matzke GR, et al. Drug dosing consideration in patients with acute and chronic kidney disease.
 *   Kidney Int. 2011;80(11):1122-1137.
 *
 * @param gfr - Glomerular filtration rate (mL/min)
 * @param fe - Fraction excreted unchanged in urine (0-1). Default is 0 (no renal adjustment).
 *        Must be explicitly set for renally-cleared drugs to avoid incorrect adjustments.
 * @param normalGfr - Normal GFR for comparison. Default is 120 mL/min.
 * @param minAdjustmentFactor - Minimum adjustment factor floor (0-1). Default is 0 (no floor).
 *        Set to 0.1 for 90% max reduction, 0.25 for 75% max reduction, etc.
 * @returns Dose adjustment factor (0-1, where 1.0 = no adjustment needed)
 */
export function gfrToDoseAdjustment(
  gfr: number,
  fe: number = 0,
  normalGfr: number = 120,
  minAdjustmentFactor: number = 0,
): number {
  // Validate fe
  const validFe = Math.max(0, Math.min(1, fe));

  // Validate minAdjustmentFactor (must be between 0 and 1, handle NaN/Infinity)
  const validMinFactor = Number.isFinite(minAdjustmentFactor)
    ? Math.max(0, Math.min(1, minAdjustmentFactor))
    : 0;

  // If no renal clearance (fe = 0), no dose adjustment needed
  if (validFe === 0) return 1.0;

  // Calculate renal function ratio (capped at 1.0)
  const renalFunctionRatio = Math.min(1.0, Math.max(0, gfr / normalGfr));

  // Apply the proper formula: 1 - fe × (1 - renalFunctionRatio)
  // This preserves the non-renally cleared portion
  const adjustmentFactor = 1 - validFe * (1 - renalFunctionRatio);

  // Apply configurable floor if set (0 = no floor for accurate PK)
  return Math.max(validMinFactor, adjustmentFactor);
}

/**
 * Legacy GFR-based dose adjustment using categorical thresholds
 * Retained for backward compatibility and simple use cases
 *
 * @deprecated Use gfrToDoseAdjustment with fe parameter for accurate adjustments
 */
export function gfrToDoseAdjustmentCategorical(gfr: number): number {
  if (gfr <= 0) return 0.25;
  if (gfr >= GFR_THRESHOLDS.normal) return 1.0;
  if (gfr >= GFR_THRESHOLDS.mild) return 0.75;
  if (gfr >= GFR_THRESHOLDS.moderate) return 0.5;
  return 0.25;
}

/**
 * Calculate allometric scaling factor for mg/kg to mg/kg conversion
 *
 * For interspecies dose scaling in mg/kg units, the correct exponent is (b - 1)
 * where b is the allometric exponent (typically 0.75 for clearance).
 *
 * Derivation:
 * - Clearance scales as CL ∝ W^b (where b ≈ 0.75)
 * - For equivalent exposure: Dose_target/CL_target = Dose_source/CL_source
 * - This gives: Dose_target = Dose_source × (CL_target/CL_source)
 * - In mg/kg: (mg/kg)_target = (mg/kg)_source × (W_target/W_source)^(b-1)
 *
 * With b = 0.75, the dose conversion exponent is -0.25
 * This means larger animals need LOWER mg/kg doses (which is biologically correct)
 *
 * References:
 * - Sharma V, McNeill JH. Br J Pharmacol. 2009;157(6):907-921
 * - Mahmood I, Balian JD. Toxicol Appl Pharmacol. 1996;140(2):253-258
 * - FDA Guidance for Industry (2005): Estimating Maximum Safe Starting Dose
 */
function calculateAllometricScaling(exponent: number): {
  factor: number;
  description: string;
} {
  // For mg/kg to mg/kg conversion, use (exponent - 1)
  const doseConversionExponent = exponent - 1;
  const description = `Allometric scaling (clearance exponent ${exponent}, dose conversion exponent ${doseConversionExponent.toFixed(2)})`;

  return { factor: doseConversionExponent, description };
}

/**
 * Calculate brain weight scaling factor
 *
 * This method estimates dose scaling based on brain-to-body weight ratios,
 * assuming CNS drug distribution correlates with relative brain size.
 *
 * EXPERIMENTAL: This method is theoretical and lacks broad clinical validation.
 * Consider only for CNS-targeted compounds as a rough approximation.
 *
 * References:
 * - Boxenbaum H, DiLea C. J Clin Pharmacol. 1995;35(10):957-966.
 * - Mahmood I. J Pharm Sci. 1999;88(11):1101-1106.
 */
function calculateBrainWeightScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string; warning?: string } {
  const sourceBrain = sourceSpecies.brainWeight;
  const targetBrain = targetSpecies.brainWeight;

  if (sourceBrain <= 0 || targetBrain <= 0) {
    throw new Error("Invalid brain weights");
  }

  // Guard against division by zero when weights are nearly equal
  if (Math.abs(weightRatio - 1) < 1e-4) {
    return {
      factor: 0,
      description: "Brain weight scaling (experimental)",
      warning:
        "Source and target weights are nearly equal; scaling factor set to 0",
    };
  }

  const factor =
    ((2 / 3) * Math.log(targetBrain / sourceBrain)) / Math.log(weightRatio);
  return { factor, description: "Brain weight scaling (experimental)" };
}

/**
 * Calculate life-span scaling factor
 *
 * This method adjusts doses based on relative species life spans, under the
 * assumption that drug exposure/toxicity correlates with lifetime duration.
 * Primarily used for chronic dosing studies and carcinogenicity assessment.
 *
 * EXPERIMENTAL: This method is highly theoretical. Life-span correlations
 * with drug exposure are complex and species-specific.
 *
 * References:
 * - Travis CC, White RK. Risk Anal. 1988;8(1):119-125.
 * - Boxenbaum H. Drug Metab Rev. 1984;15(5-6):1071-1121.
 */
function calculateLifeSpanScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string; warning?: string } {
  const sourceLife = sourceSpecies.lifeSpan;
  const targetLife = targetSpecies.lifeSpan;

  if (sourceLife <= 0 || targetLife <= 0) {
    throw new Error("Invalid life spans");
  }

  // Guard against division by zero when weights are nearly equal
  if (Math.abs(weightRatio - 1) < 1e-4) {
    return {
      factor: 0,
      description: "Life-span scaling (experimental)",
      warning:
        "Source and target weights are nearly equal; scaling factor set to 0",
    };
  }

  const factor = Math.log(targetLife / sourceLife) / Math.log(weightRatio);
  return { factor, description: "Life-span scaling (experimental)" };
}

/**
 * Calculate hepatic blood flow scaling factor (EXPLORATORY)
 *
 * Scales the per-kg dose by the ratio of species hepatic blood flow
 * (mL/min/kg), the flow-limited-clearance assumption for a high-extraction
 * drug (CL ≈ hepatic blood flow Q). It uses ONLY species physiology
 * (hepaticFlow); it does NOT use any per-species "hepatic clearance" value,
 * because a drug's hepatic clearance is a compound property, not a species
 * constant (see species.ts, v0.9.9).
 *
 * Derivation (per-kg): for a flow-limited drug matching exposure,
 *   Dose_total ∝ Q_total = qPerKg × W
 *   (mg/kg)_target / (mg/kg)_source = qPerKg_target / qPerKg_source
 * Expressed via the shared weightRatio^factor machinery:
 *   factor = ln(qPerKg_target / qPerKg_source) / ln(weightRatio)
 *
 * EXPLORATORY: Only valid for high-extraction (flow-limited) drugs, and even
 * then it ignores compound-specific extraction/binding. Not a validated
 * general dose estimator.
 *
 * References:
 * - Boxenbaum H. J Pharmacokinet Biopharm. 1980;8(2):165-176.
 * - Davies B, Morris T. Pharm Res. 1993;10(7):1093-1095.
 */
function calculateHepaticFlowScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string; warning?: string } {
  const sourceFlow = sourceSpecies.hepaticFlow;
  const targetFlow = targetSpecies.hepaticFlow;

  if (sourceFlow <= 0 || targetFlow <= 0) {
    throw new Error("Invalid hepatic flow values");
  }

  // Guard against division by zero when weights are nearly equal
  if (Math.abs(weightRatio - 1) < 1e-4) {
    return {
      factor: 0,
      description: "Hepatic blood flow scaling (exploratory)",
      warning:
        "Source and target weights are nearly equal; scaling factor set to 0",
    };
  }

  const factor = Math.log(targetFlow / sourceFlow) / Math.log(weightRatio);
  return { factor, description: "Hepatic blood flow scaling (exploratory)" };
}

/**
 * Calculate BSA-based dose
 *
 * NOTE: BSA/Km scaling uses FDA reference weights and BSA values from species database,
 * NOT user-entered weights. This is by design - the FDA 2005 guidance specifies exact
 * Km factors based on reference body weights and BSA values in Table 1.
 *
 * If user-entered weights differ significantly from reference values, consider using
 * allometric scaling which honors user-entered weights.
 */
function calculateBSAScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  baseDose: number,
): { dose: number; description: string; step: string; warning?: string } {
  const sourceBSA = sourceSpecies.bsa;
  const targetBSA = targetSpecies.bsa;

  if (sourceBSA <= 0 || targetBSA <= 0) {
    throw new Error("Invalid BSA values");
  }

  // Calculate Km factors (Weight/BSA) per FDA guidance
  // Km is used for proper BSA-based interspecies dose conversion
  // NOTE: Uses reference weights from species database, not user-entered weights
  const sourceKm = sourceSpecies.weight / sourceBSA;
  const targetKm = targetSpecies.weight / targetBSA;

  if (sourceKm <= 0 || targetKm <= 0) {
    throw new Error(
      "Invalid Km values; check weight and BSA for source/target species",
    );
  }

  // Correct formula: Target dose = Source dose × (Source Km / Target Km)
  const dose = baseDose * (sourceKm / targetKm);
  const step = `BSA scaling (Km method): ${baseDose} mg/kg × (Km_source: ${sourceKm.toFixed(2)} / Km_target: ${targetKm.toFixed(2)}) = ${dose.toFixed(4)} mg/kg`;

  return {
    dose,
    description: "BSA-based scaling using Km factors (FDA method)",
    step,
    warning:
      "BSA/Km scaling uses FDA reference weights from species database. User-entered weight adjustments are not applied to Km factors.",
  };
}

/**
 * Main dose calculation function
 */
export function calculateDose(
  baseWeight: number,
  targetWeight: number,
  baseDose: number,
  method: ScalingMethod,
  sourceAnimalKey: string,
  targetAnimalKey: string,
  params: Partial<CalculationParameters> = {},
): CalculationResult {
  // Validate inputs
  const validation = validateCalculationInputs(
    baseWeight,
    targetWeight,
    baseDose,
    method,
    params,
  );

  if (!validation.isValid) {
    return {
      dose: 0,
      scalingFactor: 0,
      methodDescription: "Invalid inputs",
      steps: validation.errors,
      warnings: validation.warnings,
      error: validation.errors.join("; "),
    };
  }

  // Get species data
  const sourceSpecies = SPECIES_DATABASE[sourceAnimalKey];
  const targetSpecies = SPECIES_DATABASE[targetAnimalKey];

  if (!sourceSpecies || !targetSpecies) {
    return {
      dose: 0,
      scalingFactor: 0,
      methodDescription: "Invalid species",
      steps: ["Error: Species data not found"],
      error: "Invalid species selection",
    };
  }

  try {
    const weightRatio = targetWeight / baseWeight;
    let scalingFactor = 0;
    let methodDescription = "";
    let dose = 0;
    const steps: string[] = [];
    const warnings = validation.warnings;

    // Note: Division by zero protection for logarithmic methods (brainWeight, lifeSpan, hepaticFlow)
    // is handled in the individual scaling functions which return warnings when weightRatio ≈ 1

    // Calculate base scaling
    if (method === "bsa") {
      const bsaResult = calculateBSAScaling(
        sourceSpecies,
        targetSpecies,
        baseDose,
      );
      dose = bsaResult.dose;
      methodDescription = bsaResult.description;
      steps.push(bsaResult.step);
      if (bsaResult.warning) {
        warnings.push(bsaResult.warning);
      }
    } else {
      // Calculate scaling factor based on method
      switch (method) {
        case "allometric": {
          const result = calculateAllometricScaling(
            params.scalingExponent || SCALING_EXPONENTS.METABOLIC,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
          break;
        }
        case "direct": {
          // Direct/Linear scaling uses exponent 1.0 → dose conversion exponent 0.0
          // This means mg/kg dose stays the same regardless of species weight
          const result = calculateAllometricScaling(SCALING_EXPONENTS.LINEAR);
          scalingFactor = result.factor;
          methodDescription =
            "Direct (linear) scaling: same mg/kg dose across species";
          break;
        }
        case "metabolic": {
          // Metabolic rate scaling uses exponent 0.75 (Kleiber's law)
          const result = calculateAllometricScaling(
            SCALING_EXPONENTS.METABOLIC,
          );
          scalingFactor = result.factor;
          methodDescription = `Metabolic rate scaling (Kleiber's law, clearance exponent ${SCALING_EXPONENTS.METABOLIC})`;
          break;
        }
        case "brainWeight": {
          const result = calculateBrainWeightScaling(
            sourceSpecies,
            targetSpecies,
            weightRatio,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
          warnings.push(EXPLORATORY_METHOD_WARNING);
          if (result.warning) {
            warnings.push(result.warning);
          }
          break;
        }
        case "lifeSpan": {
          const result = calculateLifeSpanScaling(
            sourceSpecies,
            targetSpecies,
            weightRatio,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
          warnings.push(EXPLORATORY_METHOD_WARNING);
          if (result.warning) {
            warnings.push(result.warning);
          }
          break;
        }
        case "hepaticFlow": {
          const result = calculateHepaticFlowScaling(
            sourceSpecies,
            targetSpecies,
            weightRatio,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
          warnings.push(EXPLORATORY_METHOD_WARNING);
          if (result.warning) {
            warnings.push(result.warning);
          }
          break;
        }
      }

      // Apply scaling factor
      dose = baseDose * Math.pow(weightRatio, scalingFactor);
      steps.push(
        `Base scaling: ${baseDose} mg/kg × (${weightRatio.toFixed(4)})^(${scalingFactor.toFixed(4)}) = ${dose.toFixed(4)} mg/kg`,
      );
    }

    // Note: Protein binding, Volume of distribution, and LogP adjustments were removed
    // in v0.8.0 as they lacked proper scientific citation and could produce misleading
    // results. Proper PBPK modeling should be used for these adjustments.

    /**
     * Apply bioavailability adjustment (TWO-SIDED, route-dependent)
     *
     * For cross-species exposure matching, AUC = F · Dose / CL. Matching AUC
     * between the source dose (administered by the source route) and the target
     * dose (administered by the target route) gives:
     *
     *   Dose_target = Dose_source × (CL_target / CL_source) × (F_source / F_target)
     *
     * The allometric/BSA step already handles CL_target/CL_source. Here we apply
     * the bioavailability term F_source / F_target. The previous one-sided form
     * (÷ F_target) implicitly assumed F_source = 100% (an IV/systemic source
     * dose). Exposing F_source makes route-to-route translation correct — and it
     * reduces to the old behavior when F_source = 100%.
     *
     * Literature-based route defaults are conservative and highly drug-specific;
     * prefer measured, compound-specific values when available.
     *
     * References:
     * - Rowland M, Tozer TN. Clinical Pharmacokinetics. 4th ed. 2011.
     * - StatPearls NBK557852 (Bioavailability); NBK551679 (First-Pass Effect)
     */
    const resolveBioavailability = (
      method: BioavailabilityMethod | undefined,
      manualValue: number | undefined,
    ): { value: number; source: string } => {
      if (method && method !== "manual") {
        const defaultData = BIOAVAILABILITY_DEFAULTS[method];
        if (defaultData) {
          return {
            value: defaultData.value,
            source: `${method} route (literature default: ${defaultData.range.min}-${defaultData.range.max}%)`,
          };
        }
      }
      return { value: manualValue ?? 100, source: "manual" };
    };

    // Clamp to (0, 100]; validation already bounds inputs, this guards division.
    const clampF = (f: number) => Math.min(100, Math.max(0.0001, f));
    const target = resolveBioavailability(
      params.bioavailabilityMethod,
      params.bioavailability,
    );
    const source = resolveBioavailability(
      params.sourceBioavailabilityMethod,
      params.sourceBioavailability,
    );
    const fTarget = clampF(target.value);
    const fSource = clampF(source.value);

    if (fSource !== fTarget) {
      const bioavailabilityFactor = fSource / fTarget;
      dose *= bioavailabilityFactor;
      steps.push(
        `Bioavailability (source F ${fSource}% [${source.source}] → target F ${fTarget}% [${target.source}]): ` +
          `× (F_source/F_target) = × ${bioavailabilityFactor.toFixed(4)} = ${dose.toFixed(4)} mg/kg`,
      );
    }

    // Apply kidney function adjustment (for renally cleared drugs)
    // Uses fe (fraction excreted unchanged) for accurate renal adjustment
    // Formula: Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))
    // SAFETY: Default to 0 (no renal adjustment) for opt-in behavior.
    // User must actively specify fe to get renal dose adjustments, preventing
    // incorrect dose reductions for hepatically-cleared drugs.
    // Clamp fe to [0, 1] range for consistency with gfrToDoseAdjustment
    const fe = Math.max(0, Math.min(1, params.fractionExcretedRenal ?? 0));
    const creatinineUnit = params.creatinineUnit ?? "mg/dL";

    if (
      params.kidneyFunctionMethod === "manual" &&
      params.kidneyFunction !== undefined
    ) {
      // Manual kidney function (0-100%) with fe adjustment
      const renalFunctionRatio =
        Math.max(0, Math.min(100, params.kidneyFunction)) / 100;
      const kidneyFactor = 1 - fe * (1 - renalFunctionRatio);
      dose *= kidneyFactor;
      if (fe < 1.0) {
        steps.push(
          `Manual kidney function (${params.kidneyFunction}%, fe=${fe.toFixed(2)}): × ${kidneyFactor.toFixed(4)} = ${dose.toFixed(4)} mg/kg`,
        );
      } else {
        steps.push(
          `Manual kidney function (${params.kidneyFunction}%): × ${kidneyFactor.toFixed(4)} = ${dose.toFixed(4)} mg/kg`,
        );
      }
    } else if (
      params.kidneyFunctionMethod === "cockcroft" &&
      params.patientAge &&
      params.patientCreatinine &&
      params.patientSex
    ) {
      // Resolve the body-weight basis (actual / ideal / adjusted) for CrCl.
      const bodyWeightBasis: BodyWeightBasis =
        params.bodyWeightBasis ?? "actual";
      const cgWeight = resolveBodyWeight(
        targetWeight,
        params.patientHeight,
        params.patientSex,
        bodyWeightBasis,
      );
      if (
        bodyWeightBasis !== "actual" &&
        (!params.patientHeight || params.patientHeight <= 0)
      ) {
        warnings.push(
          `Cockcroft-Gault ${bodyWeightBasis} body weight requires patient height; falling back to actual body weight.`,
        );
      }

      const crcl = calculateCockcroftCrCl(
        cgWeight,
        params.patientAge,
        params.patientCreatinine,
        params.patientSex,
        creatinineUnit,
      );

      if (crcl > 0) {
        const fraction = gfrToDoseAdjustment(crcl, fe);
        dose *= fraction;
        const unitLabel = creatinineUnit === "umol/L" ? "µmol/L" : "mg/dL";
        const basisLabel =
          bodyWeightBasis === "actual"
            ? ""
            : `, ${bodyWeightBasis} BW ${cgWeight.toFixed(1)} kg`;
        if (fe < 1.0) {
          steps.push(
            `Cockcroft-Gault CrCl (${crcl.toFixed(1)} mL/min, creatinine in ${unitLabel}${basisLabel}, fe=${fe.toFixed(2)}): × ${fraction.toFixed(2)} = ${dose.toFixed(4)} mg/kg`,
          );
        } else {
          steps.push(
            `Cockcroft-Gault CrCl (${crcl.toFixed(1)} mL/min${basisLabel}): × ${fraction.toFixed(2)} = ${dose.toFixed(4)} mg/kg`,
          );
        }
      } else {
        warnings.push("Invalid Cockcroft-Gault CrCl calculation inputs");
      }
    }

    // Final dose validation
    if (!isFinite(dose) || isNaN(dose)) {
      return {
        dose: 0,
        scalingFactor,
        methodDescription,
        steps: ["Error: Calculation resulted in invalid number"],
        warnings,
        error: "Mathematical error in calculation",
      };
    }

    return {
      dose,
      scalingFactor,
      methodDescription,
      steps,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error("Calculation error:", error);
    return {
      dose: 0,
      scalingFactor: 0,
      methodDescription: "Calculation error",
      steps: [
        "Error: " + (error instanceof Error ? error.message : "Unknown error"),
      ],
      warnings: validation.warnings,
      error:
        error instanceof Error ? error.message : "Unknown calculation error",
    };
  }
}

// ChartDataPoint is exported from types.ts

/**
 * Generate chart data points for visualization
 *
 * NOTE: Interpolation is only scientifically valid for allometric scaling,
 * which uses weight ratios directly. Methods that depend on species-specific
 * physiological data (BSA, brain weight, life span, hepatic flow) only show
 * actual species data points to avoid misleading visualizations.
 */
export function generateChartData(
  baseWeight: number,
  baseDose: number,
  method: ScalingMethod,
  sourceAnimalKey: string,
  params: Partial<CalculationParameters> = {},
  numPoints: number = 50,
): ChartDataPoint[] {
  // Guard against division by zero - baseWeight is used in scaling factor calculations
  if (baseWeight <= 0) {
    console.warn("generateChartData: baseWeight must be positive");
    return [];
  }

  const points: ChartDataPoint[] = [];
  const minWeight = 0.01;
  const maxWeight = 1000;

  // Add actual animal data points (always included for all methods)
  for (const [key, species] of Object.entries(SPECIES_DATABASE)) {
    const result = calculateDose(
      baseWeight,
      species.weight,
      baseDose,
      method,
      sourceAnimalKey,
      key,
      params,
    );

    if (result.dose > 0 && isFinite(result.dose)) {
      points.push({
        name: key,
        weight: species.weight,
        dose: result.dose,
        isAnimal: true,
        label: species.name,
      });
    }
  }

  // Only interpolate for allometric scaling - other methods depend on
  // species-specific physiological data that cannot be interpolated
  const canInterpolate = method === "allometric";

  if (canInterpolate) {
    // Add interpolated points for smooth curve using corrected allometric formula
    // For mg/kg to mg/kg: (mg/kg)_target = (mg/kg)_source × (W_target/W_source)^(b-1)
    const clearanceExponent =
      params.scalingExponent ?? SCALING_EXPONENTS.METABOLIC;
    const doseConversionExponent = clearanceExponent - 1; // -0.25 for standard 0.75

    for (let i = 0; i <= numPoints; i++) {
      const logMin = Math.log10(minWeight);
      const logMax = Math.log10(maxWeight);
      const logWeight = logMin + (logMax - logMin) * (i / numPoints);
      const weight = Math.pow(10, logWeight);

      // Skip if too close to an actual animal point
      const tooClose = points.some(
        (p) => Math.abs(p.weight - weight) < weight * 0.01,
      );

      if (!tooClose) {
        // Calculate using corrected allometric formula with (exponent - 1)
        const scalingFactor = Math.pow(
          weight / baseWeight,
          doseConversionExponent,
        );
        const dose = baseDose * scalingFactor;

        if (dose > 0 && isFinite(dose)) {
          points.push({
            name: `interpolated_${i}`,
            weight,
            dose,
            isAnimal: false,
            label: "",
          });
        }
      }
    }
  }

  return points.sort((a, b) => a.weight - b.weight);
}

// Re-export ChartDataPoint for backwards compatibility
export type { ChartDataPoint } from "./types";
