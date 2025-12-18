# DoseFinder Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
