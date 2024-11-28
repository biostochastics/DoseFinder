DoseFinder: Allometric Scaling Calculator - Documentation

Table of Contents

	•	Introduction
	•	Getting Started
	•	User Interface Overview
	•	Header
	•	Tabs
	•	Using the Calculator
	•	Basic Parameters Tab
	•	Entering Basic Data
	•	Selecting Scaling Methods
	•	Viewing Results
	•	Advanced Parameters Tab
	•	Entering Advanced Data
	•	Help/Documentation Tab
	•	Scaling Methods Explained
	•	1. General Allometric Scaling
	•	2. Species-Specific Scaling
	•	3. Rule of Exponents
	•	4. Brain Weight Scaling
	•	5. Maximum Life-Span Potential Scaling
	•	6. Lipophilicity-Based Correction
	•	7. Custom Scaling Factor
	•	Understanding Inputs and Outputs
	•	Input Parameters
	•	Output Results
	•	Interpreting the Charts
	•	Limitations and Considerations
	•	Frequently Asked Questions (FAQ)
	•	References
	•	Short Guide to Key Features
	•	Tips for Effective Use
	•	Examples
	•	Example 1: Scaling a Human Dose to a Mouse
	•	Example 2: Using Brain Weight Scaling for a CNS Drug
	•	Shortcuts to Features
	•	Feedback
	•	Contact Information

Introduction

DoseFinder is a comprehensive Allometric Scaling Calculator designed for pharmacologists, toxicologists, and researchers involved in interspecies dose extrapolation. By incorporating multiple advanced scaling methods, DoseFinder facilitates more accurate dose predictions across different species.

Getting Started

DoseFinder is accessible via a web interface and can be used on both desktop and mobile devices. No installation is required; simply navigate to the application URL in your web browser.

User Interface Overview

Header

	•	App Title: Displays the name of the application.
	•	Dark Mode Switch: Toggle between light and dark themes for optimal viewing.
	•	Unit System Selector: Choose between metric (kg) and imperial (lbs) units.

Tabs

The application is organized into three main tabs:
	1.	Basic Parameters: For entering essential data and selecting scaling methods.
	2.	Advanced Parameters: For inputting data required by advanced scaling methods.
	3.	Help/Documentation: Provides detailed guidance and explanations.

Using the Calculator

Basic Parameters Tab

Entering Basic Data

	1.	Base Species Weight and Dose
	•	Base Weight: Enter the weight of the species for which the initial dose is known (e.g., human weight).
	•	Base Dose: Enter the known dose for the base species in milligrams (mg).
	2.	Target Species Weight
	•	Target Weight: Enter the weight of the species to which you want to scale the dose.

Selecting Scaling Methods

	•	Scaling Method Selection: Choose from the following scaling methods:
	•	General Allometric Scaling
	•	Species-Specific Scaling
	•	Rule of Exponents
	•	Brain Weight Scaling
	•	Maximum Life-Span Potential Scaling
	•	Lipophilicity-Based Correction
	•	Custom Scaling Factor
	•	Species Selection: If using species-specific scaling, select the base and target species from the dropdown menus.

Viewing Results

	•	Calculated Dose: The calculator displays the scaled dose for the target species based on the selected method.
	•	Intermediate Steps: Detailed calculation steps are provided for transparency.
	•	Finished Product Amount: Calculates the total amount required, considering dilution factors.

Advanced Parameters Tab

Entering Advanced Data

Input parameters specific to the advanced scaling methods:
	•	Brain Weight: Required for brain weight scaling (in grams).
	•	Maximum Life Span: Required for maximum life-span potential scaling (in years).
	•	Molecular Weight: Required for the rule of exponents method (in g/mol).
	•	LogP (Lipophilicity): Required for lipophilicity-based correction.
	•	Hepatic Blood Flow: May be needed for clearance corrections (in mL/min/kg).

Help/Documentation Tab

	•	Guidance and Explanations: Provides detailed information on how to use each feature.
	•	Scaling Methods: Explains the scientific basis and formulas for each scaling method.
	•	Limitations: Discusses considerations and potential sources of error.
	•	References: Lists scientific literature for further reading.

Scaling Methods Explained

1. General Allometric Scaling

	•	Basis: Based on Kleiber’s law, relating metabolic rate to body mass.
	•	Formula:
￼

2. Species-Specific Scaling

	•	Basis: Accounts for physiological differences between species.
	•	Scaling Factors: Uses predefined exponents for each species.

3. Rule of Exponents

	•	Basis: Adjusts the scaling exponent based on the molecular weight of the drug.
	•	Exponents:
	•	Molecular weight ≤ 400 g/mol: exponent = 0.8
	•	400 < molecular weight ≤ 700 g/mol: exponent = 0.75
	•	Molecular weight > 700 g/mol: exponent = 0.7

4. Brain Weight Scaling

	•	Basis: Suitable for drugs acting on the central nervous system.
	•	Formula:
￼

5. Maximum Life-Span Potential Scaling

	•	Basis: Incorporates maximum life span of species for long-term toxicity studies.
	•	Formula:
￼

6. Lipophilicity-Based Correction

	•	Basis: Adjusts dose based on the drug’s lipophilicity (LogP value).
	•	Formula:
￼

7. Custom Scaling Factor

	•	Basis: Allows users to input a custom exponent based on specific data or research.
	•	Formula:
￼

Understanding Inputs and Outputs

Input Parameters

	•	Base Weight: Weight of the base species (kg or lbs).
	•	Base Dose: Known dose for the base species (mg).
	•	Target Weight: Weight of the target species (kg or lbs).
	•	Scaling Method: Selected method for dose extrapolation.
	•	Advanced Inputs: Brain weight, life span, molecular weight, LogP, etc.

Output Results

	•	Calculated Dose: Scaled dose for the target species (mg).
	•	Finished Product Amount: Total amount required after considering dilution factors (mg).
	•	Calculation Steps: Detailed intermediate steps for transparency.

Interpreting the Charts

	•	Dose vs. Body Weight Graph: Visual representation of how the calculated dose changes with body weight across different species.
	•	Interactive Elements: Hover over data points to see exact values.
	•	Customization: Adjust chart settings to focus on specific species or weight ranges.

Limitations and Considerations

	•	Approximation: Allometric scaling is an estimation; results should be validated experimentally.
	•	Drug-Specific Factors: Unique properties of the drug may affect scaling accuracy.
	•	Species Differences: Physiological and metabolic variations can influence outcomes.
	•	Regulatory Compliance: Ensure all activities comply with relevant laws and guidelines.

Frequently Asked Questions (FAQ)

Q1: Can I use this calculator for any drug?

A1: The calculator is designed for general use but may not be suitable for drugs with non-linear pharmacokinetics or unique properties. Always consult pharmacokinetic data for the specific drug.

Q2: How do I choose the correct scaling method?

A2: The choice depends on the drug’s characteristics and the species involved. Refer to the “Scaling Methods Explained” section for guidance.

Q3: Can I add a species that is not listed?

A3: Yes, you can input custom species data in the advanced parameters tab.

Q4: Why are some parameters like plasma protein binding not included as species-specific constants?

A4: Plasma protein binding is drug-specific rather than species-specific. It should be provided based on the specific drug being studied.

References

	1.	Boxenbaum, H. (1982). Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. Journal of Pharmacokinetics and Biopharmaceutics, 10(2), 201-227.
	2.	Mahmood, I., & Balian, J. D. (1996). Interspecies scaling: predicting clearance of drugs in humans. Toxicology and Applied Pharmacology, 140(2), 253-258.
	3.	Sharma, V., & McNeill, J. H. (2009). To scale or not to scale: the principles of dose extrapolation. British Journal of Pharmacology, 157(6), 907-921.
	4.	Tang, H., & Mayersohn, M. (2005). A comparison of allometric scaling methods for predicting human drug clearance and volume of distribution. Journal of Pharmaceutical Sciences, 94(6), 1237-1243.

Disclaimer: This calculator is intended for research and educational purposes only. Users should verify all calculations and consult relevant guidelines and experts when applying these methods in practice.

Short Guide to Key Features

	•	Dark Mode: Toggle between light and dark themes for comfort.
	•	Unit System: Switch between metric and imperial units.
	•	Instructions Panel: Access step-by-step guidance within the app.
	•	Interactive Charts: Visualize dose changes across species.
	•	Responsive Design: Use the app on various devices seamlessly.

Tips for Effective Use

	•	Validate Inputs: Ensure all entered data is accurate and appropriate for the chosen scaling method.
	•	Understand the Methods: Familiarize yourself with the scaling methods to select the most suitable one.
	•	Use Advanced Parameters Judiciously: Only input advanced parameters when necessary and when you have reliable data.
	•	Consult the Help Tab: When in doubt, refer to the help/documentation tab for detailed explanations.

Examples

Example 1: Scaling a Human Dose to a Mouse

	•	Base Species: Human
	•	Base Weight: 70 kg
	•	Base Dose: 500 mg
	•	Target Species: Mouse
	•	Target Weight: 0.02 kg
	•	Scaling Method: General Allometric Scaling

Steps:
	1.	Enter the base weight (70 kg) and base dose (500 mg).
	2.	Enter the target weight (0.02 kg).
	3.	Select “General Allometric Scaling” as the scaling method.
	4.	The calculator computes the scaled dose for the mouse.

Result:
	•	Calculated Dose: Approximately 1.79 mg

Example 2: Using Brain Weight Scaling for a CNS Drug

	•	Base Species: Human
	•	Base Brain Weight: 1350 g
	•	Base Dose: 200 mg
	•	Target Species: Rat
	•	Target Brain Weight: 2 g
	•	Scaling Method: Brain Weight Scaling

Steps:
	1.	Enter the base brain weight (1350 g) and base dose (200 mg).
	2.	Enter the target brain weight (2 g).
	3.	Select “Brain Weight Scaling” as the scaling method.
	4.	The calculator computes the scaled dose for the rat.

Result:
	•	Calculated Dose: Approximately 2.15 mg

Shortcuts to Features

	•	Ctrl + H: Open Help/Documentation Tab
	•	Ctrl + D: Toggle Dark Mode
	•	Ctrl + U: Switch Unit System
	•	Ctrl + R: Reset All Inputs

Feedback

Your feedback is valuable for improving this tool. Please send any comments, suggestions, or reports of issues to:

Email: sergey.kornilov@biostochastics.com

Contact Information

For questions, feedback, or support, please contact:

BioStochastics
Email: sergey.kornilov@biostochastics.com

DoseFinder Tutorial

Understanding Dose Scaling Methods

DoseFinder provides several scaling methods, each with its own strengths and specific use cases. This tutorial will help you understand when and how to use each method.

1. Allometric Scaling (Default Method)

What is it?

The simplest and most widely used scaling method, based on the relationship between body mass and metabolic rate.

When to use?
	•	Initial dose estimation
	•	When limited physiological data is available
	•	For drugs with simple metabolic pathways

Key Features:
	•	Customizable scaling exponent (default: 0.75)
	•	Works well across wide weight ranges
	•	Generally produces smooth, predictable curves

Example:

Starting with a human dose of 1000 mg, scaling to a mouse would use:

￼

2. Brain Weight Scaling

What is it?

Uses brain weight ratios to account for differences in neural tissue distribution.

When to use?
	•	CNS-active drugs
	•	Neurological therapeutics
	•	Drugs that cross the blood-brain barrier

Key Features:
	•	Uses 2/3 power law relationship
	•	Accounts for species-specific brain development
	•	More conservative for small animals compared to allometric scaling

Pattern:

The curve tends to be steeper than allometric scaling for small animals due to their relatively larger brain-to-body weight ratios.

3. Life-Span Scaling

What is it?

Incorporates maximum life span differences between species.

When to use?
	•	Chronic toxicity studies
	•	Long-term drug exposure assessment
	•	Age-related drug development

Key Features:
	•	Considers species longevity
	•	Uses natural logarithm for better accuracy
	•	Particularly relevant for chronic studies

Pattern:

Shows more variation between species of similar size due to life span differences (e.g., cat vs. dog).

4. Hepatic Blood Flow Scaling

What is it?

Incorporates both hepatic blood flow and clearance data to estimate doses.

When to use?
	•	Drugs with significant hepatic metabolism
	•	High extraction ratio compounds
	•	When first-pass effects are important

Key Features:
	•	Uses species-specific hepatic flow rates
	•	Considers clearance ratios
	•	Most physiologically detailed method

Understanding the Pattern

The graph shows several interesting features:
	1.	High Small Animal Doses:
	•	Small animals (mouse, rat) show higher relative doses
	•	Due to their much higher hepatic blood flow per kg (mouse: 131 mL/min/kg vs. human: 20.7 mL/min/kg)
	2.	Mid-Range Fluctuations:
	•	Variations between guinea pig, ferret, and rabbit
	•	Reflects differences in hepatic flow/clearance ratios
	3.	Large Animal Plateau:
	•	Doses stabilize for larger animals (horse, cow)
	•	Due to similar hepatic flow/clearance ratios
	4.	Species-Specific Steps:
	•	Sharp changes between some species
	•	Reflects real physiological differences in hepatic processing

Practical Example

For a drug with high hepatic extraction:
	1.	Human dose: 1000 mg
	2.	Scaling to Mouse: The scaled dose will be higher than expected from simple allometry due to higher hepatic blood flow in mice.
	3.	Visualization: The curve shows why direct weight-based scaling would be inadequate.

Choosing the Right Method

	1.	Consider Drug Properties:
	•	CNS activity → Brain Weight Scaling
	•	High hepatic extraction → Hepatic Blood Flow Scaling
	•	Long-term study → Life-Span Scaling
	•	Unknown/simple kinetics → Allometric Scaling
	2.	Available Data:
	•	Limited data → Allometric Scaling
	•	Full physiological data → Hepatic Blood Flow Scaling
	3.	Study Purpose:
	•	Initial estimation → Allometric Scaling
	•	Detailed study design → Match method to drug properties
	•	Safety assessment → Consider multiple methods

Best Practices

	1.	Always Start Conservatively:
	•	Begin with lower doses
	•	Use multiple scaling methods for comparison
	•	Consider safety margins
	2.	Document Your Choice:
	•	Record the scaling method used
	•	Note any adjustments made
	•	Keep track of assumptions
	3.	Validate Results:
	•	Compare with literature data when available
	•	Consider species-specific factors
	•	Monitor for unexpected variations

Advanced Tips

	1.	Combining Methods:
	•	Consider averaging results from multiple methods
	•	Weight methods based on drug properties
	•	Document your reasoning
	2.	Adjusting for Special Cases:
	•	Protein binding differences
	•	Route of administration
	•	Species-specific sensitivities
	3.	Using the Interface:
	•	Try different methods for comparison
	•	Use the logarithmic visualization
	•	Export results for documentation

Remember

	•	These are estimation tools, not absolute rules
	•	Professional judgment is essential
	•	Consider all available data
	•	Use for research/educational purposes only
	•	Consult regulatory guidelines for clinical applications

If you have any further questions or need assistance, feel free to reach out via the contact information provided.

Thank you for using DoseFinder!

Shortcuts to Features

	•	Ctrl + H: Open Help/Documentation Tab
	•	Ctrl + D: Toggle Dark Mode
	•	Ctrl + U: Switch Unit System
	•	Ctrl + R: Reset All Inputs

Feedback

Your feedback is valuable for improving this tool. Please send any comments, suggestions, or reports of issues to:

Email: sergey.kornilov@biostochastics.com

Contact Information

For questions, feedback, or support, please contact:

BioStochastics
Email: sergey.kornilov@biostochastics.com

Disclaimer: This guide is intended to supplement the help documentation within the app and provide a deeper understanding of the scaling methods and best practices for dose extrapolation across species.

Short Guide to Key Features

	•	Dark Mode: Toggle between light and dark themes for optimal viewing.
	•	Unit System Selector: Switch between metric (kg) and imperial (lbs) units.
	•	Instructions Panel: Access step-by-step guidance within the app.
	•	Interactive Charts: Visualize how the calculated dose changes with body weight across different species.
	•	Responsive Design: Use the app seamlessly on various devices, including desktops, tablets, and smartphones.

Tips for Effective Use

	•	Validate Inputs: Ensure all entered data is accurate and appropriate for the chosen scaling method.
	•	Understand the Methods: Familiarize yourself with the scaling methods to select the most suitable one for your application.
	•	Use Advanced Parameters Judiciously: Input advanced parameters when necessary and ensure you have reliable data.
	•	Consult the Help Tab: When in doubt, refer to the help/documentation tab for detailed explanations.
	•	Document Your Calculations: Keep records of the parameters and methods used for future reference and validation.

Feel free to adjust and expand this guide as needed to suit your specific requirements and updates to the application.