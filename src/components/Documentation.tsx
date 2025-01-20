import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Documentation() {
  return (
    <ScrollArea className="h-[calc(100vh-200px)] w-full">
      <div className="space-y-6 p-4">
        <section>
          <h2 className="text-2xl font-bold mb-4">Understanding Dose Scaling Methods</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Allometric Scaling (Default Method)</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">The simplest and most widely used scaling method, based on the relationship between body mass and metabolic rate.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Most common scaling situations</li>
                  <li>When dealing with metabolically active compounds</li>
                  <li>For initial dose estimations</li>
                </ul>

                <h4 className="font-semibold mb-2">Key Points</h4>
                <ul className="list-disc pl-6">
                  <li>Uses the 3/4 power law by default (exponent = 0.75)</li>
                  <li>Can be adjusted based on molecular weight:
                    <ul className="list-disc pl-6 mt-2">
                      <li>MW > 700 Da → exponent = 0.70</li>
                      <li>400 &lt; MW ≤ 700 Da → exponent = 0.75</li>
                      <li>MW ≤ 400 Da → exponent = 0.80</li>
                    </ul>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Brain Weight Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Scaling based on brain weight differences between species, useful for certain types of drugs.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>CNS-active compounds</li>
                  <li>Drugs that cross the blood-brain barrier</li>
                  <li>Neurological treatments</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Life-Span Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Scaling based on the maximum life span potential of different species.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Long-term toxicity studies</li>
                  <li>Chronic exposure assessments</li>
                  <li>Age-related treatments</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Hepatic Blood Flow Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Scaling based on species differences in hepatic blood flow and clearance.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Drugs with high hepatic extraction</li>
                  <li>Compounds primarily metabolized by the liver</li>
                  <li>Flow-limited drugs</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. BSA-Based Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Scaling based on body surface area differences between species.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Many anticancer drugs</li>
                  <li>Initial human dose estimates</li>
                  <li>When surface-dependent effects are important</li>
                </ul>

                <h4 className="font-semibold mb-2">Key Points</h4>
                <ul className="list-disc pl-6">
                  <li>Uses built-in approximate BSA values for each species</li>
                  <li>Direct ratio scaling of doses based on BSA</li>
                  <li>Common in clinical settings</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Advanced Features</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Kidney Function Adjustment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Three modes available:</p>
                <ul className="list-disc pl-6 mb-4">
                  <li><strong>None:</strong> No kidney function adjustment</li>
                  <li><strong>Manual:</strong> Enter a percentage directly</li>
                  <li><strong>Cockcroft-Gault:</strong> Calculates estimated GFR and applies stage-based reductions:
                    <ul className="list-disc pl-6 mt-2">
                      <li>GFR ≥ 60 mL/min → 100% dose</li>
                      <li>30 ≤ GFR < 60 mL/min → 75% dose</li>
                      <li>15 ≤ GFR < 30 mL/min → 50% dose</li>
                      <li>GFR < 15 mL/min → 25% dose</li>
                    </ul>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bioavailability Options</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">Choose from preset values or enter manually:</p>
                <ul className="list-disc pl-6">
                  <li><strong>Manual:</strong> Enter any percentage</li>
                  <li><strong>IV:</strong> 100% bioavailability</li>
                  <li><strong>Oral:</strong> Assumes 50% bioavailability</li>
                  <li><strong>Other:</strong> Assumes 75% bioavailability</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6">
                  <li><strong>Volume of Distribution (Vd):</strong> Affects dose based on drug distribution in body compartments</li>
                  <li><strong>Molecular Weight:</strong> Can affect allometric scaling exponent selection</li>
                  <li><strong>LogP:</strong> Influences dose adjustments based on lipophilicity</li>
                  <li><strong>Protein Binding:</strong> Adjusts for differences in free drug fraction</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">1. Always Start Conservative</h4>
                  <ul className="list-disc pl-6">
                    <li>Begin with lower doses</li>
                    <li>Use multiple scaling methods for comparison</li>
                    <li>Consider safety margins</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">2. Document Your Choice</h4>
                  <ul className="list-disc pl-6">
                    <li>Record scaling method used</li>
                    <li>Note any adjustments made</li>
                    <li>Keep track of assumptions</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">3. Validate Results</h4>
                  <ul className="list-disc pl-6">
                    <li>Compare with literature data when available</li>
                    <li>Consider species-specific factors</li>
                    <li>Monitor for unexpected variations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Important Reminders</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="list-disc pl-6">
                <li>These are estimation tools, not absolute rules</li>
                <li>Professional judgment is essential</li>
                <li>Consider all available data</li>
                <li>Use for research/educational purposes only</li>
                <li>Consult regulatory guidelines for clinical applications</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">References</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-4">
                <li>
                  <p className="text-sm">Boxenbaum, H. (1982). Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. <em>Journal of Pharmacokinetics and Biopharmaceutics</em>, 10(2), 201-227.</p>
                </li>
                <li>
                  <p className="text-sm">Mahmood, I., & Balian, J. D. (1996). Interspecies scaling: predicting clearance of drugs in humans. <em>Toxicology and Applied Pharmacology</em>, 140(2), 253-258.</p>
                </li>
                <li>
                  <p className="text-sm">Sharma, V., & McNeill, J. H. (2009). To scale or not to scale: the principles of dose extrapolation. <em>British Journal of Pharmacology</em>, 157(6), 907-921.</p>
                </li>
                <li>
                  <p className="text-sm">Tang, H., & Mayersohn, M. (2005). A comparison of allometric scaling methods for predicting human drug clearance and volume of distribution. <em>Journal of Pharmaceutical Sciences</em>, 94(6), 1237-1243.</p>
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </ScrollArea>
  );
}
