# DoseFinder: Simple Pharmacological Dose Scaling Calculator

A simple web application for calculating and visualizing pharmacological dose scaling across different species. You can check out the functioning demo at https://dose-finder.vercel.app

## Disclaimer / Terms of Use
DoseFinder is a Simple Allometric Scaling Calculator ("the Calculator") by BioStochastics and is not intended for clinical or therapeutic dosing. The Calculator is intended for informational and educational purposes only. This Calculator is not a substitute for professional medical, pharmacological, toxicological, or veterinary advice. Consult qualified professionals before making decisions based on its outputs.
Calculations are for research purposes and should not be used for clinical or therapeutic dosing without professional oversight.

By using this Calculator, you agree to these terms and assume full responsibility for its use.

## Features

#### Core Functionality
- Interactive dose scaling calculator
- Real-time calculation updates
- Logarithmic scaling visualization
- Dark/light mode support
- Export calculation reports
- Dilution factor adjustment

#### Visualization
- Interactive scaling chart
- Species-specific data points
- Logarithmic weight axis
- Customizable display
- Responsive design
- Tooltip information

#### Advanced Parameters
- Protein Binding (%)
- Bioavailability (%)
- Kidney Function (%)
- Volume Distribution (L/kg)
- Molecular Weight (g/mol)
- Log P

### Species Coverage
- Small Laboratory Animals: Mouse, Rat, Hamster, Guinea Pig
- Medium-sized Laboratory Animals: Rabbit, Ferret
- Large Laboratory Animals: Dog, Mini Pig, Sheep
- Non-human Primates: Monkey (generic)
- Companion Animals: Cat
- Large Animals: Horse, Cow
- Human (Reference Species)

### Scaling Methods
1. Allometric Scaling
   - Customizable scaling exponent (default: 0.75)
   - Based on standard metabolic scaling principles
   - Uses the widely accepted 3/4 power law
   - Suitable for initial dose estimation
   - Reference: West GB, Brown JH, Enquist BJ. Science. 1997

2. Brain Weight Scaling
   - Uses 2/3 power law relationship for brain-to-body mass
   - Considers species-specific brain weight differences
   - Particularly useful for CNS-active compounds
   - Accounts for neural tissue distribution
   - Reference: Wang Z et al. Brain-weight scaling in mammals

3. Life-Span Scaling
   - Based on maximum life-span potential
   - Uses natural logarithm for better accuracy
   - Useful for chronic toxicity studies
   - Considers species longevity differences
   - Reference: Boxenbaum H. J Pharmacokinet Biopharm. 1982

4. Hepatic Blood Flow Scaling
   - Uses species-specific hepatic blood flow rates
   - Incorporates hepatic clearance ratios
   - Relevant for highly extracted drugs
   - Considers first-pass metabolism
   - Reference: Davies B, Morris T. Pharm Res. 1993

### Physiological Parameters
Each species entry includes:
- Average adult weight (kg)
- Brain weight (g)
- Life span (years)
- Hepatic blood flow (mL/min/kg)
- Hepatic clearance (mL/min/kg)
- Renal clearance (mL/min/kg)

### Animal Database
| Species    | Weight (kg) | Brain (g) | Life Span (y) | Hepatic Flow (mL/min/kg) | Hep. Clear. | Renal Clear. |
|------------|------------|-----------|---------------|-------------------------|-------------|--------------|
| Mouse      | 0.02       | 0.4       | 2             | 131                     | 90          | 15           |
| Rat        | 0.15       | 2.0       | 3             | 85                      | 73          | 12           |
| Hamster    | 0.1        | 1.0       | 2.5           | 90                      | 75          | 12           |
| Guinea Pig | 1.0        | 4.8       | 6             | 75                      | 55          | 8            |
| Ferret     | 1.2        | 7.2       | 7             | 72                      | 52          | 10           |
| Rabbit     | 2.0        | 9.1       | 9             | 77                      | 65          | 10           |
| Cat        | 4.0        | 28.4      | 15            | 65                      | 48          | 8            |
| Monkey     | 5.0        | 95.0      | 25            | 58                      | 42          | 7            |
| Dog        | 20.0       | 85.0      | 13            | 55                      | 38          | 6            |
| Mini Pig   | 30.0       | 125.0     | 17            | 45                      | 28          | 4            |
| Sheep      | 40.0       | 130.0     | 12            | 47                      | 32          | 5            |
| Horse      | 500.0      | 620.0     | 28            | 28                      | 18          | 2.5          |
| Cow        | 600.0      | 445.0     | 18            | 25                      | 15          | 2            |
| Human      | 70.0       | 1350.0    | 80            | 20.7                    | 15          | 1.5          |

### Important Notes
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

### Calculation Steps
1. Weight Ratio = Target Weight / Base Weight
2. Scaled Factor = Weight Ratio ^ Scaling Factor
3. Calculated Dose = Base Dose × Scaled Factor
4. Final Dose = Calculated Dose × Dilution Factor (optional)

### Technical Details
- Framework: Next.js 14
- Language: TypeScript
- Styling: Tailwind CSS
- Components: shadcn/ui
- Charts: Recharts
- Responsive Design
- Dark/Light Theme

## Getting Started

```bash
# Install dependencies
npm install --legacy-peer-deps # For shadcn/ui

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage
1. Select source animal and enter base dose
2. Choose target animal
3. Select scaling method
4. Adjust dilution factor if needed
5. View calculated dose and visualization
6. Use dark/light mode toggle as preferred

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

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## Contact

For inquiries: sergey.kornilov@biostochastics.com

## License

[MIT License](https://opensource.org/license/mit)
