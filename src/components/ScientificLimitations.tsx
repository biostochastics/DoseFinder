import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, AlertTriangle } from "lucide-react";

export function ScientificLimitations() {
  return (
    <div className="space-y-4">
      <Alert className="border-warning/40 bg-warning/10 dark:bg-warning/20">
        <AlertTriangle className="h-4 w-4 text-warning" />
        <AlertTitle>Important Scientific Limitations</AlertTitle>
        <AlertDescription className="space-y-2 mt-2">
          <p>
            This calculator implements classical allometric scaling approaches.
            Modern pharmacokinetic practice combines these methods with:
          </p>
          <ul className="list-disc ml-6 space-y-1">
            <li>Population pharmacokinetic (PopPK) modeling</li>
            <li>Physiologically-based pharmacokinetic (PBPK) models</li>
            <li>Drug-specific absorption and metabolism factors</li>
            <li>Target organ exposure considerations</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="h-5 w-5" />
            Key Assumptions & Limitations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Scaling Method Limitations</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline">Allometric</Badge>
                <span>
                  Assumes similar metabolic rates across species. May not apply
                  to drugs with active metabolites or non-linear kinetics.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">Brain Weight</Badge>
                <span>
                  Based on simplified coefficient (2/3). Actual brain-drug
                  penetration varies significantly by drug properties.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">Life-Span</Badge>
                <span>
                  Correlation-based method. Does not account for specific aging
                  mechanisms or drug accumulation.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">Hepatic Flow</Badge>
                <span>
                  Applies only to high-extraction drugs. Requires knowledge of
                  hepatic extraction ratio.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">BSA</Badge>
                <span>
                  Traditional oncology approach. May overestimate doses for
                  small animals.
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Physiological Parameters</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>• Values represent species averages without considering:</p>
              <p className="ml-4">- Strain/breed variations (can be ±30%)</p>
              <p className="ml-4">- Age-dependent changes</p>
              <p className="ml-4">- Sex differences</p>
              <p className="ml-4">- Disease state modifications</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Not Accounted For</h4>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>
                Drug-specific pharmacokinetics (half-life, clearance pathways)
              </li>
              <li>Route of administration differences</li>
              <li>Species-specific drug sensitivity and receptor density</li>
              <li>Plasma protein binding variations</li>
              <li>First-pass metabolism differences</li>
              <li>Active metabolite formation</li>
              <li>Drug-drug interactions</li>
            </ul>
          </div>

          <div className="p-3 bg-secondary/70 dark:bg-secondary/30 rounded-lg">
            <p className="text-sm font-medium">Recommended Use:</p>
            <p className="text-sm mt-1">
              Use results as initial estimates only. Always validate with:
            </p>
            <ul className="list-disc ml-6 mt-1 text-sm">
              <li>Literature precedent for similar compounds</li>
              <li>Pilot dose-finding studies</li>
              <li>Safety factors (typically 10-fold for first-in-human)</li>
              <li>Professional pharmacological consultation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Literature References</AlertTitle>
        <AlertDescription className="space-y-1 text-sm mt-2">
          <p>
            • Reagan-Shaw et al. (2008) "Dose translation from animal to human
            studies revisited" FASEB J. 22(3):659-61
          </p>
          <p>
            • Nair & Jacob (2016) "A simple practice guide for dose conversion"
            J Basic Clin Pharm. 7(2):27-31
          </p>
          <p>
            • Sharma & McNeill (2009) "To scale or not to scale" Br J Pharmacol.
            157(6):907-21
          </p>
          <p>
            • FDA Guidance (2005) "Estimating the Maximum Safe Starting Dose in
            Initial Clinical Trials"
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
