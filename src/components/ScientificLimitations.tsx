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
                <Badge
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                >
                  Brain Weight (Experimental)
                </Badge>
                <span>
                  Based on simplified coefficient (2/3). Actual brain-drug
                  penetration varies significantly by drug properties.
                  <em className="block text-xs text-muted-foreground mt-1">
                    Refs: Boxenbaum & DiLea (1995), Mahmood (1999)
                  </em>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                >
                  Life-Span (Experimental)
                </Badge>
                <span>
                  Correlation-based method. Does not account for specific aging
                  mechanisms or drug accumulation.
                  <em className="block text-xs text-muted-foreground mt-1">
                    Refs: Travis & White (1988), Boxenbaum (1984)
                  </em>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge
                  variant="secondary"
                  className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                >
                  Hepatic Clearance (Experimental)
                </Badge>
                <span>
                  Applies only to high-extraction drugs. Requires knowledge of
                  hepatic extraction ratio.
                  <em className="block text-xs text-muted-foreground mt-1">
                    Refs: Boxenbaum (1980), Lave et al. (1999)
                  </em>
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

          <div>
            <h4 className="font-semibold mb-2">Kidney Function Adjustment</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                • The fe (fraction excreted unchanged) parameter uses the
                scientifically validated formula:
              </p>
              <p className="ml-4 font-mono">
                Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))
              </p>
              <p className="ml-4 mt-2">
                This properly accounts for drugs with partial renal clearance.
              </p>
              <p className="ml-4 mt-1">
                References: Rowland & Tozer (2011), Matzke et al. (2011) Kidney
                Int.
              </p>
              <p className="mt-2">
                • Cockcroft-Gault GFR estimation has limitations:
              </p>
              <p className="ml-4">- Validated mainly in stable patients</p>
              <p className="ml-4">- Less accurate at extremes of body weight</p>
              <p className="ml-4">- May overestimate GFR in elderly patients</p>
            </div>
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
        <AlertTitle>Species Data Sources</AlertTitle>
        <AlertDescription className="space-y-1 text-sm mt-2">
          <p className="font-semibold text-foreground">
            Primary Sources (Peer-Reviewed):
          </p>
          <p>
            • Davies B, Morris T. (1993) "Physiological parameters in laboratory
            animals and humans" Pharm Res. 10(7):1093-1095
          </p>
          <p>
            • Brown RP, et al. (1997) "Physiological parameter values for PBPK
            models" Toxicol Ind Health. 13(4):407-484
          </p>
          <p>
            • FDA Guidance (2005) "Estimating the Maximum Safe Starting Dose in
            Initial Clinical Trials for Therapeutics in Adult Healthy
            Volunteers"
          </p>
          <p>
            • Nair AB, Jacob S. (2016) "A simple practice guide for dose
            conversion between animals and human" J Basic Clin Pharm. 7(2):27-31
          </p>
          <p className="font-semibold text-foreground mt-2">
            Additional Sources:
          </p>
          <p>
            • Lin Z, et al. (2020) "PBPK parameters in food-producing animals.
            Part I: Cattle and swine" J Vet Pharmacol Ther. 43:385-420
          </p>
          <p>
            • Li M, et al. (2021) "PBPK parameters. Part III: Sheep and goat" J
            Vet Pharmacol Ther. 44:533-563
          </p>
          <p>
            • Mandikian D, et al. (2018) "Tissue Physiology of Cynomolgus
            Monkeys" AAPS J. 20:107
          </p>
          <p>
            • Reagan-Shaw S, et al. (2008) "Dose translation from animal to
            human studies revisited" FASEB J. 22(3):659-61
          </p>
          <p>
            • Sharma V, McNeill JH. (2009) "To scale or not to scale: the
            principles of dose extrapolation" Br J Pharmacol. 157(6):907-21
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
