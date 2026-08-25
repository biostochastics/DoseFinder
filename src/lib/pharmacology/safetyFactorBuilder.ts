/**
 * SAFETY-FACTOR RATIONALE BUILDER
 *
 * The FDA 2005 / EMA 2017 safety factor is a REASONED conclusion, not a fixed
 * tier. This builder turns the EMA 2017 Rev.1 §7.2 factor list into a
 * transparent, auditable RANGE of safety factors plus a rationale trail — it
 * deliberately never emits a single "the answer" number. The user commits to a
 * specific value WITHIN the recommended range as an act of professional
 * judgment, and that choice (with the rationale) is recorded.
 *
 * EMA 2017 Rev.1 §7.2 — safety factors should take into account:
 *   - novelty of the active substance / mode of action
 *   - pharmacodynamic characteristics (dose-response shape; irreversible or
 *     long-lasting findings)
 *   - relevance of the animal models used for safety testing
 *   - characteristics of the safety findings
 *   - uncertainties in the estimation of MABEL/PAD and expected human exposure
 *   - how well potential target-organ effects can be monitored clinically
 *
 * FDA 2005 anchors the default at "at least 10", reducible below only for
 * well-characterized classes with extensive human experience (and justified).
 *
 * Pure, UI-free, deterministic — unit tested as an assay control.
 */

/** Severity contribution of a single factor: 0 = low/none, 1 = moderate, 2 = high. */
export type FactorLevel = 0 | 1 | 2;

export interface SafetyFactorInput {
  /** Novelty of the active substance / mechanism of action. */
  novelty: FactorLevel;
  /** PD characteristics: steep dose-response and/or irreversible-long-lasting findings. */
  pdCharacteristics: FactorLevel;
  /** Relevance of the animal model(s) used for safety testing. */
  animalModelRelevance: FactorLevel;
  /** Character of the safety findings (severity, unmonitorability of the toxicity itself). */
  safetyFindings: FactorLevel;
  /** Uncertainty in the NOAEL/MABEL/exposure estimation. */
  estimationUncertainty: FactorLevel;
  /** How well potential target-organ effects can be monitored in the clinic. */
  clinicalMonitorability: FactorLevel;
  /**
   * Well-characterized compound class with extensive human data. FDA 2005
   * allows a safety factor below 10 ONLY in this case, and only with
   * justification. Default false.
   */
  wellCharacterizedClass?: boolean;
}

export type SafetyFactorBand =
  "reduced" | "standard" | "elevated" | "high" | "very-high" | "extreme";

export interface SafetyFactorRange {
  /** Lower (less conservative) end of the recommended safety-factor range. */
  low: number;
  /** Upper (more conservative) end of the recommended safety-factor range. */
  high: number;
  /** Total severity score across the six EMA factors (0–12). */
  score: number;
  /** Qualitative band label. */
  band: SafetyFactorBand;
  /** Audit trail: one line per factor that raised the safety factor. */
  rationale: string[];
  /** Overall one-line summary. */
  summary: string;
}

const FACTOR_LABELS: Record<
  keyof Omit<SafetyFactorInput, "wellCharacterizedClass">,
  string
> = {
  novelty: "Novelty of the active substance / mode of action",
  pdCharacteristics:
    "PD characteristics (dose-response steepness; irreversible/long-lasting effects)",
  animalModelRelevance: "Relevance of the animal safety model(s)",
  safetyFindings: "Character of the safety findings",
  estimationUncertainty: "Uncertainty in NOAEL/MABEL/exposure estimation",
  clinicalMonitorability: "Clinical monitorability of target-organ effects",
};

const LEVEL_WORD: Record<FactorLevel, string> = {
  0: "low",
  1: "moderate",
  2: "high",
};

const clampLevel = (v: number): FactorLevel =>
  (v <= 0 ? 0 : v >= 2 ? 2 : 1) as FactorLevel;

/**
 * Map a total severity score (0–12) to a recommended safety-factor range.
 * Ranges follow the customary FDA/EMA ladder (10 → 30 → 100 → 300 → 1000) and
 * widen as uncertainty grows. The RANGE is intentional: the exact value is a
 * judgment, and the tool must not pretend otherwise.
 */
function scoreToRange(
  score: number,
  wellCharacterizedClass: boolean,
): { low: number; high: number; band: SafetyFactorBand } {
  if (wellCharacterizedClass && score <= 1) {
    // FDA 2005: below-10 permitted only for well-characterized classes, with justification.
    return { low: 3, high: 10, band: "reduced" };
  }
  if (score <= 1) return { low: 10, high: 10, band: "standard" };
  // A single clearly-elevated factor (score 2) is already enough to warrant
  // considering a safety factor above the default 10.
  if (score <= 4) return { low: 10, high: 30, band: "elevated" };
  if (score <= 7) return { low: 30, high: 100, band: "high" };
  if (score <= 9) return { low: 100, high: 300, band: "very-high" };
  return { low: 300, high: 1000, band: "extreme" };
}

const BAND_SUMMARY: Record<SafetyFactorBand, string> = {
  reduced:
    "Below the default 10 is only defensible for a well-characterized class with extensive human data — document the justification.",
  standard:
    "Standard FDA/EMA default range; no factor materially elevates risk.",
  elevated:
    "One or more factors elevate uncertainty; a safety factor above the default 10 is warranted.",
  high: "Multiple elevated factors; a substantially higher safety factor is indicated.",
  "very-high":
    "High cumulative uncertainty/risk; consider whether a MABEL/exposure-based approach is more appropriate than NOAEL scaling.",
  extreme:
    "Extreme cumulative uncertainty — reconsider the FIH strategy (MABEL, staged/sentinel design) rather than relying on a large safety factor alone.",
};

/**
 * Build a recommended safety-factor RANGE with an audit trail from the EMA
 * factor list. Never returns a single "answer" — the caller must have the user
 * commit to a value within [low, high].
 */
export function buildSafetyFactorRange(
  input: SafetyFactorInput,
): SafetyFactorRange {
  const factorKeys: Array<keyof typeof FACTOR_LABELS> = [
    "novelty",
    "pdCharacteristics",
    "animalModelRelevance",
    "safetyFindings",
    "estimationUncertainty",
    "clinicalMonitorability",
  ];

  const rationale: string[] = [];
  let score = 0;
  for (const key of factorKeys) {
    const level = clampLevel(input[key] as number);
    score += level;
    if (level > 0) {
      rationale.push(`${FACTOR_LABELS[key]}: ${LEVEL_WORD[level]} → +${level}`);
    }
  }

  const { low, high, band } = scoreToRange(
    score,
    input.wellCharacterizedClass ?? false,
  );

  if (rationale.length === 0) {
    rationale.push(
      "No factor flagged above baseline — standard default applies.",
    );
  }

  const summary =
    `Recommended safety-factor range ${low}–${high}× (score ${score}/12, ${band}). ` +
    BAND_SUMMARY[band];

  return { low, high, score, band, rationale, summary };
}
