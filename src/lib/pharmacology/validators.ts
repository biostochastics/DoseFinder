/**
 * Input validation for pharmacological calculations
 */

import {
  ValidationResult,
  VALIDATION_LIMITS,
  CalculationParameters,
  ScalingMethod,
} from "./types";

export function validateWeight(weight: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(weight) || !isFinite(weight)) {
    errors.push("Weight must be a valid number");
  } else if (weight <= 0) {
    errors.push("Weight must be greater than 0");
  } else if (weight < VALIDATION_LIMITS.weight.min) {
    errors.push(`Weight must be at least ${VALIDATION_LIMITS.weight.min} kg`);
  } else if (weight > VALIDATION_LIMITS.weight.max) {
    errors.push(`Weight must not exceed ${VALIDATION_LIMITS.weight.max} kg`);
  } else if (weight < 0.01) {
    warnings.push(
      "Very small weight detected. Please verify the value is correct",
    );
  } else if (weight > 1000) {
    warnings.push(
      "Very large weight detected. Please verify the value is correct",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateDose(dose: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(dose) || !isFinite(dose)) {
    errors.push("Dose must be a valid number");
  } else if (dose <= 0) {
    errors.push("Dose must be greater than 0");
  } else if (dose < VALIDATION_LIMITS.dose.min) {
    errors.push(`Dose must be at least ${VALIDATION_LIMITS.dose.min} mg`);
  } else if (dose > VALIDATION_LIMITS.dose.max) {
    errors.push(`Dose must not exceed ${VALIDATION_LIMITS.dose.max} mg`);
  } else if (dose < 0.001) {
    warnings.push(
      "Very small dose detected. Consider using micrograms (mcg) instead",
    );
  } else if (dose > 10000) {
    warnings.push(
      "Very large dose detected. Please verify the value is correct",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateProteinBinding(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value) || !isFinite(value)) {
    errors.push("Protein binding must be a valid number");
  } else if (value < VALIDATION_LIMITS.proteinBinding.min) {
    errors.push(`Protein binding cannot be negative`);
  } else if (value > VALIDATION_LIMITS.proteinBinding.max) {
    errors.push(
      `Protein binding cannot exceed ${VALIDATION_LIMITS.proteinBinding.max}%`,
    );
  } else if (value > 95) {
    warnings.push(
      "Very high protein binding (>95%) detected. This will significantly affect the dose",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateBioavailability(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value) || !isFinite(value)) {
    errors.push("Bioavailability must be a valid number");
  } else if (value <= 0) {
    errors.push("Bioavailability must be greater than 0");
  } else if (value < VALIDATION_LIMITS.bioavailability.min) {
    errors.push(
      `Bioavailability must be at least ${VALIDATION_LIMITS.bioavailability.min}%`,
    );
  } else if (value > VALIDATION_LIMITS.bioavailability.max) {
    errors.push(
      `Bioavailability cannot exceed ${VALIDATION_LIMITS.bioavailability.max}%`,
    );
  } else if (value < 10) {
    warnings.push(
      "Very low bioavailability (<10%) detected. This will significantly increase the dose",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateCreatinine(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value) || !isFinite(value)) {
    errors.push("Creatinine must be a valid number");
  } else if (value <= 0) {
    errors.push("Creatinine must be greater than 0");
  } else if (value < VALIDATION_LIMITS.creatinine.min) {
    errors.push(
      `Creatinine must be at least ${VALIDATION_LIMITS.creatinine.min} mg/dL`,
    );
  } else if (value > VALIDATION_LIMITS.creatinine.max) {
    errors.push(
      `Creatinine must not exceed ${VALIDATION_LIMITS.creatinine.max} mg/dL`,
    );
  } else if (value > 2) {
    warnings.push(
      "Elevated creatinine detected. Consider kidney function adjustment",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateAge(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value) || !isFinite(value)) {
    errors.push("Age must be a valid number");
  } else if (value <= 0) {
    errors.push("Age must be greater than 0");
  } else if (value < VALIDATION_LIMITS.age.min) {
    errors.push(`Age must be at least ${VALIDATION_LIMITS.age.min}`);
  } else if (value > VALIDATION_LIMITS.age.max) {
    errors.push(`Age must not exceed ${VALIDATION_LIMITS.age.max} years`);
  } else if (value > 100) {
    warnings.push(
      "Advanced age detected. Consider additional dose adjustments",
    );
  } else if (value < 18) {
    warnings.push("Pediatric age detected. Consider age-appropriate dosing");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateScalingExponent(value: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isNaN(value) || !isFinite(value)) {
    errors.push("Scaling exponent must be a valid number");
  } else if (value < VALIDATION_LIMITS.scalingExponent.min) {
    errors.push(
      `Scaling exponent must be at least ${VALIDATION_LIMITS.scalingExponent.min}`,
    );
  } else if (value > VALIDATION_LIMITS.scalingExponent.max) {
    errors.push(
      `Scaling exponent must not exceed ${VALIDATION_LIMITS.scalingExponent.max}`,
    );
  } else if (value < 0.5 || value > 1.0) {
    warnings.push(
      "Unusual scaling exponent. Standard values are typically between 0.67 and 0.75",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function validateCalculationInputs(
  baseWeight: number,
  targetWeight: number,
  baseDose: number,
  method: ScalingMethod,
  params?: Partial<CalculationParameters>,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate weights
  const baseWeightValidation = validateWeight(baseWeight);
  const targetWeightValidation = validateWeight(targetWeight);
  const doseValidation = validateDose(baseDose);

  errors.push(...baseWeightValidation.errors.map((e) => `Source weight: ${e}`));
  errors.push(
    ...targetWeightValidation.errors.map((e) => `Target weight: ${e}`),
  );
  errors.push(...doseValidation.errors);

  warnings.push(
    ...baseWeightValidation.warnings.map((w) => `Source weight: ${w}`),
  );
  warnings.push(
    ...targetWeightValidation.warnings.map((w) => `Target weight: ${w}`),
  );
  warnings.push(...doseValidation.warnings);

  // Validate optional parameters if provided
  if (params) {
    if (params.proteinBinding !== undefined) {
      const validation = validateProteinBinding(params.proteinBinding);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (params.bioavailability !== undefined) {
      const validation = validateBioavailability(params.bioavailability);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (params.patientCreatinine !== undefined) {
      const validation = validateCreatinine(params.patientCreatinine);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (params.patientAge !== undefined) {
      const validation = validateAge(params.patientAge);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }

    if (params.scalingExponent !== undefined) {
      const validation = validateScalingExponent(params.scalingExponent);
      errors.push(...validation.errors);
      warnings.push(...validation.warnings);
    }
  }

  // Check for potential mathematical issues
  if (
    baseWeight === targetWeight &&
    (method === "brainWeight" ||
      method === "lifeSpan" ||
      method === "hepaticFlow")
  ) {
    warnings.push(
      "Source and target weights are equal. Some scaling methods may produce undefined results",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
