# DoseFinder: Simple Pharmacological Dose Scaling Calculator

A simple web application for calculating and visualizing pharmacological dose scaling across different species.

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
1. Allometric Scaling (Weight^0.75)
   - Based on standard metabolic scaling principles
   - Uses the widely accepted 3/4 power law
   - Suitable for initial dose estimation

2. Brain Weight Scaling
   - Considers species-specific brain weight differences
   - Particularly useful for CNS-active compounds
   - Accounts for neural tissue distribution

3. Life-Span Scaling
   - Based on maximum life-span potential
   - Useful for chronic toxicity studies
   - Considers species longevity differences

4. Hepatic Blood Flow Scaling
   - Uses species-specific hepatic blood flow rates
   - Relevant for highly extracted drugs
   - Considers first-pass metabolism

### Physiological Parameters
Each species entry includes:
- Average adult weight (kg)
- Brain weight (g)
- Life span (years)
- Hepatic blood flow (mL/min/kg)
- Hepatic clearance (mL/min/kg)
- Renal clearance (mL/min/kg)

### Important Notes
1. The allometric exponent is set to 0.75 for all species, following standard metabolic scaling principles.
2. Clearance values are population averages and may vary significantly based on the specific drug.
3. For more accurate dosing, consider drug-specific parameters such as:
   - Plasma protein binding
   - Blood-brain barrier penetration
   - Volume of distribution
   - Route of administration
   - Bioavailability

### Calculation Steps
1. Weight Ratio = Target Weight / Base Weight
2. Scaled Factor = Weight Ratio ^ Scaling Factor
3. Calculated Dose = Base Dose × Scaled Factor
4. Final Dose = Calculated Dose × Dilution Factor (optional)

### Animal Database
| Species    | Weight (kg) | Brain Weight (g) | Life Span (years) | Hepatic Flow (ml/min/kg) | Hepatic Clearance | Renal Clearance |
|------------|------------|------------------|-------------------|------------------------|------------------|----------------|
| Mouse      | 0.02       | 0.4             | 2                 | 90                    | 85               | 15             |
| Rat        | 0.15       | 2               | 3                 | 80                    | 70               | 12             |
| Hamster    | 0.1        | 1               | 2.5               | 80                    | 70               | 12             |
| Guinea Pig | 1.0        | 5               | 6                 | 70                    | 50               | 8              |
| Ferret     | 1.2        | 6               | 7                 | 70                    | 50               | 10             |
| Rabbit     | 2          | 10              | 9                 | 65                    | 60               | 10             |
| Cat        | 4          | 28              | 15                | 60                    | 45               | 8              |
| Monkey     | 5          | 85              | 25                | 55                    | 40               | 7              |
| Dog        | 20         | 80              | 13                | 55                    | 35               | 6              |
| Mini Pig   | 30         | 125             | 17                | 40                    | 25               | 4              |
| Sheep      | 40         | 130             | 12                | 45                    | 30               | 5              |
| Horse      | 500        | 600             | 28                | 25                    | 15               | 2.5            |
| Cow        | 600        | 440             | 18                | 20                    | 12               | 2              |
| Human      | 70         | 1350            | 80                | 22.5                  | 15               | 1.5            |

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