"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { IconAlertCircle } from "@tabler/icons-react";
import { Species } from "@/lib/pharmacology/types";
import { formatDose, formatUnit, formatMass } from "@/lib/units";

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
  baseDosePerKg: number;
  animals: Record<string, Species>;
  showDilution: boolean;
  setShowDilution: (value: boolean) => void;
  dilutionFactor: string;
  handleDilutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = React.memo(
  ({
    calculationSteps,
    sourceAnimal,
    targetAnimal,
    sourceWeight,
    targetWeight,
    baseDosePerKg,
    animals,
    showDilution,
    setShowDilution,
    dilutionFactor,
    handleDilutionChange,
  }) => {
    if (!calculationSteps) return null;

    return (
      <div className="space-y-4">
        {/* Dilution Control */}
        <Card className="bg-card-elevated/50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4 flex-wrap gap-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="dilution"
                  checked={showDilution}
                  onCheckedChange={setShowDilution}
                  className="data-[state=unchecked]:bg-muted"
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
              {/* Live region for announcing dilution toggle changes */}
              <div className="sr-only" aria-live="polite" aria-atomic="true">
                {showDilution ? "Dilution factor input is now visible" : ""}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Card */}
        <Card
          className="card-hover"
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
                  <Badge
                    variant="secondary"
                    className="mt-2"
                    aria-label={`Source total dose: ${formatMass(baseDosePerKg * sourceWeight, true)}`}
                  >
                    Total: {formatMass(baseDosePerKg * sourceWeight, true)}
                  </Badge>
                </dd>
              </dl>
              <dl>
                <dt className="result-label">Target Species</dt>
                <dd className="result-value">
                  {animals[targetAnimal as keyof typeof animals].name}
                  <span className="block text-sm text-muted-foreground font-normal mt-1">
                    {targetWeight} kg
                  </span>
                  <Badge
                    variant="default"
                    className="mt-2"
                    aria-label={`Target total dose: ${formatMass(calculationSteps.calculatedDose * targetWeight, true)}`}
                  >
                    Total:{" "}
                    {formatMass(
                      calculationSteps.calculatedDose * targetWeight,
                      true,
                    )}
                  </Badge>
                </dd>
              </dl>
              <div className="space-y-3">
                <dl>
                  <dt className="result-label">Base Dose</dt>
                  <dd className="result-value">
                    {baseDosePerKg.toFixed(4)} {formatUnit("mg/kg")}
                  </dd>
                </dl>
                <dl>
                  <dt className="result-label">Calculated Dose</dt>
                  <dd className="result-value" aria-live="polite">
                    {formatDose(calculationSteps.calculatedDose)}
                  </dd>
                </dl>
                {showDilution && (parseFloat(dilutionFactor) || 1) !== 1 && (
                  <dl>
                    <dt className="result-label">Final with Dilution</dt>
                    <dd className="result-value">
                      {formatDose(calculationSteps.finalDose)}
                    </dd>
                  </dl>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculation Steps */}
        <Card
          className="card-hover"
          role="region"
          aria-label="Calculation methodology"
        >
          <CardHeader>
            <CardTitle>Calculation Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="warning-note mb-3" role="note">
              <div className="flex items-start gap-2">
                <IconAlertCircle
                  className="warning-note-icon"
                  stroke={1.5}
                  aria-hidden="true"
                />
                <p className="text-xs text-muted-foreground">
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
              {showDilution && (parseFloat(dilutionFactor) || 1) !== 1 && (
                <li className="ml-2 font-mono text-xs">
                  {`Final Dose with Dilution: ${calculationSteps.calculatedDose.toFixed(4)} × ${parseFloat(dilutionFactor) || 1} = ${formatDose(calculationSteps.finalDose)}`}
                </li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    );
  },
);

// Set display name for debugging
ResultsDisplay.displayName = "ResultsDisplay";
