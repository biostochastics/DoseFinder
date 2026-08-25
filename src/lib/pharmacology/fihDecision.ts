/**
 * First-in-Human STARTING-DOSE DECISION model
 *
 * Turns a set of candidate starting doses (from different methods and/or
 * species) into an explicit, auditable decision — replacing a silent
 * `min()` over species.
 *
 * Grounded in EMA 2017 Rev.1 (EMEA/CHMP/SWP/28367/07) §7.2: "When the methods
 * of calculation (e.g. NOAEL and MABEL) give different estimations of the
 * starting dose for humans, the LOWEST value should be used, UNLESS justified."
 * Also FDA 2005: the most SENSITIVE species is the default "most appropriate"
 * only ABSENT information that another species is more relevant.
 *
 * Design consequences enforced here:
 *  - The default recommendation is the lowest INCLUDED candidate.
 *  - Recommending anything other than the lowest REQUIRES a justification
 *    (requiresJustification = true) — the UI must collect it.
 *  - Excluding a candidate (relevance = "excluded") is an explicit, reasoned
 *    act; the decision records why each candidate is in or out.
 *  - Every candidate carries provenance tags so a reader can see which inputs
 *    were measured vs assumed vs literature-default.
 *
 * This module is deliberately UI-free and side-effect-free so it can be unit
 * tested as an "assay control" and reused by the MABEL/PAD tracks (Batch 4).
 */

/** Where a numeric input came from — surfaced so users never mistake an assumption for data. */
export type Provenance = "measured" | "assumed" | "literature-default";

/** The method family that produced a candidate starting dose. */
export type CandidateMethod = "NOAEL-HED-MRSD" | "MABEL" | "PAD";

/**
 * Whether a candidate's underlying species/assay is considered relevant.
 * "most sensitive" ≠ automatically "most appropriate" (FDA 2005) — the user,
 * not the tool, decides relevance, and must justify excluding a candidate.
 */
export type SpeciesRelevance = "relevant" | "questionable" | "excluded";

export interface DoseCandidate {
  /** Stable id (used for selection/override). */
  id: string;
  method: CandidateMethod;
  /** Human-readable label, e.g. "Rat NOAEL→MRSD" or "MABEL (10% RO)". */
  label: string;
  /** Originating species, when applicable. */
  species?: string;
  /** The candidate starting dose in mg/kg. */
  valueMgKg: number;
  /** Safety factor applied to reach this candidate, if any. */
  safetyFactor?: number;
  /** User-set relevance; defaults to "relevant". */
  relevance: SpeciesRelevance;
  /** If relevance is "questionable"/"excluded", the user's reason. */
  relevanceJustification?: string;
  /** Provenance of the key inputs behind this candidate. */
  provenance?: Record<string, Provenance>;
  /** Free-form notes (e.g. assay, RO target). */
  notes?: string;
}

export interface StartingDoseDecision {
  /** All candidates, in the order supplied. */
  candidates: DoseCandidate[];
  /** Candidates not excluded and with a usable positive dose. */
  included: DoseCandidate[];
  /** The lowest included candidate — the EMA default. */
  lowestIncluded?: DoseCandidate;
  /** The chosen recommendation (defaults to lowestIncluded). */
  recommended?: DoseCandidate;
  /** True when `recommended` is not the lowest included candidate. */
  requiresJustification: boolean;
  /** The justification supplied for a non-lowest recommendation, if any. */
  overrideJustification?: string;
  /** Human-readable explanation of how the recommendation was reached. */
  rationale: string;
  /** Advisory notes (excluded candidates, wide spread, empty set, missing justification). */
  warnings: string[];
}

export interface BuildDecisionOptions {
  /** Explicitly choose a candidate by id (otherwise the lowest included). */
  recommendedId?: string;
  /** Justification text when recommending a non-lowest candidate. */
  overrideJustification?: string;
  /** Fold ratio above which a spread warning is emitted (default 3). */
  spreadWarnFold?: number;
}

const isUsable = (c: DoseCandidate): boolean =>
  c.relevance !== "excluded" && Number.isFinite(c.valueMgKg) && c.valueMgKg > 0;

/**
 * Build an explicit starting-dose decision from candidate doses.
 *
 * Pure function: no I/O, deterministic given inputs. `min()` is never applied
 * silently — the lowest is the DEFAULT, and any deviation is flagged as
 * requiring justification.
 */
export function buildStartingDoseDecision(
  candidates: DoseCandidate[],
  options: BuildDecisionOptions = {},
): StartingDoseDecision {
  const spreadWarnFold = options.spreadWarnFold ?? 3;
  const warnings: string[] = [];

  const included = candidates.filter(isUsable);

  // Note any excluded/questionable candidates so the decision is auditable.
  for (const c of candidates) {
    if (c.relevance === "excluded") {
      warnings.push(
        `Excluded: ${c.label}${c.relevanceJustification ? ` — ${c.relevanceJustification}` : " — no justification recorded"}.`,
      );
    } else if (c.relevance === "questionable") {
      warnings.push(
        `Flagged questionable: ${c.label}${c.relevanceJustification ? ` — ${c.relevanceJustification}` : ""} (still included).`,
      );
    }
  }

  if (included.length === 0) {
    return {
      candidates,
      included,
      lowestIncluded: undefined,
      recommended: undefined,
      requiresJustification: false,
      rationale:
        "No usable candidate starting doses (all excluded or non-positive). Provide at least one relevant candidate.",
      warnings: [...warnings, "No candidate could be recommended."],
    };
  }

  const lowestIncluded = included.reduce((min, c) =>
    c.valueMgKg < min.valueMgKg ? c : min,
  );

  // Resolve the recommendation.
  let recommended = lowestIncluded;
  if (options.recommendedId) {
    const picked = candidates.find((c) => c.id === options.recommendedId);
    if (picked && isUsable(picked)) {
      recommended = picked;
    } else if (picked && !isUsable(picked)) {
      warnings.push(
        `Requested recommendation "${picked.label}" is excluded or non-positive; falling back to the lowest included candidate.`,
      );
    }
  }

  const requiresJustification = recommended.id !== lowestIncluded.id;

  // Spread warning across included candidates.
  const maxV = Math.max(...included.map((c) => c.valueMgKg));
  const minV = Math.min(...included.map((c) => c.valueMgKg));
  if (minV > 0 && maxV / minV > spreadWarnFold) {
    warnings.push(
      `>${spreadWarnFold}-fold spread across included candidates (${minV.toPrecision(3)}–${maxV.toPrecision(3)} mg/kg): investigate species/method differences before finalizing.`,
    );
  }

  // Rationale + justification bookkeeping.
  let rationale: string;
  let overrideJustification: string | undefined;
  if (!requiresJustification) {
    rationale =
      `Recommended the LOWEST included candidate — ${recommended.label} at ${recommended.valueMgKg.toPrecision(3)} mg/kg — ` +
      "per EMA 2017 Rev.1 §7.2 (use the lowest estimate unless a documented justification supports otherwise).";
  } else {
    overrideJustification = options.overrideJustification?.trim() || undefined;
    rationale =
      `Recommended ${recommended.label} at ${recommended.valueMgKg.toPrecision(3)} mg/kg, which is NOT the lowest candidate ` +
      `(lowest = ${lowestIncluded.label} at ${lowestIncluded.valueMgKg.toPrecision(3)} mg/kg). ` +
      "EMA 2017 Rev.1 §7.2 requires a documented justification to use a higher-than-lowest starting dose.";
    if (!overrideJustification) {
      warnings.push(
        "Recommending a non-lowest candidate REQUIRES a written justification — none was provided.",
      );
    }
  }

  return {
    candidates,
    included,
    lowestIncluded,
    recommended,
    requiresJustification,
    overrideJustification,
    rationale,
    warnings,
  };
}
