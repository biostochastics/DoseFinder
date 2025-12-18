import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormulaDocumentation } from "./FormulaDocumentation";
import { IconExternalLink } from "@tabler/icons-react";

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
      className="text-primary hover:underline inline-flex items-center gap-1"
    >
      {children}
      <IconExternalLink className="h-3 w-3 flex-shrink-0" stroke={1.5} />
    </a>
  );
}

export function Documentation() {
  return (
    <div className="h-[calc(100vh-200px)] w-full overflow-y-auto">
      <div className="space-y-6 p-4">
        <section>
          <h2 className="text-2xl font-bold mb-4">
            Understanding Dose Scaling Methods
          </h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Allometric Scaling (Default Method)</CardTitle>
              </CardHeader>
              <CardContent>
                <h4 className="font-semibold mb-2">What is it?</h4>
                <p className="mb-4">
                  The simplest and most widely used scaling method, based on the
                  relationship between body mass and metabolic rate.
                </p>
                <h4 className="font-semibold mb-2">When to use?</h4>
                <ul className="list-disc pl-6 mb-4">
                  <li>Most common scaling situations</li>
                  <li>When dealing with metabolically active compounds</li>
                  <li>For initial dose estimations</li>
                </ul>
                <h4 className="font-semibold mb-2">Key Points</h4>
                <ul className="list-disc pl-6">
                  <li>Uses the 3/4 power law by default (exponent = 0.75)</li>
                  <li>
                    Can be adjusted based on molecular weight:
                    <ul className="list-disc pl-6 mt-2">
                      <li>MW &gt; 700 Da → exponent = 0.70</li>
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
                <p className="mb-4">
                  Scaling based on brain weight differences between species,
                  useful for certain types of drugs.
                </p>
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
                <p className="mb-4">
                  Scaling based on the maximum life span potential of different
                  species.
                </p>
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
                <p className="mb-4">
                  Scaling based on species differences in hepatic blood flow and
                  clearance.
                </p>
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
                <p className="mb-4">
                  Scaling based on body surface area differences between
                  species.
                </p>
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
                  <li>
                    <strong>None:</strong> No kidney function adjustment
                  </li>
                  <li>
                    <strong>Manual:</strong> Enter a percentage directly
                  </li>
                  <li>
                    <strong>Cockcroft-Gault:</strong> Calculates estimated GFR
                    from patient parameters (age, weight, creatinine, sex)
                  </li>
                </ul>
                <h4 className="font-semibold mb-2 mt-4">
                  Fraction Excreted Unchanged (fe)
                </h4>
                <p className="mb-2">
                  The fe parameter adjusts for drugs with partial renal
                  clearance using the scientifically correct formula:
                </p>
                <p className="font-mono bg-muted p-2 rounded mb-2">
                  Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))
                </p>
                <ul className="list-disc pl-6 mb-4">
                  <li>
                    <strong>fe = 1.0:</strong> 100% renal clearance (e.g.,
                    aminoglycosides, vancomycin)
                  </li>
                  <li>
                    <strong>fe = 0.7:</strong> 70% renal clearance (e.g.,
                    digoxin)
                  </li>
                  <li>
                    <strong>fe = 0.0:</strong> No renal clearance (hepatically
                    cleared)
                  </li>
                </ul>
                <h4 className="font-semibold mb-2 mt-4">Creatinine Units</h4>
                <p className="mb-2">
                  Serum creatinine can be entered in either unit:
                </p>
                <ul className="list-disc pl-6">
                  <li>
                    <strong>mg/dL</strong> (conventional US units)
                  </li>
                  <li>
                    <strong>µmol/L</strong> (SI units) — automatically converted
                    using factor 88.4
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>
                  Bioavailability by Route of Administration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  Literature-based default values for different routes of
                  administration. These are conservative estimates—actual
                  bioavailability varies significantly by drug, formulation, and
                  patient factors.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Route</th>
                        <th className="text-left p-2">Default</th>
                        <th className="text-left p-2">Range</th>
                        <th className="text-left p-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">IV (Intravenous)</td>
                        <td className="p-2">100%</td>
                        <td className="p-2">100%</td>
                        <td className="p-2 text-muted-foreground">
                          Reference standard by definition
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">IM (Intramuscular)</td>
                        <td className="p-2">85%</td>
                        <td className="p-2">75–100%</td>
                        <td className="p-2 text-muted-foreground">
                          Near-complete; avoids first-pass
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">SC (Subcutaneous)</td>
                        <td className="p-2">70%</td>
                        <td className="p-2">50–100%</td>
                        <td className="p-2 text-muted-foreground">
                          Lower for biologics (50–80%)
                        </td>
                      </tr>
                      <tr className="border-b bg-amber-500/10">
                        <td className="p-2 font-medium">Oral</td>
                        <td className="p-2">50%</td>
                        <td className="p-2 font-bold text-amber-600">5–99%</td>
                        <td className="p-2 text-amber-600">
                          HIGHLY VARIABLE—use drug-specific values
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Rectal</td>
                        <td className="p-2">65%</td>
                        <td className="p-2">30–80%</td>
                        <td className="p-2 text-muted-foreground">
                          ~50% bypasses hepatic first-pass
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Sublingual</td>
                        <td className="p-2">70%</td>
                        <td className="p-2">60–80%</td>
                        <td className="p-2 text-muted-foreground">
                          Bypasses first-pass via oral mucosa
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Transdermal</td>
                        <td className="p-2">35%</td>
                        <td className="p-2">10–50%</td>
                        <td className="p-2 text-muted-foreground">
                          Limited to small lipophilic molecules
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Inhalation</td>
                        <td className="p-2">25%</td>
                        <td className="p-2">10–40%</td>
                        <td className="p-2 text-muted-foreground">
                          Lung deposition depends on particle size
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">Other</td>
                        <td className="p-2">75%</td>
                        <td className="p-2">50–100%</td>
                        <td className="p-2 text-muted-foreground">
                          Conservative estimate for unspecified routes
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                  <p className="text-sm font-medium text-amber-600 mb-2">
                    ⚠️ Important: Oral Bioavailability Variability
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Oral bioavailability ranges from 5% to 99% depending on the
                    drug. Examples: Propranolol ~26%, Morphine ~30%, Metformin
                    ~50–60%. The 50% default is a conservative middle estimate.
                    Always use compound-specific values from pharmacokinetic
                    studies when available.
                  </p>
                </div>
                <h4 className="font-semibold mt-4 mb-2">References</h4>
                <ul className="text-xs space-y-1.5 text-muted-foreground">
                  <li>
                    <ReferenceLink href="https://www.ncbi.nlm.nih.gov/books/NBK557852/">
                      NBK557852
                    </ReferenceLink>
                    : Drug Bioavailability (StatPearls)
                  </li>
                  <li>
                    <ReferenceLink href="https://www.ncbi.nlm.nih.gov/books/NBK551679/">
                      NBK551679
                    </ReferenceLink>
                    : First-Pass Effect (StatPearls)
                  </li>
                  <li>
                    <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10745386/">
                      PMCID: PMC10745386
                    </ReferenceLink>
                    : The Bioavailability of Drugs—Current State of Knowledge
                  </li>
                  <li>
                    <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6182494/">
                      PMCID: PMC6182494
                    </ReferenceLink>
                    : Subcutaneous Administration of Biotherapeutics
                  </li>
                  <li>
                    <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6805701/">
                      PMCID: PMC6805701
                    </ReferenceLink>
                    : Physiological Considerations for Rectal Drug Formulations
                  </li>
                  <li>
                    <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/498711/">
                      PMID: 498711
                    </ReferenceLink>
                    : Rectal Bioavailability of Lidocaine
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Additional Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-6">
                  <li>
                    <strong>Volume of Distribution (Vd):</strong> Affects dose
                    based on drug distribution in body compartments
                  </li>
                  <li>
                    <strong>Molecular Weight:</strong> Can affect allometric
                    scaling exponent selection
                  </li>
                  <li>
                    <strong>LogP:</strong> Influences dose adjustments based on
                    lipophilicity
                  </li>
                  <li>
                    <strong>Protein Binding:</strong> Adjusts for differences in
                    free drug fraction
                  </li>
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
                  <h4 className="font-semibold mb-2">
                    1. Always Start Conservative
                  </h4>
                  <ul className="list-disc pl-6">
                    <li>Begin with lower doses</li>
                    <li>Use multiple scaling methods for comparison</li>
                    <li>Consider safety margins</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">
                    2. Document Your Choice
                  </h4>
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
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">
                    Species Database & Physiological Parameters
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <p className="text-sm">
                        Davies B, Morris T. (1993). Physiological parameters in
                        laboratory animals and humans. <em>Pharm Res.</em>{" "}
                        10(7):1093-1095.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/8378254/">
                          PMID: 8378254
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Brown RP, Delp MD, Lindstedt SL, Rhomberg LR, Beliles
                        RP. (1997). Physiological parameter values for
                        physiologically based pharmacokinetic models.{" "}
                        <em>Toxicol Ind Health.</em> 13(4):407-484.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/9249929/">
                          PMID: 9249929
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Lin Z, et al. (2020). Physiological parameter values for
                        PBPK models in food-producing animals. Part I: Cattle
                        and swine. <em>J Vet Pharmacol Ther.</em> 43:385-420.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/32190909/">
                          PMID: 32190909
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Li M, et al. (2021). Physiological parameter values for
                        PBPK models. Part III: Sheep and goat.{" "}
                        <em>J Vet Pharmacol Ther.</em> 44:533-563.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8359294/">
                          PMCID: PMC8359294
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Mandikian D, et al. (2018). Tissue Physiology of
                        Cynomolgus Monkeys: Cross-Species Comparison and
                        Implications for Translational Pharmacology.{" "}
                        <em>AAPS J.</em> 20:107.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/30264171/">
                          PMID: 30264171
                        </ReferenceLink>
                      </p>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">
                    Allometric Scaling & Dose Conversion
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <p className="text-sm">
                        FDA Guidance for Industry. (2005). Estimating the
                        Maximum Safe Starting Dose in Initial Clinical Trials
                        for Therapeutics in Adult Healthy Volunteers.{" "}
                        <em>U.S. Food and Drug Administration.</em>{" "}
                        <ReferenceLink href="https://www.fda.gov/media/72309/download">
                          View Document
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Nair AB, Jacob S. (2016). A simple practice guide for
                        dose conversion between animals and human.{" "}
                        <em>J Basic Clin Pharm.</em> 7(2):27-31.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4804402/">
                          PMCID: PMC4804402
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Reagan-Shaw S, Nihal M, Ahmad N. (2008). Dose
                        translation from animal to human studies revisited.{" "}
                        <em>FASEB J.</em> 22(3):659-661.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/17942826/">
                          PMID: 17942826
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Boxenbaum H. (1982). Interspecies scaling, allometry,
                        physiological time, and the ground plan of
                        pharmacokinetics. <em>J Pharmacokinet Biopharm.</em>{" "}
                        10(2):201-227.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/7120049/">
                          PMID: 7120049
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Mahmood I, Balian JD. (1996). Interspecies scaling:
                        predicting clearance of drugs in humans.{" "}
                        <em>Xenobiotica.</em> 26(9):887-895.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/8902907/">
                          PMID: 8902907
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Sharma V, McNeill JH. (2009). To scale or not to scale:
                        the principles of dose extrapolation.{" "}
                        <em>Br J Pharmacol.</em> 157(6):907-921.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2737649/">
                          PMCID: PMC2737649
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        West GB, Brown JH. (2005). The origin of allometric
                        scaling laws in biology from genomes to ecosystems.{" "}
                        <em>J Exp Biol.</em> 208:1575-1592.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/15855389/">
                          PMID: 15855389
                        </ReferenceLink>
                      </p>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">
                    Bioavailability by Route of Administration
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <p className="text-sm">
                        Herman TF, Santos C. (2023). First-Pass Effect.{" "}
                        <em>StatPearls</em> [Internet].{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/books/NBK551679/">
                          NBK551679
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Azman M, et al. (2023). The Bioavailability of Drugs—The
                        Current State of Knowledge. <em>Molecules.</em>{" "}
                        28(24):8038.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10745386/">
                          PMCID: PMC10745386
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Bittner B, et al. (2018). Subcutaneous Administration of
                        Biotherapeutics: An Overview of Current Challenges and
                        Opportunities. <em>BioDrugs.</em> 32(5):425-440.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6182494/">
                          PMCID: PMC6182494
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Hua S. (2019). Physiological and Pharmaceutical
                        Considerations for Rectal Drug Formulations.{" "}
                        <em>Front Pharmacol.</em> 10:1196.{" "}
                        <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6805701/">
                          PMCID: PMC6805701
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        de Boer AG, et al. (1979). Rectal bioavailability of
                        lidocaine in man: Partial avoidance of
                        &quot;first-pass&quot; metabolism.{" "}
                        <em>Clin Pharmacol Ther.</em> 26(6):701-709.{" "}
                        <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/498711/">
                          PMID: 498711
                        </ReferenceLink>
                      </p>
                    </li>
                    <li>
                      <p className="text-sm">
                        Al-Tabakha MM, Arida AI. (2008). Considerations in
                        Developing Sublingual Tablets—An Overview.{" "}
                        <em>Pharm Technol.</em> 32(1).{" "}
                        <ReferenceLink href="https://www.pharmtech.com/view/considerations-developing-sublingual-tablets-overview">
                          View Article
                        </ReferenceLink>
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-4">
              Detailed Formula Documentation
            </h2>
            <FormulaDocumentation />
          </section>
        </section>
      </div>
    </div>
  );
}
