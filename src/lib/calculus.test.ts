import { describe, expect, it } from "vitest";
import { computeDerivative } from "./calculus";
import { expressionToTex, makeEvaluator } from "./mathCore";

describe("computeDerivative", () => {
  it("differentiates a polynomial standard case", () => {
    const result = computeDerivative("x^3 - 3*x^2 + 2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const derivative = makeEvaluator(result.derivative);
    expect(derivative(2)).toBeCloseTo(0, 8);
    expect(derivative(4)).toBeCloseTo(24, 8);
  });

  it("recognizes product and chain rules for a decay expression", () => {
    const result = computeDerivative("x*exp(-0.5*x)");
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.rules).toContain("Produktregel");
    expect(result.rules).toContain("Kettenregel");
    expect(result.detailedSteps.some((step) => step.title === "Produktregel")).toBe(true);
    expect(result.detailedSteps.some((step) => step.title === "Kettenregel")).toBe(true);
    const derivative = makeEvaluator(result.derivative);
    expect(derivative(2)).toBeCloseTo(0, 8);
  });

  it("renders exponential notation in book style", () => {
    expect(expressionToTex("x*exp(-0.4*x)")).toContain("\\operatorname{exp}");
    expect(expressionToTex("e^x")).toContain("\\operatorname{exp}");
    expect(expressionToTex("exp(x)", { exponential: "euler" })).toContain("\\mathrm{e}");
    expect(expressionToTex("exp(x * -1 / 2) * (x / 4 - 1)")).toContain("\\operatorname{exp}");
  });
});
