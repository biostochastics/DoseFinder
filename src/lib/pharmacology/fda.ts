/**
 * FDA First-in-Human (FIH) Starting Dose Calculations
 *
 * Implements the FDA 2005 Guidance methodology for calculating Maximum
 * Recommended Starting Dose (MRSD) from animal NOAEL data.
 *
 * Reference: FDA "Guidance for Industry: Estimating the Maximum Safe Starting
 * Dose in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers"
 * (July 2005)
 *
 * FORMULA:
 *   HED (mg/kg) = Animal NOAEL (mg/kg) × (Animal Km / Human Km)
 *   MRSD (mg/kg) = HED / Safety Factor
 */

import {
  FDA_KM_FACTORS,
  FDA_REFERENCE_WEIGHTS,
  SAFETY_FACTOR_GUIDANCE,
  MODALITY_GUIDANCE,
  REGULATORY_REFERENCES,
  FDA_VALIDATED_SPECIES,
  KM_VALIDATION_RANGES,
  type DrugModality,
} from "./constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Input parameters for FIH dose calculation
 */
export interface FihDoseInput {
  /** NOAEL from toxicology study (mg/kg) */
  noael: number;
  /** Animal species from toxicology study */
  animalSpecies: string;
  /** Safety factor to apply (3, 10, 30, or custom) */
  safetyFactor: number;
  /** Drug modality (small molecule or biologic) */
  modality: DrugModality;
  /** Optional: multiple species data for comparison */
  additionalSpeciesData?: Array<{
    species: string;
    noael: number;
  }>;
  /** Optional: human reference weight (default 60 kg) */
  humanWeight?: number;
}

/**
 * Individual calculation step for traceability
 */
export interface CalculationStep {
  /** Step description */
  description: string;
  /** Mathematical formula used */
  formula: string;
  /** Input values */
  values: Record<string, number | string>;
  /** Calculated result */
  result: number;
  /** Result unit */
  unit: string;
}

/**
 * Warning generated during calculation
 */
export interface FihWarning {
  /** Warning code for programmatic handling */
  code: string;
  /** Severity level */
  severity: "info" | "warning" | "critical";
  /** Human-readable message */
  message: string;
  /** Recommended action */
  recommendation?: string;
}

/**
 * Result of FIH dose calculation
 */
export interface FihDoseResult {
  /** Human Equivalent Dose (mg/kg) */
  hed: number;
  /** Maximum Recommended Starting Dose (mg/kg) */
  mrsd: number;
  /** MRSD as total dose for reference human (mg) */
  mrsdTotal: number;
  /** Human reference weight used (kg) */
  humanWeight: number;
  /** Km factor for animal species */
  animalKm: number;
  /** Km factor for human */
  humanKm: number;
  /** Safety factor applied */
  safetyFactor: number;
  /** Step-by-step calculation for traceability */
  steps: CalculationStep[];
  /** Warnings and recommendations */
  warnings: FihWarning[];
  /** Regulatory reference information */
  regulatoryReference: string;
  /** Comparison results from multiple species (if provided) */
  multiSpeciesResults?: Array<{
    species: string;
    noael: number;
    hed: number;
    mrsd: number;
  }>;
  /** Most conservative recommendation */
  recommendedMrsd?: {
    value: number;
    source: string;
    rationale: string;
  };
}

// ============================================================================
// Core Calculation Functions
// ============================================================================

/**
 * Check if a species is in the FDA 2005 Table 1 (validated)
 *
 * @param species - Species identifier
 * @returns true if FDA-validated, false if estimated
 */
export function isFdaValidatedSpecies(species: string): boolean {
  const normalizedSpecies = species.toLowerCase().replace(/\s+/g, "");
  // Normalize FDA_VALIDATED_SPECIES to lowercase for comparison
  return FDA_VALIDATED_SPECIES.some(
    (s) => s.toLowerCase() === normalizedSpecies,
  );
}

/**
 * Get Km factor for a species
 *
 * @param species - Species identifier
 * @returns Km factor or null if not found
 */
export function getKmFactor(species: string): number | null {
  const normalizedSpecies = species.toLowerCase().replace(/\s+/g, "");
  return FDA_KM_FACTORS[normalizedSpecies] ?? null;
}

// ============================================================================
// Km Validation Types and Functions
// ============================================================================

/**
 * Result of Km factor validation
 */
export interface KmValidationResult {
  /** Whether the Km value is valid (within acceptable biological range) */
  isValid: boolean;
  /** Whether the Km value is within species-specific expected range */
  isWithinSpeciesRange: boolean;
  /** Severity of any validation issue */
  severity: "none" | "warning" | "error";
  /** Validation message */
  message: string;
  /** Expected range for the species (if known) */
  expectedRange?: { min: number; max: number; expected: number };
  /** Recommendation for resolving issues */
  recommendation?: string;
}

/**
 * Validate a Km factor for allometric scaling
 *
 * Checks that the Km value falls within biologically plausible ranges
 * based on FDA 2005 Guidance Table 1 values.
 *
 * @param km - Km factor to validate
 * @param species - Optional species for species-specific validation
 * @param isHuman - Whether this is the human Km value
 * @returns Validation result with status and messages
 *
 * @example
 * // Valid mouse Km
 * validateKmFactor(3, 'mouse'); // { isValid: true, ... }
 *
 * // Implausibly low Km
 * validateKmFactor(0.3, 'mouse'); // { isValid: false, severity: 'error', ... }
 *
 * // Km outside expected range but biologically plausible
 * validateKmFactor(10, 'mouse'); // { isValid: true, isWithinSpeciesRange: false, severity: 'warning', ... }
 */
export function validateKmFactor(
  km: number,
  species?: string,
  isHuman: boolean = false,
): KmValidationResult {
  const normalizedSpecies = species?.toLowerCase().replace(/\s+/g, "");

  // Check for basic validity (positive number)
  if (!Number.isFinite(km) || km <= 0) {
    return {
      isValid: false,
      isWithinSpeciesRange: false,
      severity: "error",
      message: `Km factor must be a positive number (received: ${km})`,
      recommendation: "Verify Km value from FDA 2005 Guidance Table 1",
    };
  }

  // Check human Km specifically
  if (isHuman) {
    const expectedHumanKm = KM_VALIDATION_RANGES.HUMAN_KM;
    const tolerance = KM_VALIDATION_RANGES.HUMAN_KM_TOLERANCE;
    const minHumanKm = expectedHumanKm * (1 - tolerance);
    const maxHumanKm = expectedHumanKm * (1 + tolerance);

    if (km < minHumanKm || km > maxHumanKm) {
      return {
        isValid: false,
        isWithinSpeciesRange: false,
        severity: "error",
        message: `Human Km factor ${km} is outside expected range (${minHumanKm.toFixed(1)}-${maxHumanKm.toFixed(1)})`,
        expectedRange: {
          min: minHumanKm,
          max: maxHumanKm,
          expected: expectedHumanKm,
        },
        recommendation: "Human Km should be 37 per FDA 2005 Guidance",
      };
    }

    return {
      isValid: true,
      isWithinSpeciesRange: true,
      severity: "none",
      message: "Human Km factor is valid",
      expectedRange: {
        min: minHumanKm,
        max: maxHumanKm,
        expected: expectedHumanKm,
      },
    };
  }

  // Check global biological plausibility range for animal Km
  const minKm = KM_VALIDATION_RANGES.MIN_ANIMAL_KM;
  const maxKm = KM_VALIDATION_RANGES.MAX_ANIMAL_KM;

  if (km < minKm) {
    return {
      isValid: false,
      isWithinSpeciesRange: false,
      severity: "error",
      message: `Km factor ${km} is below minimum biologically plausible value (${minKm})`,
      recommendation:
        `Km values below ${minKm} are not found in any FDA-validated species. ` +
        "Verify the Km value or species selection. Mouse has the lowest Km at 3.",
    };
  }

  if (km > maxKm) {
    return {
      isValid: false,
      isWithinSpeciesRange: false,
      severity: "error",
      message: `Km factor ${km} is above maximum biologically plausible value (${maxKm})`,
      recommendation:
        `Km values above ${maxKm} exceed all FDA-validated species. ` +
        "Verify the Km value. Mini-pig has the highest animal Km at 35.",
    };
  }

  // If species provided, check species-specific range
  if (normalizedSpecies) {
    const speciesRange = KM_VALIDATION_RANGES.SPECIES_RANGES[normalizedSpecies];

    if (speciesRange) {
      if (km < speciesRange.min || km > speciesRange.max) {
        return {
          isValid: true, // Still biologically plausible, just outside species range
          isWithinSpeciesRange: false,
          severity: "warning",
          message:
            `Km factor ${km} is outside expected range for ${species} ` +
            `(expected: ${speciesRange.min}-${speciesRange.max}, typical: ${speciesRange.expected})`,
          expectedRange: speciesRange,
          recommendation:
            `Verify Km value for ${species}. FDA 2005 Table 1 specifies Km = ${speciesRange.expected}. ` +
            "Document justification if using non-standard Km values.",
        };
      }

      return {
        isValid: true,
        isWithinSpeciesRange: true,
        severity: "none",
        message: `Km factor ${km} is within expected range for ${species}`,
        expectedRange: speciesRange,
      };
    }
  }

  // Valid within global range, no species-specific data
  return {
    isValid: true,
    isWithinSpeciesRange: true, // Can't verify without species data
    severity: "none",
    message: `Km factor ${km} is within biologically plausible range (${minKm}-${maxKm})`,
  };
}

/**
 * Options for HED calculation
 */
export interface HedCalculationOptions {
  /** Species name for species-specific validation */
  species?: string;
  /** Whether to validate Km values (default: false for backward compatibility) */
  validateKm?: boolean;
  /** Whether to throw on invalid Km (default: false, returns NaN instead) */
  throwOnInvalidKm?: boolean;
}

/**
 * Result of HED calculation with validation info
 */
export interface HedCalculationResult {
  /** Calculated HED value (NaN if invalid) */
  hed: number;
  /** Validation result for animal Km */
  animalKmValidation?: KmValidationResult;
  /** Validation result for human Km */
  humanKmValidation?: KmValidationResult;
}

/**
 * Calculate Human Equivalent Dose (HED) from animal NOAEL
 *
 * Formula: HED = NOAEL × (Animal Km / Human Km)
 *
 * This function now includes optional validation of Km factors to ensure
 * they fall within biologically plausible ranges per FDA 2005 Guidance.
 *
 * @param noael - Animal NOAEL in mg/kg
 * @param animalKm - Animal Km factor
 * @param humanKm - Human Km factor (default 37)
 * @param options - Optional validation settings
 * @returns HED in mg/kg (or NaN if validation fails and throwOnInvalidKm is false)
 * @throws Error if validation fails and throwOnInvalidKm is true
 *
 * @example
 * // Basic calculation (no validation)
 * calculateHED(100, 3, 37); // 8.108
 *
 * // With validation
 * calculateHED(100, 0.3, 37, { validateKm: true, throwOnInvalidKm: true });
 * // Throws: "Invalid animal Km factor: Km factor 0.3 is below minimum..."
 */
export function calculateHED(
  noael: number,
  animalKm: number,
  humanKm: number = FDA_KM_FACTORS.human,
  options?: HedCalculationOptions,
): number {
  // Perform validation if requested
  if (options?.validateKm) {
    const animalValidation = validateKmFactor(animalKm, options.species, false);
    const humanValidation = validateKmFactor(humanKm, undefined, true);

    if (!animalValidation.isValid) {
      if (options.throwOnInvalidKm) {
        throw new Error(
          `Invalid animal Km factor: ${animalValidation.message}`,
        );
      }
      return NaN;
    }

    if (!humanValidation.isValid) {
      if (options.throwOnInvalidKm) {
        throw new Error(`Invalid human Km factor: ${humanValidation.message}`);
      }
      return NaN;
    }
  }

  return noael * (animalKm / humanKm);
}

/**
 * Calculate Human Equivalent Dose (HED) with full validation results
 *
 * This is an extended version of calculateHED that returns both the HED
 * and detailed validation information for both Km factors.
 *
 * @param noael - Animal NOAEL in mg/kg
 * @param animalKm - Animal Km factor
 * @param humanKm - Human Km factor (default 37)
 * @param species - Optional species for species-specific validation
 * @returns Object containing HED and validation results
 */
export function calculateHEDWithValidation(
  noael: number,
  animalKm: number,
  humanKm: number = FDA_KM_FACTORS.human,
  species?: string,
): HedCalculationResult {
  const animalKmValidation = validateKmFactor(animalKm, species, false);
  const humanKmValidation = validateKmFactor(humanKm, undefined, true);

  const hed =
    animalKmValidation.isValid && humanKmValidation.isValid
      ? noael * (animalKm / humanKm)
      : NaN;

  return {
    hed,
    animalKmValidation,
    humanKmValidation,
  };
}

/**
 * Calculate Maximum Recommended Starting Dose (MRSD) from HED
 *
 * Formula: MRSD = HED / Safety Factor
 *
 * @param hed - Human Equivalent Dose in mg/kg
 * @param safetyFactor - Safety factor to apply
 * @returns MRSD in mg/kg
 */
export function calculateMRSD(hed: number, safetyFactor: number): number {
  if (safetyFactor <= 0) {
    throw new Error("Safety factor must be greater than zero");
  }
  return hed / safetyFactor;
}

// ============================================================================
// Main FIH Calculation Function
// ============================================================================

/**
 * Calculate FDA FIH Starting Dose with full traceability
 *
 * This function implements the complete FDA 2005 guidance methodology
 * for calculating MRSD from NOAEL data, with comprehensive warnings
 * and multi-species support.
 *
 * @param input - FIH calculation input parameters
 * @returns Complete FIH calculation result with steps and warnings
 *
 * @example
 * const result = calculateFdaFihDose({
 *   noael: 100,
 *   animalSpecies: 'mouse',
 *   safetyFactor: 10,
 *   modality: 'small_molecule'
 * });
 * // result.mrsd = 0.811 mg/kg
 */
export function calculateFdaFihDose(input: FihDoseInput): FihDoseResult {
  const steps: CalculationStep[] = [];
  const warnings: FihWarning[] = [];

  // Default human reference weight
  const humanWeight = input.humanWeight ?? 60;

  // Runtime guard: NOAEL must be positive and finite
  // This is a safety-critical check independent of upstream validation
  if (!Number.isFinite(input.noael) || input.noael <= 0) {
    warnings.push({
      code: "INVALID_NOAEL",
      severity: "critical",
      message: `NOAEL must be a positive number (received: ${input.noael})`,
      recommendation: "Verify NOAEL value from toxicology study data",
    });
    return {
      hed: 0,
      mrsd: 0,
      mrsdTotal: 0,
      humanWeight,
      animalKm: 0,
      humanKm: FDA_KM_FACTORS.human,
      safetyFactor: input.safetyFactor,
      steps: [],
      warnings,
      regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    };
  }

  // Validate and normalize species
  const normalizedSpecies = input.animalSpecies
    .toLowerCase()
    .replace(/\s+/g, "");

  // Get Km factors
  const animalKm = getKmFactor(normalizedSpecies);
  const humanKm = FDA_KM_FACTORS.human;

  // Check if species is supported
  if (animalKm === null) {
    warnings.push({
      code: "UNKNOWN_SPECIES",
      severity: "critical",
      message: `Species "${input.animalSpecies}" not found in FDA Km table`,
      recommendation:
        "Use FDA-validated species: mouse, rat, hamster, guinea pig, rabbit, monkey, dog, mini-pig, or micro-pig",
    });
    // Return empty result for unsupported species
    return {
      hed: 0,
      mrsd: 0,
      mrsdTotal: 0,
      humanWeight,
      animalKm: 0,
      humanKm,
      safetyFactor: input.safetyFactor,
      steps: [],
      warnings,
      regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    };
  }

  // Check if species has estimated (non-FDA) Km value
  if (!isFdaValidatedSpecies(normalizedSpecies)) {
    warnings.push({
      code: "ESTIMATED_SPECIES_KM",
      severity: "warning",
      message: `Species "${input.animalSpecies}" uses estimated Km value (not from FDA 2005 Table 1)`,
      recommendation:
        "Consider using FDA-validated species for regulatory submissions. " +
        "Document rationale for using estimated values.",
    });
  }

  // Validate Km factor for allometric scaling plausibility
  const animalKmValidation = validateKmFactor(
    animalKm,
    normalizedSpecies,
    false,
  );
  const humanKmValidation = validateKmFactor(humanKm, undefined, true);

  // Halt on invalid animal Km - critical safety check
  if (!animalKmValidation.isValid) {
    warnings.push({
      code: "INVALID_ANIMAL_KM",
      severity: "critical",
      message: animalKmValidation.message,
      recommendation: animalKmValidation.recommendation,
    });
    // Return error result - invalid Km would produce meaningless/dangerous doses
    return {
      hed: 0,
      mrsd: 0,
      mrsdTotal: 0,
      humanWeight,
      animalKm,
      humanKm,
      safetyFactor: input.safetyFactor,
      steps: [],
      warnings,
      regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    };
  } else if (!animalKmValidation.isWithinSpeciesRange) {
    // Valid but outside expected species range - warn but continue
    warnings.push({
      code: "KM_OUTSIDE_SPECIES_RANGE",
      severity: "warning",
      message: animalKmValidation.message,
      recommendation: animalKmValidation.recommendation,
    });
  }

  // Halt on invalid human Km - critical safety check
  if (!humanKmValidation.isValid) {
    warnings.push({
      code: "INVALID_HUMAN_KM",
      severity: "critical",
      message: humanKmValidation.message,
      recommendation: humanKmValidation.recommendation,
    });
    // Return error result - invalid human Km would produce meaningless/dangerous doses
    return {
      hed: 0,
      mrsd: 0,
      mrsdTotal: 0,
      humanWeight,
      animalKm,
      humanKm,
      safetyFactor: input.safetyFactor,
      steps: [],
      warnings,
      regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    };
  }

  // Check modality and add appropriate warnings
  const modalityInfo = MODALITY_GUIDANCE[input.modality];
  if (modalityInfo.warning) {
    warnings.push({
      code: "BIOLOGIC_MABEL_REQUIRED",
      severity: input.modality === "biologic" ? "warning" : "critical",
      message: modalityInfo.warning,
      recommendation: `Consider ${modalityInfo.approach}. Reference: ${modalityInfo.reference}`,
    });
  }

  // Validate safety factor - must be ≥1 (halt calculation, not just warn)
  if (input.safetyFactor < 1) {
    warnings.push({
      code: "INVALID_SAFETY_FACTOR",
      severity: "critical",
      message: "Safety factor must be ≥1",
      recommendation: "Use standard safety factors: 3, 10, 30, or 100",
    });
    // Return error result - safety factor <1 would produce dangerously inflated doses
    return {
      hed: 0,
      mrsd: 0,
      mrsdTotal: 0,
      humanWeight,
      animalKm: animalKm ?? 0,
      humanKm,
      safetyFactor: input.safetyFactor,
      steps: [],
      warnings,
      regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    };
  }

  // Add safety factor guidance
  const sfGuidance = SAFETY_FACTOR_GUIDANCE[input.safetyFactor];
  if (!sfGuidance && input.safetyFactor !== 1) {
    warnings.push({
      code: "CUSTOM_SAFETY_FACTOR",
      severity: "info",
      message: `Using non-standard safety factor of ${input.safetyFactor}`,
      recommendation:
        "Document justification for non-standard safety factor selection",
    });
  }

  // Step 1: Identify animal Km
  steps.push({
    description: `Identify Km factor for ${input.animalSpecies}`,
    formula: "Km = Body Weight (kg) / Body Surface Area (m²)",
    values: {
      species: input.animalSpecies,
      referenceWeight: FDA_REFERENCE_WEIGHTS[normalizedSpecies] ?? "N/A",
    },
    result: animalKm,
    unit: "",
  });

  // Step 2: Identify human Km
  steps.push({
    description: "Identify Km factor for human (60 kg reference)",
    formula: "Km = 60 kg / 1.62 m²",
    values: {
      referenceWeight: 60,
      referenceBSA: 1.62,
    },
    result: humanKm,
    unit: "",
  });

  // Step 3: Calculate HED
  const hed = calculateHED(input.noael, animalKm, humanKm);
  steps.push({
    description: "Calculate Human Equivalent Dose (HED)",
    formula: "HED = NOAEL × (Animal Km / Human Km)",
    values: {
      noael: input.noael,
      animalKm,
      humanKm,
    },
    result: hed,
    unit: "mg/kg",
  });

  // Step 4: Apply safety factor
  const mrsd = calculateMRSD(hed, input.safetyFactor);
  steps.push({
    description: "Calculate Maximum Recommended Starting Dose (MRSD)",
    formula: "MRSD = HED / Safety Factor",
    values: {
      hed,
      safetyFactor: input.safetyFactor,
    },
    result: mrsd,
    unit: "mg/kg",
  });

  // Step 5: Calculate total dose for reference human
  const mrsdTotal = mrsd * humanWeight;
  steps.push({
    description: `Calculate total dose for ${humanWeight} kg human`,
    formula: "Total Dose = MRSD × Human Weight",
    values: {
      mrsd,
      humanWeight,
    },
    result: mrsdTotal,
    unit: "mg",
  });

  // Process additional species data if provided
  let multiSpeciesResults:
    | Array<{ species: string; noael: number; hed: number; mrsd: number }>
    | undefined;
  let recommendedMrsd:
    { value: number; source: string; rationale: string } | undefined;

  if (input.additionalSpeciesData && input.additionalSpeciesData.length > 0) {
    multiSpeciesResults = [];

    // Add primary species
    multiSpeciesResults.push({
      species: input.animalSpecies,
      noael: input.noael,
      hed,
      mrsd,
    });

    // Calculate for additional species with NOAEL validation
    for (const speciesData of input.additionalSpeciesData) {
      // Validate additional species NOAEL (must be positive and finite)
      if (!Number.isFinite(speciesData.noael) || speciesData.noael <= 0) {
        warnings.push({
          code: "INVALID_ADDITIONAL_NOAEL",
          severity: "warning",
          message: `Additional species "${speciesData.species}" has invalid NOAEL (${speciesData.noael}); excluded from comparison`,
          recommendation: "NOAEL must be a positive number",
        });
        continue; // Skip this species - don't corrupt the conservative selection
      }

      const speciesKm = getKmFactor(speciesData.species);
      if (speciesKm) {
        const speciesHed = calculateHED(speciesData.noael, speciesKm, humanKm);
        const speciesMrsd = calculateMRSD(speciesHed, input.safetyFactor);

        // Verify calculated values are valid before adding
        if (
          Number.isFinite(speciesHed) &&
          Number.isFinite(speciesMrsd) &&
          speciesMrsd > 0
        ) {
          multiSpeciesResults.push({
            species: speciesData.species,
            noael: speciesData.noael,
            hed: speciesHed,
            mrsd: speciesMrsd,
          });
        } else {
          warnings.push({
            code: "INVALID_ADDITIONAL_CALCULATION",
            severity: "warning",
            message: `Calculation for "${speciesData.species}" produced invalid result; excluded from comparison`,
            recommendation: "Verify input values for this species",
          });
        }
      } else {
        warnings.push({
          code: "UNKNOWN_ADDITIONAL_SPECIES",
          severity: "warning",
          message: `Additional species "${speciesData.species}" not found in FDA Km table`,
          recommendation: "Verify species identifier or provide Km factor",
        });
      }
    }

    // Find most conservative (lowest) MRSD
    if (multiSpeciesResults.length > 0) {
      const mostConservative = multiSpeciesResults.reduce((min, current) =>
        current.mrsd < min.mrsd ? current : min,
      );

      recommendedMrsd = {
        value: mostConservative.mrsd,
        source: mostConservative.species,
        rationale:
          `Most conservative MRSD based on ${mostConservative.species} data ` +
          `(NOAEL: ${mostConservative.noael} mg/kg)`,
      };

      // Add warning if there's significant variation between species
      const maxMrsd = Math.max(...multiSpeciesResults.map((r) => r.mrsd));
      const minMrsd = Math.min(...multiSpeciesResults.map((r) => r.mrsd));
      if (maxMrsd / minMrsd > 3) {
        warnings.push({
          code: "SPECIES_VARIATION",
          severity: "warning",
          message: `>3-fold variation in MRSD between species (${minMrsd.toFixed(3)} - ${maxMrsd.toFixed(3)} mg/kg)`,
          recommendation:
            "Investigate species differences and consider using most sensitive species",
        });
      }
    }
  }

  // Add general warnings
  if (input.noael > 1000) {
    warnings.push({
      code: "HIGH_NOAEL",
      severity: "info",
      message: "NOAEL >1000 mg/kg is unusually high",
      recommendation:
        "Verify NOAEL value and consider dose-limiting toxicities",
    });
  }

  if (hed > 100) {
    warnings.push({
      code: "HIGH_HED",
      severity: "info",
      message: "HED >100 mg/kg may indicate limited systemic exposure concerns",
      recommendation:
        "Consider practical dosing constraints and formulation limitations",
    });
  }

  return {
    hed,
    mrsd,
    mrsdTotal,
    humanWeight,
    animalKm,
    humanKm,
    safetyFactor: input.safetyFactor,
    steps,
    warnings,
    regulatoryReference: REGULATORY_REFERENCES.FDA_2005.title,
    multiSpeciesResults,
    recommendedMrsd,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all FDA-validated species for FIH calculations
 *
 * Only returns species that are directly from FDA 2005 Guidance Table 1.
 * Does not include estimated/extrapolated species to ensure regulatory accuracy.
 *
 * @returns Array of FDA-validated species with their Km factors
 */
export function getSupportedSpecies(): Array<{
  id: string;
  name: string;
  km: number;
  isFdaValidated: boolean;
}> {
  // Species name formatting map for better display
  // NOTE: Keys are lowercase to match FDA_VALIDATED_SPECIES normalization
  const displayNames: Record<string, string> = {
    mouse: "Mouse",
    rat: "Rat",
    hamster: "Hamster",
    guineapig: "Guinea Pig",
    rabbit: "Rabbit",
    monkey: "Monkey (NHP)",
    dog: "Dog",
    minipig: "Mini-pig (40 kg)",
    micropig: "Micro-pig (20 kg)",
  };

  // Only return FDA-validated species (exclude human and estimated species)
  return FDA_VALIDATED_SPECIES.filter((id) => id !== "human").map((id) => ({
    id,
    name: displayNames[id] || id.charAt(0).toUpperCase() + id.slice(1),
    km: FDA_KM_FACTORS[id],
    isFdaValidated: true,
  }));
}

/**
 * Get safety factor options with guidance
 *
 * @returns Array of safety factor options
 */
export function getSafetyFactorOptions(): Array<{
  value: number;
  label: string;
  criteria: string;
}> {
  return Object.entries(SAFETY_FACTOR_GUIDANCE).map(([value, guidance]) => ({
    value: parseInt(value),
    label: `${value}× - ${guidance.criteria.substring(0, 50)}...`,
    criteria: guidance.criteria,
  }));
}

/**
 * Validate input parameters before calculation
 *
 * @param input - Input parameters to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateFihInput(input: Partial<FihDoseInput>): string[] {
  const errors: string[] = [];

  if (input.noael === undefined || input.noael <= 0) {
    errors.push("NOAEL must be a positive number");
  }

  if (!input.animalSpecies) {
    errors.push("Animal species is required");
  }

  if (input.safetyFactor !== undefined && input.safetyFactor < 1) {
    errors.push("Safety factor must be at least 1");
  }

  if (!input.modality) {
    errors.push("Drug modality is required");
  }

  return errors;
}

/**
 * Format FIH result for display
 *
 * @param result - FIH calculation result
 * @returns Formatted string summary
 */
export function formatFihResultSummary(result: FihDoseResult): string {
  const lines = [
    `Human Equivalent Dose (HED): ${result.hed.toFixed(4)} mg/kg`,
    `Maximum Recommended Starting Dose (MRSD): ${result.mrsd.toFixed(4)} mg/kg`,
    `Total Dose for ${result.humanWeight} kg human: ${result.mrsdTotal.toFixed(2)} mg`,
    `Safety Factor Applied: ${result.safetyFactor}×`,
  ];

  if (result.recommendedMrsd) {
    lines.push(
      `\nRecommended MRSD: ${result.recommendedMrsd.value.toFixed(4)} mg/kg`,
    );
    lines.push(`Source: ${result.recommendedMrsd.source}`);
    lines.push(`Rationale: ${result.recommendedMrsd.rationale}`);
  }

  if (result.warnings.length > 0) {
    lines.push("\nWarnings:");
    result.warnings.forEach((w) => {
      lines.push(`  [${w.severity.toUpperCase()}] ${w.message}`);
    });
  }

  return lines.join("\n");
}
