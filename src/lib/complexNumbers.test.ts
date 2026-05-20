import { describe, expect, it } from "vitest";
import { computeComplex, formatComplex, parseComplexInput, toFormsWithNotation } from "./complexNumbers";

describe("complex numbers", () => {
  it("parses cartesian form", () => {
    expect(parseComplexInput("2 - 3i")).toEqual({ re: 2, im: -3 });
  });

  it("parses exponential form", () => {
    const value = parseComplexInput("2*exp(i*pi/2)");
    expect(value).not.toBeNull();
    expect(value!.re).toBeCloseTo(0, 8);
    expect(value!.im).toBeCloseTo(2, 8);
  });

  it("multiplies by adding arguments", () => {
    const result = computeComplex("2*exp(i*pi/6)", "3*exp(i*pi/3)", "multiply");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.forms.modulus).toBeCloseTo(6, 8);
    expect(result.forms.argument).toBeCloseTo(Math.PI / 2, 8);
  });

  it("formats pure imaginary results without a zero real part", () => {
    expect(formatComplex({ re: 0, im: 6 })).toBe("6i");
    expect(toFormsWithNotation({ re: 0, im: 6 }, "exp").cartesianTex).toBe("6\\,\\mathrm{i}");
  });
});
