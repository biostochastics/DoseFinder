import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, BookOpen } from "lucide-react";

export function FormulaDocumentation() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Scaling Formula Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Allometric Scaling</Badge>
                <Badge variant="outline">Most Common</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  Dose_target = Dose_source × (Weight_target / Weight_source)^b
                </p>
                <p>where b is the allometric exponent (typically 0.75)</p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Metabolic rate scales with body
                  mass^0.75 (Kleiber's law)
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Drugs cleared by metabolism, when
                  pharmacokinetics scale with metabolic rate
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  <strong>Reference:</strong> West GB, Brown JH (2005) "The
                  origin of allometric scaling laws in biology" J Exp Biol
                  208:1575-92
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Brain Weight Scaling</Badge>
                <Badge variant="outline">CNS Drugs</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  b = (2/3) × ln(Brain_target / Brain_source) / ln(Weight_target
                  / Weight_source)
                </p>
                <p>
                  Then: Dose_target = Dose_source × (Weight_target /
                  Weight_source)^b
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Brain weight scales differently than
                  body weight across species
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> CNS-active drugs, psychotropics,
                  anesthetics
                </p>
                <p className="text-orange-600 dark:text-orange-400">
                  <strong>Note:</strong> The 2/3 coefficient is empirical and
                  may vary by drug class
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  <strong>Reference:</strong> Mahmood I, Balian JD (1996)
                  "Interspecies scaling: predicting clearance of anticancer
                  drugs" Br J Clin Pharmacol 41:163-75
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Life-Span Scaling</Badge>
                <Badge variant="outline">Theoretical</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  b = ln(LifeSpan_target / LifeSpan_source) / ln(Weight_target /
                  Weight_source)
                </p>
                <p>
                  Then: Dose_target = Dose_source × (Weight_target /
                  Weight_source)^b
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Maximum life span potential correlates
                  with metabolic capacity
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Chronic toxicity studies,
                  gerontological research
                </p>
                <p className="text-orange-600 dark:text-orange-400">
                  <strong>Limitation:</strong> Assumes similar aging mechanisms
                  across species
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  <strong>Reference:</strong> Boxenbaum H (1982) "Interspecies
                  scaling, allometry, physiological time, and the ground plan of
                  pharmacokinetics" J Pharmacokinet Biopharm 10:201-27
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Hepatic Blood Flow</Badge>
                <Badge variant="outline">High-Extraction Drugs</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  b = ln[(Q_h × CL_h/Q_h)_target / (Q_h × CL_h/Q_h)_source] /
                  ln(W_ratio)
                </p>
                <p>where Q_h = hepatic blood flow, CL_h = hepatic clearance</p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Clearance of high-extraction drugs
                  depends on hepatic blood flow
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Drugs with hepatic extraction ratio
                  &gt; 0.7
                </p>
                <p className="text-orange-600 dark:text-orange-400">
                  <strong>Important:</strong> Only valid for flow-limited drugs
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  <strong>Reference:</strong> Ward KW, Smith BR (2004) "A
                  comprehensive quantitative and qualitative evaluation of
                  extrapolation of intravenous pharmacokinetic parameters" Drug
                  Metab Dispos 32:603-11
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Body Surface Area (BSA)</Badge>
                <Badge variant="outline">Oncology Standard</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded">
                  Dose_target = Dose_source × (BSA_target / BSA_source)
                </p>
                <p>BSA (m²) ≈ 0.007184 × Weight(kg)^0.425 × Height(cm)^0.725</p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> BSA correlates with many physiological
                  parameters
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Chemotherapy agents, traditional in
                  oncology
                </p>
                <p className="text-orange-600 dark:text-orange-400">
                  <strong>Criticism:</strong> May not be optimal for all drug
                  types
                </p>
                <p className="text-blue-600 dark:text-blue-400">
                  <strong>Reference:</strong> Reagan-Shaw S et al. (2008) "Dose
                  translation from animal to human studies revisited" FASEB J
                  22:659-61
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-blue-600" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">
                  Key Considerations for Method Selection:
                </p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>
                    <strong>Drug properties:</strong> Lipophilicity, protein
                    binding, molecular weight
                  </li>
                  <li>
                    <strong>Clearance pathway:</strong> Hepatic, renal, or mixed
                    elimination
                  </li>
                  <li>
                    <strong>Target organ:</strong> CNS drugs may require brain
                    weight scaling
                  </li>
                  <li>
                    <strong>Study type:</strong> Acute vs. chronic exposure
                  </li>
                  <li>
                    <strong>Safety factors:</strong> FDA recommends 10-fold
                    safety factor for first-in-human
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm font-semibold mb-2">FDA Guidance (2005):</p>
            <p className="text-sm">
              "Estimating the Maximum Safe Starting Dose in Initial Clinical
              Trials for Therapeutics in Adult Healthy Volunteers" recommends
              using allometric scaling with appropriate safety factors. The HED
              (Human Equivalent Dose) is calculated as:
            </p>
            <p className="font-mono text-sm mt-2 bg-white dark:bg-slate-800 p-2 rounded">
              HED = Animal dose × (Animal weight / Human weight)^(1-b)
            </p>
            <p className="text-sm mt-2">
              where b = 0.67 for scaling based on body surface area
              normalization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
