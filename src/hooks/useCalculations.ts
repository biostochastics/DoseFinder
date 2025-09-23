/**
 * Custom hook for safely performing pharmacological calculations
 * Provides error handling, validation, and result caching
 */

import { useState, useCallback, useMemo } from 'react';
import {
  calculateDose,
  calculateCockcroftGFR,
  gfrToDoseAdjustment,
  generateChartData
} from '@/lib/pharmacology/calculations';
import { validateCalculationInputs } from '@/lib/pharmacology/validators';
import { SPECIES_DATABASE } from '@/lib/pharmacology/species';
import {
  CalculationParameters,
  CalculationResult,
  ScalingMethod,
  ChartDataPoint
} from '@/lib/pharmacology/types';

interface UseCalculationsOptions {
  enableCaching?: boolean;
  onError?: (error: Error) => void;
  onWarning?: (warnings: string[]) => void;
}

export function useCalculations(options: UseCalculationsOptions = {}) {
  const { enableCaching = true, onError, onWarning } = options;

  const [lastResult, setLastResult] = useState<CalculationResult | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Memoized cache for recent calculations
  const cache = useMemo(() => new Map<string, CalculationResult>(), []);

  const getCacheKey = useCallback((
    baseWeight: number,
    targetWeight: number,
    baseDose: number,
    method: ScalingMethod,
    sourceAnimal: string,
    targetAnimal: string,
    params?: Partial<CalculationParameters>
  ) => {
    return JSON.stringify({
      baseWeight,
      targetWeight,
      baseDose,
      method,
      sourceAnimal,
      targetAnimal,
      params
    });
  }, []);

  const performCalculation = useCallback((
    baseWeight: number,
    targetWeight: number,
    baseDose: number,
    method: ScalingMethod,
    sourceAnimal: string,
    targetAnimal: string,
    params?: Partial<CalculationParameters>
  ): CalculationResult => {
    try {
      setIsCalculating(true);
      setError(null);

      // Check cache if enabled
      if (enableCaching) {
        const cacheKey = getCacheKey(
          baseWeight,
          targetWeight,
          baseDose,
          method,
          sourceAnimal,
          targetAnimal,
          params
        );

        if (cache.has(cacheKey)) {
          const cached = cache.get(cacheKey)!;
          setLastResult(cached);
          return cached;
        }
      }

      // Validate inputs first
      const validation = validateCalculationInputs(
        baseWeight,
        targetWeight,
        baseDose,
        method,
        params
      );

      if (!validation.isValid) {
        const error = new Error(validation.errors.join('; '));
        setError(error);
        if (onError) onError(error);

        return {
          dose: 0,
          scalingFactor: 0,
          methodDescription: 'Invalid inputs',
          steps: validation.errors,
          warnings: validation.warnings,
          error: validation.errors.join('; ')
        };
      }

      // Handle warnings
      if (validation.warnings.length > 0 && onWarning) {
        onWarning(validation.warnings);
      }

      // Perform calculation
      const result = calculateDose(
        baseWeight,
        targetWeight,
        baseDose,
        method,
        sourceAnimal,
        targetAnimal,
        params
      );

      // Cache the result if enabled
      if (enableCaching) {
        const cacheKey = getCacheKey(
          baseWeight,
          targetWeight,
          baseDose,
          method,
          sourceAnimal,
          targetAnimal,
          params
        );
        cache.set(cacheKey, result);

        // Limit cache size
        if (cache.size > 100) {
          const firstKey = cache.keys().next().value;
          if (firstKey) cache.delete(firstKey);
        }
      }

      setLastResult(result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Calculation failed');
      setError(error);
      if (onError) onError(error);

      return {
        dose: 0,
        scalingFactor: 0,
        methodDescription: 'Error',
        steps: ['An error occurred during calculation'],
        error: error.message
      };
    } finally {
      setIsCalculating(false);
    }
  }, [enableCaching, getCacheKey, cache, onError, onWarning]);

  const generateChart = useCallback((
    baseWeight: number,
    baseDose: number,
    method: ScalingMethod,
    sourceAnimal: string,
    params?: Partial<CalculationParameters>,
    numPoints: number = 50
  ) => {
    try {
      const data = generateChartData(
        baseWeight,
        baseDose,
        method,
        sourceAnimal,
        params,
        numPoints
      );
      setChartData(data);
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Chart generation failed');
      setError(error);
      if (onError) onError(error);
      return [];
    }
  }, [onError]);

  const calculateGFR = useCallback((
    weightKg: number,
    age: number,
    creatinine: number,
    sex: 'male' | 'female'
  ): number => {
    try {
      return calculateCockcroftGFR(weightKg, age, creatinine, sex);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('GFR calculation failed');
      setError(error);
      if (onError) onError(error);
      return 0;
    }
  }, [onError]);

  const getSpeciesData = useCallback((speciesKey: string) => {
    return SPECIES_DATABASE[speciesKey];
  }, []);

  const clearCache = useCallback(() => {
    cache.clear();
  }, [cache]);

  const reset = useCallback(() => {
    setLastResult(null);
    setChartData([]);
    setError(null);
    setIsCalculating(false);
    clearCache();
  }, [clearCache]);

  return {
    // Calculation functions
    performCalculation,
    generateChart,
    calculateGFR,
    getSpeciesData,

    // Results
    lastResult,
    chartData,

    // State
    isCalculating,
    error,

    // Utilities
    clearCache,
    reset,
    gfrToDoseAdjustment
  };
}