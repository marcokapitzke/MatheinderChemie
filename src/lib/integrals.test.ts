import { describe, expect, it } from "vitest";
import { computeIntegral, computeNumericDefiniteIntegral } from "./integrals";
import { makeEvaluator, math } from "./mathCore";

function derivativeMatches(antiderivative: string, integrand: string, x: number) {
  const clean = antiderivative.replace(" + C", "");
  const derived = math.derivative(math.parse(clean), "x").toString();
  const left = makeEvaluator(derived)(x);
  const right = makeEvaluator(integrand)(x);
  expect(left).not.toBeNull();
  expect(right).not.toBeNull();
  expect(left!).toBeCloseTo(right!, 7);
}

describe("computeIntegral", () => {
  it("integrates a polynomial termwise", () => {
    const result = computeIntegral("3*x^2 - 2*x + 1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    derivativeMatches(result.antiderivative, "3*x^2 - 2*x + 1", 1.3);
  });

  it("integrates exponential decay with linear substitution", () => {
    const result = computeIntegral("exp(-0.4*x)");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe("Lineare Substitution");
    derivativeMatches(result.antiderivative, "exp(-0.4*x)", 2);
  });

  it("integrates polynomial times exponential standard forms", () => {
    const result = computeIntegral("3exp(-0.4*x)*x^2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.method).toBe("Wiederholte partielle Integration");
    derivativeMatches(result.antiderivative, "3*exp(-0.4*x)*x^2", 1.2);
  });

  it("integrates higher polynomial powers times exponential decay", () => {
    const result = computeIntegral("exp(-0.4*x)*x^3");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.detailedSteps.length).toBeGreaterThan(2);
    derivativeMatches(result.antiderivative, "exp(-0.4*x)*x^3", 1.7);
  });

  it("integrates polynomial sums times exponential decay", () => {
    const result = computeIntegral("(x^2 + 2*x + 1)*exp(-0.4*x)");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    derivativeMatches(result.antiderivative, "(x^2 + 2*x + 1)*exp(-0.4*x)", 0.8);
  });

  it("does not force unsupported integrals", () => {
    const result = computeIntegral("sin(x^2)");
    expect(result.ok).toBe(false);
  });

  it("computes stable numeric definite integrals without symbolic antiderivative", () => {
    const symbolic = computeIntegral("exp(-x^2)");
    expect(symbolic.ok).toBe(false);

    const result = computeNumericDefiniteIntegral("exp(-x^2)", 0, 1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBeCloseTo(0.746824, 5);
    expect(result.errorEstimate).toBeLessThan(1e-4);
  });
});
