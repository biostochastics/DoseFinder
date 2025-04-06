# DoseFinder: Allometric Scaling Calculator - Documentation

## Table of Contents
- [Introduction](#introduction)
- [Getting Started](#getting-started)
- [User Interface Overview](#user-interface-overview)
- [Using the Calculator](#using-the-calculator)
- [Scaling Methods Explained](#scaling-methods-explained)
- [Understanding Inputs and Outputs](#understanding-inputs-and-outputs)
- [Limitations and Considerations](#limitations-and-considerations)
- [Frequently Asked Questions (FAQ)](#frequently-asked-questions)
- [References](#references)
- [Short Guide to Key Features](#short-guide-to-key-features)
- [Examples](#examples)
- [Feedback](#feedback)

## Introduction

DoseFinder is a web-based Allometric Scaling Calculator designed for pharmacologists, toxicologists, and researchers involved in interspecies dose extrapolation. By incorporating multiple advanced scaling methods, DoseFinder facilitates accurate dose predictions across different species.

## Getting Started

DoseFinder is accessible via a web interface and can be used on both desktop and mobile devices. No installation is required; simply navigate to the application URL in your web browser.

## User Interface Overview

### Header
- **App Title**: Displays the name of the application.
- **Dark Mode Switch**: Toggle between light and dark themes for optimal viewing.

### Tabs
The application is organized into three main tabs:
1. **Calculator**: For entering essential data and selecting scaling methods.
2. **Advanced**: For inputting data required by advanced scaling methods.
3. **Documentation**: Provides detailed guidance and explanations.

## Using the Calculator

### Basic Parameters

**Entering Basic Data**
1. **Source Animal and Weight**
   - Select the source animal from the dropdown
   - The default weight will be populated, but can be adjusted if needed

2. **Target Animal and Weight**
   - Select the target animal from the dropdown
   - The default weight will be populated, but can be adjusted if needed

3. **Base Dose**
   - Enter the known dose for the base species in milligrams (mg)
   - The mg/kg dose will be automatically calculated

**Selecting Scaling Methods**
- Choose from the following scaling methods:
  - Allometric Scaling
  - Brain Weight Scaling
  - Life-Span Scaling
  - Hepatic Blood Flow Scaling
  - BSA Scaling

**Viewing Results**
- **Calculated Dose**: Displays the scaled dose for the target species.
- **Calculation Steps**: Detailed steps are provided for transparency.
- **Results Chart**: Visual representation of dose scaling across species.

### Advanced Parameters

**Kidney Function**
- None: No kidney function adjustment
- Manual: Enter kidney function percentage manually
- Cockcroft-Gault: Calculate kidney function using age, sex, and creatinine

**Bioavailability**
- Manual: Enter bioavailability percentage manually
- IV: Assumes 100% bioavailability
- Oral: Assumes 50% bioavailability
- Other: Assumes 75% bioavailability

**Additional Parameters**
- **Protein Binding (%)**: Percentage of drug bound to plasma proteins
- **Volume of Distribution (L/kg)**: Apparent volume per kg body weight
- **Molecular Weight (g/mol)**: Affects scaling exponent for molecules >400 g/mol
- **LogP**: Lipophilicity coefficient (negative for hydrophilic)

## Scaling Methods Explained

### 1. Allometric Scaling (Default Method)

**What is it?**  
The simplest and most widely used scaling method, based on the relationship between body mass and metabolic rate.

**When to use?**
- Initial dose estimation
- When limited physiological data is available
- For drugs with simple metabolic pathways

**Key Features:**
- Customizable scaling exponent (default: 0.75)
- Works well across wide weight ranges
- Generally produces smooth, predictable curves

**Formula:**  
`Target Dose = Base Dose × (Target Weight / Base Weight)^Exponent`

The default exponent is typically 0.75 (the 3/4 power law), but can be adjusted based on molecular weight:
- MW > 700 Da → exponent = 0.70
- 400 < MW ≤ 700 Da → exponent = 0.75
- MW ≤ 400 Da → exponent = 0.80

### 2. Brain Weight Scaling

**What is it?**  
Uses brain weight ratios to account for differences in neural tissue distribution.

**When to use?**
- CNS-active drugs
- Neurological therapeutics
- Drugs that cross the blood-brain barrier

**Key Features:**
- Accounts for species-specific brain development
- More conservative for small animals compared to allometric scaling

**Formula:**  
The calculation incorporates both body weight and brain weight differences between species:
`Target Dose = Base Dose × (Target Weight / Base Weight)^[(2/3) × log(Target Brain Weight / Base Brain Weight) / log(Target Weight / Base Weight)]`

### 3. Life-Span Scaling

**What is it?**  
Incorporates maximum life span differences between species.

**When to use?**
- Chronic toxicity studies
- Long-term drug exposure assessment
- Age-related drug development

**Key Features:**
- Considers species longevity
- Uses natural logarithm for better accuracy
- Particularly relevant for chronic studies

**Formula:**  
`Target Dose = Base Dose × (Target Weight / Base Weight)^[log(Target Life Span / Base Life Span) / log(Target Weight / Base Weight)]`

### 4. Hepatic Blood Flow Scaling

**What is it?**  
Incorporates both hepatic blood flow and clearance data to estimate doses.

**When to use?**
- Drugs with significant hepatic metabolism
- High extraction ratio compounds
- When first-pass effects are important

**Key Features:**
- Uses species-specific hepatic flow rates
- Considers clearance ratios
- Most physiologically detailed method

**Formula:**  
`Target Dose = Base Dose × (Target Weight / Base Weight)^[log((Target Flow × Target Clearance Ratio) / (Base Flow × Base Clearance Ratio)) / log(Target Weight / Base Weight)]`

Where Clearance Ratio is hepatic clearance divided by hepatic flow for each species.

### 5. BSA Scaling

**What is it?**  
Body Surface Area scaling directly compares the BSA between species.

**When to use?**
- Many anticancer drugs
- Initial human dose estimates
- When surface-dependent effects are important

**Key Features:**
- Uses built-in approximate BSA values for each species
- Direct ratio scaling of doses based on BSA
- Common in clinical settings

**Formula:**  
`Target Dose = Base Dose × (Target BSA / Base BSA)`

## Understanding Inputs and Outputs

### Input Parameters
- **Source Weight**: Weight of the source species (kg).
- **Target Weight**: Weight of the target species (kg).
- **Base Dose**: Known dose for the base species (mg).
- **Scaling Method**: Selected method for dose extrapolation.
- **Advanced Inputs**: Protein binding, bioavailability, kidney function, etc.

### Output Results
- **Calculated Dose**: Scaled dose for the target species (mg).
- **Dose per kg**: Calculated dose divided by target weight (mg/kg).
- **Calculation Steps**: Detailed intermediate steps for transparency.

### Interpreting the Charts
- **Dose vs. Body Weight Graph**: Visual representation of how the calculated dose changes with body weight across different species.
- **Data Points**: Animal species are marked as distinct points on the curve.
- **Logarithmic Scale**: The x-axis (weight) uses a logarithmic scale to accommodate the wide range of animal weights.

## Limitations and Considerations

- **Approximation**: Allometric scaling is an estimation; results should be validated experimentally.
- **Drug-Specific Factors**: Unique properties of the drug may affect scaling accuracy.
- **Species Differences**: Physiological and metabolic variations can influence outcomes.
- **Regulatory Compliance**: Ensure all activities comply with relevant laws and guidelines.

## Frequently Asked Questions

**Q1: Can I use this calculator for any drug?**  
A1: The calculator is designed for general use but may not be suitable for drugs with non-linear pharmacokinetics or unique properties. Always consult pharmacokinetic data for the specific drug.

**Q2: How do I choose the correct scaling method?**  
A2: The choice depends on the drug's characteristics:
- CNS-active drugs → Brain Weight Scaling
- High hepatic extraction → Hepatic Blood Flow Scaling
- Long-term study → Life-Span Scaling
- Unknown/simple kinetics → Allometric Scaling

**Q3: Can I add a custom animal species?**  
A3: Soon! 

**Q4: How accurate are these calculations?**  
A4: Allometric scaling provides an estimate based on mathematical relationships between species. Results should be considered approximations and used as starting points for dose determination, not as definitive values.

## References

1. Boxenbaum, H. (1982). Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. Journal of Pharmacokinetics and Biopharmaceutics, 10(2), 201-227.

2. Mahmood, I., & Balian, J. D. (1996). Interspecies scaling: predicting clearance of drugs in humans. Toxicology and Applied Pharmacology, 140(2), 253-258.

3. Sharma, V., & McNeill, J. H. (2009). To scale or not to scale: the principles of dose extrapolation. British Journal of Pharmacology, 157(6), 907-921.

4. Tang, H., & Mayersohn, M. (2005). A comparison of allometric scaling methods for predicting human drug clearance and volume of distribution. Journal of Pharmaceutical Sciences, 94(6), 1237-1243.

## Short Guide to Key Features

- **Dark Mode**: Toggle between light and dark themes for comfort.
- **Interactive Charts**: Visualize dose changes across species.
- **Export Function**: Save calculation results for documentation.
- **Responsive Design**: Use the app on various devices seamlessly.

## Examples

### Example 1: Scaling a Human Dose to a Mouse

- **Source Species**: Human
- **Source Weight**: 70 kg
- **Base Dose**: 500 mg
- **Target Species**: Mouse
- **Target Weight**: 0.02 kg
- **Scaling Method**: Allometric Scaling

**Steps:**
1. Select "human" as the source animal (70 kg)
2. Enter base dose (500 mg)
3. Select "mouse" as the target animal (0.02 kg)
4. Select "allometric" as the scaling method
5. View the calculated dose

**Result:**
- Calculated Dose: Approximately 0.58 mg
- Calculation steps show the application of the 0.75 exponent

### Example 2: Using Brain Weight Scaling for a CNS Drug

- **Source Species**: Human
- **Source Weight**: 70 kg
- **Source Brain Weight**: 1350 g
- **Base Dose**: 200 mg
- **Target Species**: Rat
- **Target Weight**: 0.15 kg
- **Target Brain Weight**: 2 g
- **Scaling Method**: Brain Weight Scaling

**Steps:**
1. Select "human" as the source animal
2. Enter base dose (200 mg)
3. Select "rat" as the target animal
4. Select "brainWeight" as the scaling method
5. View the calculated dose

**Result:**
- Calculated Dose: Approximately 0.84 mg
- The calculation incorporates both weight and brain weight differences


**Disclaimer**: This calculator is intended for research and education purposes only. Always consult with a healthcare professional before using this calculator for clinical purposes. Better yet, DO NOT use it for clinical purposes.