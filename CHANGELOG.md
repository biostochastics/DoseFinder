# DoseFinder Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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