/**
 * Core pharmacological calculation engine
 * Implements various dose scaling methods based on allometric principles
 */

import {
  Species,
  ScalingMethod,
  CalculationParameters,
  CalculationResult,
  COCKCROFT_CONSTANTS,
  GFR_THRESHOLDS,
  PatientSex,
} from "./types";
import { SPECIES_DATABASE } from "./species";
import { validateCalculationInputs } from "./validators";

/**
 * Calculate Cockcroft-Gault GFR for kidney function assessment
 */
export function calculateCockcroftGFR(
  weightKg: number,
  age: number,
  creatinine: number,
  sex: PatientSex,
): number {
  try {
    if (weightKg <= 0 || age <= 0 || creatinine <= 0) {
      return 0;
    }

    const { ageFactor, creatinineMultiplier, femaleAdjustment } =
      COCKCROFT_CONSTANTS;

    let gfr =
      ((ageFactor - age) * weightKg) / (creatinineMultiplier * creatinine);

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
 * Convert GFR to dose adjustment factor
 */
export function gfrToDoseAdjustment(gfr: number): number {
  if (gfr <= 0) return 0.25;
  if (gfr >= GFR_THRESHOLDS.normal) return 1.0;
  if (gfr >= GFR_THRESHOLDS.mild) return 0.75;
  if (gfr >= GFR_THRESHOLDS.moderate) return 0.5;
  return 0.25;
}

/**
 * Calculate allometric scaling factor
 */
function calculateAllometricScaling(
  weightRatio: number,
  exponent: number,
  molecularWeight?: number,
): { factor: number; description: string } {
  let scalingFactor = exponent;
  let description = `Allometric scaling (${exponent})`;

  if (molecularWeight && molecularWeight > 0) {
    // Adjust exponent based on molecular weight
    if (molecularWeight > 700) {
      scalingFactor = 0.7;
    } else if (molecularWeight > 400) {
      scalingFactor = 0.75;
    } else {
      scalingFactor = 0.8;
    }
    description = `Allometric scaling with MW adjustment (${molecularWeight} g/mol → ${scalingFactor})`;
  }

  return { factor: scalingFactor, description };
}

/**
 * Calculate brain weight scaling factor
 */
function calculateBrainWeightScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string } {
  const sourceBrain = sourceSpecies.brainWeight;
  const targetBrain = targetSpecies.brainWeight;

  if (sourceBrain <= 0 || targetBrain <= 0) {
    throw new Error("Invalid brain weights");
  }

  const factor =
    ((2 / 3) * Math.log(targetBrain / sourceBrain)) / Math.log(weightRatio);
  return { factor, description: "Brain weight scaling" };
}

/**
 * Calculate life-span scaling factor
 */
function calculateLifeSpanScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string } {
  const sourceLife = sourceSpecies.lifeSpan;
  const targetLife = targetSpecies.lifeSpan;

  if (sourceLife <= 0 || targetLife <= 0) {
    throw new Error("Invalid life spans");
  }

  const factor = Math.log(targetLife / sourceLife) / Math.log(weightRatio);
  return { factor, description: "Life-span scaling" };
}

/**
 * Calculate hepatic flow scaling factor
 */
function calculateHepaticFlowScaling(
  sourceSpecies: Species,
  targetSpecies: Species,
  weightRatio: number,
): { factor: number; description: string } {
  const sourceFlow = sourceSpecies.hepaticFlow;
  const targetFlow = targetSpecies.hepaticFlow;
  const sourceHepRatio = sourceSpecies.hepaticClearance / sourceFlow;
  const targetHepRatio = targetSpecies.hepaticClearance / targetFlow;

  if (sourceFlow <= 0 || targetFlow <= 0) {
    throw new Error("Invalid hepatic flow values");
  }

  const factor =
    Math.log((targetFlow * targetHepRatio) / (sourceFlow * sourceHepRatio)) /
    Math.log(weightRatio);
  return { factor, description: "Hepatic blood flow scaling" };
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

  const dose = baseDose * (targetBSA / sourceBSA);
  const step = `BSA scaling: ${baseDose} mg × (${targetBSA.toFixed(3)} / ${sourceBSA.toFixed(3)}) = ${dose.toFixed(4)} mg`;

  return { dose, description: "BSA-based scaling", step };
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

    // Prevent division by zero in logarithmic calculations
    if (
      Math.abs(weightRatio - 1) < 0.0001 &&
      method !== "allometric" &&
      method !== "bsa"
    ) {
      warnings.push(
        "Source and target weights are nearly equal. Some scaling methods may be inaccurate",
      );
    }

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
            weightRatio,
            params.scalingExponent || 0.75,
            params.molecularWeight,
          );
          scalingFactor = result.factor;
          methodDescription = result.description;
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
          break;
        }
      }

      // Apply scaling factor
      dose = baseDose * Math.pow(weightRatio, scalingFactor);
      steps.push(
        `Base scaling: ${baseDose} mg × (${weightRatio.toFixed(4)}^${scalingFactor.toFixed(4)}) = ${dose.toFixed(4)} mg`,
      );
    }

    // Apply protein binding adjustment
    if (params.proteinBinding && params.proteinBinding > 0) {
      const proteinBindingFactor = (100 - params.proteinBinding) / 100;
      dose *= proteinBindingFactor;
      steps.push(
        `Protein binding (${params.proteinBinding}%): × ${proteinBindingFactor.toFixed(4)} = ${dose.toFixed(4)} mg`,
      );
    }

    // Apply bioavailability adjustment
    let actualBioavailability = params.bioavailability || 100;
    if (params.bioavailabilityMethod) {
      switch (params.bioavailabilityMethod) {
        case "iv":
          actualBioavailability = 100;
          break;
        case "oral":
          actualBioavailability = 50;
          break;
        case "other":
          actualBioavailability = 75;
          break;
      }
    }

    if (actualBioavailability < 100) {
      const bioavailabilityFactor = actualBioavailability / 100;
      dose /= bioavailabilityFactor;
      steps.push(
        `Bioavailability (${actualBioavailability}%): ÷ ${bioavailabilityFactor.toFixed(4)} = ${dose.toFixed(4)} mg`,
      );
    }

    // Apply kidney function adjustment
    if (
      params.kidneyFunctionMethod === "manual" &&
      params.kidneyFunction !== undefined
    ) {
      const kidneyFactor =
        Math.max(0, Math.min(100, params.kidneyFunction)) / 100;
      dose *= kidneyFactor;
      steps.push(
        `Manual kidney function: × ${kidneyFactor.toFixed(4)} = ${dose.toFixed(4)} mg`,
      );
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
      );

      if (gfr > 0) {
        const fraction = gfrToDoseAdjustment(gfr);
        dose *= fraction;
        steps.push(
          `Cockcroft-Gault GFR (${gfr.toFixed(1)} mL/min): × ${fraction.toFixed(2)} = ${dose.toFixed(4)} mg`,
        );
      } else {
        warnings.push("Invalid GFR calculation inputs");
      }
    }

    // Apply volume of distribution adjustment
    if (params.volumeDistribution && params.volumeDistribution > 0) {
      const volumeFactor = params.volumeDistribution / targetSpecies.weight;
      dose *= volumeFactor;
      steps.push(
        `Volume distribution (${params.volumeDistribution} L/kg): × ${volumeFactor.toFixed(4)} = ${dose.toFixed(4)} mg`,
      );
    }

    // Apply lipophilicity adjustment
    if (params.logP && params.logP !== 0) {
      const lipophilicityFactor = 1 + Math.abs(params.logP) * 0.1;
      dose *= lipophilicityFactor;
      steps.push(
        `Lipophilicity (LogP ${params.logP}): × ${lipophilicityFactor.toFixed(4)} = ${dose.toFixed(4)} mg`,
      );
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

/**
 * Generate chart data points for visualization
 */
export function generateChartData(
  baseWeight: number,
  baseDose: number,
  method: ScalingMethod,
  sourceAnimalKey: string,
  params: Partial<CalculationParameters> = {},
  numPoints: number = 50,
): any[] {
  const points: any[] = [];
  const minWeight = 0.01;
  const maxWeight = 1000;

  // Add actual animal data points
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

  // Add interpolated points for smooth curve
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
      // Find closest animal for calculation
      const closestAnimal = Object.entries(SPECIES_DATABASE).reduce(
        (prev, curr) => {
          return Math.abs(curr[1].weight - weight) <
            Math.abs(prev[1].weight - weight)
            ? curr
            : prev;
        },
      )[0];

      const result = calculateDose(
        baseWeight,
        weight,
        baseDose,
        method,
        sourceAnimalKey,
        closestAnimal,
        params,
      );

      if (result.dose > 0 && isFinite(result.dose)) {
        points.push({
          name: `interpolated_${i}`,
          weight,
          dose: result.dose,
          isAnimal: false,
          label: "",
        });
      }
    }
  }

  return points.sort((a, b) => a.weight - b.weight);
}
