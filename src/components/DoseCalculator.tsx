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
  IconDownload,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Species,
  ScalingMethod,
  CalculationResult,
} from "@/lib/pharmacology/types";
import { formatMass } from "@/lib/units";
import type { DoseInputUnit } from "@/hooks/useCalculatorState";

// Extended calculation result with additional computed fields
interface DoseCalculationSteps extends CalculationResult {
  calculatedDose: number;
  finalDose: number;
}

interface DoseCalculatorProps {
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  doseInputUnit: DoseInputUnit;
  onDoseInputUnitChange: (unit: DoseInputUnit) => void;
  baseDosePerKg: number;
  scalingMethod: ScalingMethod;
  scalingExponent: string;
  customExponentValue: number;
  animals: Record<string, Species>;
  onSourceAnimalChange: (value: string) => void;
  onTargetAnimalChange: (value: string) => void;
  onSourceWeightChange: (value: number) => void;
  onTargetWeightChange: (value: number) => void;
  onBaseDoseChange: (value: number) => void;
  onScalingMethodChange: (value: ScalingMethod) => void;
  onScalingExponentChange: (value: string) => void;
  onCustomExponentValueChange: (value: number) => void;
  calculateDose: () => CalculationResult | null;
  calculationSteps: DoseCalculationSteps | null;
  resultDose: number;
  uncertaintyRange: { lower: number; upper: number };
  copySuccess: boolean;
  onCopyToClipboard: () => void;
  onExportResults: () => void;
}

export const DoseCalculator: React.FC<DoseCalculatorProps> = React.memo(
  ({
    sourceAnimal,
    targetAnimal,
    sourceWeight,
    targetWeight,
    baseDose,
    doseInputUnit,
    onDoseInputUnitChange,
    baseDosePerKg,
    scalingMethod,
    scalingExponent,
    customExponentValue,
    animals,
    onSourceAnimalChange,
    onTargetAnimalChange,
    onSourceWeightChange,
    onTargetWeightChange,
    onBaseDoseChange,
    onScalingMethodChange,
    onScalingExponentChange,
    onCustomExponentValueChange,
    calculateDose,
    calculationSteps,
    resultDose,
    uncertaintyRange,
    copySuccess,
    onCopyToClipboard,
    onExportResults,
  }) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-animal" className="flex items-center gap-2">
              Source Species
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="More information about source species"
                  >
                    <IconInfoCircle
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      aria-hidden="true"
                    />
                  </button>
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
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="More information about target species"
                  >
                    <IconInfoCircle
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      aria-hidden="true"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    Select the target species for dose translation. The
                    calculator will apply appropriate scaling factors based on
                    physiological differences between species.
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
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="More information about source weight"
                  >
                    <IconInfoCircle
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      aria-hidden="true"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    Enter the body weight for the source{" "}
                    {sourceAnimal === "human" ? "patient" : "animal"}. For{" "}
                    {sourceAnimal === "human" ? "humans" : "animals"}, typical
                    weight range is {(animals[sourceAnimal]?.weight ?? 0) * 0.8}{" "}
                    - {(animals[sourceAnimal]?.weight ?? 0) * 1.2} kg.
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
              placeholder={`Default: ${animals[sourceAnimal]?.weight ?? ""} kg`}
              step="0.001"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target-weight" className="flex items-center gap-2">
              {targetAnimal === "human" ? "Patient" : "Animal"} Weight (kg)
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="More information about target weight"
                  >
                    <IconInfoCircle
                      className="h-4 w-4 text-muted-foreground cursor-help"
                      aria-hidden="true"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    Enter the body weight for the target{" "}
                    {targetAnimal === "human" ? "patient" : "animal"}. Typical
                    weight range is {(animals[targetAnimal]?.weight ?? 0) * 0.8}{" "}
                    - {(animals[targetAnimal]?.weight ?? 0) * 1.2} kg.
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
              placeholder={`Default: ${animals[targetAnimal]?.weight ?? ""} kg`}
              step="0.001"
              min="0"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base-dose" className="flex items-center gap-2">
            <span className="required-indicator">
              Known Dose ({doseInputUnit})
            </span>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="More information about known dose"
                >
                  <IconInfoCircle
                    className="h-4 w-4 text-muted-foreground cursor-help"
                    aria-hidden="true"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm">
                  Enter the known dose from the source species. You can enter
                  either per-kg dose (mg/kg) or total absolute dose (mg) and
                  toggle between them.
                </p>
              </PopoverContent>
            </Popover>
          </Label>
          <div className="flex gap-2">
            <ToggleGroup
              type="single"
              value={doseInputUnit}
              onValueChange={(value) => {
                if (value) onDoseInputUnitChange(value as DoseInputUnit);
              }}
              className="border rounded-md h-10"
              aria-label="Dose unit selection"
            >
              <ToggleGroupItem
                value="mg/kg"
                aria-label="Per kilogram dose"
                className="text-[11px] px-2 h-9"
              >
                mg/kg
              </ToggleGroupItem>
              <ToggleGroupItem
                value="mg"
                aria-label="Total absolute dose"
                className="text-[11px] px-2 h-9"
              >
                mg
              </ToggleGroupItem>
            </ToggleGroup>
            <Input
              id="base-dose"
              type="number"
              value={baseDose || ""}
              onChange={(e) =>
                onBaseDoseChange(parseFloat(e.target.value) || 0)
              }
              placeholder={`Enter dose in ${doseInputUnit}`}
              step="0.001"
              min="0"
              aria-required="true"
              aria-describedby="base-dose-hint"
              className="flex-1"
            />
          </div>
          <p id="base-dose-hint" className="text-xs text-muted-foreground">
            {doseInputUnit === "mg"
              ? sourceWeight > 0
                ? `Total dose for ${sourceWeight} kg source. Equivalent: ${baseDosePerKg.toFixed(4)} mg/kg`
                : "Total dose entered. Set a positive source weight to see the per-kg equivalent."
              : "Per-kilogram dose. Toggle to enter total mg instead."}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
            Scaling Method
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="More information about scaling methods"
                >
                  <IconInfoCircle
                    className="h-4 w-4 text-muted-foreground cursor-help"
                    aria-hidden="true"
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <p className="text-sm font-semibold mb-2">
                  Recommended scaling methods:
                </p>
                <ul className="text-sm space-y-1">
                  <li>
                    <strong>Allometric:</strong> Customizable power-law scaling
                    (default W^0.75)
                  </li>
                  <li>
                    <strong>BSA (Km method):</strong> FDA-recommended body
                    surface area scaling
                  </li>
                  <li>
                    <strong>Direct:</strong> Linear weight-based scaling
                    (exponent = 1.0)
                  </li>
                  <li>
                    <strong>Metabolic:</strong> Kleiber&apos;s law metabolic
                    rate scaling (W^0.75)
                  </li>
                </ul>
                <p className="text-sm font-semibold mt-3 mb-2">
                  Exploratory (historical — not validated for dosing):
                </p>
                <ul className="text-sm space-y-1">
                  <li>
                    <strong>
                      Brain Weight / Life-Span / Hepatic Blood Flow:
                    </strong>{" "}
                    each reduces to a simple physiological ratio and is not a
                    validated dose estimator. Provided for reference only.
                  </li>
                </ul>
              </PopoverContent>
            </Popover>
          </legend>
          <RadioGroup
            value={scalingMethod}
            onValueChange={(v: string) =>
              onScalingMethodChange(v as ScalingMethod)
            }
            aria-label="Scaling method selection"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="allometric" id="allometric" />
              <Label htmlFor="allometric">Allometric (Recommended)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bsa" id="bsa" />
              <Label htmlFor="bsa">Body Surface Area (Km method)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="direct" id="direct" />
              <Label htmlFor="direct">Direct (Linear)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="metabolic" id="metabolic" />
              <Label htmlFor="metabolic">
                Metabolic Rate (Kleiber&apos;s law)
              </Label>
            </div>

            <div className="mt-3 pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Exploratory (historical — not validated for dosing)
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                These reduce to a trivial physiological ratio. Prefer allometric
                or BSA/Km for dose selection.
              </p>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brainWeight" id="brainWeight" />
                <Label htmlFor="brainWeight">Brain Weight (exploratory)</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="lifeSpan" id="lifeSpan" />
                <Label htmlFor="lifeSpan">Life-Span (exploratory)</Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="hepaticFlow" id="hepaticFlow" />
                <Label htmlFor="hepaticFlow">
                  Hepatic Blood Flow (exploratory)
                </Label>
              </div>
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
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="More information about allometric exponents"
                    >
                      <IconInfoCircle
                        className="h-4 w-4 text-muted-foreground cursor-help"
                        aria-hidden="true"
                      />
                    </button>
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
                <div className="space-y-1">
                  <Label htmlFor="custom-exponent" className="text-sm">
                    Custom Exponent Value
                  </Label>
                  <Input
                    id="custom-exponent"
                    type="number"
                    placeholder="Enter custom exponent (typical: 0.5 - 1.0)"
                    step="0.01"
                    min="0"
                    max="2"
                    value={customExponentValue}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value) && value >= 0 && value <= 2) {
                        onCustomExponentValueChange(value);
                      }
                    }}
                    aria-describedby="custom-exponent-hint"
                  />
                  <p
                    id="custom-exponent-hint"
                    className="text-xs text-muted-foreground"
                  >
                    Valid range: 0 to 2. Typical values: 0.67 (surface area),
                    0.75 (standard), 1.0 (linear)
                  </p>
                </div>
              )}
            </div>
          )}
        </fieldset>

        <div
          className="relative btn-disabled-hint"
          data-disabled-reason={
            !baseDose || baseDose <= 0 ? "Enter a dose value first" : undefined
          }
        >
          <Button
            onClick={calculateDose}
            className="w-full"
            disabled={!baseDose || baseDose <= 0}
            aria-describedby={
              !baseDose || baseDose <= 0
                ? "calculate-disabled-reason"
                : undefined
            }
          >
            Calculate Dose
          </Button>
          {(!baseDose || baseDose <= 0) && (
            <span id="calculate-disabled-reason" className="sr-only">
              Button is disabled. Enter a dose value to enable calculation.
            </span>
          )}
        </div>

        {calculationSteps && (
          <Card
            className="mt-4 border-primary/20 bg-primary/5 scroll-mt-4"
            role="region"
            aria-label="Calculation results"
            tabIndex={-1}
          >
            <CardContent className="pt-6">
              {/* Screen reader announcement for new results */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                Calculation complete. Result: {resultDose.toFixed(4)} mg/kg for{" "}
                {animals[targetAnimal]?.name || targetAnimal}
              </div>
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">Results</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onCopyToClipboard}
                    className="flex items-center gap-2"
                    aria-label={
                      copySuccess
                        ? "Results copied to clipboard"
                        : "Copy results to clipboard"
                    }
                  >
                    {copySuccess ? (
                      <>
                        <IconCheck className="h-4 w-4" aria-hidden="true" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <IconCopy className="h-4 w-4" aria-hidden="true" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onExportResults}
                    className="flex items-center gap-2"
                    aria-label="Export results to file"
                  >
                    <IconDownload className="h-4 w-4" aria-hidden="true" />
                    Export
                  </Button>
                  <span
                    className="sr-only"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {copySuccess ? "Results copied to clipboard" : ""}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-background rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    Calculated Dose
                  </p>
                  <p className="text-2xl font-bold text-accent">
                    {resultDose.toFixed(3)} mg/kg
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Range: {uncertaintyRange.lower.toFixed(3)} -{" "}
                    {uncertaintyRange.upper.toFixed(3)} mg/kg
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge
                      variant="secondary"
                      aria-label={`Source total dose: ${formatMass(
                        doseInputUnit === "mg"
                          ? baseDose
                          : baseDosePerKg * sourceWeight,
                        true,
                      )}`}
                    >
                      Source Total:{" "}
                      {formatMass(
                        doseInputUnit === "mg"
                          ? baseDose
                          : baseDosePerKg * sourceWeight,
                        true,
                      )}
                    </Badge>
                    <Badge
                      variant="default"
                      aria-label={`Target total dose: ${formatMass(resultDose * targetWeight, true)}`}
                    >
                      Target Total:{" "}
                      {formatMass(resultDose * targetWeight, true)}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">Calculation Steps:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    {calculationSteps.steps.map(
                      (step: string, index: number) => (
                        <li key={index}>{step}</li>
                      ),
                    )}
                  </ol>
                </div>

                <div
                  className="warning-note"
                  role="note"
                  aria-label="Important disclaimer"
                >
                  <div className="flex items-start gap-2">
                    <IconAlertCircle
                      className="warning-note-icon"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="warning-note-title">Disclaimer</p>
                      <p className="warning-note-text">
                        This calculation is for research purposes only. Always
                        validate doses with experimental data and consider
                        factors like drug properties, disease state, and
                        individual variability.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  },
);

// Set display name for debugging
DoseCalculator.displayName = "DoseCalculator";
