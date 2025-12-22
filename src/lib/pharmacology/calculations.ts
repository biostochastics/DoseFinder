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
} from "./types";
import { SPECIES_DATABASE } from "./species";
import { validateCalculationInputs } from "./validators";

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
 * Calculate Cockcroft-Gault GFR for kidney function assessment
 *
 * Formula: GFR = ((140 - age) × weight) / (72 × creatinine) [× 0.85 if female]
 *
 * Note: Creatinine must be in mg/dL. If provided in µmol/L, use the
 * creatinineUnit parameter to auto-convert.
 *
 * Reference: Cockcroft DW, Gault MH. Prediction of creatinine clearance
 * from serum creatinine. Nephron. 1976;16(1):31-41.
 */
export function calculateCockcroftGFR(
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
    console.error("Error calculating GFR:", error);
    return 0;
  }
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

  // Validate minAdjustmentFactor (must be between 0 and 1)
  const validMinFactor = Math.max(0, Math.min(1, minAdjustmentFactor));

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
 * Calculate hepatic clearance scaling factor
 *
 * This method scales doses based on hepatic blood flow and extraction ratio
 * to account for differences in hepatic drug clearance between species.
 *
 * EXPERIMENTAL: This method lacks extensive clinical validation. Results should
 * be interpreted with caution and validated with compound-specific data.
 *
 * References:
 * - Boxenbaum H. J Pharmacokinet Biopharm. 1980;8(2):165-176.
 * - Lave T, et al. Pharm Res. 1999;16(7):1013-1021.
 */
function calculateHepaticClearanceScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string; warning?: string } {
  const sourceFlow = sourceSpecies.hepaticFlow;
  const targetFlow = targetSpecies.hepaticFlow;
  const sourceHepRatio = sourceSpecies.hepaticClearance / sourceFlow;
  const targetHepRatio = targetSpecies.hepaticClearance / targetFlow;

  if (sourceFlow <= 0 || targetFlow <= 0) {
    throw new Error("Invalid hepatic flow values");
  }

  // Guard against division by zero when weights are nearly equal
  if (Math.abs(weightRatio - 1) < 1e-4) {
    return {
      factor: 0,
      description: "Hepatic clearance scaling (experimental)",
      warning:
        "Source and target weights are nearly equal; scaling factor set to 0",
    };
  }

  const factor =
    Math.log((targetFlow * targetHepRatio) / (sourceFlow * sourceHepRatio)) /
    Math.log(weightRatio);
  return { factor, description: "Hepatic clearance scaling (experimental)" };
}

/**
 * Calculate BSA-based dose
 */
function calculateBSAScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  baseDose: number,
): { dose: number; description: string; step: string } {
  const sourceBSA = sourceSpecies.bsa;
  const targetBSA = targetSpecies.bsa;

  if (sourceBSA <= 0 || targetBSA <= 0) {
    throw new Error("Invalid BSA values");
  }

  // Calculate Km factors (Weight/BSA) per FDA guidance
  // Km is used for proper BSA-based interspecies dose conversion
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
    } else {
      // Calculate scaling factor based on method
      switch (method) {
        case "allometric": {
          const result = calculateAllometricScaling(
            params.scalingExponent || 0.75,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
          break;
        }
        case "direct": {
          // Direct/Linear scaling uses exponent 1.0 → dose conversion exponent 0.0
          // This means mg/kg dose stays the same regardless of species weight
          const result = calculateAllometricScaling(1.0);
          scalingFactor = result.factor;
          methodDescription =
            "Direct (linear) scaling: same mg/kg dose across species";
          break;
        }
        case "metabolic": {
          // Metabolic rate scaling uses exponent 0.75 (Kleiber's law)
          const result = calculateAllometricScaling(0.75);
          scalingFactor = result.factor;
          methodDescription =
            "Metabolic rate scaling (Kleiber's law, clearance exponent 0.75)";
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
          if (result.warning) {
            warnings.push(result.warning);
          }
          break;
        }
        case "hepaticFlow": {
          const result = calculateHepaticClearanceScaling(
            sourceSpecies,
            targetSpecies,
            weightRatio,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
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
     * Apply bioavailability adjustment (route-dependent)
     *
     * Bioavailability (F) directly affects systemic drug exposure and is a scientifically
     * valid adjustment factor. The formula Dose_oral = Dose_IV / F compensates for
     * incomplete absorption and first-pass metabolism.
     *
     * Literature-based default values are used when a route is specified. These are
     * conservative estimates - actual bioavailability varies significantly by drug.
     *
     * References:
     * - StatPearls NBK557852: Drug Bioavailability
     * - StatPearls NBK551679: First-Pass Effect
     * - PMC10745386: The Bioavailability of Drugs - Current State of Knowledge
     * - PMC6182494: Subcutaneous Administration of Biotherapeutics
     * - PMC6805701: Physiological Considerations for Rectal Drug Formulations
     *
     * CAVEAT: Oral bioavailability is highly variable (5-99%) depending on the drug.
     * The 50% default is a conservative middle estimate. Always use drug-specific
     * values when available from pharmacokinetic studies.
     */
    let actualBioavailability = params.bioavailability || 100;
    let bioavailabilitySource = "manual";

    if (
      params.bioavailabilityMethod &&
      params.bioavailabilityMethod !== "manual"
    ) {
      const method = params.bioavailabilityMethod as Exclude<
        BioavailabilityMethod,
        "manual"
      >;
      const defaultData = BIOAVAILABILITY_DEFAULTS[method];
      if (defaultData) {
        actualBioavailability = defaultData.value;
        bioavailabilitySource = `${method} route (literature default: ${defaultData.range.min}-${defaultData.range.max}%)`;
      }
    }

    if (actualBioavailability < 100) {
      const bioavailabilityFactor = actualBioavailability / 100;
      dose /= bioavailabilityFactor;
      steps.push(
        `Bioavailability (${actualBioavailability}%, ${bioavailabilitySource}): ÷ ${bioavailabilityFactor.toFixed(4)} = ${dose.toFixed(4)} mg/kg`,
      );
    }

    // Apply kidney function adjustment (for renally cleared drugs)
    // Uses fe (fraction excreted unchanged) for accurate renal adjustment
    // Formula: Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))
    // SAFETY: Default to 0 (no renal adjustment) for opt-in behavior.
    // User must actively specify fe to get renal dose adjustments, preventing
    // incorrect dose reductions for hepatically-cleared drugs.
    const fe = params.fractionExcretedRenal ?? 0;
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
      const gfr = calculateCockcroftGFR(
        targetWeight,
        params.patientAge,
        params.patientCreatinine,
        params.patientSex,
        creatinineUnit,
      );

      if (gfr > 0) {
        const fraction = gfrToDoseAdjustment(gfr, fe);
        dose *= fraction;
        const unitLabel = creatinineUnit === "umol/L" ? "µmol/L" : "mg/dL";
        if (fe < 1.0) {
          steps.push(
            `Cockcroft-Gault GFR (${gfr.toFixed(1)} mL/min, creatinine in ${unitLabel}, fe=${fe.toFixed(2)}): × ${fraction.toFixed(2)} = ${dose.toFixed(4)} mg/kg`,
          );
        } else {
          steps.push(
            `Cockcroft-Gault GFR (${gfr.toFixed(1)} mL/min): × ${fraction.toFixed(2)} = ${dose.toFixed(4)} mg/kg`,
          );
        }
      } else {
        warnings.push("Invalid GFR calculation inputs");
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
    const clearanceExponent = params.scalingExponent ?? 0.75;
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
