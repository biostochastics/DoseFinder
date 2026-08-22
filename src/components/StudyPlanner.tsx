import React, { useState, useEffect } from "react";
import { useAnnounce, LiveRegion } from "@/hooks/useAnnounce";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import {
  IconTrash,
  IconPlus,
  IconCalculator,
  IconCalendar,
  IconFileTypeCsv,
  IconDownload,
} from "@tabler/icons-react";
import { Species, type MaterialRequirement } from "@/lib/pharmacology/types";
import {
  generateStudySchedule,
  armConfigToSchedule,
  downloadSchedule,
  type ExportFormat,
} from "@/lib/calendar";
import type { AdminRoute } from "@/lib/pharmacology/constants";
import {
  validateVolume,
  type VolumeValidationResult,
} from "@/lib/pharmacology/volumeLimits";
import {
  VolumeWarningPanel,
  VolumeWarningBadge,
} from "@/components/VolumeWarning";

// Fallback body weight (kg) used when a target species has no weight on record.
// Matches the physiological adult human reference used elsewhere in the app.
const DEFAULT_HUMAN_WEIGHT_KG = 70;

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
    "once" | "twice" | "thrice" | "weekly" | "biweekly" | "monthly" | "custom";
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
  /** Volume validation result for NC3Rs/IACUC compliance */
  volumeValidation?: VolumeValidationResult;
  /** Detailed material requirements with base/buffer breakdown */
  materialBreakdown?: MaterialRequirement;
}

/**
 * Map UI route names to AdminRoute types
 * UI uses "oral" but constants use "po" (per os)
 */
function mapToAdminRoute(uiRoute: string): AdminRoute {
  const routeMap: Record<string, AdminRoute> = {
    oral: "po",
    iv: "iv",
    ip: "ip",
    sc: "sc",
    im: "im",
    other: "other",
  };
  return routeMap[uiRoute] || "other";
}

interface StudyPlannerProps {
  animals: Record<string, Species>;
  currentDose: number;
  currentDoseUnit: "mg/kg" | "mg";
  targetAnimal: string;
}

export function StudyPlanner({
  animals,
  currentDose,
  currentDoseUnit,
  targetAnimal,
}: StudyPlannerProps) {
  // Accessibility: Screen reader announcements for dynamic content
  const { announcement, announce } = useAnnounce();

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
  const [percentType, setPercentType] = useState<"wv" | "ww">("wv");
  const [density, setDensity] = useState<number>(1.0);
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
  const [baseDosesTotal, setBaseDosesTotal] = useState<number | null>(null);
  const [bufferDosesTotal, setBufferDosesTotal] = useState<number | null>(null);

  // Calendar Export State
  const [studyName, setStudyName] = useState<string>("DoseFinder Study");
  const [scheduleStartDate, setScheduleStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

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
    announce(`Added ${type} arm: ${newName}`);
  };

  // Remove an arm
  const removeArm = (index: number) => {
    if (arms.length > 1) {
      const removedName = arms[index].name;
      const updatedArms = [...arms];
      updatedArms.splice(index, 1);
      setArms(updatedArms);
      setNumArms(numArms - 1);
      announce(`Removed arm: ${removedName}`);
    }
  };

  // Update arm properties
  const updateArm = (
    index: number,
    property: keyof ArmConfig,
    value: string | number,
  ) => {
    const updatedArms = [...arms];

    // Create updated arm object
    const updatedArm = {
      ...updatedArms[index],
      [property]: value,
    };

    // If species changes, update weight
    if (property === "species" && typeof value === "string" && animals[value]) {
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
    value: string | number,
  ) => {
    const updatedArms = [...arms];
    updatedArms[armIndex] = {
      ...updatedArms[armIndex],
      [nestedObj]: {
        ...(updatedArms[armIndex][nestedObj as keyof ArmConfig] as Record<
          string,
          string | number
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
    value: string | number,
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
   *
   * Includes validation to prevent division by zero and handle edge cases.
   */
  const calculateTotalDoses = (arm: ArmConfig): number => {
    const daysPerUnit: Record<string, number> = {
      days: 1,
      weeks: 7,
      months: 30.44, // Average month length for more accurate calculations
    };

    // Validate duration - ensure positive value
    const safeDuration = Math.max(0, arm.duration || 0);
    const unitMultiplier = daysPerUnit[arm.durationUnit] ?? 1;
    const totalDays = safeDuration * unitMultiplier;

    // Validate subjects - ensure at least 0
    const safeSubjects = Math.max(0, arm.subjects || 0);

    if (totalDays <= 0 || safeSubjects <= 0) {
      return 0;
    }

    // Calculate doses per day with validation
    let dosesPerDay = 0;
    if (arm.frequency === "once") dosesPerDay = 1;
    else if (arm.frequency === "twice") dosesPerDay = 2;
    else if (arm.frequency === "thrice") dosesPerDay = 3;
    else if (arm.frequency === "weekly") dosesPerDay = 1 / 7;
    else if (arm.frequency === "biweekly") dosesPerDay = 1 / 14;
    else if (arm.frequency === "monthly")
      dosesPerDay = 1 / 30.44; // Use consistent month length
    else if (arm.frequency === "custom") {
      // Validate custom frequency parameters to prevent division by zero
      const safePeriod = Math.max(1, arm.customFrequency.period || 1);
      const safeDoses = Math.max(0, arm.customFrequency.doses || 0);
      const customUnitMultiplier = daysPerUnit[arm.customFrequency.unit] ?? 1;
      const periodInDays = safePeriod * customUnitMultiplier;

      // Prevent division by zero
      dosesPerDay = periodInDays > 0 ? safeDoses / periodInDays : 0;
    }

    // Handle edge case where dosesPerDay is 0 or invalid
    if (dosesPerDay <= 0 || !isFinite(dosesPerDay)) {
      return 0;
    }

    const totalDoses = totalDays * dosesPerDay * safeSubjects;

    // Ensure we return a valid number
    return isFinite(totalDoses) ? Math.ceil(totalDoses) : 0;
  };

  // Calculate total product required for an arm
  // Includes validation to prevent division by zero and handle edge cases
  const calculateArmRequirement = (
    arm: ArmConfig,
    stockConc: number,
    stockConcUnit: string,
    dilutionSteps: DilutionStep[],
    route: AdminRoute,
    bufferDays: number,
    overagePercent: number,
    pctType: "wv" | "ww",
    densityGml: number,
  ): ArmRequirement => {
    // Calculate base doses (for study period)
    const baseDoses = calculateTotalDoses(arm);

    // Calculate buffer doses (for stability buffer period)
    // Buffer is additional doses for the stability buffer period
    const daysPerUnit: Record<string, number> = {
      days: 1,
      weeks: 7,
      months: 30.44,
    };

    // Validate duration and subjects to prevent division by zero
    const safeDuration = Math.max(0, arm.duration || 0);
    const unitMultiplier = daysPerUnit[arm.durationUnit] ?? 1;
    const studyDurationDays = safeDuration * unitMultiplier;
    const safeSubjects = Math.max(1, arm.subjects || 1);
    const safeBufferDays = Math.max(0, bufferDays || 0);

    // Calculate doses per day with division by zero protection
    let dosesPerDay = 0;
    if (studyDurationDays > 0 && safeSubjects > 0 && baseDoses > 0) {
      dosesPerDay = baseDoses / studyDurationDays / safeSubjects;
    }

    const bufferDoses =
      isFinite(dosesPerDay) && dosesPerDay > 0
        ? Math.ceil(safeBufferDays * dosesPerDay * safeSubjects)
        : 0;
    const totalDoses = baseDoses + bufferDoses;

    // Special handling for placebo and comparator arms
    if (arm.armType === "placebo") {
      // Placebo arms don't require active product (no volume validation needed)
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
        volumeValidation: undefined,
        materialBreakdown: {
          baseDoses,
          bufferDoses,
          totalDoses,
          baseProduct: 0,
          bufferProduct: 0,
          totalProduct: 0,
          wasteAllowance: 0,
          grandTotal: 0,
        },
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
      // Validate concentration to prevent division by zero
      let comparatorConcMg = Math.max(0, comparatorDetails.concentration || 0);
      if (comparatorDetails.concentrationUnit === "mcg/ml")
        comparatorConcMg /= 1000;
      else if (comparatorDetails.concentrationUnit === "percent")
        comparatorConcMg =
          Math.max(0, comparatorDetails.concentration || 0) * 10;

      // Ensure we have a valid concentration (minimum 0.0001 to prevent division issues)
      const safeComparatorConc = Math.max(0.0001, comparatorConcMg);

      // Convert dose to mg with validation
      const safeDoseLevel = Math.max(0, arm.doseLevel || 0);
      const safeWeight = Math.max(0.001, arm.weight || 0.001);
      let dosePerSubjectMg = safeDoseLevel;
      if (arm.doseUnit === "mg/kg") dosePerSubjectMg *= safeWeight;
      else if (arm.doseUnit === "mcg") dosePerSubjectMg /= 1000;
      else if (arm.doseUnit === "mcg/kg")
        dosePerSubjectMg = (safeDoseLevel * safeWeight) / 1000;

      // Calculate administration volume per dose with division protection
      const adminVolume =
        safeComparatorConc > 0 ? dosePerSubjectMg / safeComparatorConc : 0;

      // Validate volume against NC3Rs/IACUC limits
      const volumeValidation = validateVolume({
        species: arm.species,
        route,
        weightKg: arm.weight,
        volumeMl: adminVolume,
      });

      // Calculate base and buffer product for comparator
      const baseProduct = dosePerSubjectMg * baseDoses;
      const bufferProduct = dosePerSubjectMg * bufferDoses;
      const totalProduct = baseProduct + bufferProduct;
      // Clamp overage: a cleared/negative field must not poison the totals with NaN
      const wasteAllowance =
        totalProduct * (Math.max(0, overagePercent || 0) / 100);

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
        volumeValidation,
        materialBreakdown: {
          baseDoses,
          bufferDoses,
          totalDoses,
          baseProduct,
          bufferProduct,
          totalProduct,
          wasteAllowance,
          grandTotal: totalProduct + wasteAllowance,
        },
      };
    }

    // Normal treatment arm calculation
    // Convert dose to mg with validation
    const safeDoseLevel = Math.max(0, arm.doseLevel || 0);
    const safeWeight = Math.max(0.001, arm.weight || 0.001);
    let dosePerSubjectMg = safeDoseLevel;
    if (arm.doseUnit === "mg/kg") dosePerSubjectMg *= safeWeight;
    else if (arm.doseUnit === "mcg") dosePerSubjectMg /= 1000;
    else if (arm.doseUnit === "mcg/kg")
      dosePerSubjectMg = (safeDoseLevel * safeWeight) / 1000;

    // Basic product calculation
    const productRequired = dosePerSubjectMg * totalDoses;

    // Convert stock concentration to mg/mL with validation
    const safeStockConc = Math.max(0, stockConc || 0);
    const safeDensity = Math.max(0.1, densityGml || 1.0);
    let stockConcMg = safeStockConc;
    if (stockConcUnit === "mcg/ml") {
      stockConcMg /= 1000;
    } else if (stockConcUnit === "mg/g") {
      // mg/g is mass per unit mass, so converting to mg/mL requires the
      // formulation density: mg/mL = mg/g × density(g/mL). Default density
      // 1.0 g/mL reproduces the prior 1:1 approximation.
      stockConcMg = safeStockConc * safeDensity;
    } else if (stockConcUnit === "percent") {
      // Percent conversion depends on type:
      // % w/v (weight/volume): mg/mL = % × 10 (assumes 1 g/mL density for solution)
      // % w/w (weight/weight): mg/mL = % × density × 10 (uses actual density)
      if (pctType === "ww") {
        stockConcMg = safeStockConc * safeDensity * 10;
      } else {
        stockConcMg = safeStockConc * 10; // w/v default
      }
    } else if (stockConcUnit === "g/ml") {
      stockConcMg = safeStockConc * 1000;
    }

    // Ensure we have a valid stock concentration (minimum 0.0001 to prevent division issues)
    const safeStockConcMg = Math.max(0.0001, stockConcMg);

    // Calculate administration volume per dose with division protection
    const adminVolume =
      safeStockConcMg > 0 ? dosePerSubjectMg / safeStockConcMg : 0;

    // Process dilution steps with validation
    const calculatedDilutionSteps = [];
    let currentConc = safeStockConcMg;
    const safeOverageFactor = Math.max(0, overagePercent || 0);
    let currentVolume =
      currentConc > 0
        ? (productRequired / currentConc) * (1 + safeOverageFactor / 100)
        : 0;

    for (const dilution of dilutionSteps) {
      // Validate dilution factor (must be > 0 to prevent division by zero)
      const safeDilutionFactor = Math.max(1, dilution.factor || 1);

      const startVolume = currentVolume;
      const addedVolume = startVolume * (safeDilutionFactor - 1);
      currentConc =
        safeDilutionFactor > 0 ? currentConc / safeDilutionFactor : currentConc;
      currentVolume = startVolume + addedVolume;

      calculatedDilutionSteps.push({
        startVolume: isFinite(startVolume) ? startVolume : 0,
        addedVolume: isFinite(addedVolume) ? addedVolume : 0,
        vehicle: dilution.vehicle,
        finalConcentration: isFinite(currentConc) ? currentConc : 0,
        concentrationUnit: "mg/mL",
      });
    }

    // Validate volume against NC3Rs/IACUC limits
    const volumeValidation = validateVolume({
      species: arm.species,
      route,
      weightKg: arm.weight,
      volumeMl: adminVolume,
    });

    // Calculate material breakdown with base/buffer separation
    const baseProduct = dosePerSubjectMg * baseDoses;
    const bufferProduct = dosePerSubjectMg * bufferDoses;
    const totalProduct = baseProduct + bufferProduct;
    // Clamp overage: a cleared/negative field must not poison the totals with NaN
    const wasteAllowance =
      totalProduct * (Math.max(0, overagePercent || 0) / 100);
    const grandTotal = totalProduct + wasteAllowance;

    return {
      name: arm.name,
      subjects: arm.subjects,
      dosePerSubject: dosePerSubjectMg,
      doseUnit: "mg",
      totalDoses,
      productRequired: grandTotal, // Now includes buffer and overage
      productUnit: "mg",
      adminVolume,
      dilutionSteps: calculatedDilutionSteps,
      volumeValidation,
      materialBreakdown: {
        baseDoses,
        bufferDoses,
        totalDoses,
        baseProduct,
        bufferProduct,
        totalProduct,
        wasteAllowance,
        grandTotal,
      },
    };
  };

  // Calculate total requirements using a single reduce operation for better performance
  const calculateRequirements = () => {
    // Map the UI route to AdminRoute type
    const mappedRoute = mapToAdminRoute(adminRoute);

    // Use a single reduce operation to avoid multiple array iterations
    const {
      armReqs,
      totalProduct,
      totalDoses,
      totalBaseDoses,
      totalBufferDoses,
    } = arms.reduce(
      (acc, arm) => {
        const req = calculateArmRequirement(
          arm,
          stockConcentration,
          stockConcentrationUnit,
          dilutions,
          mappedRoute,
          stabilityBuffer,
          overageFactor,
          percentType,
          density,
        );
        return {
          armReqs: [...acc.armReqs, req],
          totalProduct:
            acc.totalProduct +
            (arm.armType === "treatment" ? req.productRequired : 0),
          totalDoses: acc.totalDoses + req.totalDoses,
          totalBaseDoses:
            acc.totalBaseDoses + (req.materialBreakdown?.baseDoses ?? 0),
          totalBufferDoses:
            acc.totalBufferDoses + (req.materialBreakdown?.bufferDoses ?? 0),
        };
      },
      {
        armReqs: [] as ArmRequirement[],
        totalProduct: 0,
        totalDoses: 0,
        totalBaseDoses: 0,
        totalBufferDoses: 0,
      },
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
    setBaseDosesTotal(totalBaseDoses);
    setBufferDosesTotal(totalBufferDoses);

    // Announce results to screen readers
    announce(
      `Calculation complete. Total product required: ${finalTotal.toFixed(3)} ${finalUnit}. Total doses: ${totalDoses}.`,
    );
  };

  // Copy dose from calculator
  const copyDoseFromCalculator = (index: number) => {
    const updatedArms = [...arms];
    const targetWeight =
      animals[targetAnimal]?.weight || DEFAULT_HUMAN_WEIGHT_KG;

    // Update the arm with the current dose
    // currentDose is in mg/kg from the calculator
    updatedArms[index] = {
      ...updatedArms[index],
      species: targetAnimal,
      weight: targetWeight,
      doseLevel: currentDose,
      doseUnit: currentDoseUnit,
    };

    setArms(updatedArms);
  };

  // Create a new arm with calculator dose
  const createArmWithCalculatorDose = () => {
    const targetWeight =
      animals[targetAnimal]?.weight || DEFAULT_HUMAN_WEIGHT_KG;

    // Create a new arm with the current dose
    // currentDose is in mg/kg from the calculator
    const newArm: ArmConfig = {
      name: `${animals[targetAnimal]?.name || targetAnimal} Dose`,
      species: targetAnimal,
      subjects: 10,
      weight: targetWeight,
      armType: "treatment",
      doseLevel: currentDose,
      doseUnit: currentDoseUnit,
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

  // Helper to format frequency for export
  const formatFrequency = (arm: ArmConfig): string => {
    if (arm.frequency === "custom") {
      return `${arm.customFrequency.doses} dose(s) per ${arm.customFrequency.period} ${arm.customFrequency.unit}`;
    }
    const freqLabels: Record<string, string> = {
      once: "Once daily",
      twice: "Twice daily",
      thrice: "Three times daily",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
    };
    return freqLabels[arm.frequency] || arm.frequency;
  };

  // Handle export function
  const exportStudyPlan = () => {
    if (armRequirements.length === 0) {
      return; // Nothing to export
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const studyPlan = `DoseFinder Study Planner Report
=====================================
Generated: ${new Date().toLocaleString()}
Export ID: ${timestamp}

STUDY DESIGN
============
Study Type: ${studyType === "preclinical" ? "Preclinical" : studyType === "phase1" ? "Clinical Phase I" : studyType === "phase2" ? "Clinical Phase II" : "Clinical Phase III"}
Number of Arms: ${numArms}
Overage Factor: ${overageFactor}%
Stability Buffer: ${stabilityBuffer} days

FORMULATION DETAILS
===================
Stock Concentration: ${stockConcentration} ${stockConcentrationUnit}
Administration Route: ${adminRoute === "oral" ? "Oral" : adminRoute === "iv" ? "Intravenous" : adminRoute === "ip" ? "Intraperitoneal" : adminRoute === "sc" ? "Subcutaneous" : adminRoute === "im" ? "Intramuscular" : "Other"}
Dilution Sequence: ${useDilutions ? "Enabled" : "Disabled"}
${
  useDilutions
    ? `Number of Dilution Steps: ${dilutions.length}
Dilution Factors: ${dilutions.map((d, i) => `Step ${i + 1}: ${d.factor}x (${d.vehicle})`).join(", ")}`
    : ""
}

ARM CONFIGURATIONS
==================
${arms
  .map((arm, index) => {
    const armConfig = `
--- Arm ${index + 1}: ${arm.name} ---
Type: ${arm.armType === "treatment" ? "Treatment" : arm.armType === "placebo" ? "Placebo" : "Comparator"}
Species/Population: ${animals[arm.species]?.name || arm.species}
Average Weight: ${arm.weight} kg
Number of Subjects: ${arm.subjects}
${arm.armType !== "placebo" ? `Dose Level: ${arm.doseLevel} ${arm.doseUnit}` : "Dose Level: N/A (Placebo)"}
Treatment Duration: ${arm.duration} ${arm.durationUnit}
Dosing Frequency: ${formatFrequency(arm)}
${arm.armType === "comparator" && arm.comparatorDetails ? `Comparator: ${arm.comparatorDetails.name} (${arm.comparatorDetails.concentration} ${arm.comparatorDetails.concentrationUnit})` : ""}`;

    return armConfig;
  })
  .join("\n")}

CALCULATED REQUIREMENTS
=======================
${armRequirements
  .map((arm, index) => {
    const armType = arms[index].armType;
    let details = `
--- ${arm.name} ---
Type: ${armType === "treatment" ? "Treatment" : armType === "placebo" ? "Placebo" : "Comparator"}
Subjects: ${arm.subjects}
`;

    if (armType === "placebo") {
      details += `Dose per Subject: N/A (Placebo)
Total Doses: ${arm.totalDoses}
Product Required: N/A (Placebo)
`;
    } else if (armType === "comparator") {
      details += `Dose per Subject: ${arm.dosePerSubject.toFixed(4)} ${arm.doseUnit}
Total Doses: ${arm.totalDoses}
Product: ${arms[index].comparatorDetails?.name || "Comparator"} (${arms[index].comparatorDetails?.concentration || 0} ${arms[index].comparatorDetails?.concentrationUnit || ""})
Administration Volume: ${arm.adminVolume.toFixed(3)} mL per dose
`;
    } else {
      details += `Dose per Subject: ${arm.dosePerSubject.toFixed(4)} ${arm.doseUnit}
Total Doses: ${arm.totalDoses}${arm.materialBreakdown ? ` (Base: ${arm.materialBreakdown.baseDoses}, Buffer: ${arm.materialBreakdown.bufferDoses})` : ""}
Product Required: ${arm.productRequired.toFixed(4)} ${arm.productUnit}
Administration Volume: ${arm.adminVolume.toFixed(3)} mL per dose
`;
      // Add material breakdown if stability buffer is used
      if (arm.materialBreakdown && stabilityBuffer > 0) {
        details += `
Material Breakdown:
  Base Product: ${arm.materialBreakdown.baseProduct.toFixed(4)} mg
  Buffer Product: ${arm.materialBreakdown.bufferProduct.toFixed(4)} mg
  Waste Allowance (${overageFactor}%): ${arm.materialBreakdown.wasteAllowance.toFixed(4)} mg
  Grand Total: ${arm.materialBreakdown.grandTotal.toFixed(4)} mg
`;
      }
      if (useDilutions && arm.dilutionSteps.length > 0) {
        details += `
Dilution Protocol:
${arm.dilutionSteps
  .map(
    (step, i) => `  Step ${i + 1}:
    Starting Volume: ${step.startVolume.toFixed(3)} mL
    Add Vehicle: ${step.addedVolume.toFixed(3)} mL of ${step.vehicle}
    Final Concentration: ${step.finalConcentration.toFixed(4)} ${step.concentrationUnit}`,
  )
  .join("\n")}
`;
      }
    }

    return details;
  })
  .join("\n")}

SUMMARY
=======
Total Doses to Prepare: ${totalDoses}
${
  stabilityBuffer > 0
    ? `  Base Study Doses: ${baseDosesTotal}
  Stability Buffer Doses: ${bufferDosesTotal}
`
    : ""
}Total Active Compound Required: ${totalProductRequired?.toFixed(4)} ${totalProductUnit}
${
  stabilityBuffer > 0
    ? `
Material Breakdown (Treatment Arms):
  Base Product: ${armRequirements
    .filter((_, i) => arms[i].armType === "treatment")
    .reduce((sum, r) => sum + (r.materialBreakdown?.baseProduct ?? 0), 0)
    .toFixed(4)} mg
  Buffer Product: ${armRequirements
    .filter((_, i) => arms[i].armType === "treatment")
    .reduce((sum, r) => sum + (r.materialBreakdown?.bufferProduct ?? 0), 0)
    .toFixed(4)} mg
  Waste Allowance (${overageFactor}%): ${armRequirements
    .filter((_, i) => arms[i].armType === "treatment")
    .reduce((sum, r) => sum + (r.materialBreakdown?.wasteAllowance ?? 0), 0)
    .toFixed(4)} mg
`
    : ""
}
Arm Breakdown:
  Treatment Arms: ${arms.filter((arm) => arm.armType === "treatment").length}
  Placebo Arms: ${arms.filter((arm) => arm.armType === "placebo").length}
  Comparator Arms: ${arms.filter((arm) => arm.armType === "comparator").length}

DISCLAIMER
==========
FOR RESEARCH AND EDUCATIONAL USE ONLY. This study plan is provided as a
planning and estimation tool and should NOT be used for clinical dosing
without proper validation. All calculations MUST be verified before use.
Drug preparation should follow appropriate laboratory protocols, GLP/GMP
standards, and regulatory guidelines. Consider species-specific differences,
formulation stability, and individual variability when applying these
calculations in actual studies.
`;

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

  /**
   * Safely parse a date string in YYYY-MM-DD format
   * Returns current date if parsing fails
   */
  const parseScheduleDate = (dateStr: string): Date => {
    // Handle empty or invalid strings
    if (!dateStr || typeof dateStr !== "string") {
      console.warn("Invalid date string, using current date");
      return new Date();
    }

    const parts = dateStr.split("-");
    if (parts.length !== 3) {
      console.warn(
        "Invalid date format (expected YYYY-MM-DD), using current date",
      );
      return new Date();
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Validate parsed values
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.warn("Invalid date components, using current date");
      return new Date();
    }

    // Validate reasonable date ranges
    if (
      year < 1970 ||
      year > 2100 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      console.warn("Date out of valid range, using current date");
      return new Date();
    }

    const date = new Date(year, month - 1, day, 9, 0, 0);

    // Check if the constructed date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date, using current date");
      return new Date();
    }

    return date;
  };

  /**
   * Export dosing schedule to CSV or ICS calendar format
   */
  const exportCalendar = (format: ExportFormat) => {
    if (armRequirements.length === 0) {
      return;
    }

    // Convert arm configs to schedule format
    const armSchedules = arms.map((arm, index) => {
      const req = armRequirements[index];
      return armConfigToSchedule(
        {
          name: arm.name,
          species: arm.species,
          subjects: arm.subjects,
          armType: arm.armType,
          doseLevel: arm.doseLevel,
          doseUnit: arm.doseUnit,
          duration: arm.duration,
          durationUnit: arm.durationUnit,
          frequency: arm.frequency,
          customFrequency: arm.customFrequency,
        },
        `arm${index + 1}`,
        req?.adminVolume ?? 0.1,
      );
    });

    // Parse start date safely with validation
    const startDate = parseScheduleDate(scheduleStartDate);

    // Generate schedule
    const schedule = generateStudySchedule(studyName, armSchedules, {
      startDate,
      skipWeekends: false,
      skipHolidays: false,
      holidays: [],
      defaultTime: "09:00",
      durationMinutes: 15,
    });

    // Download the file
    downloadSchedule(schedule, format);
  };

  return (
    <div className="space-y-4">
      {/* Screen reader live region for dynamic announcements */}
      <LiveRegion announcement={announcement} />

      {/* Study Design Section */}
      <Card>
        <CardHeader>
          <CardTitle>Study Design</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Study Type Selection */}
            <div>
              <Label htmlFor="study-type">Study Type</Label>
              <Select value={studyType} onValueChange={setStudyType}>
                <SelectTrigger id="study-type" aria-label="Select study type">
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
              <Label htmlFor="num-arms">Number of Arms</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Input
                    id="num-arms"
                    type="number"
                    value={numArms}
                    onChange={(e) => setNumArms(Number(e.target.value))}
                    min={1}
                    className="w-24"
                    aria-describedby="arms-description"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("treatment")}
                    className="gap-2"
                  >
                    <IconPlus
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    Add Treatment Arm
                  </Button>
                </div>
                <p id="arms-description" className="sr-only">
                  Use the buttons below to add different types of study arms
                </p>
                <div className="flex space-x-2 flex-wrap gap-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("placebo")}
                    className="gap-2"
                  >
                    <IconPlus
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    Add Placebo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addArm("comparator")}
                    className="gap-2"
                  >
                    <IconPlus
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    Add Comparator
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={createArmWithCalculatorDose}
                    className="gap-2 bg-primary/10"
                    aria-label="Create arm using dose from calculator"
                  >
                    <IconPlus
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    From Calculator
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Parameters */}
          <div className="mt-4">
            <h3 className="text-base font-semibold mb-2">
              Additional Parameters
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="overage-factor" className="text-sm">
                  Overage Factor (%)
                </Label>
                <Input
                  id="overage-factor"
                  type="number"
                  value={overageFactor}
                  onChange={(e) => setOverageFactor(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-24"
                  placeholder="15"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Extra product to account for losses
                </p>
              </div>
              <div>
                <Label htmlFor="stability-buffer" className="text-sm">
                  Stability Buffer (days)
                </Label>
                <Input
                  id="stability-buffer"
                  type="number"
                  value={stabilityBuffer}
                  onChange={(e) => setStabilityBuffer(Number(e.target.value))}
                  min={0}
                  className="w-24"
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
        <Card key={index}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
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
                {arm.armType !== "placebo" && (
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
                          ,{" "}
                          {animals[targetAnimal]?.weight ||
                            DEFAULT_HUMAN_WEIGHT_KG}{" "}
                          kg
                        </p>
                        <p className="text-sm">
                          Current dose: {currentDose.toFixed(3)}{" "}
                          {currentDoseUnit}
                          {currentDoseUnit === "mg/kg" && (
                            <>
                              {" "}
                              (
                              {(
                                currentDose *
                                (animals[targetAnimal]?.weight ||
                                  DEFAULT_HUMAN_WEIGHT_KG)
                              ).toFixed(3)}{" "}
                              mg total)
                            </>
                          )}
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
                  aria-label={`Remove ${arm.name}`}
                >
                  <IconTrash
                    className="h-4 w-4"
                    stroke={1.5}
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Arm Name */}
              <div>
                <Label htmlFor={`arm-name-${index}`}>Arm Name</Label>
                <Input
                  id={`arm-name-${index}`}
                  value={arm.name}
                  onChange={(e) => updateArm(index, "name", e.target.value)}
                  placeholder="e.g., Low Dose"
                />
              </div>

              {/* Arm Type */}
              <div>
                <Label htmlFor={`arm-type-${index}`}>Arm Type</Label>
                <Select
                  value={arm.armType}
                  onValueChange={(val) =>
                    updateArm(index, "armType", val as ArmConfig["armType"])
                  }
                >
                  <SelectTrigger
                    id={`arm-type-${index}`}
                    aria-label={`Arm type for ${arm.name}`}
                  >
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
                <Label htmlFor={`arm-species-${index}`}>
                  Species/Population
                </Label>
                <Select
                  value={arm.species}
                  onValueChange={(val) => updateArm(index, "species", val)}
                >
                  <SelectTrigger
                    id={`arm-species-${index}`}
                    aria-label={`Species for ${arm.name}`}
                  >
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(animals).map(([key, animal]) => (
                      <SelectItem key={key} value={key}>
                        {animal.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Subjects per Arm */}
              <div>
                <Label htmlFor={`arm-subjects-${index}`}>
                  Number of Subjects
                </Label>
                <Input
                  id={`arm-subjects-${index}`}
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
                <Label htmlFor={`arm-weight-${index}`}>
                  Average Weight (kg)
                </Label>
                <Input
                  id={`arm-weight-${index}`}
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
                  <Label htmlFor={`arm-dose-${index}`}>Dose Level</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id={`arm-dose-${index}`}
                      type="number"
                      value={arm.doseLevel}
                      onChange={(e) =>
                        updateArm(index, "doseLevel", Number(e.target.value))
                      }
                      min={0}
                      step="0.01"
                      className="w-24"
                      aria-label={`Dose level for ${arm.name}`}
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
                      <SelectTrigger
                        className="w-24"
                        aria-label={`Dose unit for ${arm.name}`}
                      >
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
                <Label htmlFor={`arm-duration-${index}`}>
                  Treatment Duration
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id={`arm-duration-${index}`}
                    type="number"
                    value={arm.duration}
                    onChange={(e) =>
                      updateArm(index, "duration", Number(e.target.value))
                    }
                    min={1}
                    className="w-24"
                    aria-label={`Duration for ${arm.name}`}
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
                    <SelectTrigger
                      className="w-24"
                      aria-label={`Duration unit for ${arm.name}`}
                    >
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
                <h4 className="text-sm font-medium mb-3">Comparator Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Comparator Name</Label>
                    <Input
                      aria-label="Comparator name"
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
                        aria-label="Comparator concentration"
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
                        <SelectTrigger
                          className="w-24"
                          aria-label="Comparator concentration unit"
                        >
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
                    <SelectTrigger aria-label="Dosing frequency">
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
                        aria-label="Number of doses per period"
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
                        className="w-24"
                      />
                      <span>per</span>
                      <Input
                        type="number"
                        aria-label="Period length"
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
                        className="w-24"
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
                        <SelectTrigger aria-label="Period unit">
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
      <Card>
        <CardHeader>
          <CardTitle>Formulation & Dilution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {/* Drug Concentration */}
            <div className="space-y-2">
              <Label htmlFor="stock-concentration">Stock Concentration</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="stock-concentration"
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
                  <SelectTrigger
                    className="w-24"
                    aria-label="Stock concentration unit"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mg/ml">mg/mL</SelectItem>
                    <SelectItem value="mg/g">mg/g</SelectItem>
                    <SelectItem value="mcg/ml">μg/mL</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Percent Type Selector - only shown when percent is selected */}
              {stockConcentrationUnit === "percent" && (
                <div className="p-3 bg-secondary/30 rounded-md space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Percent Type</Label>
                    <RadioGroup
                      value={percentType}
                      onValueChange={(value) =>
                        setPercentType(value as "wv" | "ww")
                      }
                      className="flex items-center gap-4 mt-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="wv" id="pct-wv" />
                        <Label
                          htmlFor="pct-wv"
                          className="font-normal cursor-pointer"
                        >
                          % w/v (weight/volume)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="ww" id="pct-ww" />
                        <Label
                          htmlFor="pct-ww"
                          className="font-normal cursor-pointer"
                        >
                          % w/w (weight/weight)
                        </Label>
                      </div>
                    </RadioGroup>
                    <p className="text-xs text-muted-foreground mt-1">
                      {percentType === "wv"
                        ? "w/v: grams of solute per 100 mL of solution (most liquids)"
                        : "w/w: grams of solute per 100 g of mixture (creams, gels, solids)"}
                    </p>
                  </div>

                  {/* Density input - only shown for w/w */}
                  {percentType === "ww" && (
                    <div>
                      <Label htmlFor="density" className="text-sm">
                        Density (g/mL)
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="density"
                          type="number"
                          value={density}
                          onChange={(e) => setDensity(Number(e.target.value))}
                          min={0.1}
                          max={10}
                          step="0.01"
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          Used to convert % w/w to mg/mL
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formula: mg/mL = {stockConcentration}% × {density} g/mL
                        × 10 ={" "}
                        <span className="font-medium">
                          {(stockConcentration * density * 10).toFixed(2)} mg/mL
                        </span>
                      </p>
                    </div>
                  )}

                  {percentType === "wv" && (
                    <p className="text-xs text-muted-foreground">
                      Formula: mg/mL = {stockConcentration}% × 10 ={" "}
                      <span className="font-medium">
                        {(stockConcentration * 10).toFixed(2)} mg/mL
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Density input - required to convert mg/g to mg/mL */}
              {stockConcentrationUnit === "mg/g" && (
                <div className="p-3 bg-secondary/30 rounded-md">
                  <Label htmlFor="density-mgg" className="text-sm">
                    Density (g/mL)
                  </Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      id="density-mgg"
                      type="number"
                      value={density}
                      onChange={(e) => setDensity(Number(e.target.value))}
                      min={0.1}
                      max={10}
                      step="0.01"
                      className="w-24"
                    />
                    <span className="text-xs text-muted-foreground">
                      Used to convert mg/g to mg/mL
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Formula: mg/mL = {stockConcentration} mg/g × {density} g/mL
                    ={" "}
                    <span className="font-medium">
                      {(stockConcentration * density).toFixed(2)} mg/mL
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Administration Route */}
            <div>
              <Label htmlFor="admin-route">Administration Route</Label>
              <Select value={adminRoute} onValueChange={setAdminRoute}>
                <SelectTrigger
                  id="admin-route"
                  aria-label="Administration route"
                >
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
                            aria-label={`Dilution factor for step ${dIndex + 1}`}
                            value={dilution.factor}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              const MAX_DILUTION_FACTOR = 1000; // Maximum allowed dilution factor
                              // Only update if value is valid; invalid values are silently ignored
                              // The input's min attribute provides visual feedback for invalid values
                              if (
                                !isNaN(value) &&
                                value >= 1 &&
                                value <= MAX_DILUTION_FACTOR
                              ) {
                                updateDilution(dIndex, "factor", value);
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
                            <SelectTrigger
                              className="w-24"
                              aria-label={`Dilution vehicle for step ${dIndex + 1}`}
                            >
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
                          aria-label={`Remove dilution step ${dIndex + 1}`}
                        >
                          <IconTrash
                            className="h-4 w-4"
                            stroke={1.5}
                            aria-hidden="true"
                          />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addDilution}
                    className="gap-2"
                  >
                    <IconPlus
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    Add Dilution Step
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Calculate Button */}
          <div className="mt-6 flex justify-center">
            <Button onClick={calculateRequirements} className="w-1/2 gap-2">
              <IconCalculator
                className="h-4 w-4"
                stroke={1.5}
                aria-hidden="true"
              />
              Calculate Requirements
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {totalProductRequired !== null && (
        <Card>
          <CardHeader>
            <CardTitle>Study Material Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Total Study Requirements */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-base font-semibold mb-2">
                  Total Active Compound Required
                </h3>
                <div className="text-2xl font-bold text-accent">
                  {totalProductRequired.toFixed(3)} {totalProductUnit}
                </div>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <div>Including {overageFactor}% overage factor</div>
                  {stabilityBuffer > 0 && (
                    <div>Including {stabilityBuffer} days stability buffer</div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-2">
                  Total Doses to Prepare
                </h3>
                <div className="text-2xl font-bold text-accent">
                  {totalDoses}
                </div>
                {stabilityBuffer > 0 &&
                  baseDosesTotal !== null &&
                  bufferDosesTotal !== null && (
                    <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                      <div>Base study: {baseDosesTotal} doses</div>
                      <div>Stability buffer: {bufferDosesTotal} doses</div>
                    </div>
                  )}
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

            {/* Calendar Export Section */}
            <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <IconCalendar className="h-4 w-4" stroke={1.5} />
                Dosing Calendar Export
              </h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Label htmlFor="study-name">Study Name</Label>
                  <Input
                    id="study-name"
                    type="text"
                    value={studyName}
                    onChange={(e) => setStudyName(e.target.value)}
                    placeholder="Enter study name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="schedule-start">Start Date</Label>
                  <Input
                    id="schedule-start"
                    type="date"
                    value={scheduleStartDate}
                    onChange={(e) => setScheduleStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCalendar("csv")}
                  disabled={armRequirements.length === 0}
                  className="gap-2"
                >
                  <IconFileTypeCsv className="h-4 w-4" stroke={1.5} />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportCalendar("ics")}
                  disabled={armRequirements.length === 0}
                  className="gap-2"
                >
                  <IconDownload className="h-4 w-4" stroke={1.5} />
                  Export ICS Calendar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                CSV: Spreadsheet with dose schedule. ICS: Import into calendar
                apps (Outlook, Google Calendar, Apple Calendar).
              </p>
            </div>

            {/* Material Breakdown Summary */}
            {stabilityBuffer > 0 && (
              <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
                <h4
                  className="text-sm font-medium mb-2"
                  id="material-breakdown-heading"
                >
                  Material Breakdown Summary
                </h4>
                <Table aria-labelledby="material-breakdown-heading">
                  <caption className="sr-only">
                    Breakdown of study materials including base doses, stability
                    buffer, and waste allowance
                  </caption>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Component</TableHead>
                      <TableHead scope="col">Doses</TableHead>
                      <TableHead scope="col">Product (mg)</TableHead>
                      <TableHead scope="col">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Base Study</TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.baseDoses ?? 0),
                            0,
                          )}
                      </TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.baseProduct ?? 0),
                            0,
                          )
                          .toFixed(3)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        Study duration doses
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Stability Buffer
                      </TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.bufferDoses ?? 0),
                            0,
                          )}
                      </TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.bufferProduct ?? 0),
                            0,
                          )
                          .toFixed(3)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {stabilityBuffer} days additional supply
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Waste Allowance
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.wasteAllowance ?? 0),
                            0,
                          )
                          .toFixed(3)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {overageFactor}% overage
                      </TableCell>
                    </TableRow>
                    <TableRow className="font-bold bg-primary/10">
                      <TableCell>Grand Total</TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum +
                              (r.materialBreakdown?.baseDoses ?? 0) +
                              (r.materialBreakdown?.bufferDoses ?? 0),
                            0,
                          )}
                      </TableCell>
                      <TableCell>
                        {armRequirements
                          .filter((_, i) => arms[i].armType === "treatment")
                          .reduce(
                            (sum, r) =>
                              sum + (r.materialBreakdown?.grandTotal ?? 0),
                            0,
                          )
                          .toFixed(3)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Per Arm Breakdown */}
            <div className="mt-6">
              <h3
                id="arm-breakdown-heading"
                className="text-base font-semibold mb-2"
              >
                Breakdown by Study Arm
              </h3>
              <Table aria-labelledby="arm-breakdown-heading">
                <caption className="sr-only">
                  Detailed breakdown of dosing requirements for each study arm
                  including subjects, doses, and volume compliance status
                </caption>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Arm</TableHead>
                    <TableHead scope="col">Type</TableHead>
                    <TableHead scope="col">Subjects</TableHead>
                    <TableHead scope="col">Dose per Subject</TableHead>
                    <TableHead scope="col">Total Doses</TableHead>
                    <TableHead scope="col">Product Required</TableHead>
                    <TableHead scope="col">Volume Status</TableHead>
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
                        <TableCell>
                          {armType === "placebo" ? (
                            <span className="text-muted-foreground text-xs">
                              N/A
                            </span>
                          ) : req.volumeValidation ? (
                            <VolumeWarningBadge
                              validation={req.volumeValidation}
                            />
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              -
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Volume Warnings Section */}
            {armRequirements.some(
              (req) => req.volumeValidation && !req.volumeValidation.isValid,
            ) && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2 text-yellow-700 dark:text-yellow-400">
                  Volume Limit Warnings
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  The following arms exceed NC3Rs/IACUC recommended volume
                  limits. Review and consider adjustments before proceeding.
                </p>
                <div className="space-y-4">
                  {armRequirements.map((req, index) => {
                    if (!req.volumeValidation || req.volumeValidation.isValid) {
                      return null;
                    }
                    return (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-2">
                          {req.name} - {req.adminVolume.toFixed(3)} mL per dose
                        </h4>
                        <VolumeWarningPanel
                          validation={req.volumeValidation}
                          className="mt-2"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dosing Solution Preparation */}
            {useDilutions && (
              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2">
                  Dosing Solution Preparation
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {armRequirements.map((req, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger>
                        Arm {index + 1}: {req.name}
                      </AccordionTrigger>
                      <AccordionContent>
                        <Table
                          aria-label={`Dilution preparation steps for ${req.name}`}
                        >
                          <TableHeader>
                            <TableRow>
                              <TableHead scope="col">Step</TableHead>
                              <TableHead scope="col">Starting Volume</TableHead>
                              <TableHead scope="col">Add Vehicle</TableHead>
                              <TableHead scope="col">
                                Final Concentration
                              </TableHead>
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
