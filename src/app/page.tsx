'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sun, Moon, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Documentation } from "@/components/Documentation";

interface CalculationSteps {
  weightRatio: number;
  scaledFactor: number;
  calculatedDose: number;
  finalDose: number;
  steps: string[];
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sourceAnimal, setSourceAnimal] = useState('mouse');
  const [targetAnimal, setTargetAnimal] = useState('human');
  const [sourceWeight, setSourceWeight] = useState(0.02);  // Initial mouse weight
  const [targetWeight, setTargetWeight] = useState(70);    // Initial human weight
  const [baseDose, setBaseDose] = useState(1);            // Initial dose of 1mg
  const [scalingMethod, setScalingMethod] = useState('allometric');
  const [scalingExponent, setScalingExponent] = useState('0.75');
  const [showDilution, setShowDilution] = useState(false);
  const [dilutionFactor, setDilutionFactor] = useState('1');
  const [proteinBinding, setProteinBinding] = useState(0);
  const [bioavailability, setBioavailability] = useState(100);
  const [kidneyFunction, setKidneyFunction] = useState(100);
  const [volumeDistribution, setVolumeDistribution] = useState(0);
  const [molecularWeight, setMolecularWeight] = useState(0);
  const [logP, setLogP] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [calculationSteps, setCalculationSteps] = useState<CalculationSteps | null>(null);
  const [selectedTab, setSelectedTab] = useState('calculator');

  // Memoize the animals object to prevent unnecessary rerenders
  const animals = useMemo(() => ({
    mouse: {
      name: 'Mouse',
      weight: 0.02,
      brainWeight: 0.4,
      lifeSpan: 2,
      hepaticFlow: 131,
      allometricExponent: 0.75,
      hepaticClearance: 90,
      renalClearance: 15
    },
    rat: {
      name: 'Rat',
      weight: 0.15,
      brainWeight: 2.0,
      lifeSpan: 3,
      hepaticFlow: 85,
      allometricExponent: 0.75,
      hepaticClearance: 73,
      renalClearance: 12
    },
    rabbit: {
      name: 'Rabbit',
      weight: 2,
      brainWeight: 9.1,
      lifeSpan: 9,
      hepaticFlow: 77,
      allometricExponent: 0.75,
      hepaticClearance: 65,
      renalClearance: 10
    },
    cat: {
      name: 'Cat',
      weight: 4,
      brainWeight: 28.4,
      lifeSpan: 15,
      hepaticFlow: 65,
      allometricExponent: 0.75,
      hepaticClearance: 48,
      renalClearance: 8
    },
    ferret: {
      name: 'Ferret',
      weight: 1.2,
      brainWeight: 7.2,
      lifeSpan: 7,
      hepaticFlow: 72,
      allometricExponent: 0.75,
      hepaticClearance: 52,
      renalClearance: 10
    },
    monkey: {
      name: 'Monkey',
      weight: 5,
      brainWeight: 95.0,
      lifeSpan: 25,
      hepaticFlow: 58,
      allometricExponent: 0.75,
      hepaticClearance: 42,
      renalClearance: 7
    },
    dog: {
      name: 'Dog',
      weight: 20,
      brainWeight: 85.0,
      lifeSpan: 13,
      hepaticFlow: 55,
      allometricExponent: 0.75,
      hepaticClearance: 38,
      renalClearance: 6
    },
    sheep: {
      name: 'Sheep',
      weight: 40,
      brainWeight: 130.0,
      lifeSpan: 12,
      hepaticFlow: 47,
      allometricExponent: 0.75,
      hepaticClearance: 32,
      renalClearance: 5
    },
    guineaPig: {
      name: 'Guinea Pig',
      weight: 1.0,
      brainWeight: 4.8,
      lifeSpan: 6,
      hepaticFlow: 75,
      allometricExponent: 0.75,
      hepaticClearance: 55,
      renalClearance: 8
    },
    hamster: {
      name: 'Hamster',
      weight: 0.1,
      brainWeight: 1.0,
      lifeSpan: 2.5,
      hepaticFlow: 90,
      allometricExponent: 0.75,
      hepaticClearance: 75,
      renalClearance: 12
    },
    miniPig: {
      name: 'Mini Pig',
      weight: 30,
      brainWeight: 125.0,
      lifeSpan: 17,
      hepaticFlow: 45,
      allometricExponent: 0.75,
      hepaticClearance: 28,
      renalClearance: 4
    },
    horse: {
      name: 'Horse',
      weight: 500,
      brainWeight: 620.0,
      lifeSpan: 28,
      hepaticFlow: 28,
      allometricExponent: 0.75,
      hepaticClearance: 18,
      renalClearance: 2.5
    },
    cow: {
      name: 'Cow',
      weight: 600,
      brainWeight: 445.0,
      lifeSpan: 18,
      hepaticFlow: 25,
      allometricExponent: 0.75,
      hepaticClearance: 15,
      renalClearance: 2
    },
    human: {
      name: 'Human',
      weight: 70,
      brainWeight: 1350.0,
      lifeSpan: 80,
      hepaticFlow: 20.7,
      allometricExponent: 0.75,
      hepaticClearance: 15,
      renalClearance: 1.5
    }
  }), []);

  const calculateDose = useCallback((
    baseWeight: number,
    targetWeight: number,
    baseDose: number,
    method: string,
    sourceAnimal: string,
    targetAnimal: string
  ) => {
    const weightRatio = targetWeight / baseWeight;
    let scalingFactor = 0;
    let methodDescription = '';
    let dose = 0;
    let steps: string[] = [];
    
    // Validate inputs
    if (baseWeight <= 0 || targetWeight <= 0) {
      return {
        dose: 0,
        scalingFactor: 0,
        methodDescription: 'Invalid weights',
        steps: ['Error: Source and target weights must be greater than 0']
      };
    }

    const sourceAnimalData = animals[sourceAnimal as keyof typeof animals];
    const targetAnimalData = animals[targetAnimal as keyof typeof animals];

    // Validate animal data exists
    if (!sourceAnimalData || !targetAnimalData) {
      return {
        dose: 0,
        scalingFactor: 0,
        methodDescription: 'Invalid animals',
        steps: ['Error: Source or target animal data not found']
      };
    }
    
    try {
      // Base scaling calculation
      switch (method) {
        case 'allometric':
          if (molecularWeight > 0) {
            scalingFactor = molecularWeight > 700 ? 0.7 : molecularWeight > 400 ? 0.75 : 0.8;
            methodDescription = `Allometric scaling with MW adjustment (${molecularWeight} g/mol → ${scalingFactor})`;
          } else {
            scalingFactor = Number(scalingExponent);
            methodDescription = `Allometric scaling (${scalingFactor})`;
          }
          break;
        case 'brainWeight':
          const sourceBrain = sourceAnimalData.brainWeight;
          const targetBrain = targetAnimalData.brainWeight;
          if (sourceBrain <= 0 || targetBrain <= 0) {
            return {
              dose: 0,
              scalingFactor: 0,
              methodDescription: 'Invalid brain weights',
              steps: ['Error: Brain weights must be greater than 0']
            };
          }
          scalingFactor = (2/3) * Math.log(targetBrain / sourceBrain) / Math.log(weightRatio);
          methodDescription = 'Brain weight scaling';
          break;
        case 'lifeSpan':
          const sourceLife = sourceAnimalData.lifeSpan;
          const targetLife = targetAnimalData.lifeSpan;
          if (sourceLife <= 0 || targetLife <= 0) {
            return {
              dose: 0,
              scalingFactor: 0,
              methodDescription: 'Invalid life spans',
              steps: ['Error: Life spans must be greater than 0']
            };
          }
          scalingFactor = Math.log(targetLife / sourceLife) / Math.log(weightRatio);
          methodDescription = 'Life-span scaling';
          break;
        case 'hepaticFlow':
          const sourceFlow = sourceAnimalData.hepaticFlow;
          const targetFlow = targetAnimalData.hepaticFlow;
          const sourceHepRatio = sourceAnimalData.hepaticClearance / sourceFlow;
          const targetHepRatio = targetAnimalData.hepaticClearance / targetFlow;
          
          if (sourceFlow <= 0 || targetFlow <= 0) {
            return {
              dose: 0,
              scalingFactor: 0,
              methodDescription: 'Invalid hepatic flow values',
              steps: ['Error: Hepatic flow values must be greater than 0']
            };
          }
          
          scalingFactor = Math.log((targetFlow * targetHepRatio) / (sourceFlow * sourceHepRatio)) / Math.log(weightRatio);
          methodDescription = 'Hepatic blood flow scaling';
          break;
        default:
          return {
            dose: 0,
            scalingFactor: 0,
            methodDescription: 'Invalid method',
            steps: ['Error: Invalid scaling method selected']
          };
      }

      // Calculate base scaled dose
      dose = baseDose * Math.pow(weightRatio, scalingFactor);
      steps.push(`Base scaling: ${baseDose} mg × (${weightRatio.toFixed(4)}^${scalingFactor.toFixed(4)}) = ${dose.toFixed(4)} mg`);

      // Apply advanced parameter adjustments
      if (proteinBinding > 0) {
        const proteinBindingFactor = (100 - proteinBinding) / 100;
        dose *= proteinBindingFactor;
        steps.push(`Protein binding (${proteinBinding}%): × ${proteinBindingFactor.toFixed(4)} = ${dose.toFixed(4)} mg`);
      }

      if (bioavailability < 100) {
        const bioavailabilityFactor = bioavailability / 100;
        dose /= bioavailabilityFactor;
        steps.push(`Bioavailability (${bioavailability}%): ÷ ${bioavailabilityFactor.toFixed(4)} = ${dose.toFixed(4)} mg`);
      }

      if (kidneyFunction < 100) {
        const kidneyFactor = kidneyFunction / 100;
        const renalClearanceRatio = targetAnimalData.renalClearance / 100;
        const kidneyAdjustment = 1 + (1 - kidneyFactor) * renalClearanceRatio;
        dose *= kidneyAdjustment;
        steps.push(`Kidney function (${kidneyFunction}%): × ${kidneyAdjustment.toFixed(4)} = ${dose.toFixed(4)} mg`);
      }

      if (volumeDistribution > 0) {
        const volumeFactor = volumeDistribution / targetAnimalData.weight;
        dose *= volumeFactor;
        steps.push(`Volume distribution (${volumeDistribution} L/kg): × ${volumeFactor.toFixed(4)} = ${dose.toFixed(4)} mg`);
      }

      if (logP !== 0) {
        const lipophilicityFactor = 1 + (Math.abs(logP) * 0.1);
        dose *= lipophilicityFactor;
        steps.push(`Lipophilicity (LogP ${logP}): × ${lipophilicityFactor.toFixed(4)} = ${dose.toFixed(4)} mg`);
      }

      return { dose, scalingFactor, methodDescription, steps };
    } catch (error) {
      return {
        dose: 0,
        scalingFactor: 0,
        methodDescription: 'Error',
        steps: ['Error: An error occurred during calculation']
      };
    }
  }, [proteinBinding, bioavailability, kidneyFunction, volumeDistribution, molecularWeight, logP, scalingExponent]);

  const generateChartData = useCallback((
    baseWeight: number,
    baseDose: number,
    method: string,
    sourceAnimal: string
  ) => {
    const numPoints = 200;
    const allPoints: any[] = [];
    
    // Find min and max weights from animals
    const weights = Object.values(animals).map(animal => animal.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    // Generate points using logarithmic scale
    for (let i = 0; i <= numPoints; i++) {
      const logMin = Math.log10(minWeight);
      const logMax = Math.log10(maxWeight);
      const logWeight = logMin + (logMax - logMin) * (i / numPoints);
      const weight = Math.pow(10, logWeight);
      
      // Find closest animal for this weight
      let closestAnimal = Object.entries(animals).reduce((prev, curr) => {
        return Math.abs(curr[1].weight - weight) < Math.abs(prev[1].weight - weight) ? curr : prev;
      })[0];
      
      // Calculate dose for this weight
      const result = calculateDose(baseWeight, weight, baseDose, method, sourceAnimal, closestAnimal);
      
      if (result && typeof result.dose === 'number' && !isNaN(result.dose)) {
        // Find if this weight matches an actual animal point
        const matchingAnimal = Object.entries(animals).find(([key, data]) => 
          Math.abs(data.weight - weight) < (weight * 0.01) // 1% tolerance
        );
        
        allPoints.push({
          name: matchingAnimal ? matchingAnimal[0] : `interpolated_${i}`,
          weight: weight,
          dose: result.dose,
          isAnimal: !!matchingAnimal,
          label: matchingAnimal ? matchingAnimal[1].name : ''
        });
      }
    }
    
    return allPoints;
  }, [calculateDose, animals]);

  const updateCalculationSteps = useCallback((
    baseWeight: number,
    targetWeight: number,
    baseDose: number,
    method: string
  ) => {
    const weightRatio = targetWeight / baseWeight;
    const result = calculateDose(baseWeight, targetWeight, baseDose, method, sourceAnimal, targetAnimal);
    
    let steps: string[] = [
      `1. ${result.methodDescription}`,
      `2. Weight ratio = ${targetWeight.toFixed(3)} kg / ${baseWeight.toFixed(3)} kg = ${weightRatio.toFixed(4)}`,
      `3. ${result.steps.join('\n   ')}`
    ];

    if (showDilution && Number(dilutionFactor) !== 1) {
      steps.push(`4. Dilution adjustment: ${result.dose.toFixed(4)} mg × ${dilutionFactor} = ${(result.dose * Number(dilutionFactor)).toFixed(4)} mg`);
    }

    return steps;
  }, [sourceAnimal, targetAnimal, showDilution, dilutionFactor, calculateDose, animals]);

  // Update dilution factor with validation
  const handleDilutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Ensure value is not empty and is a positive number
    if (value === '' || Number(value) <= 0) {
      setDilutionFactor("1");
    } else {
      setDilutionFactor(value);
    }
  };

  // Update source/target weights when animals change
  useEffect(() => {
    if (sourceAnimal) {
      setSourceWeight(animals[sourceAnimal as keyof typeof animals].weight);
    }
  }, [sourceAnimal, animals]);

  useEffect(() => {
    if (targetAnimal) {
      setTargetWeight(animals[targetAnimal as keyof typeof animals].weight);
    }
  }, [targetAnimal, animals]);

  // Single useEffect for all calculations
  useEffect(() => {
    if (sourceWeight && targetWeight && baseDose) {
      const sourceWeightNum = Number(sourceWeight);
      const targetWeightNum = Number(targetWeight);
      const baseDoseNum = Number(baseDose);
      
      if (sourceWeightNum > 0 && targetWeightNum > 0 && baseDoseNum > 0) {
        const result = calculateDose(sourceWeightNum, targetWeightNum, baseDoseNum, scalingMethod, sourceAnimal, targetAnimal);
        const newDose = result.dose;
        const chartPoints = generateChartData(sourceWeightNum, baseDoseNum, scalingMethod, sourceAnimal);
        setChartData(chartPoints);
        
        // Update calculation steps
        const steps = updateCalculationSteps(sourceWeightNum, targetWeightNum, baseDoseNum, scalingMethod);
        const finalDose = showDilution ? newDose * Number(dilutionFactor) : newDose;
        
        setCalculationSteps({
          weightRatio: targetWeightNum / sourceWeightNum,
          scaledFactor: result.scalingFactor,
          calculatedDose: newDose,
          finalDose: finalDose,
          steps: steps
        });
      }
    }
  }, [
    sourceWeight, targetWeight, baseDose,
    scalingMethod,
    sourceAnimal, targetAnimal,
    showDilution, dilutionFactor,
    calculateDose, generateChartData, updateCalculationSteps
  ]);

  const exportCalculations = () => {
    if (!calculationSteps) return;
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const calculations = `DoseFinder Calculation Report
Generated: ${new Date().toLocaleString()}

Parameters:
-----------
Source Animal: ${sourceAnimal} (${sourceWeight} kg)
Target Animal: ${targetAnimal} (${targetWeight} kg)
Base Dose: ${baseDose} mg/kg
Scaling Method: ${scalingMethod}
${showDilution ? `Dilution Factor: ${dilutionFactor}` : ''}

Calculation Steps:
----------------
${calculationSteps.steps.join('\n')}
${showDilution && Number(dilutionFactor) !== 1 && calculationSteps ? `\nFinal Dose with Dilution: ${calculationSteps.finalDose.toFixed(4)} mg` : ''}

Results:
--------
Base Calculated Dose: ${calculationSteps.calculatedDose.toFixed(4)} mg/kg${showDilution && Number(dilutionFactor) !== 1 && calculationSteps ? `\nFinal Dose with Dilution: ${calculationSteps.finalDose.toFixed(4)} mg/kg` : ''}`;

    const blob = new Blob([calculations], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dosefinder-calculation-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="container mx-auto p-4 max-w-5xl flex-grow">
        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">DoseFinder</CardTitle>
                <div className="flex items-center space-x-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="rounded-full">
                        <Info className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-4" align="end">
                      <div className="space-y-4 text-sm">
                        <h4 className="font-medium leading-none">Disclaimer</h4>
                        <p>DoseFinder is a Simple Allometric Scaling Calculator ("the Calculator") by BioStochastics and is not intended for clinical or therapeutic dosing. The Calculator is intended for informational and educational purposes only.</p>
                        
                        <p>This Calculator is not a substitute for professional medical, pharmacological, toxicological, or veterinary advice. Consult qualified professionals before making decisions based on its outputs.</p>
                        
                        <p>Calculations are for research purposes and should not be used for clinical or therapeutic dosing without professional oversight.</p>
                        
                        <p className="font-medium pt-2">Contact Information</p>
                        <p>Email: sergey.kornilov@biostochastics.com</p>
                        
                        <p className="text-xs text-muted-foreground">By using this calculator, you agree to our terms and assume full responsibility for its use.</p>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={cn(
                      "rounded-full",
                      isDarkMode && "bg-slate-800 text-slate-100 hover:bg-slate-700"
                    )}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              <CardDescription>
                Calculate and visualize pharmacological dose scaling across different species
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="calculator" className="w-full" onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="calculator">Calculator</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced</TabsTrigger>
                  <TabsTrigger value="documentation">Documentation</TabsTrigger>
                </TabsList>

                <TabsContent value="calculator">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="sourceAnimal">Source Animal</Label>
                        <Select value={sourceAnimal} onValueChange={setSourceAnimal}>
                          <SelectTrigger id="sourceAnimal">
                            <SelectValue placeholder="Select source animal" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(animals).map(([key, animal]) => (
                              <SelectItem key={key} value={key}>
                                {animal.name} ({animal.weight} kg)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Label htmlFor="sourceWeight">Source Weight (kg)</Label>
                        <Input
                          id="sourceWeight"
                          type="number"
                          value={sourceWeight}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string for better UX while typing
                            if (value === '') {
                              setSourceWeight(0);
                              return;
                            }
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setSourceWeight(numValue);
                            }
                          }}
                          className="w-24"
                          step="0.001"
                          min="0.001"
                          placeholder="0.020"
                        />
                        <Label htmlFor="baseDose">Base Dose (mg)</Label>
                        <Input
                          id="baseDose"
                          type="number"
                          value={baseDose.toString()}
                          onChange={(e) => setBaseDose(Number(e.target.value) || 0)}
                          className="w-24"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="targetAnimal">Target Animal</Label>
                        <Select value={targetAnimal} onValueChange={setTargetAnimal}>
                          <SelectTrigger id="targetAnimal">
                            <SelectValue placeholder="Select target animal" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(animals).map(([key, animal]) => (
                              <SelectItem key={key} value={key}>
                                {animal.name} ({animal.weight} kg)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Label htmlFor="targetWeight">Target Weight (kg)</Label>
                        <Input
                          id="targetWeight"
                          type="number"
                          value={targetWeight}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Allow empty string for better UX while typing
                            if (value === '') {
                              setTargetWeight(0);
                              return;
                            }
                            const numValue = parseFloat(value);
                            if (!isNaN(numValue) && numValue >= 0) {
                              setTargetWeight(numValue);
                            }
                          }}
                          className="w-24"
                          step="0.001"
                          min="0.001"
                          placeholder="70.000"
                        />
                        <div className="pt-2">
                          <Label>Calculated Dose</Label>
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-2xl font-bold text-primary">
                                {calculationSteps?.calculatedDose !== undefined ? `${calculationSteps.calculatedDose.toFixed(2)} mg` : '-'}
                              </div>
                              {showDilution && Number(dilutionFactor) !== 1 && calculationSteps && (
                                <div className="text-sm text-muted-foreground">
                                  Final with dilution: {calculationSteps.finalDose.toFixed(2)} mg
                                </div>
                              )}
                            </div>
                            {calculationSteps && (
                              <Button 
                                variant="outline"
                                onClick={exportCalculations}
                                size="sm"
                              >
                                Export
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="scalingMethod">Scaling Method</Label>
                      <Select value={scalingMethod} onValueChange={setScalingMethod}>
                        <SelectTrigger id="scalingMethod">
                          <SelectValue placeholder="Select scaling method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="allometric">Allometric</SelectItem>
                          <SelectItem value="brainWeight">Brain Weight</SelectItem>
                          <SelectItem value="lifeSpan">Life-Span</SelectItem>
                          <SelectItem value="hepaticFlow">Hepatic Blood Flow</SelectItem>
                        </SelectContent>
                      </Select>
                      {scalingMethod === 'allometric' && (
                        <div className="mt-2">
                          <Label htmlFor="scalingExponent">Scaling Exponent</Label>
                          <Input
                            id="scalingExponent"
                            type="number"
                            value={scalingExponent}
                            onChange={(e) => setScalingExponent(e.target.value)}
                            className="w-24"
                            step="0.01"
                            min="0"
                            max="2"
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Standard value is 0.75 (3/4 power law)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proteinBinding">Protein Binding (%)</Label>
                        <Input
                          id="proteinBinding"
                          type="number"
                          value={proteinBinding.toString()}
                          onChange={(e) => setProteinBinding(Number(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of drug bound to plasma proteins
                        </p>

                        <Label htmlFor="bioavailability">Bioavailability (%)</Label>
                        <Input
                          id="bioavailability"
                          type="number"
                          value={bioavailability.toString()}
                          onChange={(e) => setBioavailability(Number(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Fraction of drug reaching systemic circulation
                        </p>

                        <Label htmlFor="kidneyFunction">Kidney Function (%)</Label>
                        <Input
                          id="kidneyFunction"
                          type="number"
                          value={kidneyFunction.toString()}
                          onChange={(e) => setKidneyFunction(Number(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          max="100"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of normal kidney function
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="volumeDistribution">Volume of Distribution (L/kg)</Label>
                        <Input
                          id="volumeDistribution"
                          type="number"
                          value={volumeDistribution.toString()}
                          onChange={(e) => setVolumeDistribution(Number(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="0.1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Apparent volume of distribution per kg body weight
                        </p>

                        <Label htmlFor="molecularWeight">Molecular Weight (g/mol)</Label>
                        <Input
                          id="molecularWeight"
                          type="number"
                          value={molecularWeight.toString()}
                          onChange={(e) => setMolecularWeight(Number(e.target.value) || 0)}
                          className="w-24"
                          min="0"
                          step="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Affects scaling exponent for molecules {'>'}400 g/mol
                        </p>

                        <Label htmlFor="logP">Log P</Label>
                        <Input
                          id="logP"
                          type="number"
                          value={logP.toString()}
                          onChange={(e) => setLogP(Number(e.target.value) || 0)}
                          className="w-24"
                          step="0.1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Lipophilicity coefficient (negative for hydrophilic)
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 p-4 bg-secondary rounded-lg">
                      <h4 className="font-medium mb-2">Advanced Parameter Effects</h4>
                      <ul className="text-sm space-y-1 list-disc pl-4">
                        {proteinBinding > 0 && (
                          <li>Protein binding reduces available drug by {proteinBinding}%</li>
                        )}
                        {bioavailability < 100 && (
                          <li>Bioavailability adjustment factor: {(100/bioavailability).toFixed(2)}x</li>
                        )}
                        {kidneyFunction < 100 && (
                          <li>Reduced kidney function ({kidneyFunction}%) affects clearance</li>
                        )}
                        {volumeDistribution > 0 && (
                          <li>Volume of distribution: {volumeDistribution} L/kg</li>
                        )}
                        {molecularWeight > 0 && (
                          <li>Molecular weight affects scaling: {molecularWeight > 700 ? "0.7" : molecularWeight > 400 ? "0.75" : "0.8"}</li>
                        )}
                        {logP !== 0 && (
                          <li>LogP adjustment factor: {(1 + Math.abs(logP) * 0.1).toFixed(2)}x</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="documentation">
                  <Documentation />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Only show results and chart if not in documentation tab */}
          {calculationSteps && selectedTab !== 'documentation' && (
            <>
              {/* Dilution Control */}
              <Card className="bg-secondary mb-4">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="dilution"
                        checked={showDilution}
                        onCheckedChange={setShowDilution}
                        className={cn(
                          "bg-primary",
                          isDarkMode && "data-[state=unchecked]:bg-slate-700"
                        )}
                      />
                      <Label htmlFor="dilution">Show Dilution</Label>
                    </div>
                    {showDilution && (
                      <div className="flex items-center space-x-2">
                        <Input
                          id="dilutionFactor"
                          value={dilutionFactor}
                          onChange={handleDilutionChange}
                          type="number"
                          className="w-24"
                          step="0.1"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Results Card */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Source Animal</Label>
                      <div className="text-2xl font-bold">
                        {animals[sourceAnimal as keyof typeof animals].name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {sourceWeight} kg
                      </div>
                    </div>
                    <div>
                      <Label>Target Animal</Label>
                      <div className="text-2xl font-bold">
                        {animals[targetAnimal as keyof typeof animals].name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {targetWeight} kg
                      </div>
                    </div>
                    <div>
                      <Label>Base Dose</Label>
                      <div className="text-2xl font-bold">
                        {baseDose} mg
                      </div>
                      <Label className="mt-4">Calculated Dose</Label>
                      <div className="text-2xl font-bold text-orange-500">
                        {calculationSteps.calculatedDose.toFixed(4)} mg
                      </div>
                      {showDilution && Number(dilutionFactor) !== 1 && (
                        <div className="text-2xl font-bold text-orange-500">
                          Final with dilution: {calculationSteps.finalDose.toFixed(4)} mg
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Calculation Steps */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    {calculationSteps.steps.map((step, index) => (
                      <p key={index} className="ml-2 font-mono text-xs">{step}</p>
                    ))}
                    {showDilution && Number(dilutionFactor) !== 1 && (
                      <p className="ml-2 font-mono text-xs">
                        {`${calculationSteps.steps.length + 1}. Final Dose with Dilution: ${calculationSteps.calculatedDose.toFixed(4)} × ${dilutionFactor} = ${calculationSteps.finalDose.toFixed(4)} mg`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chart Card */}
              <Card className="min-h-[700px] mb-6">
                <CardHeader>
                  <CardTitle>Dose Scaling Chart</CardTitle>
                </CardHeader>
                <CardContent className="w-full h-[600px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="weight"
                        type="number"
                        scale="log"
                        domain={[0.01, 1000]}
                        allowDuplicatedCategory={true}
                        ticks={chartData.filter(point => point.isAnimal).map(point => point.weight)}
                        tickFormatter={(value) => {
                          // First try to find the animal in the raw data
                          const animal = Object.entries(animals).find(([, data]) => 
                            Math.abs(data.weight - value) < 1e-10
                          );
                          if (animal) return animal[1].name;
                          
                          // Fallback to chart data
                          const point = chartData.find(p => p.isAnimal && Math.abs(p.weight - value) < 1e-10);
                          return point?.label || value.toExponential(1);
                        }}
                        tick={{
                          fill: isDarkMode ? "#e2e8f0" : "#1e293b",
                          fontSize: 12,
                          textAnchor: 'end',
                          transform: 'rotate(-45)'
                        }}
                        angle={-45}
                        dy={15}
                        dx={-10}
                        height={60}
                        interval={0}
                      />
                      <YAxis
                        type="number"
                        domain={['auto', 'auto']}
                        tickFormatter={(value) => `${value.toFixed(1)} mg`}
                        tick={{
                          fill: isDarkMode ? "#e2e8f0" : "#1e293b",
                          fontSize: 12
                        }}
                        interval={0}
                        minTickGap={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDarkMode ? "#1e293b" : "#ffffff",
                          border: isDarkMode ? "1px solid #475569" : "1px solid #e2e8f0",
                          borderRadius: "0.5rem",
                          fontSize: "0.875rem"
                        }}
                        itemStyle={{
                          color: isDarkMode ? "#e2e8f0" : "#1e293b",
                          fontSize: "0.875rem"
                        }}
                        formatter={(value: number) => [`${value.toFixed(2)} mg`, 'Dose']}
                        labelFormatter={(weight: number) => {
                          const point = chartData.find(p => {
                            return p.isAnimal && Math.abs(p.weight - weight) < 1e-10;
                          });
                          return `Weight: ${weight.toFixed(2)} kg${point?.label ? ` (${point.label})` : ''}`;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: "1rem"
                        }}
                        height={36}
                        iconType="circle"
                        iconSize={8}
                      />
                      <Line
                        dataKey="dose"
                        stroke="#f97316"
                        strokeWidth={2}
                        name={`${scalingMethod.charAt(0).toUpperCase() + scalingMethod.slice(1)} Scaling`}
                        dot={(props: any): React.ReactElement<SVGElement> => {
                          const { cx, cy, payload } = props;
                          return (
                            <circle
                              key={`dot-${payload.name}`}
                              cx={cx}
                              cy={cy}
                              r={payload.isAnimal ? 4 : 0}
                              fill="#f97316"
                              stroke="none"
                            />
                          );
                        }}
                        type="monotone"
                        connectNulls={true}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; 2024 BioStochastics with 🖤 Built using Next.js and shadcn@, deployed on Vercel
      </footer>
    </div>
  )
}
