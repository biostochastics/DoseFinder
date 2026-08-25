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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  calculateFdaFihDose,
  getSupportedSpecies,
  validateFihInput,
  type FihDoseResult,
  type FihWarning,
} from "@/lib/pharmacology/fda";
import {
  buildStartingDoseDecision,
  type DoseCandidate,
  type Provenance,
  type SpeciesRelevance,
} from "@/lib/pharmacology/fihDecision";
import {
  buildSafetyFactorRange,
  type FactorLevel,
  type SafetyFactorInput,
} from "@/lib/pharmacology/safetyFactorBuilder";
import {
  calculateOccupancyDose,
  type OccupancyDoseInput,
} from "@/lib/pharmacology/mabel";
import {
  SAFETY_FACTOR_GUIDANCE,
  REGULATORY_REFERENCES,
} from "@/lib/pharmacology/constants";
import type { DrugModality } from "@/lib/pharmacology/constants";

/** Small provenance chip so an assumption is never mistaken for measured data. */
function ProvenanceBadge({ provenance }: { provenance: Provenance }) {
  const styles: Record<Provenance, string> = {
    measured: "border-green-500/40 text-green-700 dark:text-green-400",
    assumed: "border-amber-500/40 text-amber-700 dark:text-amber-400",
    "literature-default": "border-sky-500/40 text-sky-700 dark:text-sky-400",
  };
  const label: Record<Provenance, string> = {
    measured: "measured",
    assumed: "assumed",
    "literature-default": "lit. default",
  };
  return (
    <Badge variant="outline" className={`text-[10px] ${styles[provenance]}`}>
      {label[provenance]}
    </Badge>
  );
}

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

  // Starting-dose decision state (candidate selection is a post-calculation act)
  const [noaelProvenance, setNoaelProvenance] =
    useState<Provenance>("measured");
  const [relevanceById, setRelevanceById] = useState<
    Record<string, { relevance: SpeciesRelevance; justification: string }>
  >({});
  const [recommendedId, setRecommendedId] = useState<string | undefined>(
    undefined,
  );
  const [overrideJustification, setOverrideJustification] =
    useState<string>("");

  // Safety-factor rationale builder (EMA 2017 §7.2) — assists, does not decide.
  const [sfFactors, setSfFactors] = useState<SafetyFactorInput>({
    novelty: 0,
    pdCharacteristics: 0,
    animalModelRelevance: 0,
    safetyFindings: 0,
    estimationUncertainty: 0,
    clinicalMonitorability: 0,
    wellCharacterizedClass: false,
  });
  const [appliedSfRationale, setAppliedSfRationale] = useState<string[] | null>(
    null,
  );
  const sfRange = useMemo(() => buildSafetyFactorRange(sfFactors), [sfFactors]);
  const setSfFactor = useCallback(
    (key: keyof SafetyFactorInput, value: FactorLevel | boolean) => {
      setSfFactors((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );
  const applySafetyFactor = useCallback(
    (value: number) => {
      setSafetyFactor("custom");
      setCustomSafetyFactor(String(value));
      setAppliedSfRationale([
        `Safety factor ${value}× chosen from recommended range ${sfRange.low}–${sfRange.high}× (score ${sfRange.score}/12, ${sfRange.band}).`,
        ...sfRange.rationale,
      ]);
    },
    [sfRange],
  );

  // Gated MABEL / PAD (receptor-occupancy) track — educational, off by default.
  const [mabelAck, setMabelAck] = useState(false);
  const [mabelKd, setMabelKd] = useState("1");
  const [mabelVd, setMabelVd] = useState("0.07");
  const [mabelMw, setMabelMw] = useState("150000");
  const [mabelF, setMabelF] = useState("100");
  const [mabelRoPct, setMabelRoPct] = useState("10"); // MABEL: minimal effect
  const [padRoPct, setPadRoPct] = useState("50"); // PAD: pharmacologically active
  const [includeMabel, setIncludeMabel] = useState(true);
  const [includePad, setIncludePad] = useState(false);

  const mabelBaseInput = useMemo<
    Omit<OccupancyDoseInput, "targetOccupancyPct">
  >(
    () => ({
      bindingConstantNM: parseFloat(mabelKd),
      vdLPerKg: parseFloat(mabelVd),
      molecularWeightGPerMol: parseFloat(mabelMw),
      bioavailabilityPct: parseFloat(mabelF),
    }),
    [mabelKd, mabelVd, mabelMw, mabelF],
  );
  const mabelResult = useMemo(
    () =>
      calculateOccupancyDose({
        ...mabelBaseInput,
        targetOccupancyPct: parseFloat(mabelRoPct),
      }),
    [mabelBaseInput, mabelRoPct],
  );
  const padResult = useMemo(
    () =>
      calculateOccupancyDose({
        ...mabelBaseInput,
        targetOccupancyPct: parseFloat(padRoPct),
      }),
    [mabelBaseInput, padRoPct],
  );

  // Accessibility: Screen reader announcements
  const { announcement, announce } = useAnnounce();

  // Ref for error focus management
  const primaryNoaelRef = useRef<HTMLInputElement>(null);
  const errorContainerRef = useRef<HTMLDivElement>(null);

  // Get supported species
  const supportedSpecies = useMemo(() => getSupportedSpecies(), []);

  // Build NOAEL-HED-MRSD candidates from the calculation result, then resolve
  // an explicit starting-dose decision (no silent min()).
  const candidates = useMemo<DoseCandidate[]>(() => {
    const list: DoseCandidate[] = [];

    if (result && result.mrsd > 0) {
      const rows =
        result.multiSpeciesResults && result.multiSpeciesResults.length > 0
          ? result.multiSpeciesResults
          : [
              {
                species: primarySpecies,
                noael: parseFloat(primaryNoael) || 0,
                hed: result.hed,
                mrsd: result.mrsd,
              },
            ];
      for (const r of rows) {
        const rel = relevanceById[r.species];
        const cap = r.species.charAt(0).toUpperCase() + r.species.slice(1);
        list.push({
          id: r.species,
          method: "NOAEL-HED-MRSD",
          label: `${cap} NOAEL→MRSD`,
          species: r.species,
          valueMgKg: r.mrsd,
          safetyFactor: result.safetyFactor,
          relevance: rel?.relevance ?? "relevant",
          relevanceJustification: rel?.justification || undefined,
          provenance: { noael: noaelProvenance, safetyFactor: "assumed" },
          notes: `NOAEL ${r.noael} mg/kg → HED ${r.hed.toFixed(3)} mg/kg (SF ${result.safetyFactor}×)`,
        });
      }
    }

    // Gated MABEL / PAD candidates (educational; only when acknowledged + valid)
    if (mabelAck) {
      const addOccupancy = (
        id: string,
        method: "MABEL" | "PAD",
        roPct: string,
        res: typeof mabelResult,
      ) => {
        if (!res.valid) return;
        const rel = relevanceById[id];
        list.push({
          id,
          method,
          label: `${method} (${roPct}% RO)`,
          valueMgKg: res.doseMgPerKg,
          relevance: rel?.relevance ?? "relevant",
          relevanceJustification: rel?.justification || undefined,
          provenance: {
            Kd: "assumed",
            Vd: "assumed",
            MW: "assumed",
          },
          notes: `C ${res.concentrationNM.toPrecision(3)} nM → ${res.doseMgPerKg.toPrecision(3)} mg/kg (unvalidated inputs)`,
        });
      };
      if (includeMabel) addOccupancy("mabel", "MABEL", mabelRoPct, mabelResult);
      if (includePad) addOccupancy("pad", "PAD", padRoPct, padResult);
    }

    return list;
  }, [
    result,
    relevanceById,
    noaelProvenance,
    primarySpecies,
    primaryNoael,
    mabelAck,
    includeMabel,
    includePad,
    mabelResult,
    padResult,
    mabelRoPct,
    padRoPct,
  ]);

  const decision = useMemo(
    () =>
      buildStartingDoseDecision(candidates, {
        recommendedId,
        overrideJustification,
      }),
    [candidates, recommendedId, overrideJustification],
  );

  const setRelevance = useCallback(
    (id: string, relevance: SpeciesRelevance) => {
      setRelevanceById((prev) => ({
        ...prev,
        [id]: { relevance, justification: prev[id]?.justification ?? "" },
      }));
    },
    [],
  );

  const setRelevanceJustification = useCallback(
    (id: string, justification: string) => {
      setRelevanceById((prev) => ({
        ...prev,
        [id]: { relevance: prev[id]?.relevance ?? "relevant", justification },
      }));
    },
    [],
  );

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
    // Fresh calculation → clear any prior relevance/recommendation overrides
    setRelevanceById({});
    setRecommendedId(undefined);
    setOverrideJustification("");

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
NOAEL: ${primaryNoael} mg/kg (${noaelProvenance})
Safety Factor: ${safetyFactor === "custom" ? customSafetyFactor : safetyFactor}×${
      appliedSfRationale
        ? `
Safety-factor rationale (EMA 2017 §7.2):
${appliedSfRationale.map((r) => `  - ${r}`).join("\n")}`
        : ""
    }
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
  decision.recommended
    ? `RECOMMENDED STARTING DOSE: ${decision.recommended.valueMgKg.toFixed(4)} mg/kg (${decision.recommended.label})
Rationale: ${decision.rationale}${decision.requiresJustification ? `\nJustification (non-lowest): ${decision.overrideJustification ?? "[REQUIRED — none provided]"}` : ""}
NOAEL provenance: ${noaelProvenance}
${decision.warnings.length ? `Decision notes:\n${decision.warnings.map((w) => `  - ${w}`).join("\n")}\n` : ""}`
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
    decision,
    noaelProvenance,
    primarySpecies,
    primaryNoael,
    safetyFactor,
    customSafetyFactor,
    modality,
    humanWeight,
    additionalSpecies,
    appliedSfRationale,
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
NOAEL: ${primaryNoael} mg/kg (${noaelProvenance})
Safety Factor: ${effectiveSafetyFactor}×${
      appliedSfRationale
        ? `
Safety-factor rationale (EMA 2017 §7.2):
${appliedSfRationale.map((r) => `  - ${r}`).join("\n")}`
        : ""
    }
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
  decision.recommended
    ? `
STARTING-DOSE DECISION
======================
Recommended: ${decision.recommended.valueMgKg.toFixed(4)} mg/kg (${decision.recommended.label})
Rationale: ${decision.rationale}${decision.requiresJustification ? `\nJustification (non-lowest): ${decision.overrideJustification ?? "[REQUIRED — none provided]"}` : ""}
NOAEL provenance: ${noaelProvenance}
Candidates:
${candidates
  .map(
    (c) =>
      `  - ${c.label}: ${c.valueMgKg.toFixed(4)} mg/kg [${c.relevance}${c.relevanceJustification ? `: ${c.relevanceJustification}` : ""}]`,
  )
  .join("\n")}
${decision.warnings.length ? `Notes:\n${decision.warnings.map((w) => `  - ${w}`).join("\n")}\n` : ""}`
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
    decision,
    candidates,
    noaelProvenance,
    primarySpecies,
    primaryNoael,
    safetyFactor,
    customSafetyFactor,
    modality,
    humanWeight,
    additionalSpecies,
    appliedSfRationale,
  ]);

  return (
    <div className="space-y-4">
      {/* Screen reader live region for dynamic announcements */}
      <LiveRegion announcement={announcement} />

      {/* First-class regulatory disclaimer — must not be buried in metadata */}
      <div
        className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3"
        role="note"
        aria-label="Regulatory disclaimer"
      >
        <div className="flex items-start gap-2">
          <IconAlertTriangle
            className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-600"
            stroke={1.5}
            aria-hidden="true"
          />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            <span className="font-semibold">
              Educational estimate — NOT for IND submission.
            </span>{" "}
            This tool structures the FDA 2005 / EMA 2017 reasoning; it does not
            validate your inputs and is no substitute for pharmacometric and
            regulatory expert review. FIH starting-dose selection is an
            integrative judgment (PK/PD, exposure, mode of action), not a single
            formula.
          </p>
        </div>
      </div>

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
              <div className="mt-1">
                <Label htmlFor="noael-provenance" className="text-xs">
                  NOAEL source
                </Label>
                <Select
                  value={noaelProvenance}
                  onValueChange={(v) => setNoaelProvenance(v as Provenance)}
                >
                  <SelectTrigger
                    id="noael-provenance"
                    className="h-8"
                    aria-label="NOAEL provenance"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="measured">
                      Measured (from your study)
                    </SelectItem>
                    <SelectItem value="assumed">Assumed / estimated</SelectItem>
                    <SelectItem value="literature-default">
                      Literature value
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Safety Factor */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="safety-factor">Safety Factor</Label>
              <Select
                value={safetyFactor}
                onValueChange={(v) => {
                  setSafetyFactor(v);
                  setAppliedSfRationale(null);
                }}
              >
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
                  onChange={(e) => {
                    setCustomSafetyFactor(e.target.value);
                    setAppliedSfRationale(null);
                  }}
                  min={1}
                  step="1"
                />
              </div>
            )}
          </div>

          {/* Safety-factor rationale builder (optional assistant) */}
          <Accordion type="single" collapsible>
            <AccordionItem
              value="sf-builder"
              className="border rounded-md px-3"
            >
              <AccordionTrigger className="text-sm">
                Safety-factor rationale builder (EMA 2017 §7.2) — optional
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-xs text-muted-foreground mb-3">
                  The safety factor is a reasoned judgment, not a fixed tier.
                  Rate each factor; the tool suggests a RANGE with an audit
                  trail. You commit to a specific value — it never decides for
                  you.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["novelty", "Novelty of substance / MoA"],
                      [
                        "pdCharacteristics",
                        "PD: dose-response / irreversibility",
                      ],
                      ["animalModelRelevance", "Animal-model relevance"],
                      ["safetyFindings", "Character of safety findings"],
                      [
                        "estimationUncertainty",
                        "NOAEL/MABEL/exposure uncertainty",
                      ],
                      ["clinicalMonitorability", "Clinical monitorability"],
                    ] as Array<[keyof SafetyFactorInput, string]>
                  ).map(([key, label]) => (
                    <div key={key}>
                      <Label htmlFor={`sf-${key}`} className="text-xs">
                        {label}
                      </Label>
                      <Select
                        value={String(sfFactors[key])}
                        onValueChange={(v) =>
                          setSfFactor(key, Number(v) as FactorLevel)
                        }
                      >
                        <SelectTrigger
                          id={`sf-${key}`}
                          className="h-8"
                          aria-label={label}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">Low / none</SelectItem>
                          <SelectItem value="1">Moderate</SelectItem>
                          <SelectItem value="2">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Checkbox
                    id="sf-well-characterized"
                    checked={sfFactors.wellCharacterizedClass}
                    onCheckedChange={(c) =>
                      setSfFactor("wellCharacterizedClass", c === true)
                    }
                  />
                  <Label htmlFor="sf-well-characterized" className="text-xs">
                    Well-characterized class with extensive human data (permits
                    a factor below 10× — must be justified)
                  </Label>
                </div>

                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    Recommended range:{" "}
                    <span className="text-accent">
                      {sfRange.low}–{sfRange.high}×
                    </span>{" "}
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      {sfRange.band}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {sfRange.summary}
                  </p>
                  <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-0.5">
                    {sfRange.rationale.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                  <div className="flex gap-2 mt-3">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => applySafetyFactor(sfRange.high)}
                    >
                      Use conservative end ({sfRange.high}×)
                    </Button>
                    {sfRange.low !== sfRange.high && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applySafetyFactor(sfRange.low)}
                      >
                        Use lower end ({sfRange.low}×)
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

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

      {/* Gated MABEL / PAD (receptor occupancy) — biologics, educational only */}
      <Card className="border-amber-500/30">
        <CardHeader>
          <CardTitle className="text-base">
            MABEL / PAD — receptor occupancy (biologics)
          </CardTitle>
          <CardDescription>
            For biologics/high-risk targets, NOAEL scaling may over-dose. MABEL
            estimates a minimal-effect dose from in-vitro potency and receptor
            occupancy. These inputs are compound-specific and{" "}
            <span className="font-medium">
              cannot be validated by this tool
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <Checkbox
              id="mabel-ack"
              checked={mabelAck}
              onCheckedChange={(c) => setMabelAck(c === true)}
              className="mt-0.5"
            />
            <Label htmlFor="mabel-ack" className="text-xs leading-snug">
              I understand these are <strong>unvalidated, user-supplied</strong>{" "}
              inputs and the result is an <strong>educational estimate</strong>,
              not a regulatory MABEL and not for IND submission. A single unit
              error (e.g. Kd in pM vs nM) changes the dose by orders of
              magnitude.
            </Label>
          </div>

          {mabelAck && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="mabel-kd" className="text-xs">
                    Kd / EC (nM)
                  </Label>
                  <Input
                    id="mabel-kd"
                    type="number"
                    value={mabelKd}
                    onChange={(e) => setMabelKd(e.target.value)}
                    min={0}
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="mabel-vd" className="text-xs">
                    Vd (L/kg)
                  </Label>
                  <Input
                    id="mabel-vd"
                    type="number"
                    value={mabelVd}
                    onChange={(e) => setMabelVd(e.target.value)}
                    min={0}
                    step="0.01"
                  />
                </div>
                <div>
                  <Label htmlFor="mabel-mw" className="text-xs">
                    MW (g/mol)
                  </Label>
                  <Input
                    id="mabel-mw"
                    type="number"
                    value={mabelMw}
                    onChange={(e) => setMabelMw(e.target.value)}
                    min={0}
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="mabel-f" className="text-xs">
                    Bioavailability F (%)
                  </Label>
                  <Input
                    id="mabel-f"
                    type="number"
                    value={mabelF}
                    onChange={(e) => setMabelF(e.target.value)}
                    min={0}
                    max={100}
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="mabel-ro" className="text-xs">
                    MABEL occupancy (%)
                  </Label>
                  <Input
                    id="mabel-ro"
                    type="number"
                    value={mabelRoPct}
                    onChange={(e) => setMabelRoPct(e.target.value)}
                    min={0}
                    max={100}
                    step="1"
                  />
                </div>
                <div>
                  <Label htmlFor="pad-ro" className="text-xs">
                    PAD occupancy (%)
                  </Label>
                  <Input
                    id="pad-ro"
                    type="number"
                    value={padRoPct}
                    onChange={(e) => setPadRoPct(e.target.value)}
                    min={0}
                    max={100}
                    step="1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={includeMabel}
                    onCheckedChange={(c) => setIncludeMabel(c === true)}
                  />
                  Include MABEL as a candidate in the decision
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={includePad}
                    onCheckedChange={(c) => setIncludePad(c === true)}
                  />
                  Include PAD as a candidate
                </label>
              </div>

              {/* MABEL result */}
              {mabelResult.valid ? (
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-sm">
                    MABEL ({mabelRoPct}% RO):{" "}
                    <span className="font-semibold text-accent">
                      {mabelResult.doseMgPerKg.toPrecision(3)} mg/kg
                    </span>
                  </p>
                  {includePad && padResult.valid && (
                    <p className="text-sm">
                      PAD ({padRoPct}% RO):{" "}
                      <span className="font-semibold text-accent">
                        {padResult.doseMgPerKg.toPrecision(3)} mg/kg
                      </span>
                    </p>
                  )}
                  <ul className="text-xs text-muted-foreground list-disc pl-4 mt-2 space-y-0.5">
                    {mabelResult.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Shown as a candidate in the starting-dose decision below
                    (after you calculate an MRSD) — never as a standalone
                    recommended dose.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Enter valid inputs to compute a MABEL estimate.
                </p>
              )}

              {mabelResult.warnings.length > 0 && (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-2">
                  <ul className="text-xs text-amber-800 dark:text-amber-300 list-disc pl-4 space-y-0.5">
                    {mabelResult.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
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
              {result.mrsdTotal.toFixed(2)} mg for a {result.humanWeight} kg
              adult.
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

              {/* Explicit starting-dose decision surface (no silent min) */}
              {decision.recommended && (
                <div className="mb-4 space-y-3">
                  <Alert className="border-primary/40 bg-primary/10">
                    <IconInfoCircle
                      className="h-4 w-4 text-primary"
                      stroke={1.5}
                    />
                    <AlertTitle className="text-sm font-medium">
                      Recommended starting point: {decision.recommended.label}
                    </AlertTitle>
                    <AlertDescription>
                      <p className="text-xl font-bold text-accent">
                        {decision.recommended.valueMgKg.toFixed(4)} mg/kg
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {decision.rationale}
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Justification required when the choice is not the lowest */}
                  {decision.requiresJustification && (
                    <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 space-y-2">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        Justification required (EMA 2017 §7.2)
                      </p>
                      <p className="text-xs text-red-700/90 dark:text-red-300">
                        You selected a dose that is not the lowest candidate
                        (lowest = {decision.lowestIncluded?.label} at{" "}
                        {decision.lowestIncluded?.valueMgKg.toFixed(4)} mg/kg).
                        Document why a higher starting dose is justified.
                      </p>
                      <Textarea
                        value={overrideJustification}
                        onChange={(e) =>
                          setOverrideJustification(e.target.value)
                        }
                        aria-label="Justification for non-lowest starting dose"
                        placeholder="e.g. the lowest species finding is a species-specific artifact not relevant to humans; supported by mechanism / exposure data…"
                        className="text-sm"
                      />
                    </div>
                  )}

                  {/* Candidate comparison + relevance controls */}
                  <div>
                    <p
                      className="text-sm font-medium mb-2"
                      id="candidate-heading"
                    >
                      Candidate starting doses
                    </p>
                    <Table aria-labelledby="candidate-heading">
                      <caption className="sr-only">
                        Candidate starting doses with inputs, provenance,
                        relevance, and selection
                      </caption>
                      <TableHeader>
                        <TableRow>
                          <TableHead scope="col">Candidate</TableHead>
                          <TableHead scope="col">Dose (mg/kg)</TableHead>
                          <TableHead scope="col">Inputs</TableHead>
                          <TableHead scope="col">Relevance</TableHead>
                          <TableHead scope="col">Use</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {candidates.map((c) => {
                          const isRec = decision.recommended?.id === c.id;
                          const isLowest = decision.lowestIncluded?.id === c.id;
                          const excluded = c.relevance === "excluded";
                          return (
                            <React.Fragment key={c.id}>
                              <TableRow
                                className={
                                  isRec
                                    ? "bg-primary/10"
                                    : excluded
                                      ? "opacity-50"
                                      : ""
                                }
                              >
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                      {c.label}
                                    </span>
                                    {isLowest && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px]"
                                      >
                                        lowest
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="font-semibold">
                                  {c.valueMgKg.toFixed(4)}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {c.notes}
                                  {c.provenance && (
                                    <div className="flex flex-wrap gap-1 mt-1 items-center">
                                      {Object.entries(c.provenance).map(
                                        ([k, v]) => (
                                          <span
                                            key={k}
                                            className="inline-flex items-center gap-1"
                                          >
                                            <span className="text-[10px]">
                                              {k}:
                                            </span>
                                            <ProvenanceBadge provenance={v} />
                                          </span>
                                        ),
                                      )}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Select
                                    value={c.relevance}
                                    onValueChange={(v) =>
                                      setRelevance(c.id, v as SpeciesRelevance)
                                    }
                                  >
                                    <SelectTrigger
                                      className="h-8 w-[130px]"
                                      aria-label={`Relevance for ${c.label}`}
                                    >
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="relevant">
                                        Relevant
                                      </SelectItem>
                                      <SelectItem value="questionable">
                                        Questionable
                                      </SelectItem>
                                      <SelectItem value="excluded">
                                        Excluded
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant={isRec ? "default" : "outline"}
                                    size="sm"
                                    disabled={excluded}
                                    onClick={() => setRecommendedId(c.id)}
                                    aria-label={`Use ${c.label} as the recommended starting dose`}
                                  >
                                    {isRec ? "Recommended" : "Use"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                              {c.relevance !== "relevant" && (
                                <TableRow className="border-0">
                                  <TableCell colSpan={5} className="pt-0 pb-2">
                                    <Input
                                      className="h-8 text-xs"
                                      placeholder={`Reason ${c.label} is ${c.relevance}…`}
                                      value={
                                        relevanceById[c.id]?.justification ?? ""
                                      }
                                      onChange={(e) =>
                                        setRelevanceJustification(
                                          c.id,
                                          e.target.value,
                                        )
                                      }
                                      aria-label={`Justification that ${c.label} is ${c.relevance}`}
                                    />
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {decision.warnings.length > 0 && (
                    <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                      {decision.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  )}

                  {recommendedId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRecommendedId(undefined);
                        setOverrideJustification("");
                      }}
                    >
                      Reset to lowest (default)
                    </Button>
                  )}
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
