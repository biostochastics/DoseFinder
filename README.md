# DoseFinder: Simple Pharmacological Dose Scaling Calculator

A comprehensive web application for calculating and visualizing pharmacological dose scaling across different species.

## Features

### Dose Scaling Methods
- **Allometric Scaling** (default): Uses the 3/4 power law (weight^0.75)
- **Brain Weight**: Scales based on brain weight ratios
- **Life-Span**: Accounts for species lifespan differences
- **Hepatic Blood Flow**: Adjusts for hepatic flow rate variations

### Key Features
- Interactive scaling visualization
- Dark/light mode support
- Responsive design
- Real-time calculations
- Detailed step-by-step process
- Logarithmic scaling chart
- Species-specific data points

### Calculation Steps
1. Weight Ratio = Target Weight / Base Weight
2. Scaled Factor = Weight Ratio ^ Scaling Factor
3. Calculated Dose = Base Dose × Scaled Factor
4. Final Dose = Calculated Dose × Dilution Factor (optional)

### Animal Database
| Species | Weight (kg) | Brain Weight (g) | Life Span (years) | Hepatic Flow (ml/min/kg) |
|---------|------------|------------------|-------------------|------------------------|
| Mouse   | 0.02       | 0.4             | 2                 | 90                    |
| Rat     | 0.15       | 2               | 3                 | 80                    |
| Rabbit  | 2          | 10              | 9                 | 65                    |
| Cat     | 4          | 30              | 15                | 60                    |
| Monkey  | 5          | 90              | 25                | 60                    |
| Dog     | 20         | 80              | 13                | 60                    |
| Sheep   | 40         | 130             | 12                | 40                    |
| Pig     | 60         | 180             | 15                | 50                    |
| Human   | 70         | 1400            | 80                | 60                    |
| Horse   | 500        | 600             | 30                | 30                    |
| Cow     | 650        | 450             | 20                | 30                    |

### Advanced Parameters
- Protein Binding (%)
- Bioavailability (%)
- Kidney Function (%)
- Volume Distribution (L/kg)
- Molecular Weight (Da)
- Log P

## Technical Stack
- Next.js 15.0.3
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for visualization

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