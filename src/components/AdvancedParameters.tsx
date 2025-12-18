"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IconRefresh, IconAlertCircle } from "@tabler/icons-react";
import {
  KidneyFunctionMethod,
  BioavailabilityMethod,
  PatientSex,
  CreatinineUnit,
} from "@/lib/pharmacology/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdvancedParametersProps {
  kidneyFunctionMethod: KidneyFunctionMethod;
  setKidneyFunctionMethod: (value: KidneyFunctionMethod) => void;
  kidneyFunction: number;
  setKidneyFunction: (value: number) => void;
  fractionExcretedRenal: number;
  setFractionExcretedRenal: (value: number) => void;
  patientAge: number;
  setPatientAge: (value: number) => void;
  patientCreatinine: number;
  setPatientCreatinine: (value: number) => void;
  creatinineUnit: CreatinineUnit;
  setCreatinineUnit: (value: CreatinineUnit) => void;
  patientSex: PatientSex;
  setPatientSex: (value: PatientSex) => void;
  bioavailabilityMethod: BioavailabilityMethod;
  setBioavailabilityMethod: (value: BioavailabilityMethod) => void;
  bioavailability: number;
  setBioavailability: (value: number) => void;
  resetAll: () => void;
}

export const AdvancedParameters: React.FC<AdvancedParametersProps> = ({
  kidneyFunctionMethod,
  setKidneyFunctionMethod,
  kidneyFunction,
  setKidneyFunction,
  fractionExcretedRenal,
  setFractionExcretedRenal,
  patientAge,
  setPatientAge,
  patientCreatinine,
  setPatientCreatinine,
  creatinineUnit,
  setCreatinineUnit,
  patientSex,
  setPatientSex,
  bioavailabilityMethod,
  setBioavailabilityMethod,
  bioavailability,
  setBioavailability,
  resetAll,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          onClick={resetAll}
          aria-label="Reset all advanced parameters to default values"
        >
          <IconRefresh
            className="h-4 w-4 mr-2"
            stroke={1.5}
            aria-hidden="true"
          />
          Reset All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-2 bg-card-elevated/50 card-hover">
          <CardHeader>
            <CardTitle className="text-sm">Kidney Function</CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset className="radio-fieldset">
              <legend className="sr-only">
                Kidney function calculation method
              </legend>
              <RadioGroup
                value={kidneyFunctionMethod}
                onValueChange={(v: string) =>
                  setKidneyFunctionMethod(v as KidneyFunctionMethod)
                }
                aria-label="Kidney function method"
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
                      id="kidney-function-manual"
                      type="number"
                      value={kidneyFunction}
                      onChange={(e) =>
                        setKidneyFunction(Number(e.target.value) || 0)
                      }
                      className="w-16 ml-2"
                      step="1"
                      min={0}
                      max={100}
                      aria-label="Kidney function percentage"
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
            </fieldset>
            {kidneyFunctionMethod !== "none" && (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col">
                  <Label htmlFor="fe-renal" className="text-sm mb-1">
                    Fraction Excreted Unchanged (fe)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="fe-renal"
                      type="number"
                      value={fractionExcretedRenal}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (!isNaN(val) && val >= 0 && val <= 1) {
                          setFractionExcretedRenal(val);
                        }
                      }}
                      className="w-20"
                      step="0.1"
                      min="0"
                      max="1"
                    />
                    <span className="text-xs text-muted-foreground">
                      (0 = hepatic, 1 = renal)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Examples: Aminoglycosides=0.95, Digoxin=0.7, Metformin=0.9
                  </p>
                </div>
              </div>
            )}
            {kidneyFunctionMethod === "cockcroft" && (
              <div
                className="mt-3 grid grid-cols-2 gap-2"
                role="group"
                aria-label="Cockcroft-Gault parameters"
              >
                <div className="flex flex-col">
                  <Label htmlFor="patient-age">Age (years)</Label>
                  <Input
                    id="patient-age"
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
                  <Label htmlFor="patient-creatinine">Serum Creatinine</Label>
                  <div className="flex items-center gap-1">
                    <Input
                      id="patient-creatinine"
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
                    <Select
                      value={creatinineUnit}
                      onValueChange={(v: string) =>
                        setCreatinineUnit(v as CreatinineUnit)
                      }
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mg/dL">mg/dL</SelectItem>
                        <SelectItem value="umol/L">µmol/L</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <fieldset className="col-span-2 radio-fieldset">
                  <legend className="text-sm font-medium mb-2">Sex</legend>
                  <RadioGroup
                    value={patientSex}
                    onValueChange={(v: string) =>
                      setPatientSex(v as PatientSex)
                    }
                    className="flex space-x-4"
                    aria-label="Patient sex"
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
                </fieldset>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="p-2 bg-card-elevated/50 card-hover">
          <CardHeader>
            <CardTitle className="text-sm">Bioavailability</CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset className="radio-fieldset">
              <legend className="sr-only">Bioavailability method</legend>
              <RadioGroup
                value={bioavailabilityMethod}
                onValueChange={(v: string) =>
                  setBioavailabilityMethod(v as BioavailabilityMethod)
                }
                aria-label="Bioavailability calculation method"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manual" id="bio-manual" />
                  <Label htmlFor="bio-manual" className="text-sm">
                    Manual (%)
                  </Label>
                  {bioavailabilityMethod === "manual" && (
                    <Input
                      id="bioavailability-manual"
                      type="number"
                      value={bioavailability}
                      onChange={(e) =>
                        setBioavailability(Number(e.target.value) || 0)
                      }
                      className="w-16 ml-2"
                      step="1"
                      min={0}
                      max={100}
                      aria-label="Bioavailability percentage"
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
            </fieldset>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h4 className="font-medium mb-2">Active Parameter Effects</h4>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {bioavailabilityMethod === "manual" && bioavailability < 100 && (
                <li>
                  Bioavailability adjustment factor:{" "}
                  {(100 / bioavailability).toFixed(2)}x
                </li>
              )}
              {bioavailabilityMethod === "oral" && (
                <li>
                  Bioavailability adjustment factor: 2x (50% oral
                  bioavailability)
                </li>
              )}
              {bioavailabilityMethod === "other" && (
                <li>
                  Bioavailability adjustment factor: 1.33x (75% bioavailability)
                </li>
              )}
              {kidneyFunctionMethod === "manual" && kidneyFunction < 100 && (
                <li>
                  Reduced kidney function ({kidneyFunction}%) reduces dose by{" "}
                  {100 - kidneyFunction}%
                </li>
              )}
              {kidneyFunctionMethod === "cockcroft" && (
                <li>Cockcroft-Gault GFR-based dose adjustment active</li>
              )}
              {kidneyFunctionMethod === "none" &&
                bioavailabilityMethod === "manual" &&
                bioavailability === 100 && (
                  <li className="text-muted-foreground">
                    No adjustments currently active
                  </li>
                )}
              {kidneyFunctionMethod === "none" &&
                bioavailabilityMethod === "iv" && (
                  <li className="text-muted-foreground">
                    No adjustments currently active (IV = 100% bioavailability)
                  </li>
                )}
            </ul>
          </div>

          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <IconAlertCircle
                className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5"
                stroke={1.5}
              />
              <div>
                <h4 className="font-medium text-amber-500 mb-1">
                  Note on Removed Parameters
                </h4>
                <p className="text-sm text-muted-foreground">
                  Protein binding, volume of distribution, molecular weight, and
                  LogP adjustments were removed in v0.8.0 as they lacked proper
                  scientific citation and could produce misleading results. For
                  compound-specific adjustments, use dedicated PBPK modeling
                  tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
