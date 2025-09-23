'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { IconAlertCircle } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Animal } from "@/lib/pharmacology/types";

interface ResultsDisplayProps {
  calculationSteps: any;
  sourceAnimal: string;
  targetAnimal: string;
  sourceWeight: number;
  targetWeight: number;
  baseDose: number;
  animals: Record<string, Animal>;
  showDilution: boolean;
  setShowDilution: (value: boolean) => void;
  dilutionFactor: string;
  handleDilutionChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDarkMode: boolean;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
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
  isDarkMode
}) => {
  if (!calculationSteps) return null;

  return (
    <>
      {/* Dilution Control */}
      <Card className="bg-secondary mb-4">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="dilution"
                checked={showDilution}
                onCheckedChange={setShowDilution}
                className={cn(
                  "bg-primary",
                  isDarkMode && "data-[state=unchecked]:bg-slate-700"
                )}
              />
              <Label htmlFor="dilution">Show Dilution</Label>
            </div>
            {showDilution && (
              <div className="flex items-center space-x-2">
                <Input
                  id="dilutionFactor"
                  value={dilutionFactor}
                  onChange={handleDilutionChange}
                  type="number"
                  className="w-24"
                  step="0.1"
                  min="0"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Source Animal</Label>
              <div className="text-2xl font-bold">
                {animals[sourceAnimal as keyof typeof animals].name}
              </div>
              <div className="text-sm text-muted-foreground">
                {sourceWeight} kg
              </div>
            </div>
            <div>
              <Label>Target Animal</Label>
              <div className="text-2xl font-bold">
                {animals[targetAnimal as keyof typeof animals].name}
              </div>
              <div className="text-sm text-muted-foreground">
                {targetWeight} kg
              </div>
            </div>
            <div>
              <Label>Base Dose</Label>
              <div className="text-2xl font-bold">
                {baseDose} mg
              </div>
              <Label className="mt-4">Calculated Dose</Label>
              <div className="text-2xl font-bold text-orange-500">
                {calculationSteps.calculatedDose.toFixed(4)} mg
              </div>
              {showDilution && Number(dilutionFactor) !== 1 && (
                <div className="text-2xl font-bold text-orange-500">
                  Final with dilution: {calculationSteps.finalDose.toFixed(4)} mg
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculation Steps */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Calculation Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-2 mb-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-2">
              <IconAlertCircle className="h-4 w-4 text-orange-600 mt-0.5" stroke={1.5} />
              <p className="text-xs text-orange-700 dark:text-orange-300">
                Values use species averages with ±30% typical variation. Individual animals may differ significantly.
              </p>
            </div>
          </div>
          <div className="text-sm space-y-1">
            {calculationSteps.steps.map((step: string, index: number) => (
              <p key={index} className="ml-2 font-mono text-xs">{step}</p>
            ))}
            {showDilution && Number(dilutionFactor) !== 1 && (
              <p className="ml-2 font-mono text-xs">
                {`${calculationSteps.steps.length + 1}. Final Dose with Dilution: ${calculationSteps.calculatedDose.toFixed(4)} × ${dilutionFactor} = ${calculationSteps.finalDose.toFixed(4)} mg`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};