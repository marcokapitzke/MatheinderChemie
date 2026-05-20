import { describe, expect, it } from "vitest";
import { computeDerivative } from "./calculus";
import { computeComplex, type ComplexOperation, type ComplexValue } from "./complexNumbers";
import { computeIntegral } from "./integrals";
import { makeEvaluator } from "./mathCore";
import { analyzeFunction } from "./numericAnalysis";
import { computeLimit, computeSequence, computeSeries } from "./sequences";

const CASES_PER_CALCULATOR = 999;
const DERIVATIVE_POINTS = [-1.6, -0.9, -0.35, 0.45, 0.95, 1.45];
const INTEGRAL_POINTS = [-1.35, -0.55, 0.35, 0.9, 1.65];

describe("999-case calculator stress suite", () => {
  it("checks 999 structurally varied derivative examples against finite differences", async () => {
    let checked = 0;

    for (let index = 0; index < CASES_PER_CALCULATOR; index += 1) {
      const expression = derivativeExpression(index);
      const result = computeDerivative(expression, 1);
      expect(result.ok, expression).toBe(true);
      if (!result.ok) continue;

      const derivative = makeEvaluator(result.derivative);
      const agreements = DERIVATIVE_POINTS.filter((x) => agreesWithFiniteDifference(expression, derivative, x)).length;
      expect(agreements, expression).toBeGreaterThanOrEqual(2);
      checked += 1;
      if (index % 40 === 39) await yieldToVitest();
    }

    expect(checked).toBe(CASES_PER_CALCULATOR);
  }, 120000);

  it("checks 999 standard integral examples by differentiating the returned antiderivative", () => {
    let checked = 0;

    for (let index = 0; index < CASES_PER_CALCULATOR; index += 1) {
      const expression = integralExpression(index);
      const result = computeIntegral(expression);
      expect(result.ok, expression).toBe(true);
      if (!result.ok) continue;

      const integrand = makeEvaluator(result.input);
      const agreements = INTEGRAL_POINTS.filter((x) => {
        const expected = integrand(x);
        const actual = numericDerivative(result.antiderivativeExpression, x);
        return closeEnough(actual, expected, 5e-3, 2e-3);
      }).length;
      expect(agreements, `${expression} -> ${result.antiderivativeExpression}`).toBeGreaterThanOrEqual(2);
      checked += 1;
    }

    expect(checked).toBe(CASES_PER_CALCULATOR);
  }, 45000);

  it("checks 999 complex-number operations against direct arithmetic", () => {
    let checked = 0;

    for (let index = 0; index < CASES_PER_CALCULATOR; index += 1) {
      const operation = complexOperation(index);
      const left = complexInput(index, "left");
      let right = complexInput(index + 17, "right");
      let rightOffset = 19;
      while (operation === "divide" && Math.hypot(right.value.re, right.value.im) < 1e-10) {
        right = complexInput(index + rightOffset, "right");
        rightOffset += 1;
      }
      const power = 2 + (index % 4);
      const result = computeComplex(left.input, right.input, operation, power);
      expect(result.ok, `${left.input} ${operation} ${right.input}`).toBe(true);
      if (!result.ok) continue;

      const expected = expectedComplex(left.value, right.value, operation, power);
      expect(closeEnough(result.result.re, expected.re, 1e-8, 1e-8), left.input).toBe(true);
      expect(closeEnough(result.result.im, expected.im, 1e-8, 1e-8), left.input).toBe(true);
      expect(closeEnough(result.forms.modulus, Math.hypot(expected.re, expected.im), 1e-8, 1e-8), left.input).toBe(true);
      checked += 1;
    }

    expect(checked).toBe(CASES_PER_CALCULATOR);
  }, 15000);

  it("checks 999 plotter and curve-discussion examples for stable numerical analysis", async () => {
    let checked = 0;

    for (let index = 0; index < CASES_PER_CALCULATOR; index += 1) {
      const testCase = plotterExpression(index);
      const result = analyzeFunction(testCase.expression, -5, 5);
      expect(result.ok, testCase.expression).toBe(true);
      if (!result.ok) continue;

      const finiteSamples = result.plot.f.ys.filter((value) => typeof value === "number" && Number.isFinite(value)).length;
      expect(finiteSamples, testCase.expression).toBeGreaterThan(350);

      if (testCase.roots?.length) {
        for (const root of testCase.roots) {
          expect(result.roots.some((point) => Math.abs(point.x - root) < 0.08), testCase.expression).toBe(true);
        }
      }
      if (testCase.extrema?.length) {
        for (const extremum of testCase.extrema) {
          expect(result.extrema.some((point) => Math.abs(point.x - extremum) < 0.1), testCase.expression).toBe(true);
        }
      }

      checked += 1;
      if (index % 30 === 29) await yieldToVitest();
    }

    expect(checked).toBe(CASES_PER_CALCULATOR);
  }, 120000);

  it("checks 999 limit, sequence and series examples across standard families", () => {
    let checked = 0;

    for (let index = 0; index < CASES_PER_CALCULATOR; index += 1) {
      const type = index % 9;

      if (type <= 3) {
        const item = limitExpression(index);
        const result = computeLimit(item.expression, item.point);
        expect(result.ok, `${item.expression} at ${item.point}`).toBe(true);
        if (!result.ok) continue;
        if (item.expected !== undefined) {
          const numericResult = Number(result.result.replace("≈", "").trim());
          expect(closeEnough(numericResult, item.expected, 7e-3, 5e-3), item.expression).toBe(true);
        }
      } else if (type <= 6) {
        const expression = sequenceExpression(index);
        const result = computeSequence(expression, 64);
        expect(result.ok, expression).toBe(true);
        if (!result.ok) continue;
        expect(result.values.length, expression).toBeGreaterThan(20);
      } else {
        const expression = seriesExpression(index);
        const result = computeSeries(expression, 96);
        expect(result.ok, expression).toBe(true);
        if (!result.ok) continue;
        expect(result.partialSums.length, expression).toBeGreaterThan(20);
      }

      checked += 1;
    }

    expect(checked).toBe(CASES_PER_CALCULATOR);
  }, 30000);
});

function yieldToVitest() {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
}

function derivativeExpression(index: number) {
  const a = nonZero(index, 1) / 4;
  const b = nonZero(index, 3) / 5;
  const c = integer(index, 5, 6) / 3;
  const p = 1 + (index % 4);

  switch (index % 12) {
    case 0:
      return `${a}*x^${p + 1} + ${b}*x - ${c}`;
    case 1:
      return `${a}*exp(${b}*x+${c})*x^${p}`;
    case 2:
      return `exp(${a}*x^${p})/(sin(x)+2.4)`;
    case 3:
      return `Exp(${a}*x^${p})/(cot(x)+3.2)`;
    case 4:
      return `log(sin(x)+2.2)*x^${p}`;
    case 5:
      return `(${a}*x^2+${b}*x+${c})/(x^2+${p + 2})`;
    case 6:
      return `sin(${a}*x+${b})*cos(${c}*x)`;
    case 7:
      return `tan(${a / 2}*x)/(x^2+${p + 1})`;
    case 8:
      return `sec(${a / 2}*x)/(1+x^2)`;
    case 9:
      return `csc(${a / 2}*x+1.7)/(x^2+2)`;
    case 10:
      return `sqrt(x^2+${p + 1})*exp(${a}*x)`;
    default:
      return `log(x^2+${p + 2})/(cos(${a}*x)+2)`;
  }
}

function integralExpression(index: number) {
  const a = nonZero(index, 2) / 3;
  const b = nonZero(index, 4) / 4;
  const c = integer(index, 7, 5) / 3;
  const p = index % 7;
  const trigPower = 1 + (index % 4);
  const inner = `${b}*x+${c + 1.2}`;

  switch (index % 13) {
    case 0:
      return `${a}*x^${p} + ${b}*x + ${c}`;
    case 1:
      return `${a}*exp(${b}*x+${c})`;
    case 2:
      return `${a}*x^${p}*exp(${b}*x+${c})`;
    case 3:
      return `${a}*x^${trigPower}*sin(${b}*x+${c})`;
    case 4:
      return `${a}*x^${trigPower}*cos(${b}*x+${c})`;
    case 5:
      return `${a}/(${b}*x+${c + 4})`;
    case 6:
      return `(${a}*x+${b})/(${nonZero(index, 9) / 5}*x+${c + 5})`;
    case 7:
      return `${a}*tan(${inner})`;
    case 8:
      return `${a}*cot(${inner})`;
    case 9:
      return `${a}*sec(${inner})^2`;
    case 10:
      return `${a}*csc(${inner})^2`;
    case 11:
      return `${a}*sec(${inner})*tan(${inner})`;
    default:
      return `${a}*csc(${inner})*cot(${inner})`;
  }
}

function complexInput(index: number, side: "left" | "right") {
  const re = integer(index, side === "left" ? 2 : 5, 6) / 2;
  const im = integer(index, side === "left" ? 7 : 11, 6) / 2;
  const radius = Number(formatPlain(0.5 + ((index % 9) + 1) / 3));
  const denominator = 3 + (index % 7);
  const sign = im >= 0 ? "+" : "-";

  if (index % 3 === 0) {
    return {
      input: `${formatPlain(re)} ${sign} ${formatPlain(Math.abs(im))}i`,
      value: { re, im }
    };
  }

  const phi = Math.PI / denominator;
  const value = { re: radius * Math.cos(phi), im: radius * Math.sin(phi) };
  return {
    input: `${formatPlain(radius)}*exp(i*pi/${denominator})`,
    value
  };
}

function complexOperation(index: number): ComplexOperation {
  return (["add", "subtract", "multiply", "divide", "power"] as ComplexOperation[])[index % 5];
}

function expectedComplex(a: ComplexValue, b: ComplexValue, operation: ComplexOperation, power: number): ComplexValue {
  switch (operation) {
    case "add":
      return { re: a.re + b.re, im: a.im + b.im };
    case "subtract":
      return { re: a.re - b.re, im: a.im - b.im };
    case "multiply":
      return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
    case "divide": {
      const denominator = b.re ** 2 + b.im ** 2;
      return { re: (a.re * b.re + a.im * b.im) / denominator, im: (a.im * b.re - a.re * b.im) / denominator };
    }
    case "power": {
      const radius = Math.hypot(a.re, a.im) ** power;
      const angle = Math.atan2(a.im, a.re) * power;
      return { re: radius * Math.cos(angle), im: radius * Math.sin(angle) };
    }
  }
}

function plotterExpression(index: number): { expression: string; roots?: number[]; extrema?: number[] } {
  const a = index % 2 === 0 ? 1 : -1;
  const r1 = -3 + (index % 5);
  const r2 = r1 + 1.5;
  const c = 1 + (index % 2);

  switch (index % 6) {
    case 0:
      return { expression: `${a}*(x-${r1})*(x-${r2})`, roots: [r1, r2], extrema: [(r1 + r2) / 2] };
    case 1:
      return { expression: `(x-${r1})*(x-${r1 + 1})*(x-${r1 + 2})`, roots: [r1, r1 + 1, r1 + 2] };
    case 2:
      return { expression: `x^3 - ${3 * c * c}*x`, roots: [-c * Math.sqrt(3), 0, c * Math.sqrt(3)], extrema: [-c, c] };
    case 3:
      return { expression: `sin(${c}*x)`, roots: [0] };
    case 4:
      return { expression: `x*exp(-${0.2 + c / 10}*x)` };
    default:
      return { expression: `(x^2-${c})/(x^2+${c + 1})`, roots: [-Math.sqrt(c), Math.sqrt(c)] };
  }
}

function limitExpression(index: number): { expression: string; point: string; expected?: number } {
  const a = 1 + (index % 5);
  switch (index % 4) {
    case 0:
      return { expression: `${a}*x^2 + ${a - 2}*x + 1`, point: "2", expected: 4 * a + 2 * (a - 2) + 1 };
    case 1:
      return { expression: `sin(${a}*x)/(${a}*x)`, point: "0", expected: 1 };
    case 2:
      return { expression: `(exp(${a}*x)-1)/x`, point: "0", expected: a };
    default:
      return { expression: `log(1+${a}*x)/x`, point: "0", expected: a };
  }
}

function sequenceExpression(index: number) {
  const a = 1 + (index % 5);
  switch (index % 3) {
    case 0:
      return `1/n^${1 + (index % 4)}`;
    case 1:
      return `(1+${a}/n)^n`;
    default:
      return `n/(n+${a})`;
  }
}

function seriesExpression(index: number) {
  const p = 1 + (index % 4);
  const q = [0.25, 0.4, 0.5, -0.35][index % 4];
  switch (index % 3) {
    case 0:
      return `1/n^${p}`;
    case 1:
      return `(-1)^(n+1)/n`;
    default:
      return `${q}^n`;
  }
}

function agreesWithFiniteDifference(expression: string, derivative: (x: number) => number | null, x: number) {
  const expected = numericDerivative(expression, x);
  const actual = derivative(x);
  return closeEnough(actual, expected, 4e-3, 3e-3);
}

function numericDerivative(expression: string, x: number): number | null {
  const evaluator = makeEvaluator(expression);
  const h = 1e-5 * Math.max(1, Math.abs(x));
  const left = evaluator(x - h);
  const right = evaluator(x + h);
  if (left === null || right === null) return null;
  const value = (right - left) / (2 * h);
  return Number.isFinite(value) && Math.abs(value) < 1e8 ? value : null;
}

function closeEnough(actual: number | null, expected: number | null | undefined, relativeTolerance: number, absoluteTolerance: number) {
  if (actual === null || expected === null || expected === undefined) return false;
  if (!Number.isFinite(actual) || !Number.isFinite(expected)) return false;
  const tolerance = Math.max(absoluteTolerance, relativeTolerance * Math.max(1, Math.abs(expected)));
  return Math.abs(actual - expected) <= tolerance;
}

function nonZero(index: number, salt: number) {
  const value = integer(index, salt, 6);
  return value === 0 ? salt % 2 === 0 ? 2 : -2 : value;
}

function integer(index: number, salt: number, span: number) {
  return ((index * (salt + 3) + salt * 11) % (2 * span + 1)) - span;
}

function formatPlain(value: number) {
  return Number(value.toFixed(6)).toString();
}
