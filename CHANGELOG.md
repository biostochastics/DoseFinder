# DoseFinder Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.9.7] - 2026-08-21

### Fixed

- **Documentation: Scaling Formulas Now Match the Implementation**
  - Allometric formula corrected from `(W_target/W_source)^b` to `(W_target/W_source)^(b-1)`, reflecting that DoseFinder works in mg/kg (per-kg dosing); added a note that total dose (mg) scales with exponent `b`
  - BSA method corrected from a direct `BSA_target/BSA_source` ratio to the FDA Km ratio `Km_source/Km_target` where `Km = W/BSA`, matching the calculation engine and the app's own HED formula (`^(1-b)`)

- **Study Planner: Overage/Waste NaN Guard**: the overage percentage is now clamped in the waste-allowance math, so clearing the field or entering a negative value no longer poisons the Total Active Compound and per-arm product figures with `NaN`

- **Study Planner: Material Breakdown Consistency**: the "Doses" column now counts treatment arms only, matching the treatment-only "Product (mg)" column (previously counted all arms, so a comparator/placebo arm inflated the dose count without contributing product)

### Accessibility & Code Quality

- **Study Planner: Accessible Control Names**: added accessible names to the comparator (name, concentration, unit), dosing-frequency, custom-frequency (doses, period, unit), and dilution (factor, vehicle) controls, which previously had no associated labels for screen readers
- **Study Planner: Cleanup**: removed the unused `sourceAnimal` prop and extracted the repeated 70 kg human-weight fallback into a named `DEFAULT_HUMAN_WEIGHT_KG` constant

## [0.9.6] - 2026-08-21

### Fixed

- **Dose Scaling Chart: Overlapping Species**: Chart X-axis now keys on species name instead of body weight
  - Species that share a weight (Human and Pig at 70 kg, Monkey and Cynomolgus at 5 kg) previously collapsed onto a single X position and rendered as a combined "Human/Pig" point
  - All 22 species now render as distinct, individually labelled points ordered by increasing body weight

- **Dose Scaling Chart: Unit Labels**: Y-axis, tooltip, screen-reader description, and data-table headers corrected from "mg" to "mg/kg"
  - Chart plots per-kilogram dose; the previous "mg" suffix mislabeled the quantity

- **Study Planner: mg/g → mg/mL Conversion**: Stock concentration entered in mg/g now applies the formulation density (mg/mL = mg/g × density)
  - Previously treated as 1:1 (density = 1 g/mL assumed), producing incorrect administration and dilution volumes for formulations with density ≠ 1
  - Density input is now exposed when the mg/g unit is selected (default 1.0 g/mL preserves prior results)

## [0.9.5] - 2026-01-20

### Fixed

- **Unit/Weight Inconsistencies in Export Reports**: Copy and export functions now correctly display base dose units
  - When user enters total mg, reports show both "X mg total" and "(Y mg/kg equivalent)"
  - When user enters mg/kg, reports display correctly as "X mg/kg"
  - Prevents confusing dose unit mislabeling in regulatory documentation workflows

- **Renal Adjustment Default (fe) Safety**: Changed default `fractionExcretedRenal` from 1.0 to 0
  - Previous default assumed 100% renal clearance, risking underdosing for hepatically-cleared drugs
  - New default requires explicit fe specification (opt-in safety behavior)
  - Aligns with calculation engine's documented safety posture

- **Accessibility: FIH Calculator SR Announcement**: Fixed hardcoded "60 kg" in screen reader announcement
  - Now correctly uses `result.humanWeight` and `result.mrsdTotal` for accurate announcements
  - Supports user-configurable human reference weights

- **Clipboard Error Handling**: Added `.catch()` handler to clipboard operations in Dose Calculator
  - Prevents silent failures when clipboard access is denied
  - Matches error handling pattern already used in FIH Calculator

### Added

- **BSA/Km Scaling Warning**: New warning when BSA method is selected explaining that FDA reference weights are used
  - Documents that user-entered weight adjustments are not applied to Km factors
  - Recommends allometric scaling if user-entered weights are important

- **Centralized Scaling Constants with Citations**: New `SCALING_EXPONENTS` constant in `constants.ts`
  - `METABOLIC: 0.75` - Kleiber's law (1947), West et al. (1997)
  - `SURFACE_AREA: 0.67` - Body surface area processes
  - `LINEAR: 1.0` - No weight adjustment
  - `BRAIN_WEIGHT: 0.67` - Boxenbaum & DiLea (1995)
  - `LIFE_SPAN: 0.25` - Travis & White (1988)
  - Full literature citations in JSDoc comments

- **Time Conversion Constants**: New `TIME_CONVERSIONS` constant for study planning
  - Standardized days per unit (DAY: 1, WEEK: 7, MONTH: 30.44, YEAR: 365.25)
  - Available for use in StudyPlanner calculations

### Changed

- **Memoization for Derived Values**: Wrapped `resultDose`, `uncertaintyRange`, and `baseDosePerKg` with `useMemo`
  - Prevents unnecessary recalculations on every render
  - Improves performance for complex calculation scenarios

- **Human Weight Documentation**: Added comprehensive comments in `species.ts` explaining weight context
  - Species database uses 70 kg (physiological average adult)
  - FDA regulatory guidance uses 60 kg reference
  - Cross-references `FDA_REFERENCE_WEIGHTS` in `constants.ts`

- **Calculation Engine Constants**: Updated `calculations.ts` to use centralized `SCALING_EXPONENTS`
  - Replaced hardcoded 0.75 and 1.0 values with named constants
  - Improves maintainability and scientific traceability

### Technical

- All 274 unit tests passing
- Build successful with zero TypeScript errors
- Changes based on multi-agent code review (Droid, Crush, Gemini, Claude)

## [0.9.4] - 2025-12-18

### Added

- **Allometric Scaling Validation**: New Km factor validation for FDA HED calculations
  - `validateKmFactor()` function validates Km values against biologically plausible ranges
  - Checks against FDA 2005 Guidance Table 1 expected values (Mouse Km=3 to Human Km=37)
  - Species-specific validation with expected ranges (e.g., mouse: 2.5-4, dog: 18-22)
  - Returns detailed validation results with severity levels, messages, and recommendations
  - `calculateHED()` now supports optional validation via `validateKm` option
  - `calculateHEDWithValidation()` provides full validation results alongside HED calculation
  - `calculateFdaFihDose()` automatically generates warnings for:
    - `INVALID_ANIMAL_KM`: Biologically implausible Km values (Km < 2 or Km > 40)
    - `KM_OUTSIDE_SPECIES_RANGE`: Valid but atypical Km for the species
    - `INVALID_HUMAN_KM`: Human Km outside 5% tolerance of 37
  - New `KM_VALIDATION_RANGES` constants in `constants.ts` with documented ranges
  - Prevents silent acceptance of biologically implausible HED calculations

### Fixed

- **Critical: Species Key Normalization** - Fixed Km factor lookup failures for camelCase species names
  - `getKmFactor("miniPig")` now correctly returns 35 (was returning null)
  - `getKmFactor("guineaPig")` now correctly returns 8 (was returning null)
  - Normalized all species keys to lowercase in `constants.ts`:
    - `FDA_KM_FACTORS`, `FDA_VALIDATED_SPECIES`, `FDA_REFERENCE_WEIGHTS`, `FDA_REFERENCE_BSA`
    - `KM_VALIDATION_RANGES.SPECIES_RANGES`, `VOLUME_LIMITS`
  - Updated display names in `fda.ts` to match normalized keys

- **Critical: "Once" Frequency Mapping** - Fixed single-dose study schedule generation
  - "Once" frequency now correctly maps to `type: "once"` (was incorrectly mapping to `type: "daily"`)
  - Single-dose studies (common in FIH SAD trials) now generate 1 event instead of daily events

- **High: Volume Suggestion Placeholder** - Fixed incorrect concentration recommendations
  - `validateVolume()` no longer generates misleading concentration suggestions when dose is unknown
  - Concentration suggestions now only appear when actual dose is provided via `validateDoseVolume()`
  - Split dose and reduce volume suggestions still work without dose information

### Technical

- All FDA Km values verified against FDA 2005 Guidance Table 1
- Density formulas and MABEL warnings confirmed correct

## [0.9.3] - 2025-12-18

### Added

- **FIH Calculator Export Button**: New "Export" button for FDA FIH Starting Dose calculations
  - Full input parameters (modality, species, NOAEL, safety factor, human weight)
  - Results with HED, MRSD, and total dose
  - Multi-species comparison table (when applicable)
  - Recommended MRSD with rationale
  - All calculation steps with formulas
  - Warnings and recommendations
  - Regulatory reference and methodology notes
  - Comprehensive disclaimer for IND submissions
- **Dosing Calendar Export (CSV/ICS)**: Export study schedules for trial coordination
  - CSV format for spreadsheet analysis with date/time, subject ID, arm, dose details
  - ICS format (RFC 5545) for calendar integration (Outlook, Google Calendar, Apple Calendar)
  - Configurable study name and start date
  - Support for all dosing frequencies (daily, BID, TID, weekly, biweekly, monthly, custom)
  - Automatic subject ID generation with species-based prefixes (M=mouse, R=rat, D=dog, etc.)
  - Schedule statistics display (total events, subjects, duration)
  - NC3Rs/IACUC volume limit validation integration

### Changed

- **Consolidated Calculation Hooks**: Removed unused `useCalculations.ts` hook
  - All calculation logic now consolidated in `useCalculatorState.ts`
  - Cleaner codebase with no duplicate/dead code
  - Maintains full calculation, caching, and validation functionality

### Technical

- New `src/lib/calendar/` module with types, generator, and exporters
- 54 new unit tests for calendar functionality (298 total tests)
- Robust edge case handling in schedule generation:
  - Maximum 365-day iteration limit for date skipping
  - Monthly dosing handles short months (e.g., Feb 28/29 for Jan 31 start)
  - Maximum 100,000 events per arm safety limit
  - Maximum 10-year duration validation
- Build successful with zero TypeScript errors

## [0.9.2] - 2025-12-18

### Added

- **Dose Calculator Export Button**: New "Export" button in Results section downloads comprehensive calculation report
  - Full parameter documentation (basic and advanced)
  - Scaling configuration with method descriptions
  - Results with absolute doses (per kg and total)
  - All calculation steps numbered
- **Enhanced Copy to Clipboard**: Now includes all calculator parameters
  - Scaling method and exponent
  - Bioavailability method and adjustment factor
  - Kidney function parameters (method, value, Cockcroft-Gault details if used)
  - Fraction excreted renal (fe) value
  - Uncertainty range (±30%)

### Changed

- **Study Planner Export**: Enhanced with full arm configurations
  - Species/population with weights
  - Dose level and unit per arm
  - Treatment duration and dosing frequency
  - Dilution protocol details
  - Improved formatting with clear sections
- **Disclaimers**: All exports (copy and file) now include prominent disclaimers
  - "FOR RESEARCH AND EDUCATIONAL USE ONLY"
  - Explicit warnings about clinical use requiring validation
  - References to regulatory guidelines and experimental verification
  - GLP/GMP guidance for study planner exports

### Technical

- Added `exportResults` function to `useCalculatorState.ts`
- Added `onExportResults` prop to `DoseCalculator` component
- Added `IconDownload` import for export button
- Build successful with zero TypeScript errors

## [0.9.1] - 2025-12-18

### Fixed

- **AdvancedParameters.tsx**: Guard against division by zero when bioavailability is 0
- **AdvancedParameters.tsx**: Updated kidney function text to accurately reflect renal fraction (fe) parameter
- **AdvancedParameters.tsx**: Cockcroft-Gault message now only shows when valid age and creatinine inputs are provided
- **DoseChart.tsx**: Removed duplicate X-axis rotation transform (had both CSS transform and angle prop)
- **DoseChart.tsx**: Fixed dilutedDose truthiness check to properly handle zero values
- **DoseCalculator.tsx**: Added null-safe access for species weight lookups in popover text and placeholders
- **ResultsDisplay.tsx**: Fixed dilution factor consistency using parseFloat normalization to match calculation logic
- **calculations.ts**: Added division by zero guard in generateChartData for baseWeight

### Technical

- All linting and formatting passing
- Improved robustness against edge cases and invalid inputs

## [0.9.0] - 2025-12-18

### Security

- **Critical**: Patched Next.js from 15.5.4 to 15.5.9 for React2Shell vulnerabilities
  - CVE-2025-66478 (critical): Remote code execution via crafted RSC payload
  - CVE-2025-55184 (high): DoS via malicious HTTP request causing server hang
  - CVE-2025-55183 (medium): Server Action source code exposure via malicious request
  - CVE-2025-67779 (high): Incomplete fix for CVE-2025-55184 DoS vulnerability
- Updated eslint-config-next to 15.5.9 for consistency

### Added

- **Fraction Excreted Unchanged (fe) Parameter**: Proper renal adjustment using scientifically validated formula
  - Formula: `Dose_adj = Dose_normal × (1 - fe × (1 - RenalFunctionRatio))`
  - Supports partial renal clearance (0 = hepatic, 1 = 100% renal)
  - UI with common drug examples (aminoglycosides, digoxin, metformin)
- **Creatinine Unit Conversion**: Support for both mg/dL and µmol/L
  - Standard conversion: 1 mg/dL = 88.4 µmol/L
  - Auto-conversion in Cockcroft-Gault calculation
  - Unit selector in Advanced Parameters UI
- **Experimental Method Markers**: Visual indicators and literature citations for less-validated methods
  - Brain weight scaling (Boxenbaum & DiLea 1995, Mahmood 1999)
  - Life-span scaling (Travis & White 1988, Boxenbaum 1984)
  - Hepatic clearance scaling (Boxenbaum 1980, Lave et al. 1999)
- New unit tests for fe parameter, creatinine conversion, and updated method descriptions
- Updated inner documentation (Documentation.tsx, ScientificLimitations.tsx) with new features

### Changed

- **Renamed Function**: `calculateHepaticFlowScaling` → `calculateHepaticClearanceScaling` for accuracy
- Updated method descriptions to include "(experimental)" for less-validated methods
- Improved kidney function adjustment formula (replaces simple categorical thresholds)
- Updated vitest.config.ts to exclude Playwright tests from unit test runs

### Documentation

- Comprehensive README update with v0.9.0 changelog
- Updated ScientificLimitations with kidney function adjustment section
- Added literature references throughout codebase

### Technical

- All 48 unit tests passing
- Build successful with zero TypeScript errors
- Full ESLint validation passing

## [0.8.1] - 2025-12-18

### Fixed

- **Critical Bug Fix**: StudyPlanner now correctly receives calculated dose (resultDose) instead of input dose (baseDose)
  - Previously, "Copy Calc. Dose" and "From Calculator" buttons copied the source dose in mg/kg but mislabeled it as mg
  - Now correctly passes the calculated target dose with proper mg/kg unit
- **Division by Zero Protection**: Log-based scaling methods (brainWeight, lifeSpan, hepaticFlow) now guard against division by zero when source and target weights are nearly equal
  - Sets scaling factor to 0 and adds a warning when weightRatio ≈ 1
  - Prevents NaN/Infinity propagation in calculations
- **TypeScript Fix**: Removed unnecessary `any` type cast in StudyPlanner species selector

### Changed

- **Aligned Exponent Limits**: Custom allometric exponent input now allows 0-2 range (matching types.ts VALIDATION_LIMITS)
  - Previous UI restricted to 0.5-1.0, now matches validation for research flexibility
  - Added helpful hint text showing typical values (0.67, 0.75, 1.0)
- **Improved Popover Display**: StudyPlanner "Copy Calc. Dose" popover now shows dose in correct units (mg/kg) with total mg calculation

### Added

- New unit tests for lifeSpan and hepaticFlow scaling methods covering:
  - Normal cross-species scaling behavior
  - Equal weight edge case handling with warnings
  - Finite dose production for typical species pairs
- `currentDoseUnit` prop to StudyPlanner interface for explicit unit tracking

### Technical

- All 38 core calculation tests passing
- Improved code comments documenting unit handling in StudyPlanner

## [0.7.5] - 2024-12-18

### Added

- Comprehensive scientific references for all species database parameters
- Full peer-reviewed literature citations in species.ts header documentation
- Validated references section in README with DOI links and PubMed/PMC citations
- Enhanced in-app documentation with categorized references (Species Data Sources, Scaling Methods)

### Changed

- Updated ScientificLimitations.tsx with expanded literature references
- Updated Documentation.tsx with comprehensive categorized reference sections
- Improved Important Notes section with validation date and uncertainty notes

### Documentation

- **Primary Sources Validated:**
  - Davies B, Morris T. (1993) Pharm Res - Hepatic blood flow values
  - Brown RP, et al. (1997) Toxicol Ind Health - PBPK parameters
  - FDA Guidance (2005) - Allometric scaling framework
  - Nair AB, Jacob S. (2016) J Basic Clin Pharm - BSA/Km methodology
- **Supplementary Sources:**
  - Lin Z, et al. (2020) J Vet Pharmacol Ther - Cattle/swine parameters
  - Li M, et al. (2021) J Vet Pharmacol Ther - Sheep/goat parameters
  - Mandikian D, et al. (2018) AAPS J - Cynomolgus monkey physiology
- All species parameters confirmed consistent with published literature ranges
- Typical parameter variation documented as ±30%

## [0.7.4] - 2025-09-23

### Added

- Modular component architecture with separate calculator, chart, and parameter components
- Custom React hook for centralized state management using useReducer pattern
- Comprehensive test suite with 33 passing tests for core calculations
- Type-safe interfaces for all pharmacological data structures

### Changed

- **Major Refactoring**: Decomposed 1478-line monolithic page.tsx into modular components:
  - `DoseCalculator.tsx` (367 lines) - Main calculator UI
  - `DoseChart.tsx` (155 lines) - Visualization component
  - `AdvancedParameters.tsx` (298 lines) - Advanced settings panel
  - `ResultsDisplay.tsx` (149 lines) - Results presentation
  - `useCalculatorState.ts` (241 lines) - State management hook
  - Reduced main page.tsx to 314 lines (78% reduction)
- Migrated from 36 separate useState hooks to centralized useReducer pattern
- Improved type safety with proper Animal/Species interface separation
- Enhanced performance with memoized calculations and optimized re-renders

### Fixed

- TypeScript integration issues between components
- Circular dependency in Cockroft-Gault calculation
- Import/export consistency across pharmacology modules
- StudyPlanner prop mismatches with calculator integration

### Technical

- Implemented proper separation of concerns following React best practices
- Added comprehensive type definitions for all data structures
- Removed code duplication and improved maintainability
- All linting warnings resolved
- Full build successful with zero TypeScript errors

## [0.7.3] - 2025-09-23

### Added

- Comprehensive "Limitations" tab with detailed scientific disclaimers
- Formula documentation with peer-reviewed literature references
- Uncertainty indicators showing ±30% variation for physiological parameters
- Visual warnings throughout the interface for parameter uncertainty
- FDA guidance references for scaling methods
- Method-specific limitations and best practices documentation

### Changed

- Enhanced user awareness of tool limitations with warning messages on calculated doses
- Improved scientific transparency with detailed assumptions documentation

### Fixed

- Removed duplicate Next.js configuration files (kept `.mjs` version)
- Fixed version control to properly ignore build artifacts (`dosefinder/.next/`)
- Resolved import naming conflicts between UI tooltip and Recharts tooltip components

### Technical

- Added `ScientificLimitations.tsx` component for comprehensive limitations documentation
- Added `FormulaDocumentation.tsx` component with detailed formula explanations
- Created `IMPROVEMENTS.md` documenting all changes made

## [0.7.2] - 2025-05-07

### Added

- Improved type safety with explicit interfaces for Study Planner props
- Density factor support for accurate percentage to mg/mL conversions
- Upper bound limits for dilution factors to ensure practical laboratory protocols
- Better error handling with user feedback for calculator data operations

### Changed

- Enhanced calculation accuracy with proper month-based calculations (30.44 days)
- Optimized array processing for better performance with large study designs
- Improved name generation efficiency for study arms
- Added comprehensive documentation for calculation logic

### Fixed

- Silent calculator data copy failures now show proper user feedback
- Fixed inaccurate percentage to mg/mL conversions with density factor

## [0.7.1] - 2025-05-05

### Added

- Study Planner feature for calculating total product requirements
- Support for multiple study arm types:
  - Treatment arms for active product administration
  - Placebo arms with zero active product dosing
  - Comparator arms with separate product tracking
- Independent duration settings for each study arm
- Flexible dosing schedules (once/twice/thrice daily, weekly, biweekly, monthly, custom)
- Integration between calculator and study planner:
  - Copy calculated doses to existing arms
  - Create new arms directly from calculator results
  - Detailed popover with dose information
- Dilution sequence calculations for dose preparation
- Comprehensive study plan exports including breakdown by arm type
- Visual distinguishing of different arm types in reports

## [0.6.0] - Previous Release

### Added

- Initial release with core dose scaling features
- Multiple scaling methods:
  - Allometric Scaling with customizable exponent
  - Brain Weight Scaling
  - Life-Span Scaling
  - Hepatic Blood Flow Scaling
  - Body Surface Area (BSA) Scaling
- Support for 14 species from mouse to humans
- Advanced pharmacological parameters
- Interactive visualization with scaling charts
- Dark/light mode support
- Basic export functionality
