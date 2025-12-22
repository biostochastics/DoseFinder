"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  IconSun,
  IconMoon,
  IconCalculator,
  IconFlask,
  IconMicroscope,
  IconPill,
  IconVaccine,
  IconHeartbeat,
  IconChartLine,
  IconStethoscope,
  IconActivity,
  IconChevronRight,
  IconFileText,
  IconBooks,
  IconTestPipe,
  IconAtom,
  IconDna2,
  IconMedicineSyrup,
  IconClipboard,
  IconBrandGithub,
  IconMail,
  IconUserHeart,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

import { Documentation } from "@/components/Documentation";
import { StudyPlanner } from "@/components/StudyPlanner";
import { ScientificLimitations } from "@/components/ScientificLimitations";
import { DoseCalculator } from "@/components/DoseCalculator";
import { DoseChart } from "@/components/DoseChart";
import { AdvancedParameters } from "@/components/AdvancedParameters";
import { ResultsDisplay } from "@/components/ResultsDisplay";
import { FihCalculator } from "@/components/FihCalculator";
import { useCalculatorState } from "@/hooks/useCalculatorState";

export default function Home() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedTab, setSelectedTab] = useState("calculator");

  const {
    state,
    dispatch,
    calculationSteps,
    chartData,
    copySuccess,
    calculateDose,
    copyToClipboard,
    exportResults,
    animals,
    resultDose,
    uncertaintyRange,
    baseDosePerKg,
    resetAll,
    setCustomExponentValue,
  } = useCalculatorState();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const shouldBeDark = savedTheme === "dark" || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newTheme);
  };

  const handleDilutionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "" || !isNaN(Number(value))) {
      dispatch({ type: "SET_DILUTION_FACTOR", payload: value });
    }
  };

  const tabIcons: { [key: string]: React.ReactNode } = {
    calculator: (
      <IconCalculator className="h-4 w-4" stroke={1.5} aria-hidden="true" />
    ),
    fih: <IconUserHeart className="h-4 w-4" stroke={1.5} aria-hidden="true" />,
    advanced: <IconFlask className="h-4 w-4" stroke={1.5} aria-hidden="true" />,
    studyplanner: (
      <IconClipboard className="h-4 w-4" stroke={1.5} aria-hidden="true" />
    ),
    limitations: (
      <IconBooks className="h-4 w-4" stroke={1.5} aria-hidden="true" />
    ),
    documentation: (
      <IconFileText className="h-4 w-4" stroke={1.5} aria-hidden="true" />
    ),
  };

  const getGradientClass = (tab: string) => {
    switch (tab) {
      case "calculator":
        return "from-primary/20 via-muted/40 to-accent/15";
      case "fih":
        return "from-green-500/15 via-primary/20 to-muted/40";
      case "advanced":
        return "from-primary/25 via-secondary/50 to-muted/40";
      case "studyplanner":
        return "from-muted/50 via-accent/20 to-secondary/50";
      case "limitations":
        return "from-primary/20 via-muted/35 to-secondary/50";
      case "documentation":
        return "from-primary/20 via-muted/40 to-accent/12";
      default:
        return "from-gray-500/10 to-gray-600/10";
    }
  };

  const decorativeIcons = [
    <IconMicroscope
      key="micro"
      className="absolute top-4 right-4 h-6 w-6 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconPill
      key="pill"
      className="absolute bottom-4 left-4 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconVaccine
      key="vac"
      className="absolute top-1/2 right-8 h-6 w-6 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconHeartbeat
      key="heart"
      className="absolute bottom-8 right-4 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconChartLine
      key="chart"
      className="absolute top-8 left-8 h-6 w-6 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconStethoscope
      key="steth"
      className="absolute bottom-12 left-1/3 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconActivity
      key="act"
      className="absolute top-1/3 left-4 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconTestPipe
      key="test"
      className="absolute top-16 right-1/3 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconAtom
      key="atom"
      className="absolute bottom-4 right-1/3 h-6 w-6 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconDna2
      key="dna"
      className="absolute top-1/4 left-1/4 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
    <IconMedicineSyrup
      key="med"
      className="absolute bottom-16 right-16 h-5 w-5 text-muted-foreground/20"
      stroke={1}
      aria-hidden="true"
    />,
  ];

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <main
        id="main-content"
        className="w-full flex-grow p-2 lg:p-4"
        role="main"
      >
        <div className="h-full w-full lg:w-[70%] xl:w-[65%] mx-auto">
          <Card className="h-full bg-card/50 backdrop-blur-sm shadow-lg border-border/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="space-y-1 py-2 bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
              <div className="flex items-center justify-between">
                <CardTitle asChild>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2 group">
                    <span className="logo-icon-wrapper">
                      <IconCalculator
                        className="h-6 w-6 text-accent logo-icon"
                        stroke={1.5}
                        aria-hidden="true"
                      />
                    </span>
                    DoseFinder
                  </h1>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="hover:bg-primary/10"
                  aria-label={
                    isDarkMode ? "Switch to light mode" : "Switch to dark mode"
                  }
                >
                  {isDarkMode ? (
                    <IconSun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <IconMoon className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              <CardDescription>
                Advanced cross-species dose translation calculator with
                comprehensive pharmacological modeling
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-6 mb-4 bg-muted/50 p-1 rounded-lg">
                  {[
                    { id: "calculator", label: "Calculator" },
                    { id: "fih", label: "FIH Dose" },
                    { id: "advanced", label: "Advanced" },
                    { id: "studyplanner", label: "Study Planner" },
                    { id: "limitations", label: "Limitations" },
                    { id: "documentation", label: "Docs" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "flex items-center gap-2 transition-all duration-200",
                        selectedTab === tab.id && "bg-background shadow-md",
                      )}
                      aria-label={tab.label}
                    >
                      {tabIcons[tab.id]}
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div
                  className={cn(
                    "relative overflow-hidden rounded-lg p-1 mb-4",
                    "bg-gradient-to-br",
                    getGradientClass(selectedTab),
                  )}
                >
                  {decorativeIcons}
                  <div className="relative z-10 bg-background/95 rounded-lg p-0.5">
                    <div className="flex items-center gap-2 px-3 py-1.5 text-sm">
                      <IconChevronRight
                        className="h-3 w-3 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="text-muted-foreground">
                        {selectedTab === "calculator" &&
                          "Standard dose scaling between species"}
                        {selectedTab === "fih" &&
                          "FDA First-in-Human starting dose calculation"}
                        {selectedTab === "advanced" &&
                          "Advanced pharmacological parameters"}
                        {selectedTab === "studyplanner" &&
                          "Plan and organize dosing studies"}
                        {selectedTab === "limitations" &&
                          "Scientific limitations and considerations"}
                        {selectedTab === "documentation" &&
                          "Comprehensive documentation and references"}
                      </span>
                    </div>
                  </div>
                </div>

                <TabsContent value="fih">
                  <FihCalculator />
                </TabsContent>

                <TabsContent value="calculator">
                  <DoseCalculator
                    sourceAnimal={state.sourceAnimal}
                    targetAnimal={state.targetAnimal}
                    sourceWeight={state.sourceWeight}
                    targetWeight={state.targetWeight}
                    baseDose={state.baseDose}
                    doseInputUnit={state.doseInputUnit}
                    onDoseInputUnitChange={(value) =>
                      dispatch({ type: "SET_DOSE_INPUT_UNIT", payload: value })
                    }
                    baseDosePerKg={baseDosePerKg}
                    scalingMethod={state.scalingMethod}
                    scalingExponent={state.scalingExponent}
                    customExponentValue={state.customExponentValue}
                    animals={animals}
                    onSourceAnimalChange={(value) =>
                      dispatch({ type: "SET_SOURCE_ANIMAL", payload: value })
                    }
                    onTargetAnimalChange={(value) =>
                      dispatch({ type: "SET_TARGET_ANIMAL", payload: value })
                    }
                    onSourceWeightChange={(value) =>
                      dispatch({ type: "SET_SOURCE_WEIGHT", payload: value })
                    }
                    onTargetWeightChange={(value) =>
                      dispatch({ type: "SET_TARGET_WEIGHT", payload: value })
                    }
                    onBaseDoseChange={(value) =>
                      dispatch({ type: "SET_BASE_DOSE", payload: value })
                    }
                    onScalingMethodChange={(value) =>
                      dispatch({ type: "SET_SCALING_METHOD", payload: value })
                    }
                    onScalingExponentChange={(value) =>
                      dispatch({ type: "SET_SCALING_EXPONENT", payload: value })
                    }
                    onCustomExponentValueChange={setCustomExponentValue}
                    calculateDose={calculateDose}
                    calculationSteps={calculationSteps}
                    resultDose={resultDose}
                    uncertaintyRange={uncertaintyRange}
                    copySuccess={copySuccess}
                    onCopyToClipboard={copyToClipboard}
                    onExportResults={exportResults}
                  />
                </TabsContent>

                <TabsContent value="advanced">
                  <AdvancedParameters
                    kidneyFunctionMethod={state.kidneyFunctionMethod}
                    setKidneyFunctionMethod={(value) =>
                      dispatch({
                        type: "SET_KIDNEY_FUNCTION_METHOD",
                        payload: value,
                      })
                    }
                    kidneyFunction={state.kidneyFunction}
                    setKidneyFunction={(value) =>
                      dispatch({ type: "SET_KIDNEY_FUNCTION", payload: value })
                    }
                    fractionExcretedRenal={state.fractionExcretedRenal}
                    setFractionExcretedRenal={(value) =>
                      dispatch({
                        type: "SET_FRACTION_EXCRETED_RENAL",
                        payload: value,
                      })
                    }
                    patientAge={state.patientAge}
                    setPatientAge={(value) =>
                      dispatch({ type: "SET_PATIENT_AGE", payload: value })
                    }
                    patientCreatinine={state.patientCreatinine}
                    setPatientCreatinine={(value) =>
                      dispatch({
                        type: "SET_PATIENT_CREATININE",
                        payload: value,
                      })
                    }
                    creatinineUnit={state.creatinineUnit}
                    setCreatinineUnit={(value) =>
                      dispatch({ type: "SET_CREATININE_UNIT", payload: value })
                    }
                    patientSex={state.patientSex}
                    setPatientSex={(value) =>
                      dispatch({ type: "SET_PATIENT_SEX", payload: value })
                    }
                    bioavailabilityMethod={state.bioavailabilityMethod}
                    setBioavailabilityMethod={(value) =>
                      dispatch({
                        type: "SET_BIOAVAILABILITY_METHOD",
                        payload: value,
                      })
                    }
                    bioavailability={state.bioavailability}
                    setBioavailability={(value) =>
                      dispatch({ type: "SET_BIOAVAILABILITY", payload: value })
                    }
                    resetAll={resetAll}
                  />
                </TabsContent>

                <TabsContent value="studyplanner">
                  <StudyPlanner
                    animals={animals}
                    currentDose={resultDose}
                    currentDoseUnit="mg/kg"
                    sourceAnimal={state.sourceAnimal}
                    targetAnimal={state.targetAnimal}
                  />
                </TabsContent>

                <TabsContent value="limitations">
                  <ScientificLimitations />
                </TabsContent>

                <TabsContent value="documentation">
                  <Documentation />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Only show results and chart if in calculator or advanced tabs */}
          {calculationSteps &&
            (selectedTab === "calculator" || selectedTab === "advanced") && (
              <div className="mt-4 space-y-4">
                <ResultsDisplay
                  calculationSteps={calculationSteps}
                  sourceAnimal={state.sourceAnimal}
                  targetAnimal={state.targetAnimal}
                  sourceWeight={state.sourceWeight}
                  targetWeight={state.targetWeight}
                  baseDosePerKg={baseDosePerKg}
                  animals={animals}
                  showDilution={state.showDilution}
                  setShowDilution={(value) =>
                    dispatch({ type: "SET_DILUTION", payload: value })
                  }
                  dilutionFactor={state.dilutionFactor}
                  handleDilutionChange={handleDilutionChange}
                />

                <DoseChart
                  chartData={chartData}
                  animals={animals}
                  scalingMethod={state.scalingMethod}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
        </div>
      </main>

      <footer className="py-3 px-4 bg-muted/50 border-t" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <a
              href="https://github.com/biostochastics/DoseFinder"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full hover:bg-muted/50"
              aria-label="View project on GitHub (opens in new tab)"
            >
              <IconBrandGithub className="h-4 w-4" aria-hidden="true" />
            </a>
            <span className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Biostochastics, LLC
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="text-xs text-muted-foreground">
              For research use only
            </span>
            <a
              href="mailto:sergey.kornilov@biostochastics.com"
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full hover:bg-muted/50"
              aria-label="Send email to contact"
            >
              <IconMail className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
