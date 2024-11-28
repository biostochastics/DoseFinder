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
                  <li>Initial dose estimation</li>
                  <li>When limited physiological data is available</li>
                  <li>For drugs with simple metabolic pathways</li>
                </ul>

                <h4 className="font-semibold mb-2">Key Features</h4>
                <ul className="list-disc pl-6">
                  <li>Customizable scaling exponent (default: 0.75)</li>
                  <li>Works well across wide weight ranges</li>
                  <li>Generally produces smooth, predictable curves</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Brain Weight Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Uses brain weight ratios to account for differences in neural tissue distribution.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>CNS-active drugs</li>
                  <li>Neurological therapeutics</li>
                  <li>Drugs that cross the blood-brain barrier</li>
                </ul>

                <h4 className="font-semibold mb-2">Key Features</h4>
                <ul className="list-disc pl-6">
                  <li>Uses 2/3 power law relationship</li>
                  <li>Accounts for species-specific brain development</li>
                  <li>More conservative for small animals compared to allometric scaling</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Life-Span Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Incorporates maximum life span differences between species.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Chronic toxicity studies</li>
                  <li>Long-term drug exposure assessment</li>
                  <li>Age-related drug development</li>
                </ul>

                <h4 className="font-semibold mb-2">Key Features</h4>
                <ul className="list-disc pl-6">
                  <li>Considers species longevity</li>
                  <li>Uses natural logarithm for better accuracy</li>
                  <li>Particularly relevant for chronic studies</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Hepatic Blood Flow Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">Incorporates both hepatic blood flow and clearance data to estimate doses.</p>
                
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Drugs with significant hepatic metabolism</li>
                  <li>High extraction ratio compounds</li>
                  <li>When first-pass effects are important</li>
                </ul>

                <h4 className="font-semibold mb-2">Understanding the Pattern</h4>
                <ul className="list-disc pl-6">
                  <li><strong>High Small Animal Doses:</strong> Small animals show higher relative doses due to higher hepatic blood flow per kg</li>
                  <li><strong>Mid-Range Fluctuations:</strong> Variations between species reflect differences in hepatic flow/clearance ratios</li>
                  <li><strong>Large Animal Plateau:</strong> Doses stabilize for larger animals due to similar hepatic flow/clearance ratios</li>
                  <li><strong>Species-Specific Steps:</strong> Sharp changes between species reflect real physiological differences</li>
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
          <h2 className="text-2xl font-bold mb-4">Shortcuts</h2>
          <Card>
            <CardContent className="pt-6">
              <ul className="space-y-2">
                <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl + H</kbd> Open Help/Documentation</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl + D</kbd> Toggle Dark Mode</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl + U</kbd> Switch Unit System</li>
                <li><kbd className="px-2 py-1 bg-muted rounded">Ctrl + R</kbd> Reset All Inputs</li>
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
