import { describe, it, expect } from 'vitest';
import {
  calculateDose,
  calculateCockcroftGFR,
  gfrToDoseAdjustment,
  generateChartData
} from './calculations';
import { CalculationParameters } from './types';

describe('DoseFinder Calculation Tests', () => {
  describe('calculateCockcroftGFR', () => {
    it('should calculate GFR correctly for standard male patient', () => {
      // Formula: ((140 - age) * weight) / (72 * creatinine)
      // ((140 - 40) * 70) / (72 * 1) = 97.22
      const gfr = calculateCockcroftGFR(70, 40, 1, 'male');
      expect(gfr).toBeCloseTo(97.22, 1);
    });

    it('should apply female adjustment factor', () => {
      // 97.22 * 0.85 = 82.64
      const gfr = calculateCockcroftGFR(70, 40, 1, 'female');
      expect(gfr).toBeCloseTo(82.64, 1);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateCockcroftGFR(0, 40, 1, 'male')).toBe(0);
      expect(calculateCockcroftGFR(70, 0, 1, 'male')).toBe(0);
      expect(calculateCockcroftGFR(70, 40, 0, 'male')).toBe(0);
      expect(calculateCockcroftGFR(-70, 40, 1, 'male')).toBe(0);
    });

    it('should handle edge case where age equals 140', () => {
      const gfr = calculateCockcroftGFR(70, 140, 1, 'male');
      expect(gfr).toBe(0);
    });

    it('should handle very high creatinine values', () => {
      const gfr = calculateCockcroftGFR(70, 40, 10, 'male');
      expect(gfr).toBeCloseTo(9.72, 1);
    });
  });

  describe('gfrToDoseAdjustment', () => {
    it('should return correct adjustment factors for different GFR ranges', () => {
      expect(gfrToDoseAdjustment(0)).toBe(0.25);
      expect(gfrToDoseAdjustment(10)).toBe(0.25);
      expect(gfrToDoseAdjustment(15)).toBe(0.5);
      expect(gfrToDoseAdjustment(30)).toBe(0.75);
      expect(gfrToDoseAdjustment(60)).toBe(1.0);
      expect(gfrToDoseAdjustment(100)).toBe(1.0);
    });

    it('should handle boundary values correctly', () => {
      expect(gfrToDoseAdjustment(14.99)).toBe(0.25);
      expect(gfrToDoseAdjustment(15)).toBe(0.5);
      expect(gfrToDoseAdjustment(29.99)).toBe(0.5);
      expect(gfrToDoseAdjustment(30)).toBe(0.75);
      expect(gfrToDoseAdjustment(59.99)).toBe(0.75);
      expect(gfrToDoseAdjustment(60)).toBe(1.0);
    });
  });

  describe('calculateDose - Input Validation', () => {
    it('should return error for zero or negative weights', () => {
      const result = calculateDose(0, 70, 1, 'allometric', 'mouse', 'human');
      expect(result.dose).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.steps).toContain('Source weight: Weight must be greater than 0');
    });

    it('should return error for invalid species', () => {
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'dragon');
      expect(result.dose).toBe(0);
      expect(result.error).toBe('Invalid species selection');
    });

    it('should return error for zero dose', () => {
      const result = calculateDose(0.02, 70, 0, 'allometric', 'mouse', 'human');
      expect(result.dose).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should handle extremely large weights with warning', () => {
      const result = calculateDose(5000, 70, 1, 'allometric', 'human', 'human');
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Source weight: Very large weight detected. Please verify the value is correct');
    });
  });

  describe('calculateDose - Allometric Scaling', () => {
    it('should calculate standard allometric scaling (mouse to human)', () => {
      // Formula: baseDose * (targetWeight / sourceWeight) ^ 0.75
      // 1 * (70 / 0.02) ^ 0.75 = 1 * 3500 ^ 0.75 ≈ 455.04
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human');
      expect(result.dose).toBeCloseTo(455.04, 1);
      expect(result.methodDescription).toContain('Allometric scaling');
    });

    it('should adjust for molecular weight', () => {
      const params: Partial<CalculationParameters> = { molecularWeight: 800 };
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(result.methodDescription).toContain('MW adjustment');
      expect(result.methodDescription).toContain('0.7');
    });

    it('should use custom scaling exponent', () => {
      const params: Partial<CalculationParameters> = { scalingExponent: 0.67 };
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(result.dose).toBeGreaterThan(0);
      expect(result.dose).not.toBeCloseTo(444.8, 0); // Different from default 0.75
    });
  });

  describe('calculateDose - BSA Scaling', () => {
    it('should calculate BSA-based scaling correctly', () => {
      // Mouse BSA: 0.006 m², Human BSA: 1.9 m²
      // 1 * (1.9 / 0.006) ≈ 316.67
      const result = calculateDose(0.02, 70, 1, 'bsa', 'mouse', 'human');
      expect(result.dose).toBeCloseTo(316.67, 1);
      expect(result.methodDescription).toBe('BSA-based scaling');
    });

    it('should handle same species BSA calculation', () => {
      const result = calculateDose(70, 70, 10, 'bsa', 'human', 'human');
      expect(result.dose).toBe(10);
    });
  });

  describe('calculateDose - Brain Weight Scaling', () => {
    it('should calculate brain weight scaling', () => {
      const result = calculateDose(0.02, 70, 1, 'brainWeight', 'mouse', 'human');
      expect(result.dose).toBeGreaterThan(0);
      expect(result.methodDescription).toBe('Brain weight scaling');
    });

    it('should handle equal weights gracefully', () => {
      const result = calculateDose(70, 70, 1, 'brainWeight', 'human', 'human');
      // Should handle the edge case without crashing
      expect(result).toBeDefined();
    });
  });

  describe('calculateDose - Advanced Parameters', () => {
    it('should apply protein binding adjustment', () => {
      const baseResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human');
      const params: Partial<CalculationParameters> = { proteinBinding: 90 };
      const adjustedResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);

      // 90% binding means only 10% active
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 0.1, 1);
    });

    it('should prevent negative doses with high protein binding', () => {
      const params: Partial<CalculationParameters> = { proteinBinding: 99.9 };
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(result.dose).toBeGreaterThan(0);
    });

    it('should apply bioavailability adjustment', () => {
      const baseResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human');
      const params: Partial<CalculationParameters> = { bioavailability: 50 };
      const adjustedResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);

      // 50% bioavailability means dose should be doubled
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 2, 1);
    });

    it('should handle bioavailability method presets', () => {
      const ivParams: Partial<CalculationParameters> = { bioavailabilityMethod: 'iv' };
      const oralParams: Partial<CalculationParameters> = { bioavailabilityMethod: 'oral' };

      const ivResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', ivParams);
      const oralResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', oralParams);

      // Oral should be double IV (50% vs 100% bioavailability)
      expect(oralResult.dose).toBeCloseTo(ivResult.dose * 2, 1);
    });

    it('should apply kidney function adjustment', () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: 'manual',
        kidneyFunction: 50
      };
      const baseResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human');
      const adjustedResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);

      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 0.5, 1);
    });

    it('should apply Cockcroft-Gault kidney adjustment', () => {
      const params: Partial<CalculationParameters> = {
        kidneyFunctionMethod: 'cockcroft',
        patientAge: 70,
        patientCreatinine: 2,
        patientSex: 'male'
      };
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);

      expect(result.steps.some(s => s.includes('Cockcroft-Gault'))).toBe(true);
      expect(result.dose).toBeGreaterThan(0);
    });

    it('should apply multiple adjustments correctly', () => {
      const params: Partial<CalculationParameters> = {
        proteinBinding: 50,      // 50% active
        bioavailability: 50,     // Double dose
        kidneyFunctionMethod: 'manual',
        kidneyFunction: 80       // 80% dose
      };

      const baseResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human');
      const adjustedResult = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);

      // Expected: base * 0.5 (protein) * 2 (bioavailability) * 0.8 (kidney) = base * 0.8
      expect(adjustedResult.dose).toBeCloseTo(baseResult.dose * 0.8, 1);
    });
  });

  describe('generateChartData', () => {
    it('should generate chart data points', () => {
      const data = generateChartData(0.02, 1, 'allometric', 'mouse', {}, 10);

      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data.some(p => p.isAnimal)).toBe(true);
      expect(data.some(p => !p.isAnimal)).toBe(true);
    });

    it('should sort data points by weight', () => {
      const data = generateChartData(0.02, 1, 'allometric', 'mouse', {}, 10);

      for (let i = 1; i < data.length; i++) {
        expect(data[i].weight).toBeGreaterThanOrEqual(data[i - 1].weight);
      }
    });

    it('should include all species as data points', () => {
      const data = generateChartData(0.02, 1, 'allometric', 'mouse', {}, 10);
      const animalPoints = data.filter(p => p.isAnimal);

      expect(animalPoints.length).toBeGreaterThan(10); // Should have all species
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle division by zero in logarithmic calculations', () => {
      // When weights are equal, log(1) = 0, which could cause division by zero
      const result = calculateDose(70, 70, 1, 'lifeSpan', 'human', 'human');
      expect(result).toBeDefined();
      // Should either handle gracefully or return an error
    });

    it('should handle very small dose values', () => {
      const result = calculateDose(70, 0.02, 1000, 'allometric', 'human', 'mouse');
      expect(result.dose).toBeGreaterThan(0);
      expect(result.dose).toBeLessThan(1000);
    });

    it('should handle extreme scaling factors', () => {
      const params: Partial<CalculationParameters> = { scalingExponent: 2 };
      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(result.dose).toBeGreaterThan(0);
      expect(isFinite(result.dose)).toBe(true);
    });

    it('should validate against mathematical errors', () => {
      // Test with parameters that might cause NaN or Infinity
      const params: Partial<CalculationParameters> = {
        bioavailability: 0.1,  // Very low, but not zero
        proteinBinding: 99.9,   // Very high
        logP: 10,              // Extreme value
        molecularWeight: 100000 // Very large
      };

      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(isFinite(result.dose)).toBe(true);
      expect(result.dose).not.toBeNaN();
    });

    it('should provide warnings for unusual parameters', () => {
      const params: Partial<CalculationParameters> = {
        proteinBinding: 98,
        bioavailability: 5
      };

      const result = calculateDose(0.02, 70, 1, 'allometric', 'mouse', 'human', params);
      expect(result.warnings).toBeDefined();
      expect(result.warnings!.length).toBeGreaterThan(0);
    });
  });
});