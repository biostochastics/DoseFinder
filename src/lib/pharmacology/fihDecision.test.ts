import { describe, it, expect } from "vitest";
import { buildStartingDoseDecision, type DoseCandidate } from "./fihDecision";

const cand = (
  id: string,
  valueMgKg: number,
  over: Partial<DoseCandidate> = {},
): DoseCandidate => ({
  id,
  method: "NOAEL-HED-MRSD",
  label: id,
  valueMgKg,
  relevance: "relevant",
  ...over,
});

describe("buildStartingDoseDecision", () => {
  it("defaults to the LOWEST included candidate (EMA §7.2) without requiring justification", () => {
    const d = buildStartingDoseDecision([
      cand("rat", 1.6),
      cand("dog", 0.54),
      cand("monkey", 0.65),
    ]);
    expect(d.recommended?.id).toBe("dog");
    expect(d.lowestIncluded?.id).toBe("dog");
    expect(d.requiresJustification).toBe(false);
    expect(d.rationale).toMatch(/lowest/i);
  });

  it("flags requiresJustification when a non-lowest candidate is recommended", () => {
    const d = buildStartingDoseDecision([cand("rat", 1.6), cand("dog", 0.54)], {
      recommendedId: "rat",
    });
    expect(d.recommended?.id).toBe("rat");
    expect(d.requiresJustification).toBe(true);
    // No justification provided → warning
    expect(
      d.warnings.some((w) => /REQUIRES a written justification/i.test(w)),
    ).toBe(true);
  });

  it("records the override justification when provided", () => {
    const d = buildStartingDoseDecision([cand("rat", 1.6), cand("dog", 0.54)], {
      recommendedId: "rat",
      overrideJustification:
        "Dog emesis is a species-specific artifact, not human-relevant toxicity.",
    });
    expect(d.requiresJustification).toBe(true);
    expect(d.overrideJustification).toMatch(/emesis/);
    expect(
      d.warnings.some((w) => /REQUIRES a written justification/i.test(w)),
    ).toBe(false);
  });

  it("excludes a candidate (with reason) and recommends the lowest of the rest", () => {
    const d = buildStartingDoseDecision([
      cand("dog", 0.54, {
        relevance: "excluded",
        relevanceJustification:
          "Dog target not expressed; not pharmacologically relevant.",
      }),
      cand("rat", 1.6),
      cand("monkey", 0.65),
    ]);
    expect(d.included.map((c) => c.id)).toEqual(["rat", "monkey"]);
    expect(d.recommended?.id).toBe("monkey"); // lowest of the included
    expect(d.warnings.some((w) => /Excluded: dog/i.test(w))).toBe(true);
  });

  it("returns no recommendation when every candidate is excluded or non-positive", () => {
    const d = buildStartingDoseDecision([
      cand("a", 0),
      cand("b", 1, { relevance: "excluded" }),
    ]);
    expect(d.recommended).toBeUndefined();
    expect(d.requiresJustification).toBe(false);
    expect(d.warnings.some((w) => /No candidate/i.test(w))).toBe(true);
  });

  it("warns on wide spread across included candidates", () => {
    const d = buildStartingDoseDecision([cand("low", 0.1), cand("high", 1.0)]);
    expect(d.warnings.some((w) => /fold spread/i.test(w))).toBe(true);
  });

  it("falls back to lowest when the requested recommendation is excluded", () => {
    const d = buildStartingDoseDecision(
      [cand("dog", 0.54, { relevance: "excluded" }), cand("rat", 1.6)],
      { recommendedId: "dog" },
    );
    expect(d.recommended?.id).toBe("rat");
    expect(d.warnings.some((w) => /falling back/i.test(w))).toBe(true);
  });

  it("preserves provenance tags on candidates", () => {
    const d = buildStartingDoseDecision([
      cand("rat", 1.6, {
        provenance: { noael: "measured", safetyFactor: "assumed" },
      }),
    ]);
    expect(d.recommended?.provenance?.noael).toBe("measured");
    expect(d.recommended?.provenance?.safetyFactor).toBe("assumed");
  });
});
