import { useState, useCallback, useMemo, useReducer } from "react";
import { SPECIES_DATABASE } from "@/lib/pharmacology/species";
import {
  calculateDose as calculateDoseLib,
  generateChartData,
} from "@/lib/pharmacology/calculations";

interface CalculatorState {
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  scalingMethod: string;
  scalingExponent: string;
  showDilution: boolean;
  dilutionFactor: string;
  proteinBinding: number;
  bioavailability: number;
  bioavailabilityMethod: string;
  kidneyFunctionMethod: string;
  kidneyFunction: number;
  patientAge: number;
  patientCreatinine: number;
  patientSex: string;
  volumeDistribution: number;
  molecularWeight: number;
  logP: number;
}

type CalculatorAction =
  | { type: "SET_SOURCE_ANIMAL"; payload: string }
  | { type: "SET_TARGET_ANIMAL"; payload: string }
  | { type: "SET_SOURCE_WEIGHT"; payload: number }
  | { type: "SET_TARGET_WEIGHT"; payload: number }
  | { type: "SET_BASE_DOSE"; payload: number }
  | { type: "SET_SCALING_METHOD"; payload: string }
  | { type: "SET_SCALING_EXPONENT"; payload: string }
  | { type: "SET_DILUTION"; payload: boolean }
  | { type: "SET_DILUTION_FACTOR"; payload: string }
  | { type: "SET_PROTEIN_BINDING"; payload: number }
  | { type: "SET_BIOAVAILABILITY"; payload: number }
  | { type: "SET_BIOAVAILABILITY_METHOD"; payload: string }
  | { type: "SET_KIDNEY_FUNCTION_METHOD"; payload: string }
  | { type: "SET_KIDNEY_FUNCTION"; payload: number }
  | { type: "SET_PATIENT_AGE"; payload: number }
  | { type: "SET_PATIENT_CREATININE"; payload: number }
  | { type: "SET_PATIENT_SEX"; payload: string }
  | { type: "SET_VOLUME_DISTRIBUTION"; payload: number }
  | { type: "SET_MOLECULAR_WEIGHT"; payload: number }
  | { type: "SET_LOG_P"; payload: number }
  | { type: "RESET_ALL" };

const initialState: CalculatorState = {
  sourceAnimal: "mouse",
  targetAnimal: "human",
  sourceWeight: 0.02,
  targetWeight: 70,
  baseDose: 1,
  scalingMethod: "allometric",
  scalingExponent: "0.75",
  showDilution: false,
  dilutionFactor: "1",
  proteinBinding: 0,
  bioavailability: 100,
  bioavailabilityMethod: "manual",
  kidneyFunctionMethod: "none",
  kidneyFunction: 100,
  patientAge: 40,
  patientCreatinine: 1,
  patientSex: "male",
  volumeDistribution: 0,
  molecularWeight: 0,
  logP: 0,
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
    case "SET_DILUTION":
      return { ...state, showDilution: action.payload };
    case "SET_DILUTION_FACTOR":
      return { ...state, dilutionFactor: action.payload };
    case "SET_PROTEIN_BINDING":
      return { ...state, proteinBinding: action.payload };
    case "SET_BIOAVAILABILITY":
      return { ...state, bioavailability: action.payload };
    case "SET_BIOAVAILABILITY_METHOD":
      return { ...state, bioavailabilityMethod: action.payload };
    case "SET_KIDNEY_FUNCTION_METHOD":
      return { ...state, kidneyFunctionMethod: action.payload };
    case "SET_KIDNEY_FUNCTION":
      return { ...state, kidneyFunction: action.payload };
    case "SET_PATIENT_AGE":
      return { ...state, patientAge: action.payload };
    case "SET_PATIENT_CREATININE":
      return { ...state, patientCreatinine: action.payload };
    case "SET_PATIENT_SEX":
      return { ...state, patientSex: action.payload };
    case "SET_VOLUME_DISTRIBUTION":
      return { ...state, volumeDistribution: action.payload };
    case "SET_MOLECULAR_WEIGHT":
      return { ...state, molecularWeight: action.payload };
    case "SET_LOG_P":
      return { ...state, logP: action.payload };
    case "RESET_ALL":
      return initialState;
    default:
      return state;
  }
}

export function useCalculatorState() {
  const [state, dispatch] = useReducer(calculatorReducer, initialState);
  const [calculationSteps, setCalculationSteps] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  const animals = useMemo(() => SPECIES_DATABASE, []);

  const calculateDose = useCallback((): any => {
    const customExponent =
      state.scalingExponent === "custom"
        ? parseFloat(prompt("Enter custom exponent (0.5 - 1.0):") || "0.75")
        : parseFloat(state.scalingExponent);

    // Calculate GFR inline to avoid circular dependency
    const sexFactor = state.patientSex === "female" ? 0.85 : 1;
    const gfr =
      (((140 - state.patientAge) * state.targetWeight) /
        (72 * state.patientCreatinine)) *
      sexFactor;
    const calculatedKidneyFunction = Math.min(100, Math.max(0, gfr));

    const result = calculateDoseLib(
      state.sourceWeight,
      state.targetWeight,
      state.baseDose,
      state.scalingMethod as any,
      state.sourceAnimal,
      state.targetAnimal,
      {
        scalingExponent: customExponent,
        proteinBinding: state.proteinBinding,
        bioavailability:
          state.bioavailabilityMethod === "iv"
            ? 100
            : state.bioavailabilityMethod === "oral"
              ? 50
              : state.bioavailabilityMethod === "other"
                ? 75
                : state.bioavailability,
        bioavailabilityMethod: state.bioavailabilityMethod as any,
        kidneyFunctionMethod: state.kidneyFunctionMethod as any,
        kidneyFunction:
          state.kidneyFunctionMethod === "none"
            ? 100
            : state.kidneyFunctionMethod === "manual"
              ? state.kidneyFunction
              : calculatedKidneyFunction,
        patientAge: state.patientAge,
        patientCreatinine: state.patientCreatinine,
        patientSex: state.patientSex as any,
        volumeDistribution: state.volumeDistribution,
        molecularWeight: state.molecularWeight,
        logP: state.logP,
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
      state.scalingMethod as any,
      state.sourceAnimal,
      {
        scalingExponent: customExponent,
      },
    );

    if (state.showDilution && dilutionFactorNum !== 1) {
      newChartData.forEach((point: any) => {
        point.dilutedDose = point.dose * dilutionFactorNum;
      });
    }

    setChartData(newChartData);
    return result;
  }, [state]);

  const copyToClipboard = useCallback(() => {
    if (!calculationSteps) return;

    const text = `
Dose Calculation Results:
Source: ${animals[state.sourceAnimal].name} (${state.sourceWeight} kg)
Target: ${animals[state.targetAnimal].name} (${state.targetWeight} kg)
Base Dose: ${state.baseDose} mg/kg
Calculated Dose: ${calculationSteps.calculatedDose.toFixed(4)} mg/kg
${
  state.showDilution && parseFloat(state.dilutionFactor) !== 1
    ? `Final Dose (with dilution): ${calculationSteps.finalDose.toFixed(4)} mg/kg`
    : ""
}

Calculation Steps:
${calculationSteps.steps.join("\n")}
`;

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  }, [calculationSteps, state, animals]);

  const resultDose = calculationSteps?.calculatedDose || 0;
  const uncertaintyRange = {
    lower: resultDose * 0.7,
    upper: resultDose * 1.3,
  };

  return {
    state,
    dispatch,
    calculationSteps,
    chartData,
    copySuccess,
    calculateDose,
    copyToClipboard,
    animals,
    resultDose,
    uncertaintyRange,
    resetAll: () => dispatch({ type: "RESET_ALL" }),
  };
}
