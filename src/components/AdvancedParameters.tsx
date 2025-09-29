"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IconRefresh } from "@tabler/icons-react";

interface AdvancedParametersProps {
  kidneyFunctionMethod: string;
  setKidneyFunctionMethod: (value: string) => void;
  kidneyFunction: number;
  setKidneyFunction: (value: number) => void;
  patientAge: number;
  setPatientAge: (value: number) => void;
  patientCreatinine: number;
  setPatientCreatinine: (value: number) => void;
  patientSex: string;
  setPatientSex: (value: string) => void;
  bioavailabilityMethod: string;
  setBioavailabilityMethod: (value: string) => void;
  bioavailability: number;
  setBioavailability: (value: number) => void;
  proteinBinding: number;
  setProteinBinding: (value: number) => void;
  volumeDistribution: number;
  setVolumeDistribution: (value: number) => void;
  molecularWeight: number;
  setMolecularWeight: (value: number) => void;
  logP: number;
  setLogP: (value: number) => void;
  resetAll: () => void;
}

export const AdvancedParameters: React.FC<AdvancedParametersProps> = ({
  kidneyFunctionMethod,
  setKidneyFunctionMethod,
  kidneyFunction,
  setKidneyFunction,
  patientAge,
  setPatientAge,
  patientCreatinine,
  setPatientCreatinine,
  patientSex,
  setPatientSex,
  bioavailabilityMethod,
  setBioavailabilityMethod,
  bioavailability,
  setBioavailability,
  proteinBinding,
  setProteinBinding,
  volumeDistribution,
  setVolumeDistribution,
  molecularWeight,
  setMolecularWeight,
  logP,
  setLogP,
  resetAll,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <Button variant="outline" onClick={resetAll}>
          <IconRefresh className="h-4 w-4 mr-2" stroke={1.5} />
          Reset All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-2 bg-card-elevated/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-sm">Kidney Function</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={kidneyFunctionMethod}
              onValueChange={(v: any) => setKidneyFunctionMethod(v)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="kf-none" />
                <Label htmlFor="kf-none" className="text-sm">
                  None
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="manual" id="kf-manual" />
                <Label htmlFor="kf-manual" className="text-sm">
                  Manual %
                </Label>
                {kidneyFunctionMethod === "manual" && (
                  <Input
                    type="number"
                    value={kidneyFunction}
                    onChange={(e) =>
                      setKidneyFunction(Number(e.target.value) || 0)
                    }
                    className="w-16 ml-2"
                    step="1"
                    min={0}
                    max={100}
                  />
                )}
              </div>
              <div className="flex items-start mt-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cockcroft" id="kf-cg" />
                  <Label htmlFor="kf-cg" className="text-sm">
                    Cockcroft-Gault
                  </Label>
                </div>
              </div>
            </RadioGroup>
            {kidneyFunctionMethod === "cockcroft" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex flex-col">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={patientAge}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val >= 0) {
                        setPatientAge(val);
                      }
                    }}
                    className="w-20"
                    min="0"
                  />
                </div>
                <div className="flex flex-col">
                  <Label>S.Creatinine (mg/dL)</Label>
                  <Input
                    type="number"
                    value={patientCreatinine}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val) && val > 0) {
                        setPatientCreatinine(val);
                      }
                    }}
                    className="w-20"
                    step="0.1"
                    min="0.1"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="mb-2 block">Sex</Label>
                  <RadioGroup
                    value={patientSex}
                    onValueChange={setPatientSex}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="sex-male" />
                      <Label htmlFor="sex-male" className="text-sm">
                        Male
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="sex-female" />
                      <Label htmlFor="sex-female" className="text-sm">
                        Female
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-2 bg-card-elevated/50 hover:shadow-md transition-all duration-200">
          <CardHeader>
            <CardTitle className="text-sm">Bioavailability</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={bioavailabilityMethod}
              onValueChange={(v: any) => setBioavailabilityMethod(v)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="bio-manual" />
                <Label htmlFor="bio-manual" className="text-sm">
                  Manual (%)
                </Label>
                {bioavailabilityMethod === "manual" && (
                  <Input
                    type="number"
                    value={bioavailability}
                    onChange={(e) =>
                      setBioavailability(Number(e.target.value) || 0)
                    }
                    className="w-16 ml-2"
                    step="1"
                    min={0}
                    max={100}
                  />
                )}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="iv" id="bio-iv" />
                <Label htmlFor="bio-iv" className="text-sm">
                  IV (100%)
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="oral" id="bio-oral" />
                <Label htmlFor="bio-oral" className="text-sm">
                  Oral (~50%)
                </Label>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="other" id="bio-other" />
                <Label htmlFor="bio-other" className="text-sm">
                  Other (~75%)
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="proteinBinding">Protein Binding (%)</Label>
          <Input
            id="proteinBinding"
            type="number"
            value={proteinBinding.toString()}
            onChange={(e) => setProteinBinding(Number(e.target.value) || 0)}
            className="w-24"
            min="0"
            max="100"
            step="1"
          />
          <p className="text-xs text-muted-foreground">
            Percentage of drug bound to plasma proteins
          </p>

          <Label htmlFor="volumeDistribution">
            Volume of Distribution (L/kg)
          </Label>
          <Input
            id="volumeDistribution"
            type="number"
            value={volumeDistribution.toString()}
            onChange={(e) => setVolumeDistribution(Number(e.target.value) || 0)}
            className="w-24"
            min="0"
            step="0.1"
          />
          <p className="text-xs text-muted-foreground">
            Apparent volume of distribution per kg body weight
          </p>

          <Label htmlFor="molecularWeight">Molecular Weight (g/mol)</Label>
          <Input
            id="molecularWeight"
            type="number"
            value={molecularWeight.toString()}
            onChange={(e) => setMolecularWeight(Number(e.target.value) || 0)}
            className="w-24"
            min="0"
            step="1"
          />
          <p className="text-xs text-muted-foreground">
            Affects scaling exponent for molecules {">"}400 g/mol
          </p>

          <Label htmlFor="logP">Log P</Label>
          <Input
            id="logP"
            type="number"
            value={logP.toString()}
            onChange={(e) => setLogP(Number(e.target.value) || 0)}
            className="w-24"
            step="0.1"
          />
          <p className="text-xs text-muted-foreground">
            Lipophilicity coefficient (negative for hydrophilic)
          </p>
        </div>

        <div className="space-y-2">
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h4 className="font-medium mb-2">Advanced Parameter Effects</h4>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {proteinBinding > 0 && (
                <li>
                  Protein binding reduces available drug by {proteinBinding}%
                </li>
              )}
              {bioavailabilityMethod === "manual" && bioavailability < 100 && (
                <li>
                  Bioavailability adjustment factor:{" "}
                  {(100 / bioavailability).toFixed(2)}x
                </li>
              )}
              {bioavailabilityMethod === "oral" && (
                <li>Bioavailability adjustment factor: 2x</li>
              )}
              {bioavailabilityMethod === "other" && (
                <li>Bioavailability adjustment factor: 1.33x</li>
              )}
              {kidneyFunctionMethod === "manual" && kidneyFunction < 100 && (
                <li>
                  Reduced kidney function ({kidneyFunction}%) affects clearance
                </li>
              )}
              {kidneyFunctionMethod === "cockcroft" && (
                <li>Cockcroft-Gault GFR adjustment</li>
              )}
              {volumeDistribution > 0 && (
                <li>Volume of distribution: {volumeDistribution} L/kg</li>
              )}
              {molecularWeight > 0 && (
                <li>
                  Molecular weight affects scaling:{" "}
                  {molecularWeight > 700
                    ? "0.7"
                    : molecularWeight > 400
                      ? "0.75"
                      : "0.8"}
                </li>
              )}
              {logP !== 0 && (
                <li>
                  LogP adjustment factor:{" "}
                  {(1 + Math.abs(logP) * 0.1).toFixed(2)}x
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
