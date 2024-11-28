'use client';

import React from 'react';
import { useState, useEffect } from "react";
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
  ResponsiveContainer
} from 'recharts';

interface CalculationSteps {
  weightRatio: number;
  scaledFactor: number;
  calculatedDose: number;
  finalDose: number;
  steps: string[];
}

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sourceAnimal, setSourceAnimal] = useState<string>('mouse');
  const [targetAnimal, setTargetAnimal] = useState<string>('rat');
  const [sourceWeight, setSourceWeight] = useState<string>('0.02');
  const [targetWeight, setTargetWeight] = useState<string>('0.2');
  const [baseDose, setBaseDose] = useState<string>('10');
  const [scalingMethod, setScalingMethod] = useState<string>('allometric');
  const [calculatedDose, setCalculatedDose] = useState<number | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [proteinBinding, setProteinBinding] = useState(0);
  const [volumeDistribution, setVolumeDistribution] = useState(0);
  const [clearanceRate, setClearanceRate] = useState(0);
  const [bioavailability, setBioavailability] = useState(100);
  const [kidneyFunction, setKidneyFunction] = useState(100);
  const [molecularWeight, setMolecularWeight] = useState(0);
  const [logP, setLogP] = useState(0);
  const [showDilution, setShowDilution] = useState(false);
  const [dilutionFactor, setDilutionFactor] = useState("1");
  const [calculationSteps, setCalculationSteps] = useState<CalculationSteps | null>(null);

  // Predefined animals with average weights
  const animals = {
    mouse: {
      name: 'Mouse',
      weight: 0.02,
      brainWeight: 0.4,
      lifeSpan: 2,
      hepaticFlow: 90,
    },
    rat: {
      name: 'Rat',
      weight: 0.15,
      brainWeight: 2,
      lifeSpan: 3,
      hepaticFlow: 80,
    },
    rabbit: {
      name: 'Rabbit',
      weight: 2,
      brainWeight: 10,
      lifeSpan: 9,
      hepaticFlow: 65,
    },
    cat: {
      name: 'Cat',
      weight: 4,
      brainWeight: 30,
      lifeSpan: 15,
      hepaticFlow: 60,
    },
    monkey: {
      name: 'Monkey',
      weight: 5,
      brainWeight: 90,
      lifeSpan: 25,
      hepaticFlow: 60,
    },
    dog: {
      name: 'Dog',
      weight: 20,
      brainWeight: 80,
      lifeSpan: 13,
      hepaticFlow: 60,
    },
    sheep: {
      name: 'Sheep',
      weight: 40,
      brainWeight: 130,
      lifeSpan: 12,
      hepaticFlow: 40,
    },
    pig: {
      name: 'Pig',
      weight: 60,
      brainWeight: 180,
      lifeSpan: 15,
      hepaticFlow: 50,
    },
    human: {
      name: 'Human',
      weight: 70,
      brainWeight: 1400,
      lifeSpan: 80,
      hepaticFlow: 60,
    },
    horse: {
      name: 'Horse',
      weight: 500,
      brainWeight: 600,
      lifeSpan: 30,
      hepaticFlow: 30,
    },
    cow: {
      name: 'Cow',
      weight: 650,
      brainWeight: 450,
      lifeSpan: 20,
      hepaticFlow: 30,
    },
  };

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
    setSourceWeight(animals[sourceAnimal as keyof typeof animals].weight.toString());
  }, [sourceAnimal]);

  useEffect(() => {
    setTargetWeight(animals[targetAnimal as keyof typeof animals].weight.toString());
  }, [targetAnimal]);

  // Calculate dose based on selected method
  const calculateDose = (baseWeight: number, targetWeight: number, baseDose: number, method: string, sourceAnimal: string, targetAnimal: string) => {
    const weightRatio = targetWeight / baseWeight;
    let scalingFactor = 0;
    let methodDescription = '';
    let dose = 0;
    
    switch (method) {
      case 'allometric':
        scalingFactor = 0.75;
        methodDescription = 'Using allometric scaling (weight^0.75)';
        break;
      case 'brainWeight':
        const sourceBrain = animals[sourceAnimal as keyof typeof animals].brainWeight;
        const targetBrain = animals[targetAnimal as keyof typeof animals].brainWeight;
        scalingFactor = 0.75 * (Math.log(targetBrain) / Math.log(sourceBrain));
        methodDescription = 'Using brain weight scaling';
        break;
      case 'lifeSpan':
        const sourceLife = animals[sourceAnimal as keyof typeof animals].lifeSpan;
        const targetLife = animals[targetAnimal as keyof typeof animals].lifeSpan;
        scalingFactor = Math.log10(targetLife / sourceLife) / Math.log10(weightRatio);
        methodDescription = 'Using life-span scaling';
        break;
      case 'hepaticFlow':
        const sourceFlow = animals[sourceAnimal as keyof typeof animals].hepaticFlow;
        const targetFlow = animals[targetAnimal as keyof typeof animals].hepaticFlow;
        scalingFactor = Math.log10(targetFlow / sourceFlow) / Math.log10(weightRatio);
        methodDescription = 'Using hepatic blood flow scaling';
        break;
    }

    // Calculate base scaled dose
    dose = baseDose * Math.pow(weightRatio, scalingFactor);

    // Apply adjustments
    if (proteinBinding > 0) {
      dose = dose * ((100 - proteinBinding) / 100);
    }
    if (bioavailability > 0) {
      dose = dose * (bioavailability / 100);
    }
    if (kidneyFunction > 0 && kidneyFunction < 100) {
      dose = dose * (1 + ((100 - kidneyFunction) / 100));
    }
    if (volumeDistribution > 0) {
      dose = dose * (1 + Math.log10(volumeDistribution));
    }

    return { dose, scalingFactor, methodDescription };
  };

  const updateCalculationSteps = (baseWeight: number, targetWeight: number, baseDose: number, method: string) => {
    const weightRatio = targetWeight / baseWeight;
    const result = calculateDose(baseWeight, targetWeight, baseDose, method, sourceAnimal, targetAnimal);
    
    let steps: string[] = [
      `1. Weight Ratio = Target Weight / Source Weight`,
      `   = ${targetWeight.toFixed(3)} kg / ${baseWeight.toFixed(3)} kg`,
      `   = ${weightRatio.toFixed(4)}`,
      `2. Scaling Factor = ${result.scalingFactor.toFixed(4)}`,
      `3. Base Scaled Dose = ${baseDose} mg × (Weight Ratio ^ Scaling Factor)`,
      `   = ${baseDose} × (${weightRatio.toFixed(4)} ^ ${result.scalingFactor.toFixed(4)})`,
      `   = ${(baseDose * Math.pow(weightRatio, result.scalingFactor)).toFixed(4)} mg`
    ];

    // Add adjustment steps
    if (proteinBinding > 0) {
      steps.push(`4. Protein Binding Adjustment: × ${((100 - proteinBinding) / 100).toFixed(2)}`);
    }
    if (bioavailability > 0) {
      steps.push(`5. Bioavailability Adjustment: × ${(bioavailability / 100).toFixed(2)}`);
    }
    if (kidneyFunction > 0 && kidneyFunction < 100) {
      steps.push(`6. Kidney Function Adjustment: × ${(1 + ((100 - kidneyFunction) / 100)).toFixed(2)}`);
    }
    if (volumeDistribution > 0) {
      steps.push(`7. Volume Distribution Adjustment: × ${(1 + Math.log10(volumeDistribution)).toFixed(2)}`);
    }

    steps.push(`Final Dose = ${result.dose.toFixed(2)} mg`);

    return steps;
  };

  const updateResults = () => {
    const baseWeightNum = Number(sourceWeight);
    const targetWeightNum = Number(targetWeight);
    const baseDoseNum = Number(baseDose);
    const result = calculateDose(baseWeightNum, targetWeightNum, baseDoseNum, scalingMethod, sourceAnimal, targetAnimal);
    setCalculatedDose(result.dose);

    // Update calculation steps
    setCalculationSteps({
      weightRatio: targetWeightNum / baseWeightNum,
      scaledFactor: Math.pow(targetWeightNum / baseWeightNum, result.scalingFactor),
      calculatedDose: result.dose,
      finalDose: result.dose * Number(dilutionFactor),
      steps: updateCalculationSteps(baseWeightNum, targetWeightNum, baseDoseNum, scalingMethod)
    });

    // Generate smooth curve points
    const points = [];
    const logMin = Math.log10(0.01);  // 10g
    const logMax = Math.log10(1000);  // 1000kg
    const steps = 100;
    
    for (let i = 0; i <= steps; i++) {
      const step = (logMax - logMin) / steps;
      const weight = Math.pow(10, logMin + step * i);
      points.push({
        weight: Number(weight.toFixed(3)),
        dose: calculateDose(baseWeightNum, weight, baseDoseNum, scalingMethod, sourceAnimal, targetAnimal).dose,
        name: undefined
      });
    }

    // Add specific animal points
    Object.entries(animals).forEach(([key, animal]) => {
      points.push({
        weight: animal.weight,
        dose: calculateDose(baseWeightNum, animal.weight, baseDoseNum, scalingMethod, sourceAnimal, targetAnimal).dose,
        name: animal.name
      });
    });

    setChartData(points);
  };

  useEffect(() => {
    updateResults();
  }, [sourceAnimal, targetAnimal, sourceWeight, targetWeight, baseDose, scalingMethod,
      proteinBinding, bioavailability, kidneyFunction, dilutionFactor]);

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
                      <Button variant="ghost" size="icon" className="rounded-full">
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
                    size="icon"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={cn(
                      "rounded-full",
                      isDarkMode && "hover:bg-slate-800"
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
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Parameters</TabsTrigger>
                  <TabsTrigger value="advanced">Advanced Parameters</TabsTrigger>
                </TabsList>
                <TabsContent value="basic">
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
                          onChange={(e) => setSourceWeight(e.target.value)}
                          min="0.01"
                          step="0.01"
                          placeholder="Enter source weight"
                        />
                        <Label htmlFor="baseDose">Base Dose (mg)</Label>
                        <Input
                          id="baseDose"
                          type="number"
                          value={baseDose}
                          onChange={(e) => setBaseDose(e.target.value)}
                          min="0"
                          step="0.1"
                          placeholder="Enter base dose"
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
                          onChange={(e) => setTargetWeight(e.target.value)}
                          min="0.01"
                          step="0.01"
                          placeholder="Enter target weight"
                        />
                        <div className="pt-2">
                          <Label>Calculated Dose</Label>
                          <div className="text-2xl font-bold text-primary">
                            {calculatedDose !== null ? `${calculatedDose.toFixed(2)} mg` : '-'}
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
                          value={proteinBinding}
                          onChange={(e) => setProteinBinding(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Enter protein binding %"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bioavailability">Bioavailability (%)</Label>
                        <Input
                          id="bioavailability"
                          type="number"
                          value={bioavailability}
                          onChange={(e) => setBioavailability(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Enter bioavailability %"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="kidneyFunction">Kidney Function (%)</Label>
                        <Input
                          id="kidneyFunction"
                          type="number"
                          value={kidneyFunction}
                          onChange={(e) => setKidneyFunction(Number(e.target.value))}
                          min="0"
                          max="100"
                          step="1"
                          placeholder="Enter kidney function %"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="volumeDistribution">Volume of Distribution (L/kg)</Label>
                        <Input
                          id="volumeDistribution"
                          type="number"
                          value={volumeDistribution}
                          onChange={(e) => setVolumeDistribution(Number(e.target.value))}
                          min="0"
                          step="0.1"
                          placeholder="Enter Vd L/kg"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="molecularWeight">Molecular Weight (g/mol)</Label>
                      <Input
                        id="molecularWeight"
                        type="number"
                        value={molecularWeight}
                        onChange={(e) => setMolecularWeight(Number(e.target.value))}
                        min="0"
                        step="0.1"
                        placeholder="Enter molecular weight"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logP">Log P</Label>
                      <Input
                        id="logP"
                        type="number"
                        value={logP}
                        onChange={(e) => setLogP(Number(e.target.value))}
                        step="0.1"
                        placeholder="Enter Log P"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Source Animal</Label>
                        <div className="text-2xl font-bold">
                          {animals[sourceAnimal as keyof typeof animals].name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {animals[sourceAnimal as keyof typeof animals].weight} kg
                        </div>
                      </div>
                      <div>
                        <Label>Target Animal</Label>
                        <div className="text-2xl font-bold">
                          {animals[targetAnimal as keyof typeof animals].name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {animals[targetAnimal as keyof typeof animals].weight} kg
                        </div>
                      </div>
                    </div>

                    {showDilution && Number(dilutionFactor) !== 1 && calculationSteps && (
                      <div>
                        <Label>Final Dose with Dilution</Label>
                        <div className="text-2xl font-bold">
                          {calculationSteps.finalDose.toFixed(2)} mg
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-secondary">
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
                          min="0.1"
                          step="0.1"
                          placeholder="Enter dilution factor"
                          className={cn(
                            "max-w-[200px]",
                            isDarkMode && "bg-slate-800 border-slate-700 focus-visible:ring-orange-500 focus-visible:ring-offset-orange-500 text-orange-400"
                          )}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calculation Steps</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    {calculationSteps?.steps?.map((step, index) => (
                      <p key={index} className="ml-2 font-mono text-xs">{step}</p>
                    ))}
                    {showDilution && Number(dilutionFactor) !== 1 && calculationSteps && (
                      <p className="ml-2 font-mono text-xs">
                        {`${calculationSteps.steps.length + 1}. Final Dose with Dilution = ${calculationSteps.calculatedDose.toFixed(4)} × ${dilutionFactor} = ${calculationSteps.finalDose.toFixed(4)} mg`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

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
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#333' : '#ccc'}
                />
                <XAxis
                  dataKey="weight"
                  type="number"
                  scale="log"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value) => {
                    const animal = Object.values(animals).find(a => Math.abs(a.weight - value) < 0.001);
                    return animal ? animal.name : '';
                  }}
                  angle={90}
                  textAnchor="start"
                  height={80}
                  interval={0}
                  ticks={Object.values(animals).map(a => a.weight)}
                />
                <YAxis
                  type="number"
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value.toFixed(1)} mg`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDarkMode ? '#1e293b' : 'white',
                    border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  itemStyle={{
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  labelStyle={{
                    color: isDarkMode ? '#94a3b8' : '#64748b',
                    marginBottom: '5px',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} mg`, 'Dose']}
                  labelFormatter={(weight: number) => {
                    const animal = Object.values(animals).find(a => Math.abs(a.weight - weight) < 0.001);
                    return `Weight: ${weight.toFixed(2)} kg${animal ? ` (${animal.name})` : ''}`;
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '11px',
                    marginTop: '5px',
                    color: isDarkMode ? '#e2e8f0' : '#1e293b',
                  }}
                  verticalAlign="bottom"
                  align="center"
                  height={20}
                  iconSize={8}
                />
                <Line
                  type="monotone"
                  dataKey="dose"
                  stroke="#f97316"
                  name={`${scalingMethod.charAt(0).toUpperCase() + scalingMethod.slice(1)} Scaling`}
                  dot={(props: any) => {
                    const { payload, cx, cy, index } = props;
                    const isAnimal = Object.values(animals).some(a => Math.abs(a.weight - payload.weight) < 0.001);
                    if (!isAnimal) return null;
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#f97316"
                        stroke="white"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; Biostochastics 2024
      </footer>
    </div>
  )
}
