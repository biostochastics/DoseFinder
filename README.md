# DoseFinder: Pharmacological Dose Scaling Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js%2015-black)](https://nextjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://dose-finder.vercel.app)

## Overview

DoseFinder is an interactive web-based calculator for pharmacological dose scaling that supports multiple scaling methods and species. It provides real-time calculation updates with visualization tools and considers additional physiological parameters for more accurate dose estimation in drug development and research.

### Important Notice

DoseFinder implements classical allometric scaling approaches for **educational and initial estimation purposes only**. Results should be validated with modern pharmacokinetic modeling and professional consultation before any clinical or research application. See the comprehensive "Limitations" tab in the application for detailed information about assumptions and uncertainties.

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

### Dose Calculator

- **Real-time Calculations:** Instant updates with multiple scaling methods
- **Species Coverage:** Comprehensive database of 22 species from small laboratory animals to humans
- **Multiple Scaling Methods:**
  - Allometric Scaling (customizable exponent, default 0.75)
  - Body Surface Area (BSA) using FDA Km method
  - Direct/Linear Scaling (exponent 1.0)
  - Metabolic Rate Scaling (Kleiber's law, exponent 0.75)
  - Brain Weight Scaling (for CNS-active drugs)
  - Life-Span Scaling (for chronic dosing)
  - Hepatic Blood Flow Scaling

### Advanced Parameters

- Bioavailability adjustments by route of administration (10 presets with literature-based defaults)
- Kidney function calculations (manual or Cockcroft-Gault GFR)
- Fraction excreted unchanged (fe) for proper renal adjustment
- Creatinine unit conversion (mg/dL to umol/L)

### Study Planner

- Calculate total product requirements for studies
- Support for multiple study arms with independent durations
- Treatment, placebo, and comparator arm types
- Flexible dosing schedules (daily, weekly, custom)
- Accurate month-based calculations using average month length
- Dilution sequence calculations with enforced practical limits
- Precise percentage to mg/mL conversion with density factor support
- Dosing Calendar Export:
  - CSV format for spreadsheet analysis
  - ICS format (RFC 5545) for calendar integration
  - Configurable study name and start date
  - Species-based subject ID prefixes (M=mouse, R=rat, D=dog, NHP=monkey)

### FDA First-in-Human (FIH) Calculator

- Calculate Maximum Recommended Starting Dose (MRSD) from NOAEL data
- Implements FDA 2005 Guidance methodology with Km factor scaling
- Multi-species support with automatic most conservative dose selection
- Only FDA-validated species from Table 1 (no estimated values)
- Supported species: Mouse, Rat, Hamster, Guinea Pig, Rabbit, Monkey (NHP), Dog, Mini-pig (40 kg), Micro-pig (20 kg)
- Safety factor guidance (3x, 10x, 30x, 100x with selection criteria)
- Comprehensive warnings for biologics (MABEL approach) and other modalities
- Allometric scaling validation against biologically plausible Km ranges
- Step-by-step calculation traceability for regulatory documentation
- Export for IND submissions with full report and disclaimers

### Scientific Documentation

- Comprehensive limitations and assumptions documentation
- Detailed formula documentation with peer-reviewed references
- Uncertainty indicators for physiological parameters (typically 30% variation)
- Method-specific guidance and best practices
- FDA guidance integration

### Visualization and Export

- Interactive scaling charts with species-specific data points
- Dark/light mode support and responsive design
- Dose Calculator: Export comprehensive calculation reports with all parameters
- Study Planner: Export study plans with arm configurations and GLP/GMP guidance
- FIH Calculator: Export IND-ready reports with regulatory disclaimers
- Copy to Clipboard: Enhanced with uncertainty ranges and methodology details

## Usage

### Basic Dose Calculation

1. Select source animal and enter base dose
2. Choose target animal
3. Select scaling method (e.g., Allometric Scaling with default 0.75 exponent)
4. View calculated dose and visualization

### Study Planning

1. Navigate to the Study Planner tab
2. Configure study parameters (type, number of arms, overage factor)
3. Add treatment, placebo, or comparator arms as needed
4. Copy doses directly from Calculator tab results or create new arms from calculator
5. Set up dose groups with species, subjects, dose levels and custom schedules
6. Define formulation details and optional dilution sequences
7. Click Calculate Requirements to generate complete study material estimates
8. Export the comprehensive study plan for documentation

## Technical Documentation

### Calculation Methods

#### Allometric Scaling

```
For mg/kg to mg/kg interspecies conversion:
Target Dose (mg/kg) = Source Dose (mg/kg) x (W_target / W_source)^(b-1)

where b = clearance scaling exponent (default: 0.75)
and dose conversion exponent = b - 1 = -0.25

This means larger animals require LOWER mg/kg doses (biologically correct).
```

**Derivation:**

- Clearance scales as: CL proportional to W^b (where b is approximately 0.75)
- For equivalent exposure: Dose_target/CL_target = Dose_source/CL_source
- This gives: (mg/kg)\_target = (mg/kg)\_source x (W_target/W_source)^(b-1)

**Example:** Mouse (0.02 kg) to Human (70 kg), 1 mg/kg dose

- Target Dose = 1 x (70/0.02)^(-0.25) is approximately 0.13 mg/kg

#### Body Surface Area Scaling (Km Method) - FDA Recommended

```
Km = Weight / BSA
Target Dose = Source Dose x (Source Km / Target Km)
```

_FDA-recommended method for interspecies dose conversion in first-in-human studies_

#### Direct (Linear) Scaling

```
Dose conversion exponent = 1.0 - 1 = 0
Target Dose (mg/kg) = Source Dose (mg/kg)
```

_Same mg/kg dose regardless of species weight_

#### Metabolic Rate Scaling (Kleiber's Law)

```
Clearance exponent = 0.75
Dose conversion exponent = 0.75 - 1 = -0.25
Target Dose (mg/kg) = Source Dose (mg/kg) x (W_target / W_source)^(-0.25)
```

_Based on basal metabolic rate scaling_

#### Brain Weight Scaling

```
Scaling Factor = (2/3) x ln(Target Brain / Source Brain) / ln(W_target / W_source)
```

_Experimental method for CNS-active drugs_

#### Life-Span Scaling

```
Scaling Factor = ln(Target Life / Source Life) / ln(W_target / W_source)
```

_Experimental method for chronic dosing studies_

#### Hepatic Flow Scaling

```
Clearance Ratio = Hepatic Clearance / Hepatic Flow
Scaling Factor = ln((Target Flow x Target Ratio) / (Source Flow x Source Ratio)) / ln(W_target / W_source)
```

_For hepatically-cleared compounds_

### FDA First-in-Human Starting Dose Calculation

The FIH calculator implements the FDA 2005 Guidance methodology for calculating the Maximum Recommended Starting Dose (MRSD) from animal NOAEL data.

#### Formulas

```
Human Equivalent Dose (HED):
HED (mg/kg) = Animal NOAEL (mg/kg) x (Animal Km / Human Km)

Maximum Recommended Starting Dose (MRSD):
MRSD (mg/kg) = HED / Safety Factor

Total Dose:
Total Dose (mg) = MRSD (mg/kg) x Human Reference Weight (kg)
```

#### FDA Km Factors (Table 1, FDA 2005 Guidance)

| Species      | Reference Weight (kg) | BSA (m2) | Km Factor |
| ------------ | --------------------- | -------- | --------- |
| Mouse        | 0.02                  | 0.0066   | 3         |
| Rat          | 0.15                  | 0.025    | 6         |
| Hamster      | 0.08                  | 0.016    | 5         |
| Guinea Pig   | 0.40                  | 0.05     | 8         |
| Rabbit       | 1.8                   | 0.15     | 12        |
| Monkey (NHP) | 3                     | 0.25     | 12        |
| Dog          | 10                    | 0.5      | 20        |
| Micro-pig    | 20                    | 0.74     | 27        |
| Mini-pig     | 40                    | 1.14     | 35        |
| Human        | 60                    | 1.62     | 37        |

**Note:** Only species from FDA 2005 Table 1 are included. Estimated/extrapolated species values are not used to ensure regulatory accuracy.

#### Safety Factor Guidelines

| Factor | When to Use                                                           |
| ------ | --------------------------------------------------------------------- |
| 3x     | Well-characterized compound class with extensive human data           |
| 10x    | Standard default for new chemical entities (NCE)                      |
| 30x    | Steep dose-response, narrow TI, irreversible toxicity, novel target   |
| 100x   | Genotoxic compounds, immunomodulatory agents, highly novel mechanisms |

#### Limitations

- **Biologics:** NOAEL-based HED calculation may not be appropriate. Consider MABEL (Minimum Anticipated Biological Effect Level) approach per ICH S6(R1) and EMA guidance.
- **Cell/Gene Therapies:** Standard HED calculation is not applicable.
- **Linear PK Assumption:** Does not account for saturable metabolism or target-mediated drug disposition.
- **Species-Specific Factors:** Receptor density, binding affinity, and metabolic pathways may differ significantly.

**Reference:** FDA "Guidance for Industry: Estimating the Maximum Safe Starting Dose in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (July 2005)

### Bioavailability by Route of Administration

Literature-based default values for different routes of administration. These are conservative estimates; actual bioavailability varies significantly by drug, formulation, and patient factors.

| Route                  | Default | Range     | Notes                                          |
| ---------------------- | ------- | --------- | ---------------------------------------------- |
| **IV (Intravenous)**   | 100%    | 100%      | Reference standard by definition               |
| **IM (Intramuscular)** | 85%     | 75-100%   | Near-complete; avoids first-pass               |
| **SC (Subcutaneous)**  | 70%     | 50-100%   | Lower for biologics (50-80%)                   |
| **Oral**               | 50%     | **5-99%** | **HIGHLY VARIABLE** - use drug-specific values |
| **Rectal**             | 65%     | 30-80%    | Approximately 50% bypasses hepatic first-pass  |
| **Sublingual**         | 70%     | 60-80%    | Bypasses first-pass via oral mucosa            |
| **Transdermal**        | 35%     | 10-50%    | Limited to small lipophilic molecules          |
| **Inhalation**         | 25%     | 10-40%    | Lung deposition depends on particle size       |
| **Other**              | 75%     | 50-100%   | Conservative estimate for unspecified routes   |

**Formula:** `Dose_adjusted = Dose_base / (Bioavailability / 100)`

**Important:** Oral bioavailability is highly variable (5-99%) depending on the drug. Examples:

- Propranolol: approximately 26%
- Morphine: approximately 30%
- Metformin: approximately 50-60%

The 50% default is a conservative middle estimate. Always use compound-specific values from pharmacokinetic studies when available.

**References:**

- [NBK557852](https://www.ncbi.nlm.nih.gov/books/NBK557852/): Drug Bioavailability (StatPearls)
- [NBK551679](https://www.ncbi.nlm.nih.gov/books/NBK551679/): First-Pass Effect (StatPearls)
- [PMCID: PMC10745386](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10745386/): The Bioavailability of Drugs—Current State of Knowledge
- [PMCID: PMC6182494](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6182494/): Subcutaneous Administration of Biotherapeutics
- [PMCID: PMC6805701](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6805701/): Physiological Considerations for Rectal Drug Formulations

### Species Database

| Species           | Weight (kg) | Brain (g) | Life Span (y) | Hepatic Flow (mL/min/kg) | Hep. Clear. | Renal Clear. | BSA (m2) |
| ----------------- | ----------- | --------- | ------------- | ------------------------ | ----------- | ------------ | -------- |
| Mouse             | 0.02        | 0.4       | 2             | 131                      | 90          | 15           | 0.006    |
| Gerbil            | 0.07        | 1.2       | 3             | 100                      | 80          | 13           | 0.012    |
| Hamster           | 0.1         | 1.0       | 2.5           | 90                       | 75          | 12           | 0.02     |
| Rat               | 0.15        | 2.0       | 3             | 85                       | 73          | 12           | 0.025    |
| Marmoset          | 0.35        | 8.0       | 12            | 95                       | 70          | 11           | 0.045    |
| Chinchilla        | 0.5         | 6.0       | 15            | 75                       | 58          | 9            | 0.04     |
| Guinea Pig        | 1.0         | 4.8       | 6             | 75                       | 55          | 8            | 0.06     |
| Ferret            | 1.2         | 7.2       | 7             | 72                       | 52          | 10           | 0.08     |
| Rabbit            | 2.0         | 9.1       | 9             | 77                       | 65          | 10           | 0.15     |
| Cat               | 4.0         | 28.4      | 15            | 65                       | 48          | 8            | 0.25     |
| Monkey            | 5.0         | 95.0      | 25            | 58                       | 42          | 7            | 0.3      |
| Cynomolgus Monkey | 5.0         | 64.0      | 30            | 43.6                     | 35          | 6            | 0.29     |
| Rhesus Macaque    | 7.0         | 91.0      | 25            | 45                       | 38          | 6            | 0.35     |
| Beagle            | 10.0        | 72.0      | 13            | 58                       | 42          | 7            | 0.5      |
| Dog               | 20.0        | 85.0      | 13            | 55                       | 38          | 6            | 0.8      |
| Goat              | 25.0        | 80.0      | 12            | 50                       | 35          | 5            | 0.85     |
| Mini Pig          | 30.0        | 125.0     | 17            | 45                       | 28          | 4            | 1.1      |
| Sheep             | 40.0        | 130.0     | 12            | 47                       | 32          | 5            | 1.2      |
| Human             | 70.0        | 1350.0    | 80            | 20.7                     | 15          | 1.5          | 1.9      |
| Pig               | 70.0        | 154.0     | 15            | 35                       | 25          | 3.5          | 1.6      |
| Horse             | 500.0       | 620.0     | 28            | 28                       | 18          | 2.5          | 6.3      |
| Cow               | 600.0       | 445.0     | 18            | 25                       | 15          | 2            | 7.1      |

**Notes on Species Data:**

- Brain weight values are based on adult animals and may vary by strain/breed (typically 30% variation)
- Hepatic blood flow values are from Davies & Morris (1993) and validated against recent literature
- Clearance values are population averages and may vary by compound
- Life span data represents typical maximum values in controlled conditions
- All species parameters validated against peer-reviewed literature (December 2024)
- For compound-specific adjustments requiring protein binding, volume of distribution, or LogP, use proper PBPK modeling tools

## Dependencies

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Charts:** Recharts

## Deployment

### Vercel (Recommended)

The easiest deployment option since it's built by the Next.js team:

1. Push your code to GitHub
2. Visit [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Click "Deploy"

### Netlify

1. Push to GitHub
2. Visit [Netlify](https://netlify.com)
3. Click "New site from Git"
4. Configure build:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Deploy site

### Heroku

1. Add to package.json:
   ```json
   {
     "scripts": {
       "heroku-postbuild": "npm run build",
       "start": "next start -p $PORT"
     }
   }
   ```
2. Run:
   ```bash
   heroku create your-app-name
   heroku buildpacks:set heroku/nodejs
   git push heroku main
   ```

### Environment Setup

Create `.env.local` for local development and add variables to your deployment platform's settings.

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Disclaimer

DoseFinder ("the Calculator") by BioStochastics is not intended for clinical or therapeutic dosing. The Calculator is intended for informational and educational purposes only. This Calculator is not a substitute for professional medical, pharmacological, toxicological, or veterinary advice. Consult qualified professionals before making decisions based on its outputs.

Calculations are for research purposes and should not be used for clinical or therapeutic dosing without professional oversight.

By using this Calculator, you agree to these terms and assume full responsibility for its use.

## Scientific References

### Species Database Sources

All physiological parameters in the species database have been validated against peer-reviewed literature:

#### Primary Sources

1. **Davies B, Morris T.** (1993). Physiological parameters in laboratory animals and humans. _Pharm Res._ 10(7):1093-1095. [PMID: 8378254](https://pubmed.ncbi.nlm.nih.gov/8378254/)
   - Primary source for hepatic blood flow values across species

2. **Brown RP, Delp MD, Lindstedt SL, Rhomberg LR, Beliles RP.** (1997). Physiological parameter values for physiologically based pharmacokinetic models. _Toxicol Ind Health._ 13(4):407-484. [PMID: 9249929](https://pubmed.ncbi.nlm.nih.gov/9249929/)
   - Comprehensive PBPK parameters for mouse, rat, dog, and human

3. **FDA Guidance for Industry.** (2005). Estimating the maximum safe starting dose in initial clinical trials for therapeutics in adult healthy volunteers. _U.S. Food and Drug Administration._ [View Document](https://www.fda.gov/media/72309/download)
   - Regulatory framework for allometric scaling and dose conversion

4. **Nair AB, Jacob S.** (2016). A simple practice guide for dose conversion between animals and human. _J Basic Clin Pharm._ 7(2):27-31. [PMCID: PMC4804402](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4804402/)
   - BSA calculation and Km factor methodology

#### Supplementary Sources

5. **Lin Z, et al.** (2020). Physiological parameter values for PBPK models in food-producing animals. Part I: Cattle and swine. _J Vet Pharmacol Ther._ 43:385-420. [PMID: 32190909](https://pubmed.ncbi.nlm.nih.gov/32190909/)

6. **Li M, et al.** (2021). Physiological parameter values for PBPK models. Part III: Sheep and goat. _J Vet Pharmacol Ther._ 44:533-563. [PMCID: PMC8359294](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8359294/)

7. **Mandikian D, et al.** (2018). Tissue Physiology of Cynomolgus Monkeys: Cross-Species Comparison and Implications for Translational Pharmacology. _AAPS J._ 20:107. [PMID: 30264171](https://pubmed.ncbi.nlm.nih.gov/30264171/)

### Scaling Method References

- **West GB, Brown JH.** (2005). The origin of allometric scaling laws in biology from genomes to ecosystems. _J Exp Biol._ 208:1575-1592. [PMID: 15855389](https://pubmed.ncbi.nlm.nih.gov/15855389/)
- **Boxenbaum H.** (1982). Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. _J Pharmacokinet Biopharm._ 10(2):201-227. [PMID: 7120049](https://pubmed.ncbi.nlm.nih.gov/7120049/)
- **Mahmood I, Balian JD.** (1996). Interspecies scaling: predicting clearance of drugs in humans. _Xenobiotica._ 26(9):887-895. [PMID: 8902907](https://pubmed.ncbi.nlm.nih.gov/8902907/)
- **Sharma V, McNeill JH.** (2009). To scale or not to scale: the principles of dose extrapolation. _Br J Pharmacol._ 157(6):907-921. [PMCID: PMC2737649](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2737649/)
- **Reagan-Shaw S, Nihal M, Ahmad N.** (2008). Dose translation from animal to human studies revisited. _FASEB J._ 22(3):659-661. [PMID: 17942826](https://pubmed.ncbi.nlm.nih.gov/17942826/)

### Bioavailability References

- **Herman TF, Santos C.** (2023). First-Pass Effect. _StatPearls_ [Internet]. [NBK551679](https://www.ncbi.nlm.nih.gov/books/NBK551679/)
- **Azman M, et al.** (2023). The Bioavailability of Drugs—The Current State of Knowledge. _Molecules._ 28(24):8038. [PMCID: PMC10745386](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10745386/)
- **Bittner B, et al.** (2018). Subcutaneous Administration of Biotherapeutics: An Overview of Current Challenges and Opportunities. _BioDrugs._ 32(5):425-440. [PMCID: PMC6182494](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6182494/)
- **Hua S.** (2019). Physiological and Pharmaceutical Considerations for Rectal Drug Formulations. _Front Pharmacol._ 10:1196. [PMCID: PMC6805701](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6805701/)
- **de Boer AG, et al.** (1979). Rectal bioavailability of lidocaine in man: Partial avoidance of "first-pass" metabolism. _Clin Pharmacol Ther._ 26(6):701-709. [PMID: 498711](https://pubmed.ncbi.nlm.nih.gov/498711/)
- **Consalvi S, et al.** (2022). Sublingual Drug Administration. _StatPearls_ [Internet]. [NBK539735](https://www.ncbi.nlm.nih.gov/books/NBK539735/)

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).

## Contact

sergey.kornilov@biostochastics.com

## Citation

```bibtex
@software{kornilov2025dosefinder,
  author = {Kornilov, Sergey},
  title = {DoseFinder: Pharmacological Dose Scaling Calculator},
  year = {2025},
  publisher = {GitHub},
  url = {https://github.com/biostochastics/DoseFinder},
  note = {https://dose-finder.vercel.app}
}
```

---

_Part of the Biostochastics collection of tools for translational science and biomarker discovery_
