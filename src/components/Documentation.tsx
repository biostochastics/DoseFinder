import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Documentation() {
  return React.createElement(
    'div',
    { className: "h-[calc(100vh-200px)] w-full overflow-y-auto" },
    React.createElement(
      'div',
      { className: "space-y-6 p-4" },
      React.createElement(
        'section',
        null,
        React.createElement(
          'h2',
          { className: "text-2xl font-bold mb-4" },
          'Understanding Dose Scaling Methods'
        ),
        React.createElement(
          'div',
          { className: "space-y-6" },
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                '1. Allometric Scaling (Default Method)'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'What is it?'
              ),
              React.createElement(
                'p',
                { className: "mb-4" },
                'The simplest and most widely used scaling method, based on the relationship between body mass and metabolic rate.'
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'When to use?'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  'Most common scaling situations'
                ),
                React.createElement(
                  'li',
                  null,
                  'When dealing with metabolically active compounds'
                ),
                React.createElement(
                  'li',
                  null,
                  'For initial dose estimations'
                )
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'Key Points'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6" },
                React.createElement(
                  'li',
                  null,
                  'Uses the 3/4 power law by default (exponent = 0.75)'
                ),
                React.createElement(
                  'li',
                  null,
                  'Can be adjusted based on molecular weight:',
                  React.createElement(
                    'ul',
                    { className: "list-disc pl-6 mt-2" },
                    React.createElement(
                      'li',
                      null,
                      'MW > 700 Da → exponent = 0.70'
                    ),
                    React.createElement(
                      'li',
                      null,
                      '400 < MW ≤ 700 Da → exponent = 0.75'
                    ),
                    React.createElement(
                      'li',
                      null,
                      'MW ≤ 400 Da → exponent = 0.80'
                    )
                  )
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                '2. Brain Weight Scaling'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'What is it?'
              ),
              React.createElement(
                'p',
                { className: "mb-4" },
                'Scaling based on brain weight differences between species, useful for certain types of drugs.'
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'When to use?'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  'CNS-active compounds'
                ),
                React.createElement(
                  'li',
                  null,
                  'Drugs that cross the blood-brain barrier'
                ),
                React.createElement(
                  'li',
                  null,
                  'Neurological treatments'
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                '3. Life-Span Scaling'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'What is it?'
              ),
              React.createElement(
                'p',
                { className: "mb-4" },
                'Scaling based on the maximum life span potential of different species.'
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'When to use?'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  'Long-term toxicity studies'
                ),
                React.createElement(
                  'li',
                  null,
                  'Chronic exposure assessments'
                ),
                React.createElement(
                  'li',
                  null,
                  'Age-related treatments'
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                '4. Hepatic Blood Flow Scaling'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'What is it?'
              ),
              React.createElement(
                'p',
                { className: "mb-4" },
                'Scaling based on species differences in hepatic blood flow and clearance.'
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'When to use?'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  'Drugs with high hepatic extraction'
                ),
                React.createElement(
                  'li',
                  null,
                  'Compounds primarily metabolized by the liver'
                ),
                React.createElement(
                  'li',
                  null,
                  'Flow-limited drugs'
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                '5. BSA-Based Scaling'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'What is it?'
              ),
              React.createElement(
                'p',
                { className: "mb-4" },
                'Scaling based on body surface area differences between species.'
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'When to use?'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  'Many anticancer drugs'
                ),
                React.createElement(
                  'li',
                  null,
                  'Initial human dose estimates'
                ),
                React.createElement(
                  'li',
                  null,
                  'When surface-dependent effects are important'
                )
              ),
              React.createElement(
                'h4',
                { className: "font-semibold mb-2" },
                'Key Points'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6" },
                React.createElement(
                  'li',
                  null,
                  'Uses built-in approximate BSA values for each species'
                ),
                React.createElement(
                  'li',
                  null,
                  'Direct ratio scaling of doses based on BSA'
                ),
                React.createElement(
                  'li',
                  null,
                  'Common in clinical settings'
                )
              )
            )
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement(
          'h2',
          { className: "text-2xl font-bold mb-4" },
          'Advanced Features'
        ),
        React.createElement(
          'div',
          { className: "space-y-6" },
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                'Kidney Function Adjustment'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'p',
                { className: "mb-4" },
                'Three modes available:'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6 mb-4" },
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'None:'
                  ),
                  ' No kidney function adjustment'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Manual:'
                  ),
                  ' Enter a percentage directly'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Cockcroft-Gault:'
                  ),
                  ' Calculates estimated GFR and applies stage-based reductions:',
                  React.createElement(
                    'ul',
                    { className: "list-disc pl-6 mt-2" },
                    React.createElement(
                      'li',
                      null,
                      'GFR ≥ 60 mL/min → 100% dose'
                    ),
                    React.createElement(
                      'li',
                      null,
                      '30 ≤ GFR < 60 mL/min → 75% dose'
                    ),
                    React.createElement(
                      'li',
                      null,
                      '15 ≤ GFR < 30 mL/min → 50% dose'
                    ),
                    React.createElement(
                      'li',
                      null,
                      'GFR < 15 mL/min → 25% dose'
                    )
                  )
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                'Bioavailability Options'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'p',
                { className: "mb-4" },
                'Choose from preset values or enter manually:'
              ),
              React.createElement(
                'ul',
                { className: "list-disc pl-6" },
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Manual:'
                  ),
                  ' Enter any percentage'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'IV:'
                  ),
                  ' 100% bioavailability'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Oral:'
                  ),
                  ' Assumes 50% bioavailability'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Other:'
                  ),
                  ' Assumes 75% bioavailability'
                )
              )
            )
          ),
          React.createElement(
            Card,
            null,
            React.createElement(
              CardHeader,
              null,
              React.createElement(
                CardTitle,
                null,
                'Additional Parameters'
              )
            ),
            React.createElement(
              CardContent,
              null,
              React.createElement(
                'ul',
                { className: "list-disc pl-6" },
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Volume of Distribution (Vd):'
                  ),
                  ' Affects dose based on drug distribution in body compartments'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Molecular Weight:'
                  ),
                  ' Can affect allometric scaling exponent selection'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'LogP:'
                  ),
                  ' Influences dose adjustments based on lipophilicity'
                ),
                React.createElement(
                  'li',
                  null,
                  React.createElement(
                    'strong',
                    null,
                    'Protein Binding:'
                  ),
                  ' Adjusts for differences in free drug fraction'
                )
              )
            )
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement(
          'h2',
          { className: "text-2xl font-bold mb-4" },
          'Best Practices'
        ),
        React.createElement(
          Card,
          null,
          React.createElement(
            CardContent,
            { className: "pt-6" },
            React.createElement(
              'div',
              { className: "space-y-6" },
              React.createElement(
                'div',
                null,
                React.createElement(
                  'h4',
                  { className: "font-semibold mb-2" },
                  '1. Always Start Conservative'
                ),
                React.createElement(
                  'ul',
                  { className: "list-disc pl-6" },
                  React.createElement(
                    'li',
                    null,
                    'Begin with lower doses'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Use multiple scaling methods for comparison'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Consider safety margins'
                  )
                )
              ),
              React.createElement(
                'div',
                null,
                React.createElement(
                  'h4',
                  { className: "font-semibold mb-2" },
                  '2. Document Your Choice'
                ),
                React.createElement(
                  'ul',
                  { className: "list-disc pl-6" },
                  React.createElement(
                    'li',
                    null,
                    'Record scaling method used'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Note any adjustments made'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Keep track of assumptions'
                  )
                )
              ),
              React.createElement(
                'div',
                null,
                React.createElement(
                  'h4',
                  { className: "font-semibold mb-2" },
                  '3. Validate Results'
                ),
                React.createElement(
                  'ul',
                  { className: "list-disc pl-6" },
                  React.createElement(
                    'li',
                    null,
                    'Compare with literature data when available'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Consider species-specific factors'
                  ),
                  React.createElement(
                    'li',
                    null,
                    'Monitor for unexpected variations'
                  )
                )
              )
            )
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement(
          'h2',
          { className: "text-2xl font-bold mb-4" },
          'Important Reminders'
        ),
        React.createElement(
          Card,
          null,
          React.createElement(
            CardContent,
            { className: "pt-6" },
            React.createElement(
              'ul',
              { className: "list-disc pl-6" },
              React.createElement(
                'li',
                null,
                'These are estimation tools, not absolute rules'
              ),
              React.createElement(
                'li',
                null,
                'Professional judgment is essential'
              ),
              React.createElement(
                'li',
                null,
                'Consider all available data'
              ),
              React.createElement(
                'li',
                null,
                'Use for research/educational purposes only'
              ),
              React.createElement(
                'li',
                null,
                'Consult regulatory guidelines for clinical applications'
              )
            )
          )
        )
      ),
      React.createElement(
        'section',
        null,
        React.createElement(
          'h2',
          { className: "text-2xl font-bold mb-4" },
          'References'
        ),
        React.createElement(
          Card,
          null,
          React.createElement(
            CardContent,
            { className: "pt-6" },
            React.createElement(
              'ul',
              { className: "space-y-4" },
              React.createElement(
                'li',
                null,
                React.createElement(
                  'p',
                  { className: "text-sm" },
                  'Boxenbaum, H. (1982). Interspecies scaling, allometry, physiological time, and the ground plan of pharmacokinetics. ',
                  React.createElement(
                    'em',
                    null,
                    'Journal of Pharmacokinetics and Biopharmaceutics'
                  ),
                  ', 10(2), 201-227.'
                )
              ),
              React.createElement(
                'li',
                null,
                React.createElement(
                  'p',
                  { className: "text-sm" },
                  'Mahmood, I., & Balian, J. D. (1996). Interspecies scaling: predicting clearance of drugs in humans. ',
                  React.createElement(
                    'em',
                    null,
                    'Toxicology and Applied Pharmacology'
                  ),
                  ', 140(2), 253-258.'
                )
              ),
              React.createElement(
                'li',
                null,
                React.createElement(
                  'p',
                  { className: "text-sm" },
                  'Sharma, V., & McNeill, J. H. (2009). To scale or not to scale: the principles of dose extrapolation. ',
                  React.createElement(
                    'em',
                    null,
                    'British Journal of Pharmacology'
                  ),
                  ', 157(6), 907-921.'
                )
              ),
              React.createElement(
                'li',
                null,
                React.createElement(
                  'p',
                  { className: "text-sm" },
                  'Tang, H., & Mayersohn, M. (2005). A comparison of allometric scaling methods for predicting human drug clearance and volume of distribution. ',
                  React.createElement(
                    'em',
                    null,
                    'Journal of Pharmaceutical Sciences'
                  ),
                  ', 94(6), 1237-1243.'
                )
              )
            )
          )
        )
      )
    )
  );
}
