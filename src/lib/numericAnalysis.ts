import {
  formatNumber,
  makeEvaluator,
  math,
  nodeToExpression,
  normalizeExpression,
  parseExpression,
  sampleExpression
} from "./mathCore";

export interface PointResult {
  x: number;
  y: number;
  kind: "Nullstelle" | "Extrempunkt" | "Wendepunkt";
}

export interface IntervalResult {
  from: number | null;
  to: number | null;
  label: string;
}

export interface FunctionAnalysis {
  ok: true;
  expression: string;
  derivative: string;
  secondDerivative: string;
  roots: PointResult[];
  extrema: PointResult[];
  inflections: PointResult[];
  monotonicity: IntervalResult[];
  curvature: IntervalResult[];
  warning: string;
  plot: {
    f: ReturnType<typeof sampleExpression>;
    derivative: ReturnType<typeof sampleExpression>;
    secondDerivative: ReturnType<typeof sampleExpression>;
  };
}

export interface AnalysisFailure {
  ok: false;
  message: string;
  details?: string;
}

export function analyzeFunction(input: string, min = -6, max = 6): FunctionAnalysis | AnalysisFailure {
  try {
    const expression = normalizeExpression(input);
    const node = parseExpression(expression);
    const derivativeNode = math.simplify(math.derivative(node, "x"));
    const secondDerivativeNode = math.simplify(math.derivative(derivativeNode, "x"));
    const derivative = nodeToExpression(derivativeNode);
    const secondDerivative = nodeToExpression(secondDerivativeNode);

    const f = makeEvaluator(expression);
    const d1 = makeEvaluator(derivative);
    const d2 = makeEvaluator(secondDerivative);

    const roots = findSignChanges(f, min, max, 360).map((x) => pointAt(f, x, "Nullstelle"));
    const extrema = findSignChanges(d1, min, max, 360).map((x) => pointAt(f, x, "Extrempunkt"));
    const inflections = findSignChanges(d2, min, max, 360).map((x) => pointAt(f, x, "Wendepunkt"));

    return {
      ok: true,
      expression,
      derivative,
      secondDerivative,
      roots: uniquePoints(roots),
      extrema: uniquePoints(extrema),
      inflections: uniquePoints(inflections),
      monotonicity: buildIntervals(d1, min, max, extrema.map((point) => point.x), "monotonicity"),
      curvature: buildIntervals(d2, min, max, inflections.map((point) => point.x), "curvature"),
      warning:
        "Alle kritischen Punkte sind numerische Näherungen im gewählten Intervall. Bei Polstellen, sehr flachen Verläufen oder schnellen Oszillationen können Punkte fehlen.",
      plot: {
        f: sampleExpression(expression, min, max, 501),
        derivative: sampleExpression(derivative, min, max, 501),
        secondDerivative: sampleExpression(secondDerivative, min, max, 501)
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: "Die Funktion konnte nicht zuverlässig analysiert werden.",
      details: error instanceof Error ? error.message : undefined
    };
  }
}

function findSignChanges(evaluator: (x: number) => number | null, min: number, max: number, steps: number): number[] {
  const points: number[] = [];
  const step = (max - min) / steps;
  let previousX = min;
  let previousY = evaluator(previousX);

  for (let index = 1; index <= steps; index += 1) {
    const x = min + index * step;
    const y = evaluator(x);

    if (y !== null && Math.abs(y) < 1e-7) points.push(x);
    if (previousY !== null && y !== null && previousY * y < 0) {
      const root = bisect(evaluator, previousX, x);
      if (root !== null) points.push(root);
    }

    previousX = x;
    previousY = y;
  }

  return points;
}

function bisect(evaluator: (x: number) => number | null, left: number, right: number): number | null {
  let a = left;
  let b = right;
  let fa = evaluator(a);
  let fb = evaluator(b);
  if (fa === null || fb === null) return null;

  for (let index = 0; index < 60; index += 1) {
    const mid = (a + b) / 2;
    const fm = evaluator(mid);
    if (fm === null) return null;
    if (Math.abs(fm) < 1e-10) return mid;
    if (fa * fm <= 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
    const _ = fb;
  }

  return (a + b) / 2;
}

function pointAt(evaluator: (x: number) => number | null, x: number, kind: PointResult["kind"]): PointResult {
  return { x, y: evaluator(x) ?? 0, kind };
}

function uniquePoints(points: PointResult[]): PointResult[] {
  return points
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    .sort((a, b) => a.x - b.x)
    .filter((point, index, arr) => index === 0 || Math.abs(point.x - arr[index - 1].x) > 1e-3)
    .slice(0, 12);
}

function buildIntervals(
  evaluator: (x: number) => number | null,
  min: number,
  max: number,
  breakpoints: number[],
  mode: "monotonicity" | "curvature"
): IntervalResult[] {
  const sorted = [min, ...breakpoints.filter((x) => x > min && x < max).sort((a, b) => a - b), max];
  const intervals: IntervalResult[] = [];

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const from = sorted[index];
    const to = sorted[index + 1];
    const mid = (from + to) / 2;
    const value = evaluator(mid);
    if (value === null) {
      intervals.push({ from, to, label: "nicht sicher bestimmbar" });
      continue;
    }
    const label =
      mode === "monotonicity"
        ? value >= 0
          ? "steigend"
          : "fallend"
        : value >= 0
          ? "linksgekrümmt / konvex"
          : "rechtsgekrümmt / konkav";
    intervals.push({ from, to, label });
  }

  return intervals;
}

export function describePoint(point: PointResult): string {
  return `${point.kind}: x ≈ ${formatNumber(point.x)}, f(x) ≈ ${formatNumber(point.y)}`;
}
