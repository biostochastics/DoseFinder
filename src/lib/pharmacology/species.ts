/**
 * Species database for pharmacological calculations
 *
 * PRIMARY DATA SOURCES (Peer-Reviewed):
 *
 * 1. Davies B, Morris T. Physiological parameters in laboratory animals and humans.
 *    Pharm Res. 1993;10(7):1093-1095. doi:10.1023/A:1018943613122
 *    - Primary source for hepatic blood flow values across species
 *    - PubMed: https://pubmed.ncbi.nlm.nih.gov/8378254/
 *
 * 2. Brown RP, Delp MD, Lindstedt SL, Rhomberg LR, Beliles RP.
 *    Physiological parameter values for physiologically based pharmacokinetic models.
 *    Toxicol Ind Health. 1997;13(4):407-484. doi:10.1177/074823379701300401
 *    - Comprehensive PBPK parameters for mouse, rat, dog, and human
 *    - Brain weights, organ volumes, blood flow rates
 *
 * 3. FDA Guidance for Industry. Estimating the maximum safe starting dose in
 *    initial clinical trials for therapeutics in adult healthy volunteers. 2005.
 *    https://www.fda.gov/media/72309/download
 *    - Regulatory framework for allometric scaling and dose conversion
 *    - Body surface area (BSA) conversion factors (Km values)
 *
 * 4. Nair AB, Jacob S. A simple practice guide for dose conversion between
 *    animals and human. J Basic Clin Pharm. 2016;7(2):27-31.
 *    doi:10.4103/0976-0105.177703
 *    - PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC4804402/
 *    - BSA calculation using Meeh formula: BSA = k(W)^(2/3)
 *
 * 5. Lin Z, et al. Physiological parameter values for PBPK models in
 *    food-producing animals. Part I: Cattle and swine.
 *    J Vet Pharmacol Ther. 2020;43:385-420. doi:10.1111/jvp.12861
 *
 * 6. Li M, et al. Physiological parameter values for PBPK models.
 *    Part III: Sheep and goat. J Vet Pharmacol Ther. 2021;44:533-563.
 *    doi:10.1111/jvp.12938
 *    - PMC: https://pmc.ncbi.nlm.nih.gov/articles/PMC8359294/
 *
 * 7. Mandikian D, et al. Tissue Physiology of Cynomolgus Monkeys:
 *    Cross-Species Comparison and Implications for Translational Pharmacology.
 *    AAPS J. 2018;20:107. doi:10.1208/s12248-018-0264-z
 *    - Cynomolgus monkey physiological parameters for PBPK modeling
 *
 * SUPPLEMENTARY SOURCES:
 * - EPA recommendations for body weight scaling (2011)
 * - NIH/NCBI databases for primate physiological data
 * - University of Washington Brain Facts database for brain weights
 *
 * PARAMETER NOTES:
 * - All values represent species averages with typical variation of ±30%
 * - Body weights are reference values; actual weights vary by strain/breed/age
 * - Hepatic blood flow: mL/min/kg body weight
 * - Brain weight: grams
 * - Body surface area: m² (calculated using Meeh formula)
 * - Allometric exponent: 0.75 based on Kleiber's law (metabolic scaling)
 *
 * Last validated: December 2024
 */

import { Species } from "./types";

export const SPECIES_DATABASE: Record<string, Species> = {
  mouse: {
    name: "Mouse",
    weight: 0.02,
    brainWeight: 0.4,
    lifeSpan: 2,
    hepaticFlow: 131,
    allometricExponent: 0.75,
    hepaticClearance: 90,
    renalClearance: 15,
    bsa: 0.006,
  },
  rat: {
    name: "Rat",
    weight: 0.15,
    brainWeight: 2.0,
    lifeSpan: 3,
    hepaticFlow: 85,
    allometricExponent: 0.75,
    hepaticClearance: 73,
    renalClearance: 12,
    bsa: 0.025,
  },
  hamster: {
    name: "Hamster",
    weight: 0.1,
    brainWeight: 1.0,
    lifeSpan: 2.5,
    hepaticFlow: 90,
    allometricExponent: 0.75,
    hepaticClearance: 75,
    renalClearance: 12,
    bsa: 0.02,
  },
  guineaPig: {
    name: "Guinea Pig",
    weight: 1.0,
    brainWeight: 4.8,
    lifeSpan: 6,
    hepaticFlow: 75,
    allometricExponent: 0.75,
    hepaticClearance: 55,
    renalClearance: 8,
    bsa: 0.06,
  },
  ferret: {
    name: "Ferret",
    weight: 1.2,
    brainWeight: 7.2,
    lifeSpan: 7,
    hepaticFlow: 72,
    allometricExponent: 0.75,
    hepaticClearance: 52,
    renalClearance: 10,
    bsa: 0.08,
  },
  rabbit: {
    name: "Rabbit",
    weight: 2,
    brainWeight: 9.1,
    lifeSpan: 9,
    hepaticFlow: 77,
    allometricExponent: 0.75,
    hepaticClearance: 65,
    renalClearance: 10,
    bsa: 0.15,
  },
  cat: {
    name: "Cat",
    weight: 4,
    brainWeight: 28.4,
    lifeSpan: 15,
    hepaticFlow: 65,
    allometricExponent: 0.75,
    hepaticClearance: 48,
    renalClearance: 8,
    bsa: 0.25,
  },
  monkey: {
    name: "Monkey",
    weight: 5,
    brainWeight: 95.0,
    lifeSpan: 25,
    hepaticFlow: 58,
    allometricExponent: 0.75,
    hepaticClearance: 42,
    renalClearance: 7,
    bsa: 0.3,
  },
  dog: {
    name: "Dog",
    weight: 20,
    brainWeight: 85.0,
    lifeSpan: 13,
    hepaticFlow: 55,
    allometricExponent: 0.75,
    hepaticClearance: 38,
    renalClearance: 6,
    bsa: 0.8,
  },
  miniPig: {
    name: "Mini Pig",
    weight: 30,
    brainWeight: 125.0,
    lifeSpan: 17,
    hepaticFlow: 45,
    allometricExponent: 0.75,
    hepaticClearance: 28,
    renalClearance: 4,
    bsa: 1.1,
  },
  sheep: {
    name: "Sheep",
    weight: 40,
    brainWeight: 130.0,
    lifeSpan: 12,
    hepaticFlow: 47,
    allometricExponent: 0.75,
    hepaticClearance: 32,
    renalClearance: 5,
    bsa: 1.2,
  },
  horse: {
    name: "Horse",
    weight: 500,
    brainWeight: 620.0,
    lifeSpan: 28,
    hepaticFlow: 28,
    allometricExponent: 0.75,
    hepaticClearance: 18,
    renalClearance: 2.5,
    bsa: 6.3, // BSA calculated using 0.1 × W^(2/3) formula for 500kg horse
  },
  cow: {
    name: "Cow",
    weight: 600,
    brainWeight: 445.0,
    lifeSpan: 18,
    hepaticFlow: 25,
    allometricExponent: 0.75,
    hepaticClearance: 15,
    renalClearance: 2,
    bsa: 7.1, // BSA calculated using 0.1 × W^(2/3) formula for 600kg cow
  },
  human: {
    // NOTE: This database uses 70 kg as the human reference weight (physiological average adult)
    // for general allometric dose scaling. The FDA 2005 Guidance uses 60 kg as the regulatory
    // reference weight for HED/MRSD calculations. The FIH Calculator correctly uses 60 kg.
    // See FDA_REFERENCE_WEIGHTS in constants.ts for regulatory reference values.
    name: "Human",
    weight: 70, // Physiological average adult; FDA regulatory reference is 60 kg
    brainWeight: 1350.0,
    lifeSpan: 80,
    hepaticFlow: 20.7,
    allometricExponent: 0.75,
    hepaticClearance: 15,
    renalClearance: 1.5,
    bsa: 1.9, // BSA for 70 kg adult; FDA uses 1.62 m² for 60 kg
  },
  // Additional species commonly used in pharmaceutical research
  gerbil: {
    name: "Gerbil",
    weight: 0.07,
    brainWeight: 1.2,
    lifeSpan: 3,
    hepaticFlow: 100,
    allometricExponent: 0.75,
    hepaticClearance: 80,
    renalClearance: 13,
    bsa: 0.012,
  },
  chinchilla: {
    name: "Chinchilla",
    weight: 0.5,
    brainWeight: 6.0,
    lifeSpan: 15,
    hepaticFlow: 75,
    allometricExponent: 0.75,
    hepaticClearance: 58,
    renalClearance: 9,
    bsa: 0.04,
  },
  marmoset: {
    name: "Marmoset",
    weight: 0.35,
    brainWeight: 8.0,
    lifeSpan: 12,
    hepaticFlow: 95,
    allometricExponent: 0.75,
    hepaticClearance: 70,
    renalClearance: 11,
    bsa: 0.045,
  },
  cynomolgus: {
    name: "Cynomolgus Monkey",
    weight: 5,
    brainWeight: 64.0,
    lifeSpan: 30,
    hepaticFlow: 43.6,
    allometricExponent: 0.75,
    hepaticClearance: 35,
    renalClearance: 6,
    bsa: 0.29,
  },
  rhesus: {
    name: "Rhesus Macaque",
    weight: 7,
    brainWeight: 91.0,
    lifeSpan: 25,
    hepaticFlow: 45,
    allometricExponent: 0.75,
    hepaticClearance: 38,
    renalClearance: 6,
    bsa: 0.35,
  },
  beagle: {
    name: "Beagle",
    weight: 10,
    brainWeight: 72.0,
    lifeSpan: 13,
    hepaticFlow: 58,
    allometricExponent: 0.75,
    hepaticClearance: 42,
    renalClearance: 7,
    bsa: 0.5,
  },
  goat: {
    name: "Goat",
    weight: 25,
    brainWeight: 80.0,
    lifeSpan: 12,
    hepaticFlow: 50,
    allometricExponent: 0.75,
    hepaticClearance: 35,
    renalClearance: 5,
    bsa: 0.85,
  },
  pig: {
    name: "Pig",
    weight: 70,
    brainWeight: 154.0,
    lifeSpan: 15,
    hepaticFlow: 35,
    allometricExponent: 0.75,
    hepaticClearance: 25,
    renalClearance: 3.5,
    bsa: 1.6,
  },
};

// Helper functions
export function getSpecies(speciesKey: string): Species | undefined {
  return SPECIES_DATABASE[speciesKey];
}

export function getAllSpeciesKeys(): string[] {
  return Object.keys(SPECIES_DATABASE);
}

export function getSpeciesByWeight(weight: number): string | undefined {
  let closestSpecies: string | undefined;
  let minDifference = Infinity;

  for (const [key, species] of Object.entries(SPECIES_DATABASE)) {
    const difference = Math.abs(species.weight - weight);
    if (difference < minDifference) {
      minDifference = difference;
      closestSpecies = key;
    }
  }

  return closestSpecies;
}
