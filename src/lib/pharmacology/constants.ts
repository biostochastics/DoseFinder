/**
 * Regulatory and pharmacological constants for DoseFinder
 *
 * FDA Km factors from "Guidance for Industry: Estimating the Maximum Safe
 * Starting Dose in Initial Clinical Trials for Therapeutics in Adult
 * Healthy Volunteers" (FDA, July 2005)
 *
 * IMPORTANT: These are hardcoded FDA values and should NOT be calculated
 * from species weight/BSA ratios, as the FDA guidance specifies exact values.
 */

// ============================================================================
// FDA Km Factors (Table 1, FDA 2005 Guidance)
// ============================================================================

/**
 * FDA Km conversion factors for dose scaling
 * Km = Body Weight (kg) / Body Surface Area (m²)
 *
 * Used in Human Equivalent Dose calculation:
 * HED (mg/kg) = Animal Dose (mg/kg) × (Animal Km / Human Km)
 *
 * CRITICAL: These values MUST match FDA 2005 guidance exactly.
 * Do NOT derive from species.ts calculated values.
 *
 * Species directly from FDA 2005 Guidance Table 1:
 *   mouse, rat, hamster, guineaPig, rabbit, monkey, dog, miniPig, micropig, human
 *
 * Species with ESTIMATED Km values (not in FDA Table 1):
 *   ferret, marmoset, cynomolgus, rhesus, beagle
 *   These are extrapolated from body weight/BSA or literature.
 *   Use with appropriate caution and documentation.
 */
export const FDA_KM_FACTORS: Record<string, number> = {
  // === Species from FDA 2005 Table 1 ===
  // NOTE: All keys are lowercase to match normalization in fda.ts getKmFactor()
  mouse: 3,
  rat: 6,
  hamster: 5,
  guineapig: 8, // Guinea pig (normalized from guineaPig)
  rabbit: 12,
  monkey: 12, // FDA Table 1: 3 kg NHP reference
  dog: 20,
  minipig: 35, // FDA Table 1: 40 kg mini-pig (normalized from miniPig)
  micropig: 27, // FDA Table 1: 20 kg micro-pig
  human: 37, // Based on 60 kg reference weight

  // === Estimated values (NOT in FDA Table 1) ===
  // These are aliases or extrapolated from literature
  ferret: 7, // Estimated: ~0.3-2 kg, BSA scaling
  cynomolgus: 12, // Same as monkey (typical 3-6 kg)
  rhesus: 12, // Same as monkey (typical 3-6 kg)
  marmoset: 6, // Estimated: ~0.3-0.5 kg small NHP
  beagle: 20, // Same as dog (typical 8-14 kg)
} as const;

/**
 * Species that are directly from FDA 2005 Table 1 (validated sources)
 */
export const FDA_VALIDATED_SPECIES = [
  "mouse",
  "rat",
  "hamster",
  "guineapig", // Normalized from guineaPig
  "rabbit",
  "monkey",
  "dog",
  "minipig", // Normalized from miniPig
  "micropig",
  "human",
] as const;

/**
 * Species with estimated Km values (not in FDA Table 1)
 */
export const ESTIMATED_SPECIES = [
  "ferret",
  "cynomolgus",
  "rhesus",
  "marmoset",
  "beagle",
] as const;

// ============================================================================
// Allometric Scaling Validation Ranges
// ============================================================================

/**
 * Expected Km factor ranges for allometric scaling validation
 *
 * Based on FDA 2005 Guidance Table 1:
 * - Smallest Km: Mouse = 3
 * - Largest Km: Human = 37
 *
 * These ranges help identify biologically implausible Km values that
 * could produce erroneous HED calculations.
 *
 * Reference: FDA 2005 Guidance, Table 1
 */
export const KM_VALIDATION_RANGES = {
  /**
   * Minimum biologically plausible Km value
   * Based on smallest FDA species (mouse Km = 3)
   * Allows ~30% tolerance below mouse for edge cases
   */
  MIN_ANIMAL_KM: 2,

  /**
   * Maximum biologically plausible Km value for animals
   * Based on mini-pig (Km = 35), with tolerance
   */
  MAX_ANIMAL_KM: 40,

  /**
   * Expected human Km value (FDA reference)
   */
  HUMAN_KM: 37,

  /**
   * Tolerance for human Km validation (±5%)
   */
  HUMAN_KM_TOLERANCE: 0.05,

  /**
   * Species-specific expected Km ranges for stricter validation
   * Format: { min, max, expected }
   */
  SPECIES_RANGES: {
    // Small rodents (Km 3-8)
    mouse: { min: 2.5, max: 4, expected: 3 },
    hamster: { min: 4, max: 6, expected: 5 },
    rat: { min: 5, max: 7, expected: 6 },
    guineapig: { min: 7, max: 9, expected: 8 }, // Normalized from guineaPig

    // Lagomorphs and small primates (Km 6-12)
    marmoset: { min: 5, max: 8, expected: 6 },
    ferret: { min: 6, max: 8, expected: 7 },
    rabbit: { min: 10, max: 14, expected: 12 },
    monkey: { min: 10, max: 14, expected: 12 },
    cynomolgus: { min: 10, max: 14, expected: 12 },
    rhesus: { min: 10, max: 14, expected: 12 },

    // Larger animals (Km 20-35)
    dog: { min: 18, max: 22, expected: 20 },
    beagle: { min: 18, max: 22, expected: 20 },
    micropig: { min: 24, max: 30, expected: 27 },
    minipig: { min: 32, max: 38, expected: 35 }, // Normalized from miniPig

    // Human
    human: { min: 35, max: 39, expected: 37 },
  } as Record<string, { min: number; max: number; expected: number }>,
} as const;

/**
 * Reference body weights from FDA 2005 guidance Table 1
 * Note: Only FDA-validated species are included here
 */
export const FDA_REFERENCE_WEIGHTS: Record<string, number> = {
  // === Species from FDA 2005 Table 1 ===
  // NOTE: All keys are lowercase to match normalization in fda.ts
  mouse: 0.02,
  rat: 0.15,
  hamster: 0.08,
  guineapig: 0.4, // Normalized from guineaPig
  rabbit: 1.8,
  monkey: 3,
  dog: 10,
  minipig: 40, // FDA Table 1: 40 kg mini-pig (normalized from miniPig)
  micropig: 20, // FDA Table 1: 20 kg micro-pig
  human: 60, // FDA reference human weight

  // === Estimated values (not in FDA Table 1) ===
  ferret: 0.3,
  cynomolgus: 3,
  rhesus: 3,
  marmoset: 0.35,
  beagle: 10,
} as const;

/**
 * Reference body surface areas from FDA 2005 guidance Table 1
 * Note: Only FDA-validated species are included here
 */
export const FDA_REFERENCE_BSA: Record<string, number> = {
  // === Species from FDA 2005 Table 1 ===
  // NOTE: All keys are lowercase to match normalization in fda.ts
  mouse: 0.0066,
  rat: 0.025,
  hamster: 0.016,
  guineapig: 0.05, // Normalized from guineaPig
  rabbit: 0.15,
  monkey: 0.25, // FDA Table 1: 0.25 m²
  dog: 0.5,
  minipig: 1.14, // FDA Table 1: 1.14 m² for 40 kg (normalized from miniPig)
  micropig: 0.74, // FDA Table 1: 0.74 m² for 20 kg
  human: 1.62, // FDA reference human BSA

  // === Estimated values (not in FDA Table 1) ===
  ferret: 0.043,
  cynomolgus: 0.25,
  rhesus: 0.25,
  marmoset: 0.058,
  beagle: 0.5,
} as const;

// ============================================================================
// Safety Factors
// ============================================================================

/**
 * Standard safety factors for MRSD calculation
 */
export const SAFETY_FACTORS = {
  /** Well-characterized compounds with extensive human data */
  LOW: 3,
  /** Standard default for new chemical entities */
  STANDARD: 10,
  /** Steep dose-response, narrow TI, irreversible toxicity, novel target */
  HIGH: 30,
  /** Genotoxic, immunotoxic, highly novel mechanism */
  VERY_HIGH: 100,
} as const;

/**
 * Safety factor selection guidance
 */
export const SAFETY_FACTOR_GUIDANCE: Record<
  number,
  { criteria: string; examples: string[] }
> = {
  3: {
    criteria: "Well-characterized compound class with extensive human data",
    examples: [
      "Second-generation drugs in established class",
      "Biosimilars with extensive PK characterization",
      "Well-known pharmacophores",
    ],
  },
  10: {
    criteria: "Standard default for new chemical entities",
    examples: [
      "First-in-class small molecules",
      "Novel formulations of known drugs",
      "Standard NCE development",
    ],
  },
  30: {
    criteria:
      "Steep dose-response, narrow therapeutic index, irreversible toxicity, novel target",
    examples: [
      "Cytotoxic agents",
      "Drugs with narrow therapeutic window",
      "Novel mechanism of action",
      "Limited dose-ranging in animals",
    ],
  },
  100: {
    criteria: "High-risk compounds requiring extra caution",
    examples: [
      "Genotoxic compounds",
      "Immunomodulatory agents",
      "Highly novel mechanisms without precedent",
      "Potential for serious irreversible effects",
    ],
  },
};

// ============================================================================
// Drug Modality Types
// ============================================================================

/**
 * Drug modality classification
 */
export type DrugModality =
  | "small_molecule"
  | "biologic"
  | "cell_therapy"
  | "gene_therapy";

/**
 * Modality-specific guidance
 */
export const MODALITY_GUIDANCE: Record<
  DrugModality,
  {
    approach: string;
    reference: string;
    warning?: string;
  }
> = {
  small_molecule: {
    approach: "NOAEL-based HED calculation with Km factor scaling",
    reference: "FDA Guidance for Industry, July 2005",
  },
  biologic: {
    approach: "MABEL (Minimum Anticipated Biological Effect Level) preferred",
    reference: "ICH S6(R1); EMA EMEA/CHMP/SWP/28367/07 Rev.1",
    warning:
      "NOAEL-based calculation may not be appropriate for biologics. " +
      "Consider MABEL approach, especially for immunomodulatory agents.",
  },
  cell_therapy: {
    approach: "Cell dose escalation per regulatory guidance",
    reference: "FDA Guidance for CAR-T therapies",
    warning: "Standard HED calculation not applicable to cell therapies.",
  },
  gene_therapy: {
    approach: "Vector dose escalation per regulatory guidance",
    reference: "FDA Guidance for Gene Therapy Products",
    warning: "Standard HED calculation not applicable to gene therapies.",
  },
};

// ============================================================================
// Volume Limits (NC3Rs/IACUC Guidelines)
// ============================================================================

/**
 * Administration routes
 */
export type AdminRoute = "iv" | "po" | "ip" | "sc" | "im" | "other";

/**
 * Volume limit specification
 */
export interface VolumeLimit {
  /** Maximum volume per kg body weight (mL/kg) */
  maxMlPerKg: number;
  /** Maximum absolute volume (mL) for typical animal size */
  maxAbsoluteMl: number;
  /** For IM: maximum per site */
  maxMlPerSite?: number;
  /** For IM: maximum number of injection sites */
  maxSites?: number;
  /** Additional notes */
  notes: string;
}

/**
 * Volume limits by species and route
 * Source: NC3Rs Administration of Substances Guidelines
 */
export const VOLUME_LIMITS: Record<
  string,
  Partial<Record<AdminRoute, VolumeLimit>>
> = {
  mouse: {
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 0.1, notes: "Slow bolus recommended" },
    po: { maxMlPerKg: 10, maxAbsoluteMl: 0.5, notes: "Gavage" },
    ip: { maxMlPerKg: 10, maxAbsoluteMl: 0.5, notes: "" },
    sc: {
      maxMlPerKg: 10,
      maxAbsoluteMl: 0.5,
      notes: "Multiple sites if >0.2 mL",
    },
    im: {
      maxMlPerKg: 2,
      maxAbsoluteMl: 0.05,
      maxMlPerSite: 0.05,
      maxSites: 2,
      notes: "Not recommended for mice",
    },
  },
  rat: {
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 2, notes: "" },
    po: { maxMlPerKg: 10, maxAbsoluteMl: 5, notes: "" },
    ip: { maxMlPerKg: 10, maxAbsoluteMl: 5, notes: "" },
    sc: { maxMlPerKg: 5, maxAbsoluteMl: 2, notes: "" },
    im: {
      maxMlPerKg: 2,
      maxAbsoluteMl: 0.3,
      maxMlPerSite: 0.1,
      maxSites: 2,
      notes: "",
    },
  },
  rabbit: {
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 10, notes: "" },
    po: { maxMlPerKg: 10, maxAbsoluteMl: 20, notes: "" },
    sc: { maxMlPerKg: 5, maxAbsoluteMl: 10, notes: "Multiple sites" },
    im: {
      maxMlPerKg: 1,
      maxAbsoluteMl: 1,
      maxMlPerSite: 0.5,
      maxSites: 2,
      notes: "",
    },
  },
  dog: {
    iv: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 50,
      notes: "Slow infusion >10 mL",
    },
    po: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 50,
      notes: "Capsule preferred >20 mL",
    },
    sc: { maxMlPerKg: 2, maxAbsoluteMl: 20, notes: "" },
    im: {
      maxMlPerKg: 0.5,
      maxAbsoluteMl: 5,
      maxMlPerSite: 2,
      maxSites: 2,
      notes: "",
    },
  },
  beagle: {
    iv: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 50,
      notes: "Slow infusion >10 mL",
    },
    po: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 50,
      notes: "Capsule preferred >20 mL",
    },
    sc: { maxMlPerKg: 2, maxAbsoluteMl: 20, notes: "" },
    im: {
      maxMlPerKg: 0.5,
      maxAbsoluteMl: 5,
      maxMlPerSite: 2,
      maxSites: 2,
      notes: "",
    },
  },
  monkey: {
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 25, notes: "" },
    po: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 25,
      notes: "Nasogastric for large volumes",
    },
    sc: { maxMlPerKg: 2, maxAbsoluteMl: 10, notes: "" },
    im: {
      maxMlPerKg: 1,
      maxAbsoluteMl: 5,
      maxMlPerSite: 1,
      maxSites: 2,
      notes: "",
    },
  },
  cynomolgus: {
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 25, notes: "" },
    po: {
      maxMlPerKg: 5,
      maxAbsoluteMl: 25,
      notes: "Nasogastric for large volumes",
    },
    sc: { maxMlPerKg: 2, maxAbsoluteMl: 10, notes: "" },
    im: {
      maxMlPerKg: 1,
      maxAbsoluteMl: 5,
      maxMlPerSite: 1,
      maxSites: 2,
      notes: "",
    },
  },
  minipig: {
    // Normalized from miniPig to match species key normalization
    iv: { maxMlPerKg: 5, maxAbsoluteMl: 100, notes: "Slow infusion" },
    po: { maxMlPerKg: 5, maxAbsoluteMl: 100, notes: "" },
    sc: { maxMlPerKg: 2, maxAbsoluteMl: 40, notes: "" },
    im: {
      maxMlPerKg: 0.5,
      maxAbsoluteMl: 10,
      maxMlPerSite: 2,
      maxSites: 4,
      notes: "",
    },
  },
};

// ============================================================================
// Regulatory References
// ============================================================================

export const REGULATORY_REFERENCES = {
  FDA_2005: {
    title:
      "Guidance for Industry: Estimating the Maximum Safe Starting Dose in " +
      "Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers",
    source: "FDA",
    date: "July 2005",
    url: "https://www.fda.gov/media/72309/download",
  },
  ICH_S6R1: {
    title:
      "Preclinical Safety Evaluation of Biotechnology-Derived Pharmaceuticals",
    source: "ICH",
    date: "June 2011",
    url: "https://database.ich.org/sites/default/files/S6_R1_Guideline_0.pdf",
  },
  EMA_FIH: {
    title:
      "Guideline on strategies to identify and mitigate risks for first-in-human " +
      "and early clinical trials with investigational medicinal products",
    source: "EMA",
    date: "2017 (Rev 1)",
    reference: "EMEA/CHMP/SWP/28367/07 Rev. 1",
  },
  NC3RS: {
    title: "Administration of Substances to Laboratory Animals",
    source: "NC3Rs",
    url: "https://nc3rs.org.uk/3rs-resources/administration-substances",
  },
  ICH_M3R2: {
    title:
      "Guidance on Nonclinical Safety Studies for the Conduct of Human Clinical Trials",
    source: "ICH",
    date: "June 2009",
    url: "https://database.ich.org/sites/default/files/M3_R2__Guideline_0.pdf",
  },
} as const;
