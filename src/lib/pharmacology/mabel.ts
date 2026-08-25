/**
 * MABEL / PAD receptor-occupancy dose estimation (GATED, EDUCATIONAL)
 *
 * ⚠ This is the single highest-liability calculation in DoseFinder. It takes
 * compound-specific in-vitro inputs (binding constant, target receptor
 * occupancy, volume of distribution, molecular weight, bioavailability) that
 * the tool CANNOT validate — a single unit error (e.g. Kd entered in pM vs nM)
 * changes the dose by orders of magnitude. The output is educational scaffolding
 * for understanding the MABEL/PAD approach, NOT a regulatory-grade number, and
 * it must never be presented as a single "recommended" dose. It is surfaced only
 * as one candidate among others in the starting-dose decision.
 *
 * Method (simple 1:1 target binding, single-dose Cmax approximation):
 *   Target concentration for occupancy RO:   C = Kd × RO / (1 − RO)   [nM]
 *   Dose to reach C given Vd:                 Dose = C × Vd × MW / 1e6 / (F/100)  [mg/kg]
 * where Vd is in L/kg, MW in g/mol, F in %, and C in nmol/L. The 1e6 converts
 * nmol·(g/mol) = ng to mg.
 *
 *   MABEL: a LOW target occupancy (minimal biological effect, e.g. 10%).
 *   PAD:   a higher, pharmacologically-active occupancy (e.g. 50%).
 *
 * References:
 * - EMA 2017 Rev.1 (EMEA/CHMP/SWP/28367/07) §7.2 — MABEL/PAD from receptor
 *   occupancy and in-vitro potency, integrated in a PK/PD model where possible.
 * - Muller PY et al. Curr Opin Biotechnol. 2009;20:722-729 (MABEL for mAbs).
 * - FDA draft guidance (2026): QSP-based MABEL for FIH.
 *
 * Pure, UI-free, deterministic. Guards are conservative and advisory.
 */

export interface OccupancyDoseInput {
  /** Binding constant Kd (or functional EC) in nM (nmol/L). */
  bindingConstantNM: number;
  /** Target receptor occupancy (%), 0 < RO < 100. */
  targetOccupancyPct: number;
  /** Volume of distribution in L/kg. */
  vdLPerKg: number;
  /** Molecular weight in g/mol. */
  molecularWeightGPerMol: number;
  /** Bioavailability F (%) for the intended route; 100 for IV/systemic. */
  bioavailabilityPct: number;
}

export interface OccupancyDoseResult {
  valid: boolean;
  /** Target free concentration for the requested occupancy (nM). */
  concentrationNM: number;
  /** Estimated dose (mg/kg). NaN if invalid. */
  doseMgPerKg: number;
  /** Step-by-step trace. */
  steps: string[];
  /** Plausibility / unit-sanity warnings (advisory — the tool cannot verify inputs). */
  warnings: string[];
}

// Advisory plausibility bounds — outside these, a unit error is likely.
const BOUNDS = {
  kdNM: { min: 1e-3, max: 1e6 }, // 1 pM … 1 mM
  vdLPerKg: { min: 0.03, max: 100 }, // ~plasma volume … very large
  mwGPerMol: { min: 100, max: 200000 }, // small molecule … large antibody
};

/**
 * Estimate a receptor-occupancy-based dose (MABEL or PAD depending on the target
 * occupancy). Returns valid=false with warnings when inputs are unusable.
 */
export function calculateOccupancyDose(
  input: OccupancyDoseInput,
): OccupancyDoseResult {
  const {
    bindingConstantNM: kd,
    targetOccupancyPct: roPct,
    vdLPerKg: vd,
    molecularWeightGPerMol: mw,
    bioavailabilityPct: fPct,
  } = input;
  const steps: string[] = [];
  const warnings: string[] = [];

  // Hard validity gates — cannot compute a meaningful dose otherwise.
  const invalid = (msg: string): OccupancyDoseResult => {
    warnings.push(msg);
    return {
      valid: false,
      concentrationNM: NaN,
      doseMgPerKg: NaN,
      steps,
      warnings,
    };
  };

  if (!Number.isFinite(kd) || kd <= 0)
    return invalid("Binding constant (Kd/EC) must be a positive number in nM.");
  if (!Number.isFinite(roPct) || roPct <= 0 || roPct >= 100)
    return invalid(
      "Target receptor occupancy must be between 0% and 100% (exclusive).",
    );
  if (!Number.isFinite(vd) || vd <= 0)
    return invalid("Volume of distribution must be a positive number in L/kg.");
  if (!Number.isFinite(mw) || mw <= 0)
    return invalid("Molecular weight must be a positive number in g/mol.");
  if (!Number.isFinite(fPct) || fPct <= 0 || fPct > 100)
    return invalid("Bioavailability must be between 0% (exclusive) and 100%.");

  // Advisory unit-sanity guards (the biggest liability vector: silent unit errors).
  if (kd < BOUNDS.kdNM.min || kd > BOUNDS.kdNM.max)
    warnings.push(
      `Kd/EC of ${kd} nM is outside the typical 1 pM–1 mM window — double-check the units (nM expected).`,
    );
  if (vd < BOUNDS.vdLPerKg.min || vd > BOUNDS.vdLPerKg.max)
    warnings.push(
      `Vd of ${vd} L/kg is unusual — antibodies ~0.05–0.1, many small molecules ~0.5–10 L/kg.`,
    );
  if (mw < BOUNDS.mwGPerMol.min || mw > BOUNDS.mwGPerMol.max)
    warnings.push(
      `Molecular weight ${mw} g/mol is unusual — small molecules ~100–900, antibodies ~150,000.`,
    );
  if (roPct > 90)
    warnings.push(
      `Target occupancy ${roPct}% is high for a MABEL (minimal-effect) estimate; occupancy near 100% makes the dose diverge.`,
    );

  const ro = roPct / 100;
  const concentrationNM = kd * (ro / (1 - ro));
  steps.push(
    `Target concentration C = Kd × RO/(1−RO) = ${kd} × ${roPct}%/(1−${roPct}%) = ${concentrationNM.toPrecision(4)} nM`,
  );

  // Dose (mg/kg) = C[nmol/L] × Vd[L/kg] × MW[g/mol] / 1e6 / (F/100)
  const doseSystemic = (concentrationNM * vd * mw) / 1e6; // mg/kg at F=100%
  const fFactor = fPct / 100;
  const doseMgPerKg = doseSystemic / fFactor;
  steps.push(
    `Systemic dose = C × Vd × MW / 1e6 = ${concentrationNM.toPrecision(4)} × ${vd} × ${mw} / 1e6 = ${doseSystemic.toPrecision(4)} mg/kg`,
  );
  if (fPct < 100) {
    steps.push(
      `Adjust for bioavailability: ÷ (F/100) = ÷ ${fFactor.toFixed(3)} = ${doseMgPerKg.toPrecision(4)} mg/kg`,
    );
  }

  if (doseMgPerKg > 0 && doseMgPerKg < 1e-6)
    warnings.push(
      "Estimated dose is extremely small (<1 ng/kg) — verify the very small doses can be reliably prepared and administered.",
    );

  return {
    valid: Number.isFinite(doseMgPerKg) && doseMgPerKg > 0,
    concentrationNM,
    doseMgPerKg,
    steps,
    warnings,
  };
}
