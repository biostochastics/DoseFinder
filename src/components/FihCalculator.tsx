"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { useAnnounce, LiveRegion } from "@/hooks/useAnnounce";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  IconAlertTriangle,
  IconInfoCircle,
  IconAlertCircle,
  IconPlus,
  IconTrash,
  IconCalculator,
  IconClipboardCopy,
  IconDownload,
  IconBook,
  IconExternalLink,
} from "@tabler/icons-react";
import { Math } from "@/components/ui/math";
import {
  calculateFdaFihDose,
  getSupportedSpecies,
  validateFihInput,
  type FihDoseResult,
  type FihWarning,
} from "@/lib/pharmacology/fda";
import {
  SAFETY_FACTOR_GUIDANCE,
  REGULATORY_REFERENCES,
} from "@/lib/pharmacology/constants";
import type { DrugModality } from "@/lib/pharmacology/constants";

// ============================================================================
// Types
// ============================================================================

interface SpeciesNoael {
  species: string;
  noael: number;
}

// ============================================================================
// Helper Components
// ============================================================================

function WarningBadge({ warning }: { warning: FihWarning }) {
  const SeverityIcon = {
    info: IconInfoCircle,
    warning: IconAlertCircle,
    critical: IconAlertTriangle,
  }[warning.severity];

  // Use Alert component for info and warning, keep custom styling for critical
  if (warning.severity === "critical") {
    return (
      <div
        className="p-3 rounded-md border bg-red-500/10 text-red-700 border-red-500/30 mb-2"
        role="alert"
      >
        <div className="flex items-start gap-2">
          <SeverityIcon className="h-4 w-4 mt-0.5 flex-shrink-0" stroke={1.5} />
          <div className="space-y-1">
            <p className="text-sm font-medium">{warning.message}</p>
            {warning.recommendation && (
              <p className="text-xs opacity-80">{warning.recommendation}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Alert
      className={
        warning.severity === "warning"
          ? "border-warning/40 bg-warning/10 mb-2"
          : "mb-2"
      }
    >
      <SeverityIcon className="h-4 w-4" stroke={1.5} />
      <AlertTitle className="text-sm font-medium">{warning.message}</AlertTitle>
      {warning.recommendation && (
        <AlertDescription className="text-xs opacity-80">
          {warning.recommendation}
        </AlertDescription>
      )}
    </Alert>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function FihCalculator() {
  // Input state
  const [primarySpecies, setPrimarySpecies] = useState<string>("mouse");
  const [primaryNoael, setPrimaryNoael] = useState<string>("100");
  const [safetyFactor, setSafetyFactor] = useState<string>("10");
  const [customSafetyFactor, setCustomSafetyFactor] = useState<string>("10");
  const [modality, setModality] = useState<DrugModality>("small_molecule");
  const [humanWeight, setHumanWeight] = useState<string>("60");
  const [additionalSpecies, setAdditionalSpecies] = useState<SpeciesNoael[]>(
    [],
  );

  // Result state
  const [result, setResult] = useState<FihDoseResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // Accessibility: Screen reader announcements
  const { announcement, announce } = useAnnounce();

  // Ref for error focus management
  const primaryNoaelRef = useRef<HTMLInputElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  // Get supported species
  const supportedSpecies = useMemo(() => getSupportedSpecies(), []);

  // Add additional species
  const addSpecies = useCallback(() => {
    setAdditionalSpecies((prev) => [...prev, { species: "rat", noael: 50 }]);
  }, []);

  // Remove additional species
  const removeSpecies = useCallback((index: number) => {
    setAdditionalSpecies((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Update additional species
  const updateSpecies = useCallback(
    (index: number, field: keyof SpeciesNoael, value: string | number) => {
      setAdditionalSpecies((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      );
    },
    [],
  );

  // Calculate FIH dose
  const calculate = useCallback(() => {
    const parsedNoael = parseFloat(primaryNoael);
    const parsedHumanWeight = parseFloat(humanWeight);
    const parsedSafetyFactor =
      safetyFactor === "custom"
        ? parseFloat(customSafetyFactor)
        : parseFloat(safetyFactor);

    // Validate numeric inputs before proceeding
    const immediateErrors: string[] = [];

    if (!Number.isFinite(parsedNoael) || parsedNoael <= 0) {
      immediateErrors.push("NOAEL must be a positive number");
    }

    if (!Number.isFinite(parsedSafetyFactor) || parsedSafetyFactor < 1) {
      immediateErrors.push("Safety factor must be at least 1");
    }

    if (!Number.isFinite(parsedHumanWeight) || parsedHumanWeight <= 0) {
      immediateErrors.push("Human reference weight must be a positive number");
    }

    if (immediateErrors.length > 0) {
      setErrors(immediateErrors);
      setResult(null);
      // Announce errors and focus on first error field
      announce(
        `Validation failed. ${immediateErrors.length} error${immediateErrors.length > 1 ? "s" : ""}: ${immediateErrors[0]}`,
      );
      // Focus on the error container or first input
      setTimeout(() => {
        errorContainerRef.current?.focus();
      }, 100);
      return;
    }

    const input = {
      noael: parsedNoael,
      animalSpecies: primarySpecies,
      safetyFactor: parsedSafetyFactor,
      modality,
      humanWeight: parsedHumanWeight,
      additionalSpeciesData:
        additionalSpecies.length > 0 ? additionalSpecies : undefined,
    };

    // Validate input
    const validationErrors = validateFihInput(input);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setResult(null);
      // Announce validation errors
      announce(
        `Validation failed. ${validationErrors.length} error${validationErrors.length > 1 ? "s" : ""}: ${validationErrors[0]}`,
      );
      setTimeout(() => {
        errorContainerRef.current?.focus();
      }, 100);
      return;
    }

    setErrors([]);
    const calculationResult = calculateFdaFihDose(input);
    setResult(calculationResult);

    // Announce successful calculation
    if (calculationResult.mrsd > 0) {
      announce(
        `Calculation complete. Maximum Recommended Starting Dose: ${calculationResult.mrsd.toFixed(4)} mg/kg, ` +
          `which equals ${calculationResult.mrsdTotal.toFixed(2)} mg for a ${calculationResult.humanWeight} kg adult.`,
      );
    }
  }, [
    primarySpecies,
    primaryNoael,
    safetyFactor,
    customSafetyFactor,
    modality,
    humanWeight,
    additionalSpecies,
    announce,
  ]);

  // Copy results to clipboard
  const copyResults = useCallback(() => {
    if (!result) return;

    const text = `FDA FIH Starting Dose Calculation
=================================
Generated: ${new Date().toLocaleString()}

INPUT PARAMETERS
----------------
Primary Species: ${primarySpecies}
NOAEL: ${primaryNoael} mg/kg
Safety Factor: ${safetyFactor === "custom" ? customSafetyFactor : safetyFactor}×
Drug Modality: ${modality}
Human Reference Weight: ${humanWeight} kg
${
  additionalSpecies.length > 0
    ? `
Additional Species Data:
${additionalSpecies.map((s) => `  - ${s.species}: ${s.noael} mg/kg`).join("\n")}`
    : ""
}

RESULTS
-------
Human Equivalent Dose (HED): ${result.hed.toFixed(4)} mg/kg
Maximum Recommended Starting Dose (MRSD): ${result.mrsd.toFixed(4)} mg/kg
Total Dose for ${result.humanWeight} kg human: ${result.mrsdTotal.toFixed(2)} mg

${
  result.recommendedMrsd
    ? `RECOMMENDED MRSD: ${result.recommendedMrsd.value.toFixed(4)} mg/kg
Source: ${result.recommendedMrsd.source}
Rationale: ${result.recommendedMrsd.rationale}
`
    : ""
}
CALCULATION STEPS
-----------------
${result.steps
  .map(
    (step, i) => `${i + 1}. ${step.description}
   Formula: ${step.formula}
   Result: ${step.result} ${step.unit}`,
  )
  .join("\n\n")}

${
  result.warnings.length > 0
    ? `
WARNINGS
--------
${result.warnings.map((w) => `[${w.severity.toUpperCase()}] ${w.message}`).join("\n")}`
    : ""
}

REGULATORY REFERENCE
--------------------
${result.regulatoryReference}

DISCLAIMER
----------
FOR RESEARCH AND EDUCATIONAL USE ONLY. This calculation is provided as an
estimation tool and should NOT be used for clinical dosing without proper
validation by qualified professionals. Always consult appropriate regulatory
guidance documents and seek expert advice for IND submissions.
`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        announce("Results copied to clipboard");
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        // Clipboard write failed (permission denied or API unavailable)
        setCopySuccess(false);
        announce("Failed to copy results to clipboard");
      });
  }, [
    result,
    primarySpecies,
    primaryNoael,
    safetyFactor,
    customSafetyFactor,
    modality,
    humanWeight,
    additionalSpecies,
    announce,
  ]);

  // Export results to file
  const exportResults = useCallback(() => {
    if (!result) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const effectiveSafetyFactor =
      safetyFactor === "custom" ? customSafetyFactor : safetyFactor;

    const exportText = `FDA First-in-Human Starting Dose Calculation Report
===================================================
Generated: ${new Date().toLocaleString()}
Export ID: ${timestamp}

INPUT PARAMETERS
================
Drug Modality: ${modality}
Primary Animal Species: ${primarySpecies}
NOAEL: ${primaryNoael} mg/kg
Safety Factor: ${effectiveSafetyFactor}×
Human Reference Weight: ${humanWeight} kg
${
  additionalSpecies.length > 0
    ? `
Additional Species Data:
${additionalSpecies.map((s) => `  - ${s.species}: ${s.noael} mg/kg NOAEL`).join("\n")}`
    : ""
}

RESULTS
=======
Human Equivalent Dose (HED): ${result.hed.toFixed(4)} mg/kg
Maximum Recommended Starting Dose (MRSD): ${result.mrsd.toFixed(4)} mg/kg
Total Dose for ${result.humanWeight} kg human: ${result.mrsdTotal.toFixed(2)} mg
${
  result.recommendedMrsd
    ? `
RECOMMENDED MRSD (Most Conservative): ${result.recommendedMrsd.value.toFixed(4)} mg/kg
Source: ${result.recommendedMrsd.source}
Rationale: ${result.recommendedMrsd.rationale}
`
    : ""
}
${
  result.multiSpeciesResults && result.multiSpeciesResults.length > 1
    ? `
MULTI-SPECIES COMPARISON
========================
${result.multiSpeciesResults
  .map(
    (r) =>
      `${r.species.charAt(0).toUpperCase() + r.species.slice(1)}: NOAEL ${r.noael} mg/kg → HED ${r.hed.toFixed(4)} mg/kg → MRSD ${r.mrsd.toFixed(4)} mg/kg`,
  )
  .join("\n")}
`
    : ""
}
CALCULATION STEPS
=================
${result.steps
  .map(
    (step, i) => `${i + 1}. ${step.description}
   Formula: ${step.formula}
   Result: ${step.result} ${step.unit}`,
  )
  .join("\n\n")}

${
  result.warnings.length > 0
    ? `
WARNINGS
========
${result.warnings.map((w) => `[${w.severity.toUpperCase()}] ${w.message}${w.recommendation ? `\n   Recommendation: ${w.recommendation}` : ""}`).join("\n\n")}
`
    : ""
}
REGULATORY REFERENCE
====================
${result.regulatoryReference}

METHODOLOGY NOTES
=================
- HED calculation uses FDA 2005 Km factor method: HED = NOAEL × (Animal Km / Human Km)
- Km factors based on body surface area normalization
- Safety factors applied per FDA guidance recommendations
- For multi-species data, the most conservative (lowest) MRSD is recommended

DISCLAIMER
==========
FOR RESEARCH AND EDUCATIONAL USE ONLY. This calculation is provided as an
estimation tool and should NOT be used for clinical dosing without proper
validation by qualified professionals. Always consult appropriate regulatory
guidance documents (FDA 2005 Guidance for Industry: Estimating the Maximum
Safe Starting Dose in Initial Clinical Trials for Therapeutics in Adult
Healthy Volunteers) and seek expert advice for IND submissions.

Considerations not captured in this calculation:
- Target-mediated drug disposition (TMDD)
- Species-specific pharmacology differences
- Non-linear pharmacokinetics
- Active metabolite contributions
- Disease-state modifications

This tool does not replace regulatory consultation or expert review.
`;

    const blob = new Blob([exportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dosefinder-fih-calculation-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [
    result,
    primarySpecies,
    primaryNoael,
    safetyFactor,
    customSafetyFactor,
    modality,
    humanWeight,
    additionalSpecies,
  ]);

  return (
    <div className="space-y-4">
      {/* Screen reader live region for dynamic announcements */}
      <LiveRegion announcement={announcement} />

      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle>FDA First-in-Human Starting Dose Calculator</CardTitle>
          <CardDescription>
            Calculate Maximum Recommended Starting Dose (MRSD) using FDA 2005
            guidance methodology with Km factor scaling.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-muted/50 rounded-md text-sm">
            <p className="font-medium mb-2">Methodology</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Math altText="Human Equivalent Dose in milligrams per kilogram equals NOAEL times the ratio of animal Km to human Km">{String.raw`\text{HED (mg/kg)} = \text{NOAEL} \times \frac{K_m^{\text{animal}}}{K_m^{\text{human}}}`}</Math>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Math altText="Maximum Recommended Starting Dose in milligrams per kilogram equals Human Equivalent Dose divided by Safety Factor">{String.raw`\text{MRSD (mg/kg)} = \frac{\text{HED}}{\text{Safety Factor}}`}</Math>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Input Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drug Modality */}
          <div>
            <Label htmlFor="modality">Drug Modality</Label>
            <Select
              value={modality}
              onValueChange={(v) => setModality(v as DrugModality)}
            >
              <SelectTrigger id="modality" aria-label="Select drug modality">
                <SelectValue placeholder="Select modality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small_molecule">Small Molecule</SelectItem>
                <SelectItem value="biologic">Biologic</SelectItem>
                <SelectItem value="cell_therapy">Cell Therapy</SelectItem>
                <SelectItem value="gene_therapy">Gene Therapy</SelectItem>
              </SelectContent>
            </Select>
            {modality !== "small_molecule" && (
              <p className="text-xs text-yellow-600 mt-1">
                Note: NOAEL-based HED calculation may not be appropriate for
                this modality. Consider MABEL approach.
              </p>
            )}
          </div>

          {/* Primary Species & NOAEL */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary-species">Animal Species</Label>
              <Select value={primarySpecies} onValueChange={setPrimarySpecies}>
                <SelectTrigger
                  id="primary-species"
                  aria-label="Select animal species"
                >
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  {supportedSpecies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} (Km={s.km})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="primary-noael">NOAEL (mg/kg)</Label>
              <Input
                ref={primaryNoaelRef}
                id="primary-noael"
                type="number"
                value={primaryNoael}
                onChange={(e) => setPrimaryNoael(e.target.value)}
                min={0}
                step="0.1"
                placeholder="e.g., 100"
                aria-invalid={
                  errors.length > 0 &&
                  (!primaryNoael || parseFloat(primaryNoael) <= 0)
                }
                aria-describedby={
                  errors.length > 0 ? "fih-validation-errors" : undefined
                }
              />
            </div>
          </div>

          {/* Safety Factor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="safety-factor">Safety Factor</Label>
              <Select value={safetyFactor} onValueChange={setSafetyFactor}>
                <SelectTrigger
                  id="safety-factor"
                  aria-label="Select safety factor"
                >
                  <SelectValue placeholder="Select safety factor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SAFETY_FACTOR_GUIDANCE).map(
                    ([value, guidance]) => (
                      <SelectItem key={value} value={value}>
                        {value}× - {guidance.criteria.substring(0, 30)}...
                      </SelectItem>
                    ),
                  )}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {safetyFactor !== "custom" && (
                <p className="text-xs text-muted-foreground mt-1">
                  {SAFETY_FACTOR_GUIDANCE[parseInt(safetyFactor)]?.criteria}
                </p>
              )}
            </div>
            {safetyFactor === "custom" && (
              <div>
                <Label htmlFor="custom-sf">Custom Safety Factor</Label>
                <Input
                  id="custom-sf"
                  type="number"
                  value={customSafetyFactor}
                  onChange={(e) => setCustomSafetyFactor(e.target.value)}
                  min={1}
                  step="1"
                />
              </div>
            )}
          </div>

          {/* Human Reference Weight */}
          <div className="w-1/2">
            <Label htmlFor="human-weight">Human Reference Weight (kg)</Label>
            <Input
              id="human-weight"
              type="number"
              value={humanWeight}
              onChange={(e) => setHumanWeight(e.target.value)}
              min={30}
              max={150}
              step="1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              FDA reference: 60 kg
            </p>
          </div>

          {/* Additional Species */}
          <div className="border rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <Label>Additional Species Data (Optional)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addSpecies}
                className="gap-2"
              >
                <IconPlus className="h-4 w-4" stroke={1.5} />
                Add Species
              </Button>
            </div>
            {additionalSpecies.length > 0 && (
              <div className="space-y-2">
                {additionalSpecies.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end"
                  >
                    <div>
                      <Label className="text-xs">Species</Label>
                      <Select
                        value={item.species}
                        onValueChange={(v) =>
                          updateSpecies(index, "species", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedSpecies.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">NOAEL (mg/kg)</Label>
                      <Input
                        type="number"
                        value={item.noael}
                        onChange={(e) =>
                          updateSpecies(
                            index,
                            "noael",
                            parseFloat(e.target.value),
                          )
                        }
                        min={0}
                        step="0.1"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSpecies(index)}
                      aria-label={`Remove ${item.species}`}
                    >
                      <IconTrash className="h-4 w-4" stroke={1.5} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {additionalSpecies.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Add data from multiple species for conservative dose selection.
              </p>
            )}
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <Alert
              ref={errorContainerRef}
              className="border-destructive/40 bg-destructive/10"
              role="alert"
              aria-live="assertive"
              id="fih-validation-errors"
              tabIndex={-1}
            >
              <IconAlertTriangle
                className="h-4 w-4"
                stroke={1.5}
                aria-hidden="true"
              />
              <AlertTitle className="text-sm font-medium">
                Validation Errors
              </AlertTitle>
              <AlertDescription>
                <ul
                  className="list-disc list-inside text-sm mt-1"
                  aria-label="List of validation errors"
                >
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Calculate Button */}
          <Button onClick={calculate} className="w-full gap-2">
            <IconCalculator className="h-4 w-4" stroke={1.5} />
            Calculate MRSD
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && result.mrsd > 0 && (
        <>
          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="space-y-1">
              {result.warnings.map((warning, i) => (
                <WarningBadge key={i} warning={warning} />
              ))}
            </div>
          )}

          {/* Main Results */}
          <Card
            className="scroll-mt-4"
            role="region"
            aria-label="First-in-Human calculation results"
            tabIndex={-1}
          >
            {/* Screen reader announcement for new results */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              Calculation complete. Maximum Recommended Starting Dose:{" "}
              {result.mrsd.toFixed(4)} mg/kg, which equals{" "}
              {(result.mrsd * 60).toFixed(2)} mg for a 60 kg adult.
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Calculation Results</CardTitle>
                  <CardDescription>
                    Based on FDA 2005 Guidance methodology
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyResults}
                    className="gap-2"
                    aria-label={
                      copySuccess
                        ? "Results copied to clipboard"
                        : "Copy results to clipboard"
                    }
                  >
                    <IconClipboardCopy
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    {copySuccess ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportResults}
                    className="gap-2"
                    aria-label="Export results to file"
                  >
                    <IconDownload
                      className="h-4 w-4"
                      stroke={1.5}
                      aria-hidden="true"
                    />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">HED</p>
                  <p className="text-2xl font-bold text-accent">
                    {result.hed.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">mg/kg</p>
                </div>
                <div className="p-4 bg-primary/10 rounded-md">
                  <p className="text-sm text-primary">MRSD</p>
                  <p className="text-2xl font-bold text-accent">
                    {result.mrsd.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">mg/kg</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground">Total Dose</p>
                  <p className="text-2xl font-bold text-accent">
                    {result.mrsdTotal.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    mg (for {result.humanWeight} kg human)
                  </p>
                </div>
              </div>

              {/* Recommended MRSD for multi-species */}
              {result.recommendedMrsd && (
                <Alert className="border-green-500/30 bg-green-500/10 mb-4">
                  <IconInfoCircle
                    className="h-4 w-4 text-green-700"
                    stroke={1.5}
                  />
                  <AlertTitle className="text-sm font-medium text-green-700">
                    Recommended MRSD (Most Conservative)
                  </AlertTitle>
                  <AlertDescription>
                    <p className="text-xl font-bold text-green-700">
                      {result.recommendedMrsd.value.toFixed(4)} mg/kg
                    </p>
                    <p className="text-xs text-green-600">
                      {result.recommendedMrsd.rationale}
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              {/* Multi-species comparison */}
              {result.multiSpeciesResults &&
                result.multiSpeciesResults.length > 1 && (
                  <div className="mb-4">
                    <p
                      className="text-sm font-medium mb-2"
                      id="species-comparison-heading"
                    >
                      Species Comparison
                    </p>
                    <Table aria-labelledby="species-comparison-heading">
                      <caption className="sr-only">
                        Comparison of NOAEL, HED, and MRSD values across
                        different species
                      </caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Species</TableHead>
                          <TableHead scope="col">NOAEL (mg/kg)</TableHead>
                          <TableHead scope="col">HED (mg/kg)</TableHead>
                          <TableHead scope="col">MRSD (mg/kg)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.multiSpeciesResults.map((r, i) => (
                          <TableRow
                            key={i}
                            className={
                              r.mrsd === result.recommendedMrsd?.value
                                ? "bg-green-500/10"
                                : ""
                            }
                          >
                            <TableCell className="capitalize">
                              {r.species}
                            </TableCell>
                            <TableCell>{r.noael}</TableCell>
                            <TableCell>{r.hed.toFixed(4)}</TableCell>
                            <TableCell>{r.mrsd.toFixed(4)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

              {/* Calculation Steps */}
              <Accordion type="single" collapsible>
                <AccordionItem value="steps">
                  <AccordionTrigger>Calculation Steps</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {result.steps.map((step, i) => (
                        <div key={i} className="p-3 bg-muted/30 rounded-md">
                          <p className="font-medium text-sm">
                            Step {i + 1}: {step.description}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground mt-1">
                            {step.formula}
                          </p>
                          <p className="text-sm mt-1">
                            Result:{" "}
                            <span className="font-semibold">{step.result}</span>{" "}
                            {step.unit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Regulatory Reference */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Regulatory Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{REGULATORY_REFERENCES.FDA_2005.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {REGULATORY_REFERENCES.FDA_2005.source},{" "}
                {REGULATORY_REFERENCES.FDA_2005.date}
              </p>
              {REGULATORY_REFERENCES.FDA_2005.url && (
                <a
                  href={REGULATORY_REFERENCES.FDA_2005.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                >
                  View Document
                  <IconExternalLink
                    className="h-3 w-3"
                    stroke={1.5}
                    aria-hidden="true"
                  />
                  <span className="sr-only">(opens in new tab)</span>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Scientific Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconBook className="h-4 w-4" stroke={1.5} />
                Scientific Limitations & Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">
                  FDA 2005 Methodology Limitations
                </h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">
                      BSA-based scaling assumption:
                    </span>{" "}
                    Assumes metabolic rate scales with body surface area. May
                    not apply to all drug classes.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Linear pharmacokinetics:
                    </span>{" "}
                    Does not account for saturable metabolism, non-linear
                    absorption, or target-mediated drug disposition.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Species-specific pharmacology:
                    </span>{" "}
                    Receptor density, binding affinity, and metabolic pathways
                    may differ significantly across species.
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Reference weights:
                    </span>{" "}
                    Uses standardized reference weights. Actual animal weights
                    in studies may differ.
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">
                  When This Method May Not Apply
                </h4>
                <ul className="list-disc ml-5 space-y-1 text-sm text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">
                      Biologics:
                    </span>{" "}
                    MABEL (Minimum Anticipated Biological Effect Level) approach
                    often required
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Immunomodulatory agents:
                    </span>{" "}
                    May require additional safety considerations (TGN1412
                    lessons)
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Cell/Gene therapies:
                    </span>{" "}
                    Standard HED calculation not applicable
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Narrow therapeutic index:
                    </span>{" "}
                    May require higher safety factors or alternative approaches
                  </li>
                  <li>
                    <span className="font-medium text-foreground">
                      Active metabolites:
                    </span>{" "}
                    Parent compound scaling may not reflect total
                    pharmacological effect
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">
                  Species Data Sources
                </h4>
                <p className="text-sm text-muted-foreground">
                  Km factors are from{" "}
                  <span className="font-medium text-foreground">
                    FDA 2005 Guidance Table 1
                  </span>{" "}
                  only. This calculator does not include extrapolated or
                  estimated species values to maintain regulatory accuracy.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Validated species: Mouse, Rat, Hamster, Guinea Pig, Rabbit,
                  Monkey (NHP), Dog, Mini-pig (40 kg), Micro-pig (20 kg)
                </p>
              </div>

              <Alert className="border-warning/40 bg-warning/10">
                <IconAlertTriangle className="h-4 w-4" stroke={1.5} />
                <AlertTitle className="text-sm font-medium">
                  Important Disclaimer
                </AlertTitle>
                <AlertDescription className="text-xs mt-1">
                  This calculator provides estimates for educational and
                  research purposes only. Results should NOT be used for
                  clinical dosing without validation by qualified professionals.
                  Always consult appropriate regulatory guidance documents and
                  expert advice for IND submissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
