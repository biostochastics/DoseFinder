# DoseFinder Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2025-05-07

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