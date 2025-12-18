"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Species } from "@/lib/pharmacology/types";

interface CalculationSteps {
  calculatedDose: number;
  finalDose: number;
  steps: string[];
}

interface ResultsDisplayProps {
  calculationSteps: CalculationSteps | null;
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  animals: Record<string, Species>;
  showDilution: boolean;
  setShowDilution: (value: boolean) => void;
  dilutionFactor: string;
  handleDilutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDarkMode: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(
  ({
    calculationSteps,
    sourceAnimal,
    targetAnimal,
    sourceWeight,
    targetWeight,
    baseDose,
    animals,
    showDilution,
    setShowDilution,
    dilutionFactor,
    handleDilutionChange,
    isDarkMode,
  }) => {
    if (!calculationSteps) return null;

    return (
      <>
        {/* Dilution Control */}
        <Card className="bg-secondary mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dilution"
                  checked={showDilution}
                  onCheckedChange={setShowDilution}
                  className={cn(
                    "bg-primary",
                    isDarkMode && "data-[state=unchecked]:bg-slate-700",
                  )}
                  aria-describedby="dilution-description"
                />
                <Label htmlFor="dilution">Show Dilution</Label>
              </div>
              {showDilution && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="dilutionFactor" className="text-sm">
                    Dilution Factor:
                  </Label>
                  <Input
                    id="dilutionFactor"
                    value={dilutionFactor}
                    onChange={handleDilutionChange}
                    type="number"
                    className="w-24"
                    step="0.1"
                    min="0"
                    aria-describedby="dilution-description"
                  />
                </div>
              )}
              <p id="dilution-description" className="sr-only">
                Enable to apply a dilution factor to the calculated dose
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card
          className="mb-4 card-hover"
          role="region"
          aria-label="Calculation results summary"
        >
          <CardHeader>
            <CardTitle>Results Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <dl>
                <dt className="result-label">Source Species</dt>
                <dd className="result-value">
                  {animals[sourceAnimal as keyof typeof animals].name}
                  <span className="block text-sm text-muted-foreground font-normal mt-1">
                    {sourceWeight} kg
                  </span>
                </dd>
              </dl>
              <dl>
                <dt className="result-label">Target Species</dt>
                <dd className="result-value">
                  {animals[targetAnimal as keyof typeof animals].name}
                  <span className="block text-sm text-muted-foreground font-normal mt-1">
                    {targetWeight} kg
                  </span>
                </dd>
              </dl>
              <div className="space-y-3">
                <dl>
                  <dt className="result-label">Base Dose</dt>
                  <dd className="result-value">{baseDose} mg</dd>
                </dl>
                <dl>
                  <dt className="result-label">Calculated Dose</dt>
                  <dd className="result-value text-accent" aria-live="polite">
                    {calculationSteps.calculatedDose.toFixed(4)} mg
                  </dd>
                </dl>
                {showDilution && Number(dilutionFactor) !== 1 && (
                  <dl>
                    <dt className="result-label">Final with Dilution</dt>
                    <dd className="result-value text-accent">
                      {calculationSteps.finalDose.toFixed(4)} mg
                    </dd>
                  </dl>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Steps */}
        <Card
          className="mb-4 card-hover"
          role="region"
          aria-label="Calculation methodology"
        >
          <CardHeader>
            <CardTitle>Calculation Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="p-2 mb-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
              role="note"
            >
              <div className="flex items-start gap-2">
                <IconAlertCircle
                  className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0"
                  stroke={1.5}
                  aria-hidden="true"
                />
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  <strong>Note:</strong> Values use species averages with ±30%
                  typical variation. Individual animals may differ
                  significantly.
                </p>
              </div>
            </div>
            <ol
              className="text-sm space-y-1 list-decimal list-inside"
              aria-label="Step-by-step calculation breakdown"
            >
              {calculationSteps.steps.map((step: string, index: number) => (
                <li key={index} className="ml-2 font-mono text-xs">
                  {step.replace(/^\d+\.\s*/, "")}
                </li>
              ))}
              {showDilution && Number(dilutionFactor) !== 1 && (
                <li className="ml-2 font-mono text-xs">
                  {`Final Dose with Dilution: ${calculationSteps.calculatedDose.toFixed(4)} × ${dilutionFactor} = ${calculationSteps.finalDose.toFixed(4)} mg`}
                </li>
              )}
            </ol>
          </CardContent>
        </Card>
      </>
    );
  },
);

// Set display name for debugging
ResultsDisplay.displayName = "ResultsDisplay";
