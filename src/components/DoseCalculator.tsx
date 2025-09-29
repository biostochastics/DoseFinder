"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  IconInfoCircle,
  IconAlertCircle,
  IconCopy,
  IconCheck,
} from "@tabler/icons-react";
import { Animal } from "@/lib/pharmacology/types";

interface DoseCalculatorProps {
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  scalingMethod: string;
  scalingExponent: string;
  animals: Record<string, Animal>;
  onSourceAnimalChange: (value: string) => void;
  onTargetAnimalChange: (value: string) => void;
  onSourceWeightChange: (value: number) => void;
  onTargetWeightChange: (value: number) => void;
  onBaseDoseChange: (value: number) => void;
  onScalingMethodChange: (value: string) => void;
  onScalingExponentChange: (value: string) => void;
  calculateDose: () => any;
  calculationSteps: any;
  resultDose: number;
  uncertaintyRange: { lower: number; upper: number };
  copySuccess: boolean;
  onCopyToClipboard: () => void;
}

export const DoseCalculator: React.FC<DoseCalculatorProps> = ({
  sourceAnimal,
  targetAnimal,
  sourceWeight,
  targetWeight,
  baseDose,
  scalingMethod,
  scalingExponent,
  animals,
  onSourceAnimalChange,
  onTargetAnimalChange,
  onSourceWeightChange,
  onTargetWeightChange,
  onBaseDoseChange,
  onScalingMethodChange,
  onScalingExponentChange,
  calculateDose,
  calculationSteps,
  resultDose,
  uncertaintyRange,
  copySuccess,
  onCopyToClipboard,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source-animal" className="flex items-center gap-2">
            Source Species
            <Popover>
              <PopoverTrigger asChild>
                <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">
                  Select the species from which the dose originates. This is
                  typically from published studies or existing data. Default
                  physiological parameters are automatically loaded for the
                  selected species.
                </p>
              </PopoverContent>
            </Popover>
          </Label>
          <Select value={sourceAnimal} onValueChange={onSourceAnimalChange}>
            <SelectTrigger id="source-animal">
              <SelectValue placeholder="Select source species" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(animals).map(([key, animal]) => (
                <SelectItem key={key} value={key}>
                  {animal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-animal" className="flex items-center gap-2">
            Target Species
            <Popover>
              <PopoverTrigger asChild>
                <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">
                  Select the target species for dose translation. The calculator
                  will apply appropriate scaling factors based on physiological
                  differences between species.
                </p>
              </PopoverContent>
            </Popover>
          </Label>
          <Select value={targetAnimal} onValueChange={onTargetAnimalChange}>
            <SelectTrigger id="target-animal">
              <SelectValue placeholder="Select target species" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(animals).map(([key, animal]) => (
                <SelectItem key={key} value={key}>
                  {animal.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="source-weight" className="flex items-center gap-2">
            {sourceAnimal === "human" ? "Patient" : "Animal"} Weight (kg)
            <Popover>
              <PopoverTrigger asChild>
                <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">
                  Enter the body weight for the source{" "}
                  {sourceAnimal === "human" ? "patient" : "animal"}. For{" "}
                  {sourceAnimal === "human" ? "humans" : "animals"}, typical
                  weight range is {animals[sourceAnimal].weight * 0.8} -{" "}
                  {animals[sourceAnimal].weight * 1.2} kg.
                </p>
              </PopoverContent>
            </Popover>
          </Label>
          <Input
            id="source-weight"
            type="number"
            value={sourceWeight || ""}
            onChange={(e) =>
              onSourceWeightChange(parseFloat(e.target.value) || 0)
            }
            placeholder={`Default: ${animals[sourceAnimal].weight} kg`}
            step="0.001"
            min="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-weight" className="flex items-center gap-2">
            {targetAnimal === "human" ? "Patient" : "Animal"} Weight (kg)
            <Popover>
              <PopoverTrigger asChild>
                <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">
                  Enter the body weight for the target{" "}
                  {targetAnimal === "human" ? "patient" : "animal"}. Typical
                  weight range is {animals[targetAnimal].weight * 0.8} -{" "}
                  {animals[targetAnimal].weight * 1.2} kg.
                </p>
              </PopoverContent>
            </Popover>
          </Label>
          <Input
            id="target-weight"
            type="number"
            value={targetWeight || ""}
            onChange={(e) =>
              onTargetWeightChange(parseFloat(e.target.value) || 0)
            }
            placeholder={`Default: ${animals[targetAnimal].weight} kg`}
            step="0.001"
            min="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="base-dose" className="flex items-center gap-2">
          Known Dose (mg/kg)
          <Popover>
            <PopoverTrigger asChild>
              <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <p className="text-sm">
                Enter the known dose from the source species in mg/kg. This is
                the dose that has been validated in the source species and will
                be translated to the target species.
              </p>
            </PopoverContent>
          </Popover>
        </Label>
        <Input
          id="base-dose"
          type="number"
          value={baseDose || ""}
          onChange={(e) => onBaseDoseChange(parseFloat(e.target.value) || 0)}
          placeholder="Enter dose in mg/kg"
          step="0.001"
          min="0"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Scaling Method
          <Popover>
            <PopoverTrigger asChild>
              <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <p className="text-sm font-semibold mb-2">
                Available scaling methods:
              </p>
              <ul className="text-sm space-y-1">
                <li>
                  <strong>Allometric:</strong> Uses power law scaling (W^0.75)
                </li>
                <li>
                  <strong>Body Surface Area:</strong> Based on BSA ratios
                </li>
                <li>
                  <strong>Direct:</strong> Linear weight-based scaling
                </li>
                <li>
                  <strong>Brain Weight:</strong> For CNS-active drugs
                </li>
                <li>
                  <strong>Metabolic Rate:</strong> Based on basal metabolism
                </li>
              </ul>
            </PopoverContent>
          </Popover>
        </Label>
        <RadioGroup value={scalingMethod} onValueChange={onScalingMethodChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="allometric" id="allometric" />
            <Label htmlFor="allometric">Allometric (Recommended)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bsa" id="bsa" />
            <Label htmlFor="bsa">Body Surface Area</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="direct" id="direct" />
            <Label htmlFor="direct">Direct (Linear)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="brainWeight" id="brainWeight" />
            <Label htmlFor="brainWeight">Brain Weight (CNS drugs)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="metabolic" id="metabolic" />
            <Label htmlFor="metabolic">Metabolic Rate</Label>
          </div>
        </RadioGroup>

        {scalingMethod === "allometric" && (
          <div className="mt-4 space-y-2">
            <Label
              htmlFor="scaling-exponent"
              className="flex items-center gap-2"
            >
              Allometric Exponent
              <Popover>
                <PopoverTrigger asChild>
                  <IconInfoCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm mb-2">Common allometric exponents:</p>
                  <ul className="text-sm space-y-1">
                    <li>
                      <strong>0.75:</strong> Standard metabolic scaling (most
                      drugs)
                    </li>
                    <li>
                      <strong>0.67:</strong> Surface area scaling
                    </li>
                    <li>
                      <strong>1.0:</strong> Direct proportional scaling
                    </li>
                    <li>
                      <strong>Custom:</strong> Based on specific drug data
                    </li>
                  </ul>
                </PopoverContent>
              </Popover>
            </Label>
            <Select
              value={scalingExponent}
              onValueChange={onScalingExponentChange}
            >
              <SelectTrigger id="scaling-exponent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.75">0.75 (Standard)</SelectItem>
                <SelectItem value="0.67">0.67 (Surface Area)</SelectItem>
                <SelectItem value="1.0">1.0 (Linear)</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {scalingExponent === "custom" && (
              <Input
                type="number"
                placeholder="Enter custom exponent (0.5 - 1.0)"
                step="0.01"
                min="0.5"
                max="1.0"
                onChange={(e) => onScalingExponentChange(e.target.value)}
              />
            )}
          </div>
        )}
      </div>

      <Button
        onClick={calculateDose}
        className="w-full"
        disabled={!baseDose || baseDose <= 0}
      >
        Calculate Dose
      </Button>

      {calculationSteps && (
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Results
                <IconAlertCircle className="h-5 w-5 text-warning" />
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={onCopyToClipboard}
                className="flex items-center gap-2"
              >
                {copySuccess ? (
                  <>
                    <IconCheck className="h-4 w-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <IconCopy className="h-4 w-4" />
                    Copy Results
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Calculated Dose
                </p>
                <p className="text-2xl font-bold">
                  {resultDose.toFixed(3)} mg/kg
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Range: {uncertaintyRange.lower.toFixed(3)} -{" "}
                  {uncertaintyRange.upper.toFixed(3)} mg/kg
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Calculation Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {calculationSteps.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                <p className="text-sm text-warning-foreground flex items-start gap-2">
                  <IconAlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    This calculation is for research purposes only. Always
                    validate doses with experimental data and consider factors
                    like drug properties, disease state, and individual
                    variability.
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
