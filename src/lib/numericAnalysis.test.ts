import { describe, expect, it } from "vitest";
import { analyzeFunction } from "./numericAnalysis";

describe("analyzeFunction", () => {
  it("finds roots, extrema and inflection points for a cubic", () => {
    const result = analyzeFunction("x^3 - 3*x", -3, 3);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.roots.some((point) => Math.abs(point.x) < 1e-3)).toBe(true);
    expect(result.roots.some((point) => Math.abs(point.x - Math.sqrt(3)) < 1e-3)).toBe(true);
    expect(result.extrema.some((point) => Math.abs(point.x - 1) < 1e-3)).toBe(true);
    expect(result.extrema.some((point) => Math.abs(point.x + 1) < 1e-3)).toBe(true);
    expect(result.inflections.some((point) => Math.abs(point.x) < 1e-3)).toBe(true);
  });
});
