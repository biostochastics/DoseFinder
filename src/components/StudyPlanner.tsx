import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash, Plus, Calculator } from "lucide-react";

interface ArmConfig {
  name: string;
  species: string;
  subjects: number;
  weight: number;
  armType: "treatment" | "placebo" | "comparator";
  doseLevel: number;
  doseUnit: "mg" | "mg/kg" | "mcg" | "mcg/kg";
  duration: number;
  durationUnit: "days" | "weeks" | "months";
  frequency:
    | "once"
    | "twice"
    | "thrice"
    | "weekly"
    | "biweekly"
    | "monthly"
    | "custom";
  customFrequency: {
    doses: number;
    period: number;
    unit: "days" | "weeks" | "months";
  };
  // For comparator arms
  comparatorDetails?: {
    name: string;
    concentration: number;
    concentrationUnit: string;
  };
}

interface DilutionStep {
  factor: number;
  vehicle: "saline" | "water" | "pbs" | "custom";
  customVehicle?: string;
}

interface ArmRequirement {
  name: string;
  subjects: number;
  dosePerSubject: number;
  doseUnit: string;
  totalDoses: number;
  productRequired: number;
  productUnit: string;
  adminVolume: number;
  dilutionSteps: {
    startVolume: number;
    addedVolume: number;
    vehicle: string;
    finalConcentration: number;
    concentrationUnit: string;
  }[];
}

interface Animal {
  name: string;
  weight: number;
  brainWeight: number;
  lifeSpan: number;
  hepaticFlow: number;
  allometricExponent: number;
  hepaticClearance: number;
  renalClearance: number;
  bsa: number;
}

interface CalculationStep {
  weightRatio: number;
  scaledFactor: number;
  calculatedDose: number;
  finalDose: number;
  steps: string[];
}

interface StudyPlannerProps {
  animals: Record<string, Animal>;
  calculationSteps: CalculationStep | null;
  targetAnimal: string;
  targetWeight: number;
  densityFactor?: number; // g/mL for percentage conversions
}

export function StudyPlanner({
  animals,
  calculationSteps,
  targetAnimal,
  targetWeight,
  densityFactor = 1, // Default density factor to 1 g/mL
}: StudyPlannerProps) {
  // Study Design State
  const [studyType, setStudyType] = useState<string>("preclinical");
  const [numArms, setNumArms] = useState<number>(1);
  const [overageFactor, setOverageFactor] = useState<number>(15);
  const [stabilityBuffer, setStabilityBuffer] = useState<number>(7);

  // Arms State
  const [arms, setArms] = useState<ArmConfig[]>([
    {
      name: "Dose Group 1",
      species: "mouse",
      subjects: 10,
      weight: 0.02,
      armType: "treatment",
      doseLevel: 10,
      doseUnit: "mg/kg",
      duration: 14,
      durationUnit: "days",
      frequency: "once",
      customFrequency: {
        doses: 1,
        period: 1,
        unit: "days",
      },
    },
  ]);

  // Formulation & Dilution State
  const [stockConcentration, setStockConcentration] = useState<number>(10);
  const [stockConcentrationUnit, setStockConcentrationUnit] =
    useState<string>("mg/ml");
  const [adminRoute, setAdminRoute] = useState<string>("oral");
  const [useDilutions, setUseDilutions] = useState<boolean>(false);
  const [dilutions, setDilutions] = useState<DilutionStep[]>([
    {
      factor: 10,
      vehicle: "saline",
    },
  ]);

  // Results State
  const [armRequirements, setArmRequirements] = useState<ArmRequirement[]>([]);
  const [totalProductRequired, setTotalProductRequired] = useState<
    number | null
  >(null);
  const [totalProductUnit, setTotalProductUnit] = useState<string>("mg");
  const [totalDoses, setTotalDoses] = useState<number | null>(null);

  // Update species weight when species changes
  // We use a ref to avoid infinite loops
  const firstRender = React.useRef(true);
  useEffect(() => {
    // Skip on first render to avoid overriding initial state
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    // Use functional state update to avoid dependency on arms
    setArms((prevArms) =>
      prevArms.map((arm) => {
        if (animals[arm.species]) {
          return {
            ...arm,
            weight: animals[arm.species].weight,
          };
        }
        return arm;
      }),
    );
  }, [animals]); // Only depend on animals, not arms

  // Counter map for efficient name generation
  const nameCounters = {
    treatment: 1,
    placebo: 1,
    comparator: 1,
  };

  // Generate a unique name for an arm based on type
  const generateUniqueName = (
    type: "treatment" | "placebo" | "comparator",
  ): string => {
    const count = nameCounters[type]++;
    return type === "treatment"
      ? `Dose Group ${count}`
      : `${type.charAt(0).toUpperCase() + type.slice(1)} ${count}`;
  };

  // Add a new arm
  const addArm = (
    type: "treatment" | "placebo" | "comparator" = "treatment",
  ) => {
    // Create a name based on type using our counter system
    let newName = generateUniqueName(type);

    // Check if we already have an arm with this name
    let counter = 1;
    while (arms.some((arm) => arm.name === newName)) {
      newName =
        type === "treatment"
          ? `Dose Group ${counter}`
          : `${type.charAt(0).toUpperCase() + type.slice(1)} ${counter}`;
      counter++;
    }

    const newArm: ArmConfig = {
      name: newName,
      species: "mouse",
      subjects: 10,
      weight: animals["mouse"].weight,
      armType: type,
      doseLevel: type === "placebo" ? 0 : 10,
      doseUnit: "mg/kg",
      duration: 14,
      durationUnit: "days",
      frequency: "once",
      customFrequency: {
        doses: 1,
        period: 1,
        unit: "days",
      },
    };

    // Add comparator details if it's a comparator arm
    if (type === "comparator") {
      newArm.comparatorDetails = {
        name: "Standard Comparator",
        concentration: 10,
        concentrationUnit: "mg/ml",
      };
    }

    setArms([...arms, newArm]);
    setNumArms(numArms + 1);
  };

  // Remove an arm
  const removeArm = (index: number) => {
    if (arms.length > 1) {
      const updatedArms = [...arms];
      updatedArms.splice(index, 1);
      setArms(updatedArms);
      setNumArms(numArms - 1);
    }
  };

  // Update arm properties
  const updateArm = (index: number, property: keyof ArmConfig, value: any) => {
    const updatedArms = [...arms];

    // Create updated arm object
    const updatedArm = {
      ...updatedArms[index],
      [property]: value,
    };

    // If species changes, update weight
    if (property === "species" && animals[value]) {
      updatedArm.weight = animals[value].weight;
    }

    // If armType changes, handle special cases
    if (property === "armType") {
      // Set dose to 0 for placebo
      if (value === "placebo") {
        updatedArm.doseLevel = 0;
      }

      // Add comparator details if changing to comparator
      if (value === "comparator" && !updatedArm.comparatorDetails) {
        updatedArm.comparatorDetails = {
          name: "Standard Comparator",
          concentration: 10,
          concentrationUnit: "mg/ml",
        };
      }
    }

    // Update the array
    updatedArms[index] = updatedArm;
    setArms(updatedArms);
  };

  // Update nested properties in arm
  const updateArmNestedValue = (
    armIndex: number,
    nestedObj: string,
    property: string,
    value: any,
  ) => {
    const updatedArms = [...arms];
    updatedArms[armIndex] = {
      ...updatedArms[armIndex],
      [nestedObj]: {
        ...(updatedArms[armIndex][nestedObj as keyof ArmConfig] as Record<
          string,
          any
        >),
        [property]: value,
      },
    };
    setArms(updatedArms);
  };

  // Add dilution step
  const addDilution = () => {
    setDilutions([
      ...dilutions,
      {
        factor: 10,
        vehicle: "saline",
      },
    ]);
  };

  // Remove dilution step
  const removeDilution = (index: number) => {
    const updatedDilutions = [...dilutions];
    updatedDilutions.splice(index, 1);
    setDilutions(updatedDilutions);
  };

  // Update dilution properties
  const updateDilution = (
    index: number,
    property: keyof DilutionStep,
    value: any,
  ) => {
    const updatedDilutions = [...dilutions];
    updatedDilutions[index] = {
      ...updatedDilutions[index],
      [property]: value,
    };
    setDilutions(updatedDilutions);
  };

  /**
   * Calculates total doses needed for a study arm by multiplying:
   * - Number of subjects
   * - Treatment duration (converted to days)
   * - Doses per day (based on frequency)
   *
   * This calculation accounts for various dosing schedules including daily,
   * weekly, monthly, and custom frequencies to determine the total number
   * of doses that will be needed for the entire study duration.
   */
  const calculateTotalDoses = (arm: ArmConfig): number => {
    const daysPerUnit: Record<string, number> = {
      days: 1,
      weeks: 7,
      months: 30.44, // Average month length for more accurate calculations
    };

    // Calculate total days
    const totalDays = arm.duration * daysPerUnit[arm.durationUnit];

    // Calculate doses per day
    let dosesPerDay = 0;
    if (arm.frequency === "once") dosesPerDay = 1;
    else if (arm.frequency === "twice") dosesPerDay = 2;
    else if (arm.frequency === "thrice") dosesPerDay = 3;
    else if (arm.frequency === "weekly") dosesPerDay = 1 / 7;
    else if (arm.frequency === "biweekly") dosesPerDay = 1 / 14;
    else if (arm.frequency === "monthly")
      dosesPerDay = 1 / 30.44; // Use consistent month length
    else if (arm.frequency === "custom") {
      const periodInDays =
        arm.customFrequency.period * daysPerUnit[arm.customFrequency.unit];
      dosesPerDay = arm.customFrequency.doses / periodInDays;
    }

    return Math.ceil(totalDays * dosesPerDay * arm.subjects);
  };

  // Calculate total product required for an arm
  const calculateArmRequirement = (
    arm: ArmConfig,
    stockConc: number,
    stockConcUnit: string,
    dilutionSteps: DilutionStep[],
  ): ArmRequirement => {
    const totalDoses = calculateTotalDoses(arm);

    // Special handling for placebo and comparator arms
    if (arm.armType === "placebo") {
      // Placebo arms don't require active product
      return {
        name: arm.name,
        subjects: arm.subjects,
        dosePerSubject: 0,
        doseUnit: "mg",
        totalDoses,
        productRequired: 0,
        productUnit: "mg",
        adminVolume: 0, // This will be calculated based on matched treatment arm
        dilutionSteps: [],
      };
    }

    if (arm.armType === "comparator") {
      // Default values if comparatorDetails is missing
      const comparatorDetails = arm.comparatorDetails || {
        name: "Standard Comparator",
        concentration: 10,
        concentrationUnit: "mg/ml",
      };
      // For comparator arms, we use the provided comparator details
      // but still calculate the volumes
      let comparatorConcMg = comparatorDetails.concentration;
      if (comparatorDetails.concentrationUnit === "mcg/ml")
        comparatorConcMg /= 1000;
      else if (comparatorDetails.concentrationUnit === "percent")
        comparatorConcMg = comparatorDetails.concentration * 10;

      // Convert dose to mg
      let dosePerSubjectMg = arm.doseLevel;
      if (arm.doseUnit === "mg/kg") dosePerSubjectMg *= arm.weight;
      else if (arm.doseUnit === "mcg") dosePerSubjectMg /= 1000;
      else if (arm.doseUnit === "mcg/kg")
        dosePerSubjectMg = (arm.doseLevel * arm.weight) / 1000;

      // Calculate administration volume per dose
      const adminVolume = dosePerSubjectMg / comparatorConcMg;

      return {
        name: `${arm.name} (${comparatorDetails.name})`,
        subjects: arm.subjects,
        dosePerSubject: dosePerSubjectMg,
        doseUnit: "mg",
        totalDoses,
        productRequired: 0, // We don't track the comparator in the main product calculation
        productUnit: "mg",
        adminVolume,
        dilutionSteps: [],
      };
    }

    // Normal treatment arm calculation
    // Convert dose to mg
    let dosePerSubjectMg = arm.doseLevel;
    if (arm.doseUnit === "mg/kg") dosePerSubjectMg *= arm.weight;
    else if (arm.doseUnit === "mcg") dosePerSubjectMg /= 1000;
    else if (arm.doseUnit === "mcg/kg")
      dosePerSubjectMg = (arm.doseLevel * arm.weight) / 1000;

    // Basic product calculation
    let productRequired = dosePerSubjectMg * totalDoses;

    // Convert stock concentration to mg/mL
    let stockConcMg = stockConc;
    if (stockConcUnit === "mcg/ml") {
      stockConcMg /= 1000;
    } else if (stockConcUnit === "percent") {
      // Use density factor for percentage conversions
      stockConcMg = stockConc * 10 * densityFactor; // Convert % to mg/mL using density
    } else if (stockConcUnit === "g/ml") {
      stockConcMg = stockConc * 1000;
    }

    // Calculate administration volume per dose
    const adminVolume = dosePerSubjectMg / stockConcMg;

    // Process dilution steps
    const calculatedDilutionSteps = [];
    let currentConc = stockConcMg;
    let currentVolume =
      (productRequired / currentConc) * (1 + overageFactor / 100);

    for (const dilution of dilutionSteps) {
      const startVolume = currentVolume;
      const addedVolume = startVolume * (dilution.factor - 1);
      currentConc = currentConc / dilution.factor;
      currentVolume = startVolume + addedVolume;

      calculatedDilutionSteps.push({
        startVolume,
        addedVolume,
        vehicle: dilution.vehicle,
        finalConcentration: currentConc,
        concentrationUnit: "mg/mL",
      });
    }

    return {
      name: arm.name,
      subjects: arm.subjects,
      dosePerSubject: dosePerSubjectMg,
      doseUnit: "mg",
      totalDoses,
      productRequired: productRequired * (1 + overageFactor / 100), // Add overage
      productUnit: "mg",
      adminVolume,
      dilutionSteps: calculatedDilutionSteps,
    };
  };

  // Calculate total requirements using a single reduce operation for better performance
  const calculateRequirements = () => {
    // Use a single reduce operation to avoid multiple array iterations
    const { armReqs, totalProduct, totalDoses } = arms.reduce(
      (acc, arm) => {
        const req = calculateArmRequirement(
          arm,
          stockConcentration,
          stockConcentrationUnit,
          dilutions,
        );
        return {
          armReqs: [...acc.armReqs, req],
          totalProduct:
            acc.totalProduct +
            (arm.armType === "treatment" ? req.productRequired : 0),
          totalDoses: acc.totalDoses + req.totalDoses,
        };
      },
      { armReqs: [] as ArmRequirement[], totalProduct: 0, totalDoses: 0 },
    );

    // Convert to appropriate units
    let finalTotal = totalProduct;
    let finalUnit = "mg";

    if (finalTotal >= 1000) {
      finalTotal /= 1000;
      finalUnit = "g";
    }

    setArmRequirements(armReqs);
    setTotalProductRequired(finalTotal);
    setTotalProductUnit(finalUnit);
    setTotalDoses(totalDoses);
  };

  // Copy dose from calculator
  const copyDoseFromCalculator = (index: number) => {
    if (!calculationSteps) {
      // Show error message to user
      alert(
        "No calculator data available to copy. Please calculate a dose first.",
      );
      return;
    }

    const updatedArms = [...arms];
    const targetDose = calculationSteps.calculatedDose;

    // Update the arm with the calculated dose
    updatedArms[index] = {
      ...updatedArms[index],
      species: targetAnimal,
      weight: targetWeight,
      doseLevel: targetDose,
      doseUnit: "mg",
    };

    setArms(updatedArms);
  };

  // Create a new arm with calculator dose
  const createArmWithCalculatorDose = () => {
    if (!calculationSteps) {
      // Show error message to user
      alert("No calculator data available. Please calculate a dose first.");
      return;
    }

    const targetDose = calculationSteps.calculatedDose;

    // Create a new arm with the calculator dose
    const newArm: ArmConfig = {
      name: `${animals[targetAnimal]?.name || targetAnimal} Dose`,
      species: targetAnimal,
      subjects: 10,
      weight: targetWeight,
      armType: "treatment",
      doseLevel: targetDose,
      doseUnit: "mg",
      duration: 14,
      durationUnit: "days",
      frequency: "once",
      customFrequency: {
        doses: 1,
        period: 1,
        unit: "days",
      },
    };

    setArms([...arms, newArm]);
    setNumArms(numArms + 1);
  };

  // Handle export function
  const exportStudyPlan = () => {
    if (armRequirements.length === 0) {
      return; // Nothing to export
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const studyPlan = `DoseFinder Study Planner Report
Generated: ${new Date().toLocaleString()}

Study Design:
-----------
Study Type: ${studyType}
Number of Arms: ${numArms}
Overage Factor: ${overageFactor}%
Stability Buffer: ${stabilityBuffer} days

Formulation:
-----------
Stock Concentration: ${stockConcentration} ${stockConcentrationUnit}
Administration Route: ${adminRoute}
${useDilutions ? `Dilution Steps: ${dilutions.length}` : ""}

Arm Requirements:
----------------
${armRequirements
  .map((arm, index) => {
    const armType = arms[index].armType;
    let details = `
Arm: ${arm.name} (${armType === "treatment" ? "Treatment" : armType === "placebo" ? "Placebo" : "Comparator"})
Subjects: ${arm.subjects}
`;

    if (armType === "placebo") {
      details += `Dose per Subject: N/A (Placebo)
Total Doses: ${arm.totalDoses}
Product Required: N/A (Placebo)
`;
    } else if (armType === "comparator") {
      details += `Dose per Subject: ${arm.dosePerSubject.toFixed(3)} ${arm.doseUnit}
Total Doses: ${arm.totalDoses}
Product: ${arms[index].comparatorDetails?.name || "Comparator"} (${arms[index].comparatorDetails?.concentration || 0} ${arms[index].comparatorDetails?.concentrationUnit || ""})
Administration Volume: ${arm.adminVolume.toFixed(2)} mL
`;
    } else {
      details += `Dose per Subject: ${arm.dosePerSubject.toFixed(3)} ${arm.doseUnit}
Total Doses: ${arm.totalDoses}
Product Required: ${arm.productRequired.toFixed(3)} ${arm.productUnit}
Administration Volume: ${arm.adminVolume.toFixed(2)} mL

${
  useDilutions && arm.dilutionSteps.length > 0
    ? `Dilution Steps:
${arm.dilutionSteps
  .map(
    (
      step,
      i,
    ) => `  ${i + 1}. Start with ${step.startVolume.toFixed(2)} mL, add ${step.addedVolume.toFixed(2)} mL of ${step.vehicle}
     Final concentration: ${step.finalConcentration.toFixed(3)} ${step.concentrationUnit}`,
  )
  .join("\n")}`
    : ""
}
`;
    }

    return details;
  })
  .join("\n")}

Summary:
--------
Total Doses to Prepare: ${totalDoses}
Total Active Compound Required: ${totalProductRequired?.toFixed(3)} ${totalProductUnit}
Treatment Arms: ${arms.filter((arm) => arm.armType === "treatment").length}
Placebo Arms: ${arms.filter((arm) => arm.armType === "placebo").length}
Comparator Arms: ${arms.filter((arm) => arm.armType === "comparator").length}`;

    const blob = new Blob([studyPlan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dosefinder-study-plan-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Study Design Section */}
      <Card>
        <CardHeader>
          <CardTitle>Study Design</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Study Type Selection */}
            <div>
              <Label>Study Type</Label>
              <Select value={studyType} onValueChange={setStudyType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select study type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preclinical">Preclinical</SelectItem>
                  <SelectItem value="phase1">Clinical Phase I</SelectItem>
                  <SelectItem value="phase2">Clinical Phase II</SelectItem>
                  <SelectItem value="phase3">Clinical Phase III</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Number of Arms */}
            <div>
              <Label>Number of Arms</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={numArms}
                    onChange={(e) => setNumArms(Number(e.target.value))}
                    min={1}
                    className="w-20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("treatment")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Treatment Arm
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("placebo")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Placebo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("comparator")}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Comparator
                  </Button>
                  {calculationSteps && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={createArmWithCalculatorDose}
                      className="bg-primary/10"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      From Calculator
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Extra Parameters */}
          <div className="mt-4">
            <Label>Additional Parameters</Label>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-sm">Overage Factor (%)</Label>
                <Input
                  type="number"
                  value={overageFactor}
                  onChange={(e) => setOverageFactor(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-20"
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Extra product to account for losses
                </p>
              </div>
              <div>
                <Label className="text-sm">Stability Buffer (days)</Label>
                <Input
                  type="number"
                  value={stabilityBuffer}
                  onChange={(e) => setStabilityBuffer(Number(e.target.value))}
                  min={0}
                  className="w-20"
                  placeholder="7"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Additional days of supply as buffer
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Arm Configuration Section */}
      {arms.map((arm, index) => (
        <Card key={index} className="mt-4">
          <CardHeader className="py-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-md">
                  Arm {index + 1}: {arm.name}
                </CardTitle>
                <CardDescription>
                  {arm.armType === "treatment"
                    ? "Treatment"
                    : arm.armType === "placebo"
                      ? "Placebo"
                      : "Comparator"}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                {calculationSteps && arm.armType !== "placebo" && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        Copy Calc. Dose
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3">
                      <div className="space-y-2">
                        <h4 className="font-medium">Calculator Dose</h4>
                        <p className="text-sm">
                          Species: {animals[targetAnimal]?.name || targetAnimal}
                          , {targetWeight} kg
                        </p>
                        <p className="text-sm">
                          Calculated dose:{" "}
                          {calculationSteps?.calculatedDose.toFixed(3)} mg (
                          {(
                            calculationSteps?.calculatedDose / targetWeight
                          ).toFixed(3)}{" "}
                          mg/kg)
                        </p>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => {
                            copyDoseFromCalculator(index);
                            document.body.click(); // Close popover
                          }}
                        >
                          Apply to this arm
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeArm(index)}
                  disabled={arms.length <= 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Arm Name */}
              <div>
                <Label>Arm Name</Label>
                <Input
                  value={arm.name}
                  onChange={(e) => updateArm(index, "name", e.target.value)}
                  placeholder="e.g., Low Dose"
                />
              </div>

              {/* Arm Type */}
              <div>
                <Label>Arm Type</Label>
                <Select
                  value={arm.armType}
                  onValueChange={(val) =>
                    updateArm(index, "armType", val as ArmConfig["armType"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select arm type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="treatment">Treatment</SelectItem>
                    <SelectItem value="placebo">Placebo</SelectItem>
                    <SelectItem value="comparator">Comparator</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Species/Population */}
              <div>
                <Label>Species/Population</Label>
                <Select
                  value={arm.species}
                  onValueChange={(val) => updateArm(index, "species", val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(animals).map(([key, animal]) => (
                      <SelectItem key={key} value={key}>
                        {(animal as any).name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subjects per Arm */}
              <div>
                <Label>Number of Subjects</Label>
                <Input
                  type="number"
                  value={arm.subjects}
                  onChange={(e) =>
                    updateArm(index, "subjects", Number(e.target.value))
                  }
                  min={1}
                />
              </div>

              {/* Weight */}
              <div>
                <Label>Average Weight (kg)</Label>
                <Input
                  type="number"
                  value={arm.weight}
                  onChange={(e) =>
                    updateArm(index, "weight", Number(e.target.value))
                  }
                  min={0.001}
                  step="0.001"
                />
              </div>

              {/* Dose Level - not shown for placebo */}
              {arm.armType !== "placebo" && (
                <div>
                  <Label>Dose Level</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={arm.doseLevel}
                      onChange={(e) =>
                        updateArm(index, "doseLevel", Number(e.target.value))
                      }
                      min={0}
                      step="0.01"
                      className="w-24"
                    />
                    <Select
                      value={arm.doseUnit}
                      onValueChange={(val) =>
                        updateArm(
                          index,
                          "doseUnit",
                          val as ArmConfig["doseUnit"],
                        )
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg">mg</SelectItem>
                        <SelectItem value="mg/kg">mg/kg</SelectItem>
                        <SelectItem value="mcg">mcg</SelectItem>
                        <SelectItem value="mcg/kg">mcg/kg</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Treatment Duration */}
              <div>
                <Label>Treatment Duration</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={arm.duration}
                    onChange={(e) =>
                      updateArm(index, "duration", Number(e.target.value))
                    }
                    min={1}
                    className="w-24"
                  />
                  <Select
                    value={arm.durationUnit}
                    onValueChange={(val) =>
                      updateArm(
                        index,
                        "durationUnit",
                        val as ArmConfig["durationUnit"],
                      )
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Comparator Details - Only shown for comparator arms */}
            {arm.armType === "comparator" && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-medium mb-3">Comparator Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Comparator Name</Label>
                    <Input
                      value={
                        arm.comparatorDetails?.name || "Standard Comparator"
                      }
                      onChange={(e) => {
                        const updatedArms = [...arms];
                        const details = arm.comparatorDetails || {
                          name: "Standard Comparator",
                          concentration: 10,
                          concentrationUnit: "mg/ml",
                        };

                        updatedArms[index] = {
                          ...updatedArms[index],
                          comparatorDetails: {
                            ...details,
                            name: e.target.value,
                          },
                        };
                        setArms(updatedArms);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Concentration</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={arm.comparatorDetails?.concentration || 10}
                        onChange={(e) => {
                          const updatedArms = [...arms];
                          const details = arm.comparatorDetails || {
                            name: "Standard Comparator",
                            concentration: 10,
                            concentrationUnit: "mg/ml",
                          };

                          updatedArms[index] = {
                            ...updatedArms[index],
                            comparatorDetails: {
                              ...details,
                              concentration: Number(e.target.value),
                            },
                          };
                          setArms(updatedArms);
                        }}
                        className="w-24"
                      />
                      <Select
                        value={
                          arm.comparatorDetails?.concentrationUnit || "mg/ml"
                        }
                        onValueChange={(val) => {
                          const updatedArms = [...arms];
                          const details = arm.comparatorDetails || {
                            name: "Standard Comparator",
                            concentration: 10,
                            concentrationUnit: "mg/ml",
                          };

                          updatedArms[index] = {
                            ...updatedArms[index],
                            comparatorDetails: {
                              ...details,
                              concentrationUnit: val,
                            },
                          };
                          setArms(updatedArms);
                        }}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mg/ml">mg/mL</SelectItem>
                          <SelectItem value="mcg/ml">μg/mL</SelectItem>
                          <SelectItem value="percent">% (w/v)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Dosing Schedule */}
            <div className="mt-4">
              <Label>Dosing Schedule</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-sm">Frequency</Label>
                  <Select
                    value={arm.frequency}
                    onValueChange={(val) =>
                      updateArm(
                        index,
                        "frequency",
                        val as ArmConfig["frequency"],
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once daily</SelectItem>
                      <SelectItem value="twice">Twice daily</SelectItem>
                      <SelectItem value="thrice">Three times daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {arm.frequency === "custom" && (
                  <div>
                    <Label className="text-sm">Doses per period</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={arm.customFrequency.doses}
                        onChange={(e) =>
                          updateArmNestedValue(
                            index,
                            "customFrequency",
                            "doses",
                            Number(e.target.value),
                          )
                        }
                        min={1}
                        className="w-16"
                      />
                      <span>per</span>
                      <Input
                        type="number"
                        value={arm.customFrequency.period}
                        onChange={(e) =>
                          updateArmNestedValue(
                            index,
                            "customFrequency",
                            "period",
                            Number(e.target.value),
                          )
                        }
                        min={1}
                        className="w-16"
                      />
                      <Select
                        value={arm.customFrequency.unit}
                        onValueChange={(val) =>
                          updateArmNestedValue(
                            index,
                            "customFrequency",
                            "unit",
                            val,
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="days">Days</SelectItem>
                          <SelectItem value="weeks">Weeks</SelectItem>
                          <SelectItem value="months">Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Formulation & Dilution Section */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Formulation & Dilution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Drug Concentration */}
            <div>
              <Label>Stock Concentration</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={stockConcentration}
                  onChange={(e) =>
                    setStockConcentration(Number(e.target.value))
                  }
                  min={0}
                  step="0.01"
                  className="w-24"
                />
                <Select
                  value={stockConcentrationUnit}
                  onValueChange={setStockConcentrationUnit}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg/ml">mg/mL</SelectItem>
                    <SelectItem value="mg/g">mg/g</SelectItem>
                    <SelectItem value="mcg/ml">μg/mL</SelectItem>
                    <SelectItem value="percent">% (w/v)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Administration Route */}
            <div>
              <Label>Administration Route</Label>
              <Select value={adminRoute} onValueChange={setAdminRoute}>
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oral">Oral</SelectItem>
                  <SelectItem value="iv">Intravenous</SelectItem>
                  <SelectItem value="ip">Intraperitoneal</SelectItem>
                  <SelectItem value="sc">Subcutaneous</SelectItem>
                  <SelectItem value="im">Intramuscular</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dilution Workflow */}
            <div className="col-span-2 mt-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="useDilutions"
                  checked={useDilutions}
                  onCheckedChange={setUseDilutions}
                />
                <Label htmlFor="useDilutions">Use Dilution Sequence</Label>
              </div>

              {useDilutions && (
                <div className="space-y-4 mt-4 border p-4 rounded-md">
                  <Label>Dilution Steps</Label>

                  {dilutions.map((dilution, dIndex) => (
                    <div
                      key={dIndex}
                      className="grid grid-cols-4 gap-4 items-center"
                    >
                      <div className="col-span-1">
                        <Label className="text-sm">Step {dIndex + 1}</Label>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={dilution.factor}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const MAX_DILUTION_FACTOR = 1000; // Maximum allowed dilution factor
                              if (
                                !isNaN(value) &&
                                value >= 1 &&
                                value <= MAX_DILUTION_FACTOR
                              ) {
                                updateDilution(dIndex, "factor", value);
                              } else {
                                // Show warning for invalid values
                                alert(
                                  `Dilution factor must be between 1 and ${MAX_DILUTION_FACTOR}`,
                                );
                              }
                            }}
                            min={1}
                            step="0.01"
                            className="w-24"
                          />
                          <span>X using</span>
                          <Select
                            value={dilution.vehicle}
                            onValueChange={(val) =>
                              updateDilution(
                                dIndex,
                                "vehicle",
                                val as DilutionStep["vehicle"],
                              )
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="saline">Saline</SelectItem>
                              <SelectItem value="water">Water</SelectItem>
                              <SelectItem value="pbs">PBS</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDilution(dIndex)}
                          disabled={dilutions.length <= 1}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" size="sm" onClick={addDilution}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Dilution Step
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Calculate Button */}
          <div className="mt-6 flex justify-center">
            <Button onClick={calculateRequirements} className="w-1/2">
              <Calculator className="h-4 w-4 mr-2" />
              Calculate Requirements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {totalProductRequired !== null && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Study Material Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Total Study Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">
                  Total Active Compound Required
                </h3>
                <div className="text-2xl font-bold text-primary">
                  {totalProductRequired.toFixed(3)} {totalProductUnit}
                  <div className="text-sm text-muted-foreground">
                    Including {overageFactor}% overage factor
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Total Doses to Prepare</h3>
                <div className="text-2xl font-bold text-orange-500">
                  {totalDoses}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportStudyPlan}
                  className="mt-2"
                >
                  Export Study Plan
                </Button>
              </div>
            </div>

            {/* Per Arm Breakdown */}
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Breakdown by Study Arm</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arm</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Dose per Subject</TableHead>
                    <TableHead>Total Doses</TableHead>
                    <TableHead>Product Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {armRequirements.map((req, index) => {
                    const armType = arms[index].armType;

                    return (
                      <TableRow
                        key={index}
                        className={
                          armType === "placebo"
                            ? "bg-secondary/30"
                            : armType === "comparator"
                              ? "bg-muted/30"
                              : ""
                        }
                      >
                        <TableCell>{req.name}</TableCell>
                        <TableCell>
                          {armType === "treatment"
                            ? "Treatment"
                            : armType === "placebo"
                              ? "Placebo"
                              : "Comparator"}
                        </TableCell>
                        <TableCell>{req.subjects}</TableCell>
                        <TableCell>
                          {armType === "placebo"
                            ? "N/A"
                            : `${req.dosePerSubject.toFixed(3)} ${req.doseUnit}`}
                        </TableCell>
                        <TableCell>{req.totalDoses}</TableCell>
                        <TableCell>
                          {armType === "treatment"
                            ? `${req.productRequired.toFixed(3)} ${req.productUnit}`
                            : armType === "placebo"
                              ? "N/A"
                              : `Separate from main product`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Dosing Solution Preparation */}
            {useDilutions && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">
                  Dosing Solution Preparation
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {armRequirements.map((req, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>
                        Arm {index + 1}: {req.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Step</TableHead>
                              <TableHead>Starting Volume</TableHead>
                              <TableHead>Add Vehicle</TableHead>
                              <TableHead>Final Concentration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {req.dilutionSteps.map((step, sIndex) => (
                              <TableRow key={sIndex}>
                                <TableCell>{sIndex + 1}</TableCell>
                                <TableCell>
                                  {step.startVolume.toFixed(2)} mL
                                </TableCell>
                                <TableCell>
                                  {step.addedVolume.toFixed(2)} mL of{" "}
                                  {step.vehicle}
                                </TableCell>
                                <TableCell>
                                  {step.finalConcentration.toFixed(3)}{" "}
                                  {step.concentrationUnit}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="mt-4 p-3 bg-secondary rounded">
                          <p className="text-sm">
                            <strong>
                              Final administration volume per dose:
                            </strong>{" "}
                            {req.adminVolume.toFixed(2)} mL
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
