/**
 * Volume limit validation for administration routes
 *
 * Implements NC3Rs/IACUC guidelines for maximum administration volumes
 * per species and route. These are soft warnings with override capability,
 * as regulatory guidance allows exceptions with justification.
 *
 * Reference: NC3Rs Administration of Substances Guidelines
 */

import { VOLUME_LIMITS, type AdminRoute, type VolumeLimit } from "./constants";

// ============================================================================
// Types
// ============================================================================

/**
 * Volume warning severity
 */
export type VolumeSeverity = "info" | "warning" | "critical";

/**
 * Suggestion for resolving volume limit exceedance
 */
export interface VolumeSuggestion {
  type:
    "increase_concentration" | "split_dose" | "change_route" | "reduce_volume";
  description: string;
  newValue?: number;
  unit?: string;
}

/**
 * Volume warning generated during calculation
 */
export interface VolumeWarning {
  severity: VolumeSeverity;
  code: string;
  message: string;
  calculatedVolume: number;
  limit: number;
  limitType: "per_kg" | "absolute" | "per_site";
  suggestions: VolumeSuggestion[];
  canOverride: boolean;
  notes?: string;
}

/**
 * Result of volume validation
 */
export interface VolumeValidationResult {
  isValid: boolean;
  volume: number;
  volumeUnit: string;
  species: string;
  route: AdminRoute;
  weight: number;
  warnings: VolumeWarning[];
  limit: VolumeLimit | null;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Get volume limits for a species and route
 *
 * @param species - Species identifier
 * @param route - Administration route
 * @returns VolumeLimit or null if not found
 */
export function getVolumeLimit(
  species: string,
  route: AdminRoute,
): VolumeLimit | null {
  const normalizedSpecies = species.toLowerCase().replace(/\s+/g, "");
  const speciesLimits = VOLUME_LIMITS[normalizedSpecies];

  if (!speciesLimits) {
    return null;
  }

  return speciesLimits[route] ?? null;
}

/**
 * Calculate administration volume from dose and concentration
 *
 * @param doseMg - Dose in mg
 * @param concentrationMgMl - Stock concentration in mg/mL
 * @returns Volume in mL
 */
export function calculateVolume(
  doseMg: number,
  concentrationMgMl: number,
): number {
  if (concentrationMgMl <= 0) return 0;
  return doseMg / concentrationMgMl;
}

/**
 * Calculate required concentration to meet volume limit
 *
 * @param doseMg - Dose in mg
 * @param maxVolumeMl - Maximum allowed volume in mL
 * @returns Required concentration in mg/mL
 */
export function calculateRequiredConcentration(
  doseMg: number,
  maxVolumeMl: number,
): number {
  if (maxVolumeMl <= 0) return Infinity;
  return doseMg / maxVolumeMl;
}

/**
 * Generate suggestions for resolving volume limit exceedance
 *
 * @param volumeMl - Calculated volume in mL
 * @param limit - Volume limit configuration
 * @param weightKg - Animal weight in kg
 * @param doseMg - Optional dose in mg (required for concentration suggestions)
 * @returns Array of suggestions
 */
function generateSuggestions(
  volumeMl: number,
  limit: VolumeLimit,
  weightKg: number,
  doseMg?: number,
): VolumeSuggestion[] {
  const suggestions: VolumeSuggestion[] = [];

  // Calculate the limiting factor
  const maxByWeight = limit.maxMlPerKg * weightKg;
  const maxAbsolute = limit.maxAbsoluteMl;
  const effectiveMax = Math.min(maxByWeight, maxAbsolute);

  // Suggestion 1: Increase concentration (only when dose is known)
  // FIX: Only generate concentration suggestions when actual dose is provided
  // Previously used volume as placeholder dose which gave incorrect recommendations
  if (doseMg !== undefined && doseMg > 0) {
    const requiredConc = calculateRequiredConcentration(doseMg, effectiveMax);
    if (requiredConc > 0 && requiredConc < Infinity) {
      suggestions.push({
        type: "increase_concentration",
        description: `Increase stock concentration to at least ${requiredConc.toFixed(2)} mg/mL to achieve ${effectiveMax.toFixed(2)} mL dosing volume`,
        newValue: requiredConc,
        unit: "mg/mL",
      });
    }
  }

  // Suggestion 2: Split dose (if > 2× limit)
  if (volumeMl > effectiveMax * 2) {
    const numDoses = Math.ceil(volumeMl / effectiveMax);
    suggestions.push({
      type: "split_dose",
      description: `Split into ${numDoses} administrations of ${(volumeMl / numDoses).toFixed(2)} mL each`,
      newValue: numDoses,
    });
  }

  // Suggestion 3: Reduce volume (general)
  suggestions.push({
    type: "reduce_volume",
    description: `Reduce to ≤${effectiveMax.toFixed(2)} mL (${limit.maxMlPerKg} mL/kg or ${limit.maxAbsoluteMl} mL absolute)`,
    newValue: effectiveMax,
    unit: "mL",
  });

  return suggestions;
}

/**
 * Validate administration volume against NC3Rs/IACUC guidelines
 *
 * @param params - Validation parameters
 * @returns VolumeValidationResult with warnings and suggestions
 */
export function validateVolume(params: {
  species: string;
  route: AdminRoute;
  weightKg: number;
  volumeMl: number;
}): VolumeValidationResult {
  const { species, route, weightKg, volumeMl } = params;
  const warnings: VolumeWarning[] = [];

  // Get limits for species and route
  const limit = getVolumeLimit(species, route);

  // Create base result
  const result: VolumeValidationResult = {
    isValid: true,
    volume: volumeMl,
    volumeUnit: "mL",
    species,
    route,
    weight: weightKg,
    warnings: [],
    limit,
  };

  // If no limits defined for this species/route, return with info
  if (!limit) {
    warnings.push({
      severity: "info",
      code: "NO_LIMIT_DEFINED",
      message: `No volume limits defined for ${species} ${route} administration`,
      calculatedVolume: volumeMl,
      limit: 0,
      limitType: "per_kg",
      suggestions: [],
      canOverride: true,
      notes: "Consider using general guidelines for similar species",
    });
    result.warnings = warnings;
    return result;
  }

  // Calculate effective limits
  const maxByWeight = limit.maxMlPerKg * weightKg;
  const maxAbsolute = limit.maxAbsoluteMl;

  // Check per-kg limit
  if (volumeMl > maxByWeight) {
    const excessPercent = ((volumeMl / maxByWeight - 1) * 100).toFixed(0);
    const severity: VolumeSeverity =
      volumeMl > maxByWeight * 2 ? "critical" : "warning";

    warnings.push({
      severity,
      code: "EXCEEDS_PER_KG_LIMIT",
      message: `Volume (${volumeMl.toFixed(2)} mL) exceeds ${limit.maxMlPerKg} mL/kg limit by ${excessPercent}%`,
      calculatedVolume: volumeMl,
      limit: maxByWeight,
      limitType: "per_kg",
      // FIX: Don't pass placeholder dose - concentration suggestions require actual dose
      suggestions: generateSuggestions(volumeMl, limit, weightKg),
      canOverride: true,
      notes: limit.notes || undefined,
    });
    result.isValid = false;
  }

  // Check absolute limit
  if (volumeMl > maxAbsolute) {
    const excessPercent = ((volumeMl / maxAbsolute - 1) * 100).toFixed(0);
    const severity: VolumeSeverity =
      volumeMl > maxAbsolute * 2 ? "critical" : "warning";

    // Only add if different from per-kg warning
    if (maxAbsolute < maxByWeight) {
      warnings.push({
        severity,
        code: "EXCEEDS_ABSOLUTE_LIMIT",
        message: `Volume (${volumeMl.toFixed(2)} mL) exceeds absolute limit of ${maxAbsolute} mL by ${excessPercent}%`,
        calculatedVolume: volumeMl,
        limit: maxAbsolute,
        limitType: "absolute",
        // FIX: Don't pass placeholder dose - concentration suggestions require actual dose
        suggestions: generateSuggestions(volumeMl, limit, weightKg),
        canOverride: true,
        notes: limit.notes || undefined,
      });
      result.isValid = false;
    }
  }

  // Check per-site limit for IM route
  if (route === "im" && limit.maxMlPerSite && limit.maxSites) {
    const maxTotal = limit.maxMlPerSite * limit.maxSites;
    if (volumeMl > maxTotal) {
      warnings.push({
        severity: "warning",
        code: "EXCEEDS_IM_SITE_LIMIT",
        message: `Volume exceeds IM limit of ${limit.maxMlPerSite} mL/site × ${limit.maxSites} sites = ${maxTotal} mL`,
        calculatedVolume: volumeMl,
        limit: maxTotal,
        limitType: "per_site",
        suggestions: [
          {
            type: "split_dose",
            description: `Split into multiple injection sites (max ${limit.maxMlPerSite} mL/site)`,
            newValue: limit.maxMlPerSite,
            unit: "mL/site",
          },
        ],
        canOverride: true,
        notes: limit.notes || "IM route not recommended for this species",
      });
      result.isValid = false;
    }
  }

  // Add notes as info if present and no warnings
  if (limit.notes && warnings.length === 0) {
    warnings.push({
      severity: "info",
      code: "ROUTE_NOTES",
      message: limit.notes,
      calculatedVolume: volumeMl,
      limit: Math.min(maxByWeight, maxAbsolute),
      limitType: "per_kg",
      suggestions: [],
      canOverride: true,
    });
  }

  result.warnings = warnings;
  return result;
}

/**
 * Validate volume with dose and concentration parameters
 *
 * @param params - Extended validation parameters
 * @returns VolumeValidationResult with complete information
 */
export function validateDoseVolume(params: {
  species: string;
  route: AdminRoute;
  weightKg: number;
  doseMg: number;
  concentrationMgMl: number;
}): VolumeValidationResult {
  const volumeMl = calculateVolume(params.doseMg, params.concentrationMgMl);

  const result = validateVolume({
    species: params.species,
    route: params.route,
    weightKg: params.weightKg,
    volumeMl,
  });

  // FIX: Regenerate suggestions with actual dose information
  // This provides accurate concentration recommendations since we know the dose
  if (result.limit) {
    result.warnings = result.warnings.map((warning) => {
      // Only regenerate suggestions for limit-related warnings (not IM site limits)
      if (
        warning.code === "EXCEEDS_PER_KG_LIMIT" ||
        warning.code === "EXCEEDS_ABSOLUTE_LIMIT"
      ) {
        return {
          ...warning,
          suggestions: generateSuggestions(
            volumeMl,
            result.limit!,
            params.weightKg,
            params.doseMg, // Pass actual dose for concentration suggestions
          ),
        };
      }
      return warning;
    });
  }

  return result;
}

/**
 * Get all supported species with volume limits
 *
 * @returns Array of species IDs
 */
export function getSupportedSpeciesForVolumeLimits(): string[] {
  return Object.keys(VOLUME_LIMITS);
}

/**
 * Get all routes with limits for a species
 *
 * @param species - Species identifier
 * @returns Array of admin routes
 */
export function getRoutesWithLimits(species: string): AdminRoute[] {
  const normalizedSpecies = species.toLowerCase().replace(/\s+/g, "");
  const speciesLimits = VOLUME_LIMITS[normalizedSpecies];

  if (!speciesLimits) {
    return [];
  }

  return Object.keys(speciesLimits) as AdminRoute[];
}

/**
 * Format volume limit for display
 *
 * @param limit - VolumeLimit configuration
 * @param weightKg - Optional weight for per-kg calculation
 * @returns Formatted string
 */
export function formatVolumeLimit(
  limit: VolumeLimit,
  weightKg?: number,
): string {
  const parts: string[] = [];

  parts.push(`${limit.maxMlPerKg} mL/kg`);

  if (weightKg) {
    parts.push(
      `(${(limit.maxMlPerKg * weightKg).toFixed(2)} mL for ${weightKg} kg)`,
    );
  }

  parts.push(`or ${limit.maxAbsoluteMl} mL absolute`);

  if (limit.maxMlPerSite && limit.maxSites) {
    parts.push(`[${limit.maxMlPerSite} mL/site × ${limit.maxSites} sites]`);
  }

  return parts.join(" ");
}
