import { describe, expect, it } from "vitest";
import { computeLimit, computeSequence, computeSeries } from "./sequences";

describe("limits, sequences and series", () => {
  it("handles a simple l'Hospital limit", () => {
    const result = computeLimit("sin(x)/x", "0");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result).toBe("1");
    expect(result.detailedSteps.some((step) => step.title.includes("L'Hospital"))).toBe(true);
  });

  it("estimates a classical sequence", () => {
    const result = computeSequence("(1+1/n)^n", 80);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.estimate).toContain("≈");
  });

  it("classifies the harmonic series", () => {
    const result = computeSeries("1/n", 30);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.classification).toContain("divergent");
  });
});
