# DoseFinder: Simple Pharmacological Dose Scaling Calculator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js%2014-black)](https://nextjs.org/)
[![Language: TypeScript](https://img.shields.io/badge/Language-TypeScript-blue)](https://www.typescriptlang.org/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://dose-finder.vercel.app)
[![Version](https://img.shields.io/badge/version-0.7.2-blue.svg)](https://github.com/biostochastics/dosefinder/)


## Overview

DoseFinder is an interactive web-based calculator for pharmacological dose scaling that supports multiple scaling methods and species. It provides real-time calculation updates with visualization tools and considers additional physiological parameters for more accurate dose estimation in drug development and research.


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

* **Interactive Calculator:** Real-time calculation updates with multiple scaling methods
* **Species Coverage:** Comprehensive database of 14 species from small laboratory animals to humans
* **Multiple Scaling Methods:**
  * Allometric Scaling (customizable exponent)
  * Brain Weight Scaling
  * Life-Span Scaling
  * Hepatic Blood Flow Scaling
  * Body Surface Area (BSA)
* **Advanced Parameters:**
  * Protein Binding (%)
  * Bioavailability adjustments
  * Kidney Function calculations
  * Volume Distribution (L/kg)
  * Molecular Weight and Log P inputs
* **Study Planner:**
  * Calculate total product requirements for studies
  * Support for multiple study arms with independent durations
  * Treatment, placebo, and comparator arm types
  * Flexible dosing schedules (daily, weekly, custom)
  * Accurate month-based calculations using average month length
  * Enforced limits on dilution factors for practical dilution steps
  * Precise percentage to mg/mL conversion with density factor support
  * Optimized performance for large study designs
  * Dilution sequence calculations
  * Color-coded study planning reports
  * Comprehensive export of study plans
* **Interactive Visualization:** Scaling charts with species-specific data points
* **User Experience:** Dark/light mode support and responsive design
* **Export Functionality:** Generate calculation reports

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
Scaled Factor = (Target Weight / Base Weight) ^ Scaling Exponent
where Scaling Exponent is customizable (default: 0.75)
```

#### Brain Weight Scaling
```
Scaling Factor = (2/3) * ln(Target Brain / Source Brain) / ln(Target Weight / Source Weight)
```

#### Life-Span Scaling
```
Scaling Factor = ln(Target Life / Source Life) / ln(Target Weight / Source Weight)
```

#### Hepatic Flow Scaling
```
Clearance Ratio = Hepatic Clearance / Hepatic Flow
Scaling Factor = ln((Target Flow * Target Ratio) / (Source Flow * Source Ratio)) / ln(Target Weight / Source Weight)
```

#### Body Surface Area Scaling
```
Scaling Factor = (Target BSA / Source BSA) ^ 0.67
```

### Animal Database
| Species    | Weight (kg) | Brain (g) | Life Span (y) | Hepatic Flow (mL/min/kg) | Hep. Clear. | Renal Clear. | Body Surface Area (m²) |
|------------|------------|-----------|---------------|-------------------------|-------------|--------------|------------------------|
| Mouse      | 0.02       | 0.4       | 2             | 131                     | 90          | 15           | 0.007                   |
| Rat        | 0.15       | 2.0       | 3             | 85                      | 73          | 12           | 0.025                   |
| Hamster    | 0.1        | 1.0       | 2.5           | 90                      | 75          | 12           | 0.02                    |
| Guinea Pig | 1.0        | 4.8       | 6             | 75                      | 55          | 8            | 0.09                    |
| Ferret     | 1.2        | 7.2       | 7             | 72                      | 52          | 10           | 0.12                    |
| Rabbit     | 2.0        | 9.1       | 9             | 77                      | 65          | 10           | 0.17                    |
| Cat        | 4.0        | 28.4      | 15            | 65                      | 48          | 8            | 0.25                    |
| Monkey     | 5.0        | 95.0      | 25            | 58                      | 42          | 7            | 0.3                     |
| Dog        | 20.0       | 85.0      | 13            | 55                      | 38          | 6            | 0.7                     |
| Mini Pig   | 30.0       | 125.0     | 17            | 45                      | 28          | 4            | 0.9                     |
| Sheep      | 40.0       | 130.0     | 12            | 47                      | 32          | 5            | 1.1                     |
| Horse      | 500.0      | 620.0     | 28            | 28                      | 18          | 2.5          | 2.5                     |
| Cow        | 600.0      | 445.0     | 18            | 25                      | 15          | 2            | 3.0                     |
| Human      | 70.0       | 1350.0    | 80            | 20.7                    | 15          | 1.5          | 1.7                     |

## Dependencies

* **Framework:** Next.js 14
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Components:** shadcn/ui
* **Charts:** Recharts
* **Environment Variable Management:** .env.local

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

## Important Notes

1. Brain weight values are based on adult animals and may vary by strain/breed
2. Hepatic blood flow values are from Davies & Morris (1993) and recent literature
3. Clearance values are population averages and may vary by compound
4. Life span data represents typical maximum values in controlled conditions
5. For more accurate dosing, consider drug-specific parameters such as:
   - Plasma protein binding
   - Blood-brain barrier penetration
   - Volume of distribution
   - Route of administration
   - Bioavailability

## License

This project is licensed under the [MIT License](https://opensource.org/license/mit).

## Contact

sergey.kornilov@biostochastics.com

## How to Cite

@software{kornilov2023dosefinder,
  author       = {Kornilov, Sergey},
  title        = {DoseFinder: Simple Pharmacological Dose Scaling Calculator},
  year         = {2023},
  publisher    = {GitHub},
  url          = {https://github.com/biostochastics/DoseFinder},
  note         = {https://dose-finder.vercel.app}
}

*Part of the Biostochastics collection of tools for translational science and biomarker discovery*