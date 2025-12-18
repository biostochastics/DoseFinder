# DoseFinder: Simple Pharmacological Dose Scaling Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://dose-finder.vercel.app)
[![Version](https://img.shields.io/badge/version-0.9.0-blue.svg)](https://github.com/biostochastics/dosefinder/)

## Overview

DoseFinder is an interactive web-based calculator for pharmacological dose scaling that supports multiple scaling methods and species. It provides real-time calculation updates with visualization tools and considers additional physiological parameters for more accurate dose estimation in drug development and research.

### ⚠️ Important Notice

DoseFinder implements classical allometric scaling approaches for **educational and initial estimation purposes only**. Results should be validated with modern pharmacokinetic modeling and professional consultation before any clinical or research application. See the comprehensive "Limitations" tab in the application for detailed information about assumptions and uncertainties.

## Installation

```bash
# Install dependencies
npm install --legacy-peer-deps # For shadcn/ui

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

- **Interactive Calculator:** Real-time calculation updates with multiple scaling methods
- **Species Coverage:** Comprehensive database of 22 species from small laboratory animals to humans
- **Multiple Scaling Methods:**
  - Allometric Scaling (customizable exponent, default 0.75)
  - Body Surface Area (BSA) using FDA Km method
  - Direct/Linear Scaling (exponent 1.0)
  - Metabolic Rate Scaling (Kleiber's law, exponent 0.75)
  - Brain Weight Scaling (for CNS-active drugs)
  - Life-Span Scaling (for chronic dosing)
  - Hepatic Blood Flow Scaling
- **Advanced Parameters:**
  - Bioavailability adjustments (route-dependent)
  - Kidney Function calculations (manual or Cockcroft-Gault GFR)
  - Fraction excreted unchanged (fe) for proper renal adjustment
  - Creatinine unit conversion (mg/dL ↔ µmol/L)
- **Study Planner:**
  - Calculate total product requirements for studies
  - Support for multiple study arms with independent durations
  - Treatment, placebo, and comparator arm types
  - Flexible dosing schedules (daily, weekly, custom)
  - Accurate month-based calculations using average month length
  - Enforced limits on dilution factors for practical dilution steps
  - Precise percentage to mg/mL conversion with density factor support
  - Optimized performance for large study designs
  - Dilution sequence calculations
  - Color-coded study planning reports
  - Comprehensive export of study plans
- **Scientific Documentation (v0.7.3):**
  - Comprehensive limitations and assumptions documentation
  - Detailed formula documentation with peer-reviewed references
  - Uncertainty indicators for physiological parameters (±30% variation)
  - Method-specific guidance and best practices
  - FDA guidance integration
- **Interactive Visualization:** Scaling charts with species-specific data points
- **User Experience:** Dark/light mode support and responsive design
- **Export Functionality:** Generate calculation reports

## Usage

### Basic Example

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

## Documentation

Full demonstration available at the [DoseFinder Demo Site](https://dose-finder.vercel.app).

### Calculation Methods

#### Allometric Scaling

```
For mg/kg to mg/kg interspecies conversion:
Target Dose (mg/kg) = Source Dose (mg/kg) × (W_target / W_source)^(b-1)

where b = clearance scaling exponent (default: 0.75)
and dose conversion exponent = b - 1 = -0.25

This means larger animals require LOWER mg/kg doses (biologically correct).
```

**Derivation:**

- Clearance scales as: CL ∝ W^b (where b ≈ 0.75)
- For equivalent exposure: Dose_target/CL_target = Dose_source/CL_source
- This gives: (mg/kg)\_target = (mg/kg)\_source × (W_target/W_source)^(b-1)

**Example:** Mouse (0.02 kg) to Human (70 kg), 1 mg/kg dose

- Target Dose = 1 × (70/0.02)^(-0.25) ≈ 0.13 mg/kg

#### Body Surface Area Scaling (Km Method) — FDA Recommended

```
Km = Weight / BSA
Target Dose = Source Dose × (Source Km / Target Km)
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
Target Dose (mg/kg) = Source Dose (mg/kg) × (W_target / W_source)^(-0.25)
```

_Based on basal metabolic rate scaling_

#### Brain Weight Scaling

```
Scaling Factor = (2/3) × ln(Target Brain / Source Brain) / ln(W_target / W_source)
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
Scaling Factor = ln((Target Flow × Target Ratio) / (Source Flow × Source Ratio)) / ln(W_target / W_source)
```

_For hepatically-cleared compounds_

### Animal Database

| Species           | Weight (kg) | Brain (g) | Life Span (y) | Hepatic Flow (mL/min/kg) | Hep. Clear. | Renal Clear. | Body Surface Area (m²) |
| ----------------- | ----------- | --------- | ------------- | ------------------------ | ----------- | ------------ | ---------------------- |
| Mouse             | 0.02        | 0.4       | 2             | 131                      | 90          | 15           | 0.006                  |
| Gerbil            | 0.07        | 1.2       | 3             | 100                      | 80          | 13           | 0.012                  |
| Hamster           | 0.1         | 1.0       | 2.5           | 90                       | 75          | 12           | 0.02                   |
| Rat               | 0.15        | 2.0       | 3             | 85                       | 73          | 12           | 0.025                  |
| Marmoset          | 0.35        | 8.0       | 12            | 95                       | 70          | 11           | 0.045                  |
| Chinchilla        | 0.5         | 6.0       | 15            | 75                       | 58          | 9            | 0.04                   |
| Guinea Pig        | 1.0         | 4.8       | 6             | 75                       | 55          | 8            | 0.06                   |
| Ferret            | 1.2         | 7.2       | 7             | 72                       | 52          | 10           | 0.08                   |
| Rabbit            | 2.0         | 9.1       | 9             | 77                       | 65          | 10           | 0.15                   |
| Cat               | 4.0         | 28.4      | 15            | 65                       | 48          | 8            | 0.25                   |
| Monkey            | 5.0         | 95.0      | 25            | 58                       | 42          | 7            | 0.3                    |
| Cynomolgus Monkey | 5.0         | 64.0      | 30            | 43.6                     | 35          | 6            | 0.29                   |
| Rhesus Macaque    | 7.0         | 91.0      | 25            | 45                       | 38          | 6            | 0.35                   |
| Beagle            | 10.0        | 72.0      | 13            | 58                       | 42          | 7            | 0.5                    |
| Dog               | 20.0        | 85.0      | 13            | 55                       | 38          | 6            | 0.8                    |
| Goat              | 25.0        | 80.0      | 12            | 50                       | 35          | 5            | 0.85                   |
| Mini Pig          | 30.0        | 125.0     | 17            | 45                       | 28          | 4            | 1.1                    |
| Sheep             | 40.0        | 130.0     | 12            | 47                       | 32          | 5            | 1.2                    |
| Human             | 70.0        | 1350.0    | 80            | 20.7                     | 15          | 1.5          | 1.9                    |
| Pig               | 70.0        | 154.0     | 15            | 35                       | 25          | 3.5          | 1.6                    |
| Horse             | 500.0       | 620.0     | 28            | 28                       | 18          | 2.5          | 6.3                    |
| Cow               | 600.0       | 445.0     | 18            | 25                       | 15          | 2            | 7.1                    |

## Dependencies

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Charts:** Recharts
- **Environment Variable Management:** .env.local

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

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Disclaimer / Terms of Use

DoseFinder is a Simple Allometric Scaling Calculator ("the Calculator") by BioStochastics and is not intended for clinical or therapeutic dosing. The Calculator is intended for informational and educational purposes only. This Calculator is not a substitute for professional medical, pharmacological, toxicological, or veterinary advice. Consult qualified professionals before making decisions based on its outputs.

Calculations are for research purposes and should not be used for clinical or therapeutic dosing without professional oversight.

By using this Calculator, you agree to these terms and assume full responsibility for its use.

## Scientific References

### Species Database Sources

All physiological parameters in the species database have been validated against peer-reviewed literature (December 2024):

#### Primary Sources

1. **Davies B, Morris T.** (1993) Physiological parameters in laboratory animals and humans. _Pharmaceutical Research_, 10(7):1093-1095. [doi:10.1023/A:1018943613122](https://doi.org/10.1023/A:1018943613122) | [PubMed](https://pubmed.ncbi.nlm.nih.gov/8378254/)
   - Primary source for hepatic blood flow values across species

2. **Brown RP, Delp MD, Lindstedt SL, Rhomberg LR, Beliles RP.** (1997) Physiological parameter values for physiologically based pharmacokinetic models. _Toxicology and Industrial Health_, 13(4):407-484. [doi:10.1177/074823379701300401](https://doi.org/10.1177/074823379701300401)
   - Comprehensive PBPK parameters for mouse, rat, dog, and human

3. **FDA Guidance for Industry.** (2005) Estimating the maximum safe starting dose in initial clinical trials for therapeutics in adult healthy volunteers. _U.S. Food and Drug Administration_. [Download PDF](https://www.fda.gov/media/72309/download)
   - Regulatory framework for allometric scaling and dose conversion

4. **Nair AB, Jacob S.** (2016) A simple practice guide for dose conversion between animals and human. _Journal of Basic and Clinical Pharmacy_, 7(2):27-31. [doi:10.4103/0976-0105.177703](https://doi.org/10.4103/0976-0105.177703) | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC4804402/)
   - BSA calculation and Km factor methodology

#### Supplementary Sources

5. **Lin Z, et al.** (2020) Physiological parameter values for PBPK models in food-producing animals. Part I: Cattle and swine. _Journal of Veterinary Pharmacology and Therapeutics_, 43:385-420. [doi:10.1111/jvp.12861](https://doi.org/10.1111/jvp.12861)

6. **Li M, et al.** (2021) Physiological parameter values for PBPK models. Part III: Sheep and goat. _Journal of Veterinary Pharmacology and Therapeutics_, 44:533-563. [doi:10.1111/jvp.12938](https://doi.org/10.1111/jvp.12938) | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8359294/)

7. **Mandikian D, et al.** (2018) Tissue Physiology of Cynomolgus Monkeys: Cross-Species Comparison and Implications for Translational Pharmacology. _The AAPS Journal_, 20:107. [doi:10.1208/s12248-018-0264-z](https://doi.org/10.1208/s12248-018-0264-z)

### Scaling Method References

- **West GB, Brown JH.** (2005) The origin of allometric scaling laws in biology from genomes to ecosystems. _Journal of Experimental Biology_, 208:1575-1592.
- **Boxenbaum H.** (1982) Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. _Journal of Pharmacokinetics and Biopharmaceutics_, 10(2):201-227.
- **Mahmood I, Balian JD.** (1996) Interspecies scaling: predicting clearance of drugs in humans. _Toxicology and Applied Pharmacology_, 140(2):253-258.
- **Sharma V, McNeill JH.** (2009) To scale or not to scale: the principles of dose extrapolation. _British Journal of Pharmacology_, 157(6):907-921. [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC2737649/)
- **Reagan-Shaw S, Nihal M, Ahmad N.** (2008) Dose translation from animal to human studies revisited. _The FASEB Journal_, 22(3):659-661.

## Important Notes

1. **Formula Correction (v0.8.0):** Allometric scaling now uses exponent (b-1) for mg/kg conversion, giving biologically correct results where larger animals receive lower mg/kg doses
2. **StudyPlanner Fix (v0.8.1):** Fixed critical bug where Study Planner incorrectly displayed mg/kg doses as mg. Now properly tracks units from calculator.
3. **Edge Case Protection (v0.8.1):** Log-based scaling methods (brainWeight, lifeSpan, hepaticFlow) now handle equal source/target weights gracefully with warnings.
4. Brain weight values are based on adult animals and may vary by strain/breed (±30% typical variation)
5. Hepatic blood flow values are from Davies & Morris (1993) and validated against recent literature
6. Clearance values are population averages and may vary by compound
7. Life span data represents typical maximum values in controlled conditions
8. All species parameters validated against peer-reviewed literature (December 2024)
9. For compound-specific adjustments requiring protein binding, volume of distribution, or LogP, use proper PBPK modeling tools

## Changelog

### v0.9.0 (2025) — Proper Renal Adjustment & Scientific Improvements

- **Added:** Fraction excreted unchanged (fe) parameter for proper renal adjustment
  - Formula: `Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))`
  - Supports partial renal clearance (0 = hepatic, 1 = 100% renal)
  - Examples: Aminoglycosides (fe=0.95), Digoxin (fe=0.7), Metformin (fe=0.9)
- **Added:** Creatinine unit conversion (mg/dL ↔ µmol/L)
  - Standard conversion: 1 mg/dL = 88.4 µmol/L
  - Auto-conversion in Cockcroft-Gault calculation
- **Changed:** Renamed `calculateHepaticFlowScaling` to `calculateHepaticClearanceScaling` for accuracy
- **Added:** Experimental method markers with literature citations
  - Brain weight scaling (Boxenbaum & DiLea 1995, Mahmood 1999)
  - Life-span scaling (Travis & White 1988, Boxenbaum 1984)
  - Hepatic clearance scaling (Boxenbaum 1980, Lave et al. 1999)
- **Added:** Comprehensive tests for fe parameter and creatinine conversion
- **Improved:** Documentation with proper scientific references

### v0.8.1 (2025) — Bug Fixes & Stability

- **Fixed:** Critical StudyPlanner bug where calculated doses were copied with wrong units (mg instead of mg/kg)
- **Fixed:** Division by zero in log-based scaling methods when source and target weights are equal
- **Fixed:** TypeScript `any` type in StudyPlanner species selector
- **Changed:** Aligned custom exponent limits to 0-2 across UI and validation (was restricted to 0.5-1.0 in UI)
- **Added:** Unit tests for lifeSpan and hepaticFlow edge cases

### v0.8.0 (2024) — Critical Scientific Corrections

- **BREAKING:** Corrected allometric scaling formula for mg/kg to mg/kg conversion
  - Now uses exponent (b-1) instead of b for proper dose conversion
  - Mouse to human example: 1 mg/kg → 0.13 mg/kg (not 455 mg/kg)
  - Larger animals correctly receive LOWER mg/kg doses
- **Removed:** Protein binding adjustment (lacked proper PBPK citation)
- **Removed:** Volume of distribution adjustment (dimensionally incorrect)
- **Removed:** Lipophilicity (LogP) adjustment (arbitrary heuristic)
- **Removed:** Molecular weight exponent override (arbitrary rule)
- **Fixed:** All unit labels now correctly show mg/kg throughout
- **Fixed:** Chart data generation uses corrected formula
- **Kept:** Bioavailability and kidney function adjustments (scientifically valid)
- **Updated:** Comprehensive test suite for corrected calculations
- **Updated:** Documentation with proper scientific derivations and references

### v0.7.5 (2024)

- **Added:** Comprehensive scientific references for all species database parameters
- **Added:** Full peer-reviewed literature citations with DOI links and PubMed/PMC references
- **Updated:** In-app documentation (ScientificLimitations, Documentation components) with validated sources
- **Validated:** All species parameters against Davies & Morris (1993), Brown et al. (1997), FDA Guidance (2005), and additional peer-reviewed sources

### v0.7.4 (2024)

- **Fixed:** BSA scaling now uses correct FDA Km method (`Target Dose = Source Dose × (Source Km / Target Km)`)
- **Fixed:** Chart interpolation now only applies to allometric scaling (other methods show species data points only)
- **Fixed:** Corrected horse BSA (2.5 → 6.3 m²) and cow BSA (3.0 → 7.1 m²) values
- **Added:** Direct (Linear) scaling method with exponent 1.0
- **Added:** Metabolic Rate scaling method using Kleiber's law (exponent 0.75)
- **Improved:** Replaced browser `prompt()` with inline input for custom exponent
- **Improved:** Unified type system (consolidated Animal/Species interfaces)
- **Improved:** Centralized GFR calculation to avoid code duplication
- **Improved:** Added React.memo to calculator components for performance
- **Improved:** Silent validation instead of browser `alert()` dialogs
- **Improved:** Better TypeScript type safety throughout

### v0.7.3 (2024)

- Added comprehensive scientific documentation and limitations
- Added uncertainty indicators for physiological parameters
- Added method-specific guidance and FDA guidance integration

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).

## Contact

sergey.kornilov@biostochastics.com

## How to Cite

@software{kornilov2023dosefinder,
author = {Kornilov, Sergey},
title = {DoseFinder: Simple Pharmacological Dose Scaling Calculator},
year = {2023},
publisher = {GitHub},
url = {https://github.com/biostochastics/DoseFinder},
note = {https://dose-finder.vercel.app}
}

_Part of the Biostochastics collection of tools for translational science and biomarker discovery_
