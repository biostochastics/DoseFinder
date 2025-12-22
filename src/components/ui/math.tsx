"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface MathProps {
  /** LaTeX math expression */
  children: string;
  /** Display mode: inline or block */
  display?: "inline" | "block";
  /** Additional CSS class */
  className?: string;
  /** Accessible text description of the formula for screen readers */
  altText?: string;
}

/**
 * Math component for rendering LaTeX mathematical expressions.
 * Uses KaTeX for fast, high-quality math typesetting.
 *
 * @example
 * // Inline math
 * <Math altText="x squared plus y squared equals z squared">x^2 + y^2 = z^2</Math>
 *
 * // Block math (centered, larger)
 * <Math display="block" altText="a divided by b equals c">\frac{a}{b} = c</Math>
 */
export function Math({
  children,
  display = "inline",
  className = "",
  altText,
}: MathProps) {
  const Component = display === "block" ? BlockMath : InlineMath;

  // When altText is provided, hide visual math and use aria-label
  // Otherwise, leave the KaTeX content exposed to screen readers
  if (altText) {
    return (
      <span className={className} role="math" aria-label={altText}>
        <span aria-hidden="true">
          <Component math={children} />
        </span>
      </span>
    );
  }

  return (
    <span className={className}>
      <Component math={children} />
    </span>
  );
}

/**
 * Formula component - styled block math with background
 * Used for prominent formula displays in documentation
 */
interface FormulaProps {
  /** LaTeX math expression */
  children: string;
  /** Additional CSS class */
  className?: string;
  /** Accessible text description of the formula for screen readers */
  altText?: string;
}

export function Formula({ children, className = "", altText }: FormulaProps) {
  const baseClassName = `p-3 bg-muted/60 dark:bg-muted/30 rounded-md overflow-x-auto ${className}`;

  // When altText is provided, hide visual math and use aria-label
  // Otherwise, leave the KaTeX content exposed to screen readers
  if (altText) {
    return (
      <div className={baseClassName} role="math" aria-label={altText}>
        <span aria-hidden="true">
          <BlockMath math={children} />
        </span>
      </div>
    );
  }

  return (
    <div className={baseClassName}>
      <BlockMath math={children} />
    </div>
  );
}

export default Math;
