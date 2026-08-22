"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, BookOpen, ExternalLink } from "lucide-react";
import { Formula, Math } from "@/components/ui/math";

// Standardized reference link component for consistency
function ReferenceLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:underline inline-flex items-center gap-0.5"
    >
      {children}
      <ExternalLink className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}

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
                <Formula altText="Target per-kilogram dose equals source per-kilogram dose times the ratio of target weight to source weight, raised to the power b minus 1">
                  {String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \left(\frac{W_{\text{target}}}{W_{\text{source}}}\right)^{b-1}`}
                </Formula>
                <p>
                  where <Math altText="b">b</Math> is the allometric (clearance)
                  exponent (typically <Math altText="0.75">0.75</Math>). Doses
                  in DoseFinder are expressed per kilogram (mg/kg), so the
                  dose-conversion exponent is{" "}
                  <Math altText="b minus 1">{String.raw`b-1`}</Math> (e.g.{" "}
                  <Math altText="negative 0.25">{String.raw`-0.25`}</Math> when{" "}
                  <Math altText="b equals 0.75">{String.raw`b = 0.75`}</Math>).
                  Total dose (mg) scales with exponent{" "}
                  <Math altText="b">b</Math>.
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Metabolic rate scales with body mass
                  <sup>0.75</sup> (Kleiber&apos;s law)
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Drugs cleared by metabolism, when
                  pharmacokinetics scale with metabolic rate
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Ref:</strong> West GB, Brown JH. (2005).{" "}
                  <em>J Exp Biol.</em> 208:1575-1592.{" "}
                  <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/15855389/">
                    PMID: 15855389
                  </ReferenceLink>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Brain Weight Scaling</Badge>
                <Badge variant="outline">CNS Drugs</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <Formula altText="b equals two-thirds times the natural log of target brain weight over source brain weight, divided by the natural log of target body weight over source body weight">
                  {String.raw`b = \frac{2}{3} \times \frac{\ln\left(\dfrac{B_{\text{target}}}{B_{\text{source}}}\right)}{\ln\left(\dfrac{W_{\text{target}}}{W_{\text{source}}}\right)}`}
                </Formula>
                <p>
                  Then:{" "}
                  <Math altText="Target dose equals source dose times weight ratio raised to power b">
                    {String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \left(\frac{W_{\text{target}}}{W_{\text{source}}}\right)^b`}
                  </Math>
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Brain weight (
                  <Math altText="B">B</Math>) scales differently than body
                  weight across species
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> CNS-active drugs, psychotropics,
                  anesthetics
                </p>
                <p className="text-warning font-medium">
                  <strong>Note:</strong> The{" "}
                  <Math altText="two-thirds">{String.raw`\frac{2}{3}`}</Math>{" "}
                  coefficient is empirical and may vary by drug class
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Ref:</strong> Mahmood I, Balian JD. (1996).{" "}
                  <em>Br J Clin Pharmacol.</em> 41:163-175.{" "}
                  <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/8866916/">
                    PMID: 8866916
                  </ReferenceLink>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Life-Span Scaling</Badge>
                <Badge variant="outline">Theoretical</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <Formula altText="b equals the natural log of target lifespan over source lifespan, divided by the natural log of target weight over source weight">
                  {String.raw`b = \frac{\ln\left(\dfrac{\tau_{\text{target}}}{\tau_{\text{source}}}\right)}{\ln\left(\dfrac{W_{\text{target}}}{W_{\text{source}}}\right)}`}
                </Formula>
                <p>
                  where <Math altText="tau">{String.raw`\tau`}</Math> = maximum
                  life span. Then:{" "}
                  <Math altText="Target dose equals source dose times weight ratio raised to power b">
                    {String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \left(\frac{W_{\text{target}}}{W_{\text{source}}}\right)^b`}
                  </Math>
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Maximum life span potential correlates
                  with metabolic capacity
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Chronic toxicity studies,
                  gerontological research
                </p>
                <p className="text-warning font-medium">
                  <strong>Limitation:</strong> Assumes similar aging mechanisms
                  across species
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Ref:</strong> Boxenbaum H. (1982).{" "}
                  <em>J Pharmacokinet Biopharm.</em> 10:201-227.{" "}
                  <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/7120049/">
                    PMID: 7120049
                  </ReferenceLink>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Hepatic Blood Flow</Badge>
                <Badge variant="outline">High-Extraction Drugs</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <Formula altText="b equals the natural log of target hepatic clearance over source hepatic clearance, divided by the natural log of weight ratio">
                  {String.raw`b = \frac{\ln\left(\dfrac{Q_h \cdot E_h}{Q_h \cdot E_h}\bigg|_{\text{target/source}}\right)}{\ln\left(\dfrac{W_{\text{target}}}{W_{\text{source}}}\right)}`}
                </Formula>
                <p>
                  where <Math altText="Q sub h">{String.raw`Q_h`}</Math> =
                  hepatic blood flow,{" "}
                  <Math altText="E sub h">{String.raw`E_h`}</Math> = extraction
                  ratio
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> Clearance of high-extraction drugs
                  depends on hepatic blood flow
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Drugs with hepatic extraction ratio{" "}
                  <Math altText="E sub h greater than 0.7">{String.raw`E_h > 0.7`}</Math>
                </p>
                <p className="text-warning font-medium">
                  <strong>Important:</strong> Only valid for flow-limited drugs
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Ref:</strong> Ward KW, Smith BR. (2004).{" "}
                  <em>Drug Metab Dispos.</em> 32:603-611.{" "}
                  <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/15155551/">
                    PMID: 15155551
                  </ReferenceLink>
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="default">Body Surface Area (BSA)</Badge>
                <Badge variant="outline">Oncology Standard</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <Formula altText="Target per-kilogram dose equals source per-kilogram dose times the ratio of source Km to target Km">
                  {String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \frac{\text{Km}_{\text{source}}}{\text{Km}_{\text{target}}}`}
                </Formula>
                <p>
                  where <Math altText="Km">Km</Math> is the FDA
                  body-surface-area normalization factor{" "}
                  <Math altText="Km equals weight divided by BSA">
                    {String.raw`\text{Km} = W / \text{BSA}`}
                  </Math>{" "}
                  (mg/kg dosing). DoseFinder uses the FDA 2005 reference weights
                  and BSA values for this method, not user-entered weights.
                </p>
                <p className="text-muted-foreground">
                  <strong>Basis:</strong> BSA correlates with many physiological
                  parameters
                </p>
                <p className="text-muted-foreground">
                  <strong>Best for:</strong> Chemotherapy agents, traditional in
                  oncology
                </p>
                <p className="text-warning font-medium">
                  <strong>Criticism:</strong> May not be optimal for all drug
                  types
                </p>
                <p className="text-muted-foreground text-xs">
                  <strong>Ref:</strong> Reagan-Shaw S, et al. (2008).{" "}
                  <em>FASEB J.</em> 22:659-661.{" "}
                  <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/17942826/">
                    PMID: 17942826
                  </ReferenceLink>
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-secondary/70 dark:bg-secondary/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-accent" />
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
            <p className="text-sm font-semibold mb-2">
              FDA Guidance (2005):{" "}
              <ReferenceLink href="https://www.fda.gov/media/72309/download">
                View Document
              </ReferenceLink>
            </p>
            <p className="text-sm">
              &quot;Estimating the Maximum Safe Starting Dose in Initial
              Clinical Trials for Therapeutics in Adult Healthy Volunteers&quot;
              recommends using allometric scaling with appropriate safety
              factors. The HED (Human Equivalent Dose) is calculated as:
            </p>
            <Formula
              className="mt-2"
              altText="Human Equivalent Dose equals animal dose times the ratio of animal weight to human weight, raised to the power of 1 minus b"
            >
              {String.raw`\text{HED} = \text{Dose}_{\text{animal}} \times \left(\frac{W_{\text{animal}}}{W_{\text{human}}}\right)^{1-b}`}
            </Formula>
            <p className="text-sm mt-2">
              where <Math altText="b equals 0.67">{String.raw`b = 0.67`}</Math>{" "}
              for scaling based on body surface area normalization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
