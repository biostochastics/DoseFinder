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

  return (
    <span className={className} role="math" aria-label={altText}>
      <span aria-hidden="true">
        <Component math={children} />
      </span>
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
  return (
    <div
      className={`p-3 bg-muted/60 dark:bg-muted/30 rounded-md overflow-x-auto ${className}`}
      role="math"
      aria-label={altText}
    >
      <span aria-hidden="true">
        <BlockMath math={children} />
      </span>
    </div>
  );
}

export default Math;
