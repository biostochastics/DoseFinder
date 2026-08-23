import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { IconExternalLink, IconAlertTriangle } from "@tabler/icons-react";
import { Info, BookOpen, Beaker, Scale, Activity, Brain } from "lucide-react";
import { Formula, Math } from "@/components/ui/math";

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
      <IconExternalLink
        className="h-3 w-3 flex-shrink-0"
        stroke={1.5}
        aria-hidden="true"
      />
    </a>
  );
}

const scalingMethods = [
  {
    id: "allometric",
    title: "Allometric Scaling",
    badge: "Default",
    badgeVariant: "default" as const,
    icon: Scale,
    description:
      "The simplest and most widely used scaling method, based on the relationship between body mass and metabolic rate.",
    formula: String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \left(\frac{W_{\text{target}}}{W_{\text{source}}}\right)^{b-1}`,
    formulaAlt:
      "Target per-kilogram dose equals source per-kilogram dose times the ratio of target weight to source weight, raised to the power b minus 1",
    details: (
      <>
        <p className="text-muted-foreground text-sm mb-2">
          where <Math altText="b">b</Math> is the allometric (clearance)
          exponent (typically <Math altText="0.75">0.75</Math>). Doses are
          expressed per kilogram (mg/kg), so the dose-conversion exponent is{" "}
          <Math altText="b minus 1">{String.raw`b-1`}</Math> (e.g.{" "}
          <Math altText="negative 0.25">{String.raw`-0.25`}</Math> when{" "}
          <Math altText="b equals 0.75">{String.raw`b = 0.75`}</Math>); total
          dose (mg) scales with exponent <Math altText="b">b</Math>.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium mb-1">When to use:</p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
              <li>Most common scaling situations</li>
              <li>Metabolically active compounds</li>
              <li>Initial dose estimations</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">MW-based exponent:</p>
            <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
              <li>MW &gt; 700 Da: b = 0.70</li>
              <li>400 &lt; MW &le; 700 Da: b = 0.75</li>
              <li>MW &le; 400 Da: b = 0.80</li>
            </ul>
          </div>
        </div>
      </>
    ),
    reference: {
      text: "West GB, Brown JH. (2005). J Exp Biol. 208:1575-1592.",
      href: "https://pubmed.ncbi.nlm.nih.gov/15855389/",
      pmid: "PMID: 15855389",
    },
  },
  {
    id: "brain-weight",
    title: "Brain Weight Scaling",
    badge: "Exploratory",
    badgeVariant: "secondary" as const,
    icon: Brain,
    description:
      "EXPLORATORY / historical. Reduces to a function of the brain-weight ratio and is not a validated dose estimator — provided for reference, not for dose selection. Prefer allometric or BSA/Km scaling.",
    formula: String.raw`b = \frac{2}{3} \times \frac{\ln\left(\dfrac{B_{\text{target}}}{B_{\text{source}}}\right)}{\ln\left(\dfrac{W_{\text{target}}}{W_{\text{source}}}\right)}`,
    formulaAlt:
      "b equals two-thirds times the natural log of brain weight ratio divided by the log of body weight ratio",
    details: (
      <>
        <p className="text-muted-foreground text-sm mb-2">
          where <Math altText="B">B</Math> = brain weight. The 2/3 coefficient
          is empirical and may vary by drug class.
        </p>
        <div className="text-sm">
          <p className="font-medium mb-1">When to use:</p>
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            <li>CNS-active compounds and psychotropics</li>
            <li>Drugs crossing the blood-brain barrier</li>
            <li>Neurological treatments and anesthetics</li>
          </ul>
        </div>
      </>
    ),
    reference: {
      text: "Mahmood I, Balian JD. (1996). Br J Clin Pharmacol. 41:163-175.",
      href: "https://pubmed.ncbi.nlm.nih.gov/8866916/",
      pmid: "PMID: 8866916",
    },
  },
  {
    id: "lifespan",
    title: "Life-Span Scaling",
    badge: "Exploratory",
    badgeVariant: "secondary" as const,
    icon: Activity,
    description:
      "EXPLORATORY / historical. Algebraically collapses to Dose × (lifespan_target / lifespan_source) and is not a validated dose estimator. Provided for reference only; prefer allometric or BSA/Km scaling.",
    formula: String.raw`b = \frac{\ln\left(\dfrac{\tau_{\text{target}}}{\tau_{\text{source}}}\right)}{\ln\left(\dfrac{W_{\text{target}}}{W_{\text{source}}}\right)}`,
    formulaAlt:
      "b equals the log of lifespan ratio divided by the log of weight ratio",
    details: (
      <>
        <p className="text-muted-foreground text-sm mb-2">
          where <Math altText="tau">{String.raw`\tau`}</Math> = maximum life
          span potential
        </p>
        <div className="text-sm">
          <p className="font-medium mb-1">When to use:</p>
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            <li>Long-term toxicity studies</li>
            <li>Chronic exposure assessments</li>
            <li>Gerontological research</li>
          </ul>
          <p className="text-amber-600 dark:text-amber-500 mt-2 text-xs">
            <strong>Limitation:</strong> Assumes similar aging mechanisms across
            species
          </p>
        </div>
      </>
    ),
    reference: {
      text: "Boxenbaum H. (1982). J Pharmacokinet Biopharm. 10:201-227.",
      href: "https://pubmed.ncbi.nlm.nih.gov/7120049/",
      pmid: "PMID: 7120049",
    },
  },
  {
    id: "hepatic",
    title: "Hepatic Blood Flow Scaling",
    badge: "Exploratory",
    badgeVariant: "secondary" as const,
    icon: Beaker,
    description:
      "EXPLORATORY / historical. Scales the per-kg dose by the ratio of species hepatic blood flow only (the flow-limited assumption for a high-extraction drug). It uses no compound-specific clearance and is not a validated general dose estimator.",
    formula: String.raw`\left(\text{mg/kg}\right)_{\text{target}} = \left(\text{mg/kg}\right)_{\text{source}} \times \frac{q_{\text{target}}}{q_{\text{source}}}`,
    formulaAlt:
      "Target per-kg dose equals source per-kg dose times the ratio of hepatic blood flow per kg (target over source)",
    details: (
      <>
        <p className="text-muted-foreground text-sm mb-2">
          where <Math altText="q">{String.raw`q`}</Math> = hepatic blood flow
          per kg (mL/min/kg), a species physiological quantity. A drug&apos;s
          hepatic clearance depends on the compound (intrinsic clearance,
          binding, extraction) and is NOT modeled here.
        </p>
        <div className="text-sm">
          <p className="font-medium mb-1">Only meaningful for:</p>
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            <li>
              High-extraction, flow-limited drugs{" "}
              <Math altText="E greater than 0.7">{String.raw`E_h > 0.7`}</Math>
            </li>
          </ul>
          <p className="text-amber-600 dark:text-amber-500 mt-2 text-xs">
            <strong>Limitation:</strong> Ignores compound-specific extraction
            and binding; not for routine dose selection.
          </p>
        </div>
      </>
    ),
    reference: {
      text: "Ward KW, Smith BR. (2004). Drug Metab Dispos. 32:603-611.",
      href: "https://pubmed.ncbi.nlm.nih.gov/15155551/",
      pmid: "PMID: 15155551",
    },
  },
  {
    id: "bsa",
    title: "Body Surface Area (BSA)",
    badge: "Oncology",
    badgeVariant: "default" as const,
    icon: Scale,
    description:
      "Scaling based on body surface area differences between species.",
    formula: String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \frac{\text{Km}_{\text{source}}}{\text{Km}_{\text{target}}}`,
    formulaAlt:
      "Target per-kilogram dose equals source per-kilogram dose times the ratio of source Km to target Km",
    details: (
      <>
        <p className="text-muted-foreground text-sm mb-2">
          where <Math altText="Km">Km</Math> is the FDA body-surface-area
          normalization factor{" "}
          <Math altText="Km equals weight divided by BSA">
            {String.raw`\text{Km} = W / \text{BSA}`}
          </Math>{" "}
          (mg/kg dosing). DoseFinder uses FDA 2005 reference weights and BSA
          values for this method, not user-entered weights.
        </p>
        <div className="text-sm">
          <p className="font-medium mb-1">When to use:</p>
          <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
            <li>Many anticancer drugs (traditional in oncology)</li>
            <li>Initial human dose estimates</li>
            <li>When surface-dependent effects are important</li>
          </ul>
        </div>
      </>
    ),
    reference: {
      text: "Reagan-Shaw S, et al. (2008). FASEB J. 22:659-661.",
      href: "https://pubmed.ncbi.nlm.nih.gov/17942826/",
      pmid: "PMID: 17942826",
    },
  },
];

const bioavailabilityData = [
  {
    route: "IV (Intravenous)",
    default: "100%",
    range: "100%",
    notes: "Reference standard by definition",
    highlight: false,
  },
  {
    route: "IM (Intramuscular)",
    default: "85%",
    range: "75-100%",
    notes: "Near-complete; avoids first-pass",
    highlight: false,
  },
  {
    route: "SC (Subcutaneous)",
    default: "70%",
    range: "50-100%",
    notes: "Lower for biologics (50-80%)",
    highlight: false,
  },
  {
    route: "Oral",
    default: "50%",
    range: "5-99%",
    notes: "HIGHLY VARIABLE",
    highlight: true,
  },
  {
    route: "Rectal",
    default: "65%",
    range: "30-80%",
    notes: "~50% bypasses hepatic first-pass",
    highlight: false,
  },
  {
    route: "Sublingual",
    default: "70%",
    range: "60-80%",
    notes: "Bypasses first-pass via oral mucosa",
    highlight: false,
  },
  {
    route: "Transdermal",
    default: "35%",
    range: "10-50%",
    notes: "Limited to small lipophilic molecules",
    highlight: false,
  },
  {
    route: "Inhalation",
    default: "25%",
    range: "10-40%",
    notes: "Lung deposition depends on particle size",
    highlight: false,
  },
];

export function Documentation() {
  return (
    <div className="h-[calc(100vh-200px)] w-full overflow-y-auto">
      <div className="space-y-6 p-4">
        {/* Scaling Methods - Consolidated Card with Accordion */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Dose Scaling Methods
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select the appropriate scaling method based on drug properties and
              clearance pathway
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              {scalingMethods.map((method) => (
                <AccordionItem key={method.id} value={method.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <method.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{method.title}</span>
                      <Badge
                        variant={method.badgeVariant}
                        className="text-xs ml-1"
                      >
                        {method.badge}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pl-7">
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                      <Formula
                        altText={method.formulaAlt}
                        className="bg-muted/50 p-2 rounded"
                      >
                        {method.formula}
                      </Formula>
                      {method.details}
                      <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                        <strong>Ref:</strong> {method.reference.text}{" "}
                        <ReferenceLink href={method.reference.href}>
                          {method.reference.pmid}
                        </ReferenceLink>
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* FDA Guidance highlight */}
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-semibold mb-1">
                FDA Guidance (2005):{" "}
                <ReferenceLink href="https://www.fda.gov/media/72309/download">
                  View Document
                </ReferenceLink>
              </p>
              <p className="text-sm text-muted-foreground">
                Human Equivalent Dose (HED) calculation:
              </p>
              <Formula
                className="mt-2 bg-green-100/50 dark:bg-green-900/30 p-2 rounded"
                altText="HED equals animal dose times weight ratio to power of 1 minus b"
              >
                {String.raw`\text{HED} = \text{Dose}_{\text{animal}} \times \left(\frac{W_{\text{animal}}}{W_{\text{human}}}\right)^{1-b}`}
              </Formula>
              <p className="text-xs text-muted-foreground mt-2">
                where{" "}
                <Math altText="b equals 0.67">{String.raw`b = 0.67`}</Math> for
                BSA-normalized scaling. Apply 10-fold safety factor for FIH
                studies.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Parameters - Consolidated */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Advanced Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="kidney">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-medium">
                    Kidney Function Adjustment
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="font-medium">None</p>
                        <p className="text-xs text-muted-foreground">
                          No kidney function adjustment
                        </p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="font-medium">Manual</p>
                        <p className="text-xs text-muted-foreground">
                          Enter a percentage directly
                        </p>
                      </div>
                      <div className="p-2 bg-muted/30 rounded">
                        <p className="font-medium">Cockcroft-Gault</p>
                        <p className="text-xs text-muted-foreground">
                          Estimate creatinine clearance (CrCl, not GFR) from
                          patient parameters. Actual / ideal (IBW) / adjusted
                          body-weight basis supported.
                        </p>
                      </div>
                    </div>

                    <div className="text-sm">
                      <p className="font-medium mb-1">
                        Fraction Excreted Unchanged (fe):
                      </p>
                      <Formula altText="Dose adjustment formula with fe">
                        {String.raw`\text{Dose}_{\text{adj}} = \text{Dose}_{\text{normal}} \times \left(1 - f_e \times (1 - \text{RenalRatio})\right)`}
                      </Formula>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-muted-foreground">
                        <div>
                          <strong>fe = 1.0:</strong> 100% renal
                          (aminoglycosides)
                        </div>
                        <div>
                          <strong>fe = 0.7:</strong> 70% renal (digoxin)
                        </div>
                        <div>
                          <strong>fe = 0.0:</strong> Hepatically cleared
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bioavailability">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-medium">
                    Bioavailability by Administration Route
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="mb-3 text-sm">
                    <p className="font-medium mb-1">
                      Two-sided route translation:
                    </p>
                    <Formula altText="Two-sided bioavailability adjustment">
                      {String.raw`\text{Dose}_{\text{target}} = \text{Dose}_{\text{source}} \times \frac{\text{CL}_{\text{target}}}{\text{CL}_{\text{source}}} \times \frac{F_{\text{source}}}{F_{\text{target}}}`}
                    </Formula>
                    <p className="text-xs text-muted-foreground mt-1">
                      The scaling step supplies the clearance ratio; the
                      bioavailability step applies{" "}
                      <Math altText="F source over F target">{String.raw`F_{\text{source}}/F_{\text{target}}`}</Math>
                      . Set the source route to IV (100%) when the known dose is
                      systemic/IV.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-left p-2 font-medium">Route</th>
                          <th className="text-left p-2 font-medium">Default</th>
                          <th className="text-left p-2 font-medium">Range</th>
                          <th className="text-left p-2 font-medium">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bioavailabilityData.map((row) => (
                          <tr
                            key={row.route}
                            className={`border-b ${row.highlight ? "bg-amber-500/10" : ""}`}
                          >
                            <th
                              scope="row"
                              className={`p-2 font-medium ${row.highlight ? "text-amber-600" : ""}`}
                            >
                              {row.route}
                            </th>
                            <td className="p-2">{row.default}</td>
                            <td
                              className={`p-2 ${row.highlight ? "font-bold text-amber-600" : ""}`}
                            >
                              {row.range}
                            </td>
                            <td
                              className={`p-2 ${row.highlight ? "text-amber-600" : "text-muted-foreground"}`}
                            >
                              {row.notes}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded text-sm">
                    <div className="flex items-start gap-2">
                      <IconAlertTriangle
                        className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0"
                        aria-hidden="true"
                      />
                      <p className="text-muted-foreground">
                        <strong className="text-amber-600">
                          Oral bioavailability
                        </strong>{" "}
                        ranges from 5% (e.g., bisphosphonates) to 99% (e.g.,
                        fluconazole). The 50% default is a conservative middle
                        estimate. Always use compound-specific values when
                        available.
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="other-params">
                <AccordionTrigger className="hover:no-underline">
                  <span className="font-medium">Other Drug Parameters</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Volume of Distribution (Vd)</p>
                      <p className="text-xs text-muted-foreground">
                        Affects dose based on drug distribution in body
                        compartments
                      </p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Molecular Weight</p>
                      <p className="text-xs text-muted-foreground">
                        Can affect allometric scaling exponent selection
                      </p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">LogP (Lipophilicity)</p>
                      <p className="text-xs text-muted-foreground">
                        Influences dose adjustments based on lipophilicity
                      </p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Protein Binding</p>
                      <p className="text-xs text-muted-foreground">
                        Adjusts for differences in free drug fraction
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Guidelines - Combined Best Practices and Important Reminders */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Guidelines & Best Practices
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    1. Start Conservative
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-0.5">
                    <li>Begin with lower doses</li>
                    <li>Use multiple scaling methods for comparison</li>
                    <li>Consider safety margins (10x for FIH)</li>
                  </ul>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    2. Document Choices
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-0.5">
                    <li>Record scaling method used</li>
                    <li>Note any adjustments made</li>
                    <li>Keep track of assumptions</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">
                    3. Validate Results
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-0.5">
                    <li>Compare with literature data</li>
                    <li>Consider species-specific factors</li>
                    <li>Monitor for unexpected variations</li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    <IconAlertTriangle
                      className="h-4 w-4 text-amber-600"
                      aria-hidden="true"
                    />
                    Important Reminders
                  </h4>
                  <ul className="list-disc pl-4 text-sm text-muted-foreground space-y-0.5">
                    <li>These are estimation tools, not absolute rules</li>
                    <li>Professional judgment is essential</li>
                    <li>Use for research/educational purposes only</li>
                    <li>Consult regulatory guidelines for clinical use</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Key Considerations */}
            <div className="mt-4 p-3 bg-secondary/50 dark:bg-secondary/30 rounded-lg">
              <p className="font-semibold text-sm mb-2">
                Key Considerations for Method Selection:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                <div className="p-2 bg-background/50 rounded text-center">
                  <p className="font-medium">Drug Properties</p>
                  <p className="text-muted-foreground">Lipophilicity, MW</p>
                </div>
                <div className="p-2 bg-background/50 rounded text-center">
                  <p className="font-medium">Clearance</p>
                  <p className="text-muted-foreground">Hepatic, renal, mixed</p>
                </div>
                <div className="p-2 bg-background/50 rounded text-center">
                  <p className="font-medium">Target Organ</p>
                  <p className="text-muted-foreground">CNS requires brain wt</p>
                </div>
                <div className="p-2 bg-background/50 rounded text-center">
                  <p className="font-medium">Study Type</p>
                  <p className="text-muted-foreground">Acute vs chronic</p>
                </div>
                <div className="p-2 bg-background/50 rounded text-center">
                  <p className="font-medium">Safety</p>
                  <p className="text-muted-foreground">10x factor for FIH</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* References - Organized Bibliography */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              References
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="species">
                <AccordionTrigger className="hover:no-underline text-sm">
                  Species Database & Physiological Parameters
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    <li>
                      Davies B, Morris T. (1993). Physiological parameters in
                      laboratory animals and humans. <em>Pharm Res.</em>{" "}
                      10(7):1093-1095.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/8378254/">
                        PMID: 8378254
                      </ReferenceLink>
                    </li>
                    <li>
                      Brown RP, et al. (1997). Physiological parameter values
                      for PBPK models. <em>Toxicol Ind Health.</em>{" "}
                      13(4):407-484.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/9249929/">
                        PMID: 9249929
                      </ReferenceLink>
                    </li>
                    <li>
                      Lin Z, et al. (2020). Physiological parameter values for
                      PBPK models. Part I: Cattle and swine.{" "}
                      <em>J Vet Pharmacol Ther.</em> 43:385-420.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/32190909/">
                        PMID: 32190909
                      </ReferenceLink>
                    </li>
                    <li>
                      Li M, et al. (2021). Physiological parameter values for
                      PBPK models. Part III: Sheep and goat.{" "}
                      <em>J Vet Pharmacol Ther.</em> 44:533-563.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8359294/">
                        PMC8359294
                      </ReferenceLink>
                    </li>
                    <li>
                      Mandikian D, et al. (2018). Tissue Physiology of
                      Cynomolgus Monkeys. <em>AAPS J.</em> 20:107.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/30264171/">
                        PMID: 30264171
                      </ReferenceLink>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="allometric">
                <AccordionTrigger className="hover:no-underline text-sm">
                  Allometric Scaling & Dose Conversion
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <strong>FDA Guidance (2005).</strong> Estimating the
                      Maximum Safe Starting Dose in Initial Clinical Trials.{" "}
                      <ReferenceLink href="https://www.fda.gov/media/72309/download">
                        View Document
                      </ReferenceLink>
                    </li>
                    <li>
                      Nair AB, Jacob S. (2016). A simple practice guide for dose
                      conversion. <em>J Basic Clin Pharm.</em> 7(2):27-31.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4804402/">
                        PMC4804402
                      </ReferenceLink>
                    </li>
                    <li>
                      Reagan-Shaw S, et al. (2008). Dose translation from animal
                      to human studies revisited. <em>FASEB J.</em>{" "}
                      22(3):659-661.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/17942826/">
                        PMID: 17942826
                      </ReferenceLink>
                    </li>
                    <li>
                      Boxenbaum H. (1982). Interspecies scaling, allometry,
                      physiological time. <em>J Pharmacokinet Biopharm.</em>{" "}
                      10(2):201-227.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/7120049/">
                        PMID: 7120049
                      </ReferenceLink>
                    </li>
                    <li>
                      Mahmood I, Balian JD. (1996). Interspecies scaling:
                      predicting clearance in humans. <em>Xenobiotica.</em>{" "}
                      26(9):887-895.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/8902907/">
                        PMID: 8902907
                      </ReferenceLink>
                    </li>
                    <li>
                      Sharma V, McNeill JH. (2009). To scale or not to scale.{" "}
                      <em>Br J Pharmacol.</em> 157(6):907-921.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2737649/">
                        PMC2737649
                      </ReferenceLink>
                    </li>
                    <li>
                      West GB, Brown JH. (2005). The origin of allometric
                      scaling laws. <em>J Exp Biol.</em> 208:1575-1592.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/15855389/">
                        PMID: 15855389
                      </ReferenceLink>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bioavailability">
                <AccordionTrigger className="hover:no-underline text-sm">
                  Bioavailability & Administration Routes
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 text-sm">
                    <li>
                      Herman TF, Santos C. (2023). First-Pass Effect.{" "}
                      <em>StatPearls</em>.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/books/NBK551679/">
                        NBK551679
                      </ReferenceLink>
                    </li>
                    <li>
                      Drug Bioavailability. <em>StatPearls</em>.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/books/NBK557852/">
                        NBK557852
                      </ReferenceLink>
                    </li>
                    <li>
                      Azman M, et al. (2023). The Bioavailability of
                      Drugs&mdash;Current State. <em>Molecules.</em>{" "}
                      28(24):8038.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10745386/">
                        PMC10745386
                      </ReferenceLink>
                    </li>
                    <li>
                      Bittner B, et al. (2018). Subcutaneous Administration of
                      Biotherapeutics. <em>BioDrugs.</em> 32(5):425-440.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6182494/">
                        PMC6182494
                      </ReferenceLink>
                    </li>
                    <li>
                      Hua S. (2019). Physiological Considerations for Rectal
                      Drug Formulations. <em>Front Pharmacol.</em> 10:1196.{" "}
                      <ReferenceLink href="https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6805701/">
                        PMC6805701
                      </ReferenceLink>
                    </li>
                    <li>
                      de Boer AG, et al. (1979). Rectal bioavailability of
                      lidocaine. <em>Clin Pharmacol Ther.</em> 26(6):701-709.{" "}
                      <ReferenceLink href="https://pubmed.ncbi.nlm.nih.gov/498711/">
                        PMID: 498711
                      </ReferenceLink>
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
