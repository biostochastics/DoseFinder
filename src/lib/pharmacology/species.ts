/**
 * Species database for pharmacological calculations
 * Data sources: Davies & Morris (1993), FDA guidance documents
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
    bsa: 2.5,
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
    bsa: 3.0,
  },
  human: {
    name: "Human",
    weight: 70,
    brainWeight: 1350.0,
    lifeSpan: 80,
    hepaticFlow: 20.7,
    allometricExponent: 0.75,
    hepaticClearance: 15,
    renalClearance: 1.5,
    bsa: 1.9,
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
