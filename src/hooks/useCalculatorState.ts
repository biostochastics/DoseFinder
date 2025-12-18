import { useState, useCallback, useMemo, useReducer } from "react";
import { SPECIES_DATABASE } from "@/lib/pharmacology/species";
import {
  calculateDose as calculateDoseLib,
  generateChartData,
  calculateCockcroftGFR,
} from "@/lib/pharmacology/calculations";
import {
  CalculationResult,
  ScalingMethod,
  ChartDataPoint,
  PatientSex,
  BioavailabilityMethod,
  KidneyFunctionMethod,
  CreatinineUnit,
  BIOAVAILABILITY_DEFAULTS,
} from "@/lib/pharmacology/types";

/**
 * Helper function to get bioavailability value for a given method
 * Uses literature-based defaults from BIOAVAILABILITY_DEFAULTS
 */
function getBioavailabilityForMethod(
  method: BioavailabilityMethod,
  manualValue: number,
): number {
  if (method === "manual") {
    return manualValue;
  }
  const defaultData = BIOAVAILABILITY_DEFAULTS[method];
  return defaultData?.value ?? 100;
}

// Extended calculation steps with final dose for dilution
interface CalculationStepsWithDilution extends CalculationResult {
  calculatedDose: number;
  finalDose: number;
}

// Extended chart data point with optional diluted dose
interface ExtendedChartDataPoint extends ChartDataPoint {
  dilutedDose?: number;
}

interface CalculatorState {
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  scalingMethod: ScalingMethod;
  scalingExponent: string;
  customExponentValue: number;
  showDilution: boolean;
  dilutionFactor: string;
  bioavailability: number;
  bioavailabilityMethod: BioavailabilityMethod;
  kidneyFunctionMethod: KidneyFunctionMethod;
  kidneyFunction: number;
  fractionExcretedRenal: number; // fe (0-1)
  patientAge: number;
  patientCreatinine: number;
  creatinineUnit: CreatinineUnit;
  patientSex: PatientSex;
}

type CalculatorAction =
  | { type: "SET_SOURCE_ANIMAL"; payload: string }
  | { type: "SET_TARGET_ANIMAL"; payload: string }
  | { type: "SET_SOURCE_WEIGHT"; payload: number }
  | { type: "SET_TARGET_WEIGHT"; payload: number }
  | { type: "SET_BASE_DOSE"; payload: number }
  | { type: "SET_SCALING_METHOD"; payload: ScalingMethod }
  | { type: "SET_SCALING_EXPONENT"; payload: string }
  | { type: "SET_CUSTOM_EXPONENT_VALUE"; payload: number }
  | { type: "SET_DILUTION"; payload: boolean }
  | { type: "SET_DILUTION_FACTOR"; payload: string }
  | { type: "SET_BIOAVAILABILITY"; payload: number }
  | { type: "SET_BIOAVAILABILITY_METHOD"; payload: BioavailabilityMethod }
  | { type: "SET_KIDNEY_FUNCTION_METHOD"; payload: KidneyFunctionMethod }
  | { type: "SET_KIDNEY_FUNCTION"; payload: number }
  | { type: "SET_FRACTION_EXCRETED_RENAL"; payload: number }
  | { type: "SET_PATIENT_AGE"; payload: number }
  | { type: "SET_PATIENT_CREATININE"; payload: number }
  | { type: "SET_CREATININE_UNIT"; payload: CreatinineUnit }
  | { type: "SET_PATIENT_SEX"; payload: PatientSex }
  | { type: "RESET_ALL" };

const initialState: CalculatorState = {
  sourceAnimal: "mouse",
  targetAnimal: "human",
  sourceWeight: 0.02,
  targetWeight: 70,
  baseDose: 1,
  scalingMethod: "allometric",
  scalingExponent: "0.75",
  customExponentValue: 0.75,
  showDilution: false,
  dilutionFactor: "1",
  bioavailability: 100,
  bioavailabilityMethod: "manual",
  kidneyFunctionMethod: "none",
  kidneyFunction: 100,
  fractionExcretedRenal: 1.0, // Default: assume 100% renal clearance
  patientAge: 40,
  patientCreatinine: 1,
  creatinineUnit: "mg/dL",
  patientSex: "male",
};

function calculatorReducer(
  state: CalculatorState,
  action: CalculatorAction,
): CalculatorState {
  switch (action.type) {
    case "SET_SOURCE_ANIMAL":
      return {
        ...state,
        sourceAnimal: action.payload,
        sourceWeight: SPECIES_DATABASE[action.payload].weight,
      };
    case "SET_TARGET_ANIMAL":
      return {
        ...state,
        targetAnimal: action.payload,
        targetWeight: SPECIES_DATABASE[action.payload].weight,
      };
    case "SET_SOURCE_WEIGHT":
      return { ...state, sourceWeight: action.payload };
    case "SET_TARGET_WEIGHT":
      return { ...state, targetWeight: action.payload };
    case "SET_BASE_DOSE":
      return { ...state, baseDose: action.payload };
    case "SET_SCALING_METHOD":
      return { ...state, scalingMethod: action.payload };
    case "SET_SCALING_EXPONENT":
      return { ...state, scalingExponent: action.payload };
    case "SET_CUSTOM_EXPONENT_VALUE":
      return { ...state, customExponentValue: action.payload };
    case "SET_DILUTION":
      return { ...state, showDilution: action.payload };
    case "SET_DILUTION_FACTOR":
      return { ...state, dilutionFactor: action.payload };
    case "SET_BIOAVAILABILITY":
      return { ...state, bioavailability: action.payload };
    case "SET_BIOAVAILABILITY_METHOD":
      return { ...state, bioavailabilityMethod: action.payload };
    case "SET_KIDNEY_FUNCTION_METHOD":
      return { ...state, kidneyFunctionMethod: action.payload };
    case "SET_KIDNEY_FUNCTION":
      return { ...state, kidneyFunction: action.payload };
    case "SET_FRACTION_EXCRETED_RENAL":
      return { ...state, fractionExcretedRenal: action.payload };
    case "SET_PATIENT_AGE":
      return { ...state, patientAge: action.payload };
    case "SET_PATIENT_CREATININE":
      return { ...state, patientCreatinine: action.payload };
    case "SET_CREATININE_UNIT":
      return { ...state, creatinineUnit: action.payload };
    case "SET_PATIENT_SEX":
      return { ...state, patientSex: action.payload };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

export function useCalculatorState() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const [calculationSteps, setCalculationSteps] =
    useState<CalculationStepsWithDilution | null>(null);
  const [chartData, setChartData] = useState<ExtendedChartDataPoint[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const animals = useMemo(() => SPECIES_DATABASE, []);

  const calculateDose = useCallback((): CalculationResult | null => {
    // Use stored customExponentValue when "custom" is selected, otherwise parse the preset value
    const exponentValue =
      state.scalingExponent === "custom"
        ? state.customExponentValue
        : parseFloat(state.scalingExponent);

    // Use centralized GFR calculation from calculations.ts
    const gfr = calculateCockcroftGFR(
      state.targetWeight,
      state.patientAge,
      state.patientCreatinine,
      state.patientSex,
      state.creatinineUnit,
    );
    const calculatedKidneyFunction = Math.min(100, Math.max(0, gfr));

    const result = calculateDoseLib(
      state.sourceWeight,
      state.targetWeight,
      state.baseDose,
      state.scalingMethod,
      state.sourceAnimal,
      state.targetAnimal,
      {
        scalingExponent: exponentValue,
        bioavailability: getBioavailabilityForMethod(
          state.bioavailabilityMethod,
          state.bioavailability,
        ),
        bioavailabilityMethod: state.bioavailabilityMethod,
        kidneyFunctionMethod: state.kidneyFunctionMethod,
        kidneyFunction:
          state.kidneyFunctionMethod === "none"
            ? 100
            : state.kidneyFunctionMethod === "manual"
              ? state.kidneyFunction
              : calculatedKidneyFunction,
        fractionExcretedRenal: state.fractionExcretedRenal,
        patientAge: state.patientAge,
        patientCreatinine: state.patientCreatinine,
        creatinineUnit: state.creatinineUnit,
        patientSex: state.patientSex,
      },
    );

    const dilutionFactorNum = parseFloat(state.dilutionFactor) || 1;
    const finalDose = result.dose * dilutionFactorNum;

    setCalculationSteps({
      ...result,
      calculatedDose: result.dose,
      finalDose: finalDose,
      steps: result.steps || [],
    });

    const newChartData = generateChartData(
      state.sourceWeight,
      state.baseDose,
      state.scalingMethod,
      state.sourceAnimal,
      {
        scalingExponent: exponentValue,
      },
    );

    if (state.showDilution && dilutionFactorNum !== 1) {
      newChartData.forEach(
        (point: ChartDataPoint & { dilutedDose?: number }) => {
          point.dilutedDose = point.dose * dilutionFactorNum;
        },
      );
    }

    setChartData(newChartData);
    return result;
  }, [state]);

  const copyToClipboard = useCallback(() => {
    if (!calculationSteps) return;

    // Determine effective bioavailability based on method using literature defaults
    const effectiveBioavailability = getBioavailabilityForMethod(
      state.bioavailabilityMethod,
      state.bioavailability,
    );

    // Build advanced parameters section
    const advancedParams: string[] = [];

    // Scaling parameters
    const exponentValue =
      state.scalingExponent === "custom"
        ? state.customExponentValue
        : parseFloat(state.scalingExponent);
    advancedParams.push(`Scaling Method: ${state.scalingMethod}`);
    advancedParams.push(`Scaling Exponent: ${exponentValue}`);

    // Bioavailability
    if (effectiveBioavailability < 100) {
      advancedParams.push(
        `Bioavailability: ${effectiveBioavailability}% (${state.bioavailabilityMethod})`,
      );
      advancedParams.push(
        `Bioavailability Adjustment: ${(100 / effectiveBioavailability).toFixed(2)}x`,
      );
    }

    // Kidney function
    if (state.kidneyFunctionMethod !== "none") {
      advancedParams.push(
        `Kidney Function Method: ${state.kidneyFunctionMethod}`,
      );
      if (state.kidneyFunctionMethod === "manual") {
        advancedParams.push(`Kidney Function: ${state.kidneyFunction}%`);
      } else if (state.kidneyFunctionMethod === "cockcroft") {
        advancedParams.push(`Patient Age: ${state.patientAge} years`);
        advancedParams.push(
          `Serum Creatinine: ${state.patientCreatinine} ${state.creatinineUnit}`,
        );
        advancedParams.push(`Patient Sex: ${state.patientSex}`);
      }
      advancedParams.push(
        `Fraction Excreted Renal (fe): ${state.fractionExcretedRenal.toFixed(2)}`,
      );
    }

    const text = `DoseFinder Calculation Results
Generated: ${new Date().toLocaleString()}

Basic Parameters:
-----------------
Source: ${animals[state.sourceAnimal].name} (${state.sourceWeight} kg)
Target: ${animals[state.targetAnimal].name} (${state.targetWeight} kg)
Base Dose: ${state.baseDose} mg/kg
Calculated Dose: ${calculationSteps.calculatedDose.toFixed(4)} mg/kg
${
  state.showDilution && parseFloat(state.dilutionFactor) !== 1
    ? `Dilution Factor: ${state.dilutionFactor}x
Final Dose (with dilution): ${calculationSteps.finalDose.toFixed(4)} mg/kg`
    : ""
}

Advanced Parameters:
-------------------
${advancedParams.join("\n")}

Uncertainty Range:
-----------------
Lower bound (0.7x): ${(calculationSteps.calculatedDose * 0.7).toFixed(4)} mg/kg
Upper bound (1.3x): ${(calculationSteps.calculatedDose * 1.3).toFixed(4)} mg/kg

Calculation Steps:
-----------------
${calculationSteps.steps.join("\n")}

DISCLAIMER:
-----------
FOR RESEARCH AND EDUCATIONAL USE ONLY. This calculation is provided as an
estimation tool and should not be used for clinical dosing without proper
validation. Always verify calculations with experimental data and consult
appropriate regulatory guidelines. Consider drug-specific properties, disease
state, and individual variability when applying these estimates.
`;

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [calculationSteps, state, animals]);

  const exportResults = useCallback(() => {
    if (!calculationSteps) return;

    // Determine effective bioavailability based on method using literature defaults
    const effectiveBioavailability = getBioavailabilityForMethod(
      state.bioavailabilityMethod,
      state.bioavailability,
    );

    // Determine effective kidney function
    const effectiveKidneyFunction =
      state.kidneyFunctionMethod === "none"
        ? 100
        : state.kidneyFunctionMethod === "manual"
          ? state.kidneyFunction
          : null; // Cockcroft-Gault calculated value

    // Build scaling method description
    const exponentValue =
      state.scalingExponent === "custom"
        ? state.customExponentValue
        : parseFloat(state.scalingExponent);

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

    const exportText = `DoseFinder Dose Calculation Report
=====================================
Generated: ${new Date().toLocaleString()}
Export ID: ${timestamp}

BASIC PARAMETERS
================
Source Species: ${animals[state.sourceAnimal].name}
Source Weight: ${state.sourceWeight} kg

Target Species: ${animals[state.targetAnimal].name}
Target Weight: ${state.targetWeight} kg

Base Dose (Known Dose): ${state.baseDose} mg/kg

SCALING CONFIGURATION
=====================
Scaling Method: ${state.scalingMethod}
Scaling Exponent: ${exponentValue}
${state.scalingExponent === "custom" ? "(Custom exponent value)" : state.scalingExponent === "0.75" ? "(Standard metabolic scaling)" : state.scalingExponent === "0.67" ? "(Surface area scaling)" : state.scalingExponent === "1.0" ? "(Linear scaling)" : ""}

ADVANCED PARAMETERS
===================
Bioavailability:
  Method: ${state.bioavailabilityMethod}
  Value: ${effectiveBioavailability}%
  ${effectiveBioavailability < 100 ? `Adjustment Factor: ${(100 / effectiveBioavailability).toFixed(2)}x` : "No adjustment applied"}

Kidney Function:
  Method: ${state.kidneyFunctionMethod}
${state.kidneyFunctionMethod === "none" ? "  No kidney function adjustment applied" : ""}${
      state.kidneyFunctionMethod === "manual"
        ? `  Value: ${effectiveKidneyFunction}%
  Fraction Excreted Renal (fe): ${state.fractionExcretedRenal.toFixed(2)}`
        : ""
    }${
      state.kidneyFunctionMethod === "cockcroft"
        ? `  Cockcroft-Gault Parameters:
    Patient Age: ${state.patientAge} years
    Serum Creatinine: ${state.patientCreatinine} ${state.creatinineUnit}
    Patient Sex: ${state.patientSex}
  Fraction Excreted Renal (fe): ${state.fractionExcretedRenal.toFixed(2)}`
        : ""
    }

DILUTION SETTINGS
=================
Dilution Enabled: ${state.showDilution ? "Yes" : "No"}
${state.showDilution && parseFloat(state.dilutionFactor) !== 1 ? `Dilution Factor: ${state.dilutionFactor}x` : ""}

RESULTS
=======
Calculated Dose: ${calculationSteps.calculatedDose.toFixed(4)} mg/kg
${state.showDilution && parseFloat(state.dilutionFactor) !== 1 ? `Final Dose (with dilution): ${calculationSteps.finalDose.toFixed(4)} mg/kg` : ""}

Absolute Dose for Target:
  Per kg: ${calculationSteps.calculatedDose.toFixed(4)} mg/kg
  Total (for ${state.targetWeight} kg): ${(calculationSteps.calculatedDose * state.targetWeight).toFixed(4)} mg

Uncertainty Range (±30%):
  Lower Bound: ${(calculationSteps.calculatedDose * 0.7).toFixed(4)} mg/kg
  Upper Bound: ${(calculationSteps.calculatedDose * 1.3).toFixed(4)} mg/kg

CALCULATION STEPS
=================
${calculationSteps.steps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

DISCLAIMER
==========
FOR RESEARCH AND EDUCATIONAL USE ONLY. This calculation is provided as an
estimation tool and should NOT be used for clinical dosing without proper
validation. Always verify calculations with experimental data and consult
appropriate regulatory guidelines. Consider drug-specific pharmacokinetic
properties, disease state, and individual variability when applying these
estimates. Cross-species dose scaling provides estimates that MUST be verified
through appropriate preclinical and clinical studies before human use.
`;

    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dosefinder-calculation-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [calculationSteps, state, animals]);

  const resultDose = calculationSteps?.calculatedDose || 0;
  const uncertaintyRange = {
    lower: resultDose * 0.7,
    upper: resultDose * 1.3,
  };

  // Handler for setting custom exponent value from UI input
  const setCustomExponentValue = useCallback((value: number) => {
    dispatch({ type: "SET_CUSTOM_EXPONENT_VALUE", payload: value });
  }, []);

  return {
    state,
    dispatch,
    calculationSteps,
    chartData,
    copySuccess,
    calculateDose,
    copyToClipboard,
    exportResults,
    animals,
    resultDose,
    uncertaintyRange,
    resetAll: () => dispatch({ type: "RESET_ALL" }),
    setCustomExponentValue,
  };
}
