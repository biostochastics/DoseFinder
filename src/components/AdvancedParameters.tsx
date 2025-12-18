"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { IconRefresh } from "@tabler/icons-react";
import {
  KidneyFunctionMethod,
  BioavailabilityMethod,
  PatientSex,
  CreatinineUnit,
  BIOAVAILABILITY_DEFAULTS,
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
          className="gap-2"
          aria-label="Reset all advanced parameters to default values"
        >
          <IconRefresh className="h-4 w-4" stroke={1.5} aria-hidden="true" />
          Reset All
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card-elevated/50 card-hover">
          <CardHeader className="pb-2">
            <CardTitle>Kidney Function</CardTitle>
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
                      className="w-24 ml-2"
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
                      className="w-24"
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
                    className="w-24"
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
                      className="w-24"
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

        <Card className="bg-card-elevated/50 card-hover">
          <CardHeader className="pb-2">
            <CardTitle>Bioavailability</CardTitle>
            <p className="text-sm text-muted-foreground">
              Route of Administration
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="bioavailability-route" className="text-sm">
                  Route
                </Label>
                <Select
                  value={bioavailabilityMethod}
                  onValueChange={(v: string) =>
                    setBioavailabilityMethod(v as BioavailabilityMethod)
                  }
                >
                  <SelectTrigger id="bioavailability-route" className="w-full">
                    <SelectValue placeholder="Select route" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                    <SelectItem value="iv">IV - Intravenous (100%)</SelectItem>
                    <SelectItem value="im">
                      IM - Intramuscular (~85%)
                    </SelectItem>
                    <SelectItem value="sc">SC - Subcutaneous (~70%)</SelectItem>
                    <SelectItem value="oral">Oral (~50%)</SelectItem>
                    <SelectItem value="rectal">Rectal (~65%)</SelectItem>
                    <SelectItem value="sublingual">
                      Sublingual (~70%)
                    </SelectItem>
                    <SelectItem value="transdermal">
                      Transdermal (~35%)
                    </SelectItem>
                    <SelectItem value="inhalation">
                      Inhalation (~25%)
                    </SelectItem>
                    <SelectItem value="other">Other (~75%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bioavailabilityMethod === "manual" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bioavailability-manual" className="text-sm">
                    Custom Bioavailability (%)
                  </Label>
                  <Input
                    id="bioavailability-manual"
                    type="number"
                    value={bioavailability}
                    onChange={(e) =>
                      setBioavailability(Number(e.target.value) || 0)
                    }
                    className="w-24"
                    step="1"
                    min={0}
                    max={100}
                    aria-label="Bioavailability percentage"
                  />
                </div>
              )}

              {bioavailabilityMethod !== "manual" &&
                bioavailabilityMethod !== "iv" && (
                  <div className="warning-note">
                    <p className="warning-note-title text-sm mb-1">
                      Literature Range:{" "}
                      {
                        BIOAVAILABILITY_DEFAULTS[bioavailabilityMethod].range
                          .min
                      }
                      –
                      {
                        BIOAVAILABILITY_DEFAULTS[bioavailabilityMethod].range
                          .max
                      }
                      %
                    </p>
                    <p className="warning-note-text">
                      {BIOAVAILABILITY_DEFAULTS[bioavailabilityMethod].caveat}
                    </p>
                  </div>
                )}

              {bioavailabilityMethod === "oral" && (
                <div className="destructive-note">
                  <p className="destructive-note-title text-sm">
                    Oral bioavailability is highly variable (5–99%)
                  </p>
                  <p className="destructive-note-text mt-1">
                    Use drug-specific values when available. Examples:
                    Propranolol ~26%, Morphine ~30%, Metformin ~50–60%.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <h4 className="text-sm font-medium mb-2">
              Active Parameter Effects
            </h4>
            <ul className="text-sm space-y-1 list-disc pl-4">
              {bioavailabilityMethod === "manual" &&
                bioavailability > 0 &&
                bioavailability < 100 && (
                  <li>
                    Bioavailability adjustment factor:{" "}
                    {(100 / bioavailability).toFixed(2)}x (manual:{" "}
                    {bioavailability}%)
                  </li>
                )}
              {bioavailabilityMethod !== "manual" &&
                bioavailabilityMethod !== "iv" && (
                  <li>
                    Bioavailability adjustment factor:{" "}
                    {(
                      100 /
                      BIOAVAILABILITY_DEFAULTS[bioavailabilityMethod].value
                    ).toFixed(2)}
                    x ({bioavailabilityMethod.toUpperCase()}:{" "}
                    {BIOAVAILABILITY_DEFAULTS[bioavailabilityMethod].value}%)
                  </li>
                )}
              {kidneyFunctionMethod === "manual" && kidneyFunction < 100 && (
                <li>
                  Reduced kidney function ({kidneyFunction}%) reduces dose, with
                  the reduction scaled by the renal fraction (fe ={" "}
                  {fractionExcretedRenal.toFixed(2)})
                </li>
              )}
              {kidneyFunctionMethod === "cockcroft" &&
                patientAge > 0 &&
                patientCreatinine > 0 && (
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
        </div>
      </div>
    </div>
  );
};
