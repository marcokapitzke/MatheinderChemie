import type { MathNode } from "mathjs";
import { expressionToTex, formatNumber, makeEvaluator, math, nodeToExpression, normalizeExpression, parseExpression, sampleExpression } from "./mathCore";
import type { MathFailure } from "./calculus";

interface IntegralSuccess {
  ok: true;
  input: string;
  antiderivative: string;
  antiderivativeExpression: string;
  antiderivativeTex: string;
  method: string;
  steps: string[];
  detailedSteps: SolutionStep[];
  plot: {
    f: ReturnType<typeof sampleExpression>;
    antiderivative: ReturnType<typeof sampleExpression>;
  };
}

export interface SolutionStep {
  title: string;
  text: string;
  tex?: string;
}

type IntegralTerm = {
  expression: string;
  method: string;
  steps: string[];
  detailedSteps?: SolutionStep[];
};

export type IntegralResult = IntegralSuccess | MathFailure;

export interface NumericDefiniteIntegralSuccess {
  ok: true;
  input: string;
  lower: number;
  upper: number;
  value: number;
  errorEstimate: number;
  method: string;
  steps: string[];
  detailedSteps: SolutionStep[];
  area: ReturnType<typeof sampleExpression>;
  window: ReturnType<typeof sampleExpression>;
}

export type NumericDefiniteIntegralResult = NumericDefiniteIntegralSuccess | MathFailure;

export function computeIntegral(input: string): IntegralResult {
  try {
    const normalized = normalizeExpression(input);
    const node = parseExpression(normalized);
    const result = integrateNode(node);

  if (!result) {
      return {
        ok: false,
        message: "Für dieses Integral ist noch kein Standardverfahren hinterlegt.",
        details: "Versuche eine Grundform wie ein Polynom, exp(ax+b), p(x) exp(ax+b), sin(ax+b), cos(ax+b) oder 1/(ax+b)."
      };
    }

    const antiderivative = `${result.expression} + C`;
    const antiderivativeForPlot = result.expression;

    return {
      ok: true,
      input: normalized,
      antiderivative,
      antiderivativeExpression: antiderivativeForPlot,
      antiderivativeTex: `${expressionToTex(result.expression)} + C`,
      method: result.method,
      steps: result.steps,
      detailedSteps: result.detailedSteps ?? [],
      plot: {
        f: sampleExpression(normalized, -6, 6, 401),
        antiderivative: sampleExpression(antiderivativeForPlot, -6, 6, 401)
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: "Diese Eingabe konnte nicht sicher als Integrand gelesen werden.",
      details: error instanceof Error ? error.message : undefined
    };
  }
}

export function computeNumericDefiniteIntegral(input: string, lower: number, upper: number): NumericDefiniteIntegralResult {
  try {
    const normalized = normalizeExpression(input);
    parseExpression(normalized);

    if (!Number.isFinite(lower) || !Number.isFinite(upper) || Math.abs(upper - lower) < 1e-12) {
      return { ok: false, message: "Bitte gib zwei verschiedene endliche Grenzen ein." };
    }

    const evaluator = makeEvaluator(normalized);
    const coarse = compositeSimpson(evaluator, lower, upper, 256);
    const fine = compositeSimpson(evaluator, lower, upper, 512);
    if (!coarse || !fine) {
      return {
        ok: false,
        message: "Das bestimmte Integral konnte numerisch nicht stabil ausgewertet werden.",
        details: "Prüfe, ob im Intervall Polstellen, Definitionslücken oder sehr große Funktionswerte liegen."
      };
    }

    const errorEstimate = Math.abs(fine.value - coarse.value) / 15;
    const tolerance = Math.max(2e-5, Math.abs(fine.value) * 2e-5);
    if (errorEstimate > tolerance) {
      return {
        ok: false,
        message: "Die numerische Auswertung ist in diesem Intervall nicht stabil genug.",
        details: `Geschätzter Fehler: ${formatNumber(errorEstimate, 4)}. Verkleinere das Intervall oder meide Polstellen.`
      };
    }

    const from = Math.min(lower, upper);
    const to = Math.max(lower, upper);
    const padding = Math.max((to - from) * 0.18, 0.75);

    return {
      ok: true,
      input: normalized,
      lower,
      upper,
      value: fine.value,
      errorEstimate,
      method: "Numerisches bestimmtes Integral mit Stabilitätscheck",
      steps: [
        "Der Integrand wird auf einem feinen Gitter im Browser ausgewertet.",
        "Die orientierte Fläche wird mit zusammengesetzter Simpson-Regel berechnet.",
        "Zwei Gitterauflösungen werden verglichen; nur stabile Ergebnisse werden angezeigt."
      ],
      detailedSteps: [
        {
          title: "Bestimmtes Integral",
          text: "Gesucht ist die orientierte Fläche zwischen den beiden Grenzen.",
          tex: `\\int_{${formatNumber(lower)}}^{${formatNumber(upper)}} ${expressionToTex(normalized)}\\,\\mathrm{d}x`
        },
        {
          title: "Simpson-Regel",
          text: "Das Intervall wird in gleich breite Teilintervalle zerlegt. Funktionswerte an Stützstellen approximieren die Fläche.",
          tex: "\\int_a^b f(x)\\,\\mathrm{d}x\\approx \\frac{h}{3}\\left(f(x_0)+4f(x_1)+2f(x_2)+\\cdots+f(x_n)\\right)"
        },
        {
          title: "Stabilitätscheck",
          text: "Die Rechnung wird mit zwei Auflösungen durchgeführt. Die Differenz dient als Fehlerindikator.",
          tex: `|I_{512}-I_{256}|/15\\approx ${formatNumber(errorEstimate, 4)}`
        }
      ],
      area: sampleExpression(normalized, from, to, 300),
      window: sampleExpression(normalized, from - padding, to + padding, 420)
    };
  } catch (error) {
    return {
      ok: false,
      message: "Dieses bestimmte Integral konnte nicht gelesen werden.",
      details: error instanceof Error ? error.message : undefined
    };
  }
}

function compositeSimpson(
  evaluator: (x: number) => number | null,
  lower: number,
  upper: number,
  intervals: number
): { value: number } | null {
  const n = intervals % 2 === 0 ? intervals : intervals + 1;
  const h = (upper - lower) / n;
  let sum = 0;

  for (let index = 0; index <= n; index += 1) {
    const x = lower + index * h;
    const value = evaluator(x);
    if (value === null || !Number.isFinite(value) || Math.abs(value) > 1e10) return null;
    const weight = index === 0 || index === n ? 1 : index % 2 === 0 ? 2 : 4;
    sum += weight * value;
  }

  const result = (h / 3) * sum;
  return Number.isFinite(result) ? { value: result } : null;
}

function integrateNode(node: MathNode): IntegralTerm | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[] };

  if (raw.type === "OperatorNode" && (raw.op === "+" || raw.op === "-") && raw.args?.length === 2) {
    const left = integrateNode(raw.args[0]);
    const right = integrateNode(raw.args[1]);
    if (!left || !right) return null;
    const sign = raw.op === "+" ? "+" : "-";
    return {
      expression: `(${left.expression}) ${sign} (${right.expression})`,
      method: "Linearität des Integrals",
      steps: [
        "Summe beziehungsweise Differenz wird termweise integriert.",
        ...left.steps,
        ...right.steps
      ],
      detailedSteps: [
        {
          title: "Linearität",
          text: "Ein Integral über eine Summe oder Differenz wird termweise behandelt.",
          tex: "\\int (g(x) \\pm h(x))\\,\\mathrm{d}x=\\int g(x)\\,\\mathrm{d}x\\pm\\int h(x)\\,\\mathrm{d}x"
        },
        ...(left.detailedSteps ?? []),
        ...(right.detailedSteps ?? [])
      ]
    };
  }

  const productPattern = integrateProductPattern(node);
  if (productPattern) return productPattern;

  const { coefficient, core } = splitCoefficient(node);
  const coreResult = integrateCore(core, coefficient);
  if (!coreResult) return null;

  if (Math.abs(coefficient - 1) < 1e-12) return coreResult;
  return {
    expression: `${formatNumber(coefficient)}*(${coreResult.expression})`,
    method: coreResult.method,
    steps: [`Konstanter Faktor ${formatNumber(coefficient)} wird vor das Integral gezogen.`, ...coreResult.steps],
    detailedSteps: [
      {
        title: "Konstanter Faktor",
        text: "Konstante Faktoren verändern die Integrationsregel nicht und werden vor das Integral gezogen.",
        tex: `\\int ${formatNumber(coefficient)}\\,g(x)\\,\\mathrm{d}x=${formatNumber(coefficient)}\\int g(x)\\,\\mathrm{d}x`
      },
      ...(coreResult.detailedSteps ?? [])
    ]
  };
}

function integrateCore(node: MathNode, coefficient: number): IntegralTerm | null {
  const raw = node as unknown as {
    type?: string;
    op?: string;
    args?: MathNode[];
    fn?: { name?: string };
    value?: string;
    name?: string;
  };

  const constant = getConstant(node);
  if (constant !== null) {
    return {
      expression: `${formatNumber(constant)}*x`,
      method: "Integral einer Konstanten",
      steps: [`Konstante ${formatNumber(constant)} integriert zu ${formatNumber(constant)}x.`]
    };
  }

  if (raw.type === "SymbolNode" && raw.name === "x") {
    return {
      expression: "x^2/2",
      method: "Potenzregel",
      steps: ["x wird als x^1 gelesen; die Potenzregel liefert x^2/2."]
    };
  }

  const power = getPowerOfX(node);
  if (power !== null) {
    if (Math.abs(power + 1) < 1e-12) {
      return {
        expression: "log(abs(x))",
        method: "Spezialfall 1/x",
        steps: ["Für x != 0 gilt integral 1/x dx = ln|x| + C."]
      };
    }
    const next = power + 1;
    return {
      expression: `x^(${formatNumber(next)})/${formatNumber(next)}`,
      method: "Potenzregel",
      steps: [`x^${formatNumber(power)} wird zu x^${formatNumber(next)}/${formatNumber(next)} integriert.`]
    };
  }

  if (raw.type === "OperatorNode" && raw.op === "/" && raw.args?.length === 2) {
    const numeratorConstant = getConstant(raw.args[0]);
    const denominatorLinear = getLinear(raw.args[1]);
    if (numeratorConstant !== null && denominatorLinear && Math.abs(denominatorLinear.a) > 1e-12) {
      return {
        expression: `${formatNumber(numeratorConstant / denominatorLinear.a)}*log(abs(${linearExpression(denominatorLinear)}))`,
        method: "Lineare Substitution",
        steps: [
          `Nenner ${linearExpression(denominatorLinear)} ist linear.`,
          "Mit u = ax + b entsteht ein Logarithmus."
        ]
      };
    }

    const rationalLinear = integrateLinearOverLinear(raw.args[0], raw.args[1]);
    if (rationalLinear) return rationalLinear;

    if (nodeToExpression(raw.args[0]) === "1" && nodeToExpression(raw.args[1]) === "x ^ 2 + 1") {
      return {
        expression: "atan(x)",
        method: "Standardintegral",
        steps: ["1/(1+x^2) ist das Standardintegral arctan(x)."]
      };
    }
  }

  if (raw.type === "FunctionNode") {
    const fn = raw.fn?.name ?? "";
    const argument = raw.args?.[0];
    const linear = argument ? getLinear(argument) : null;

    if (argument && linear && Math.abs(linear.a) > 1e-12) {
      const inner = linearExpression(linear);
      if (fn === "exp") {
        const expression = `exp(${inner})/${formatNumber(linear.a)}`;
        return {
          expression,
          method: "Lineare Substitution",
          steps: [
            "Erkannt wurde eine Exponentialfunktion mit linearer innerer Funktion.",
            "Die lineare innere Funktion wird substituiert und anschließend zurückgesetzt."
          ],
          detailedSteps: substitutionDetails(inner, linear.a, expression)
        };
      }
      if (fn === "sin") {
        const expression = `-cos(${inner})/${formatNumber(linear.a)}`;
        return {
          expression,
          method: "Lineare Substitution",
          steps: [`sin(${inner}) wird mit u = ${inner} integriert.`],
          detailedSteps: [
            {
              title: "Substitution",
              text: "Die innere Funktion ist linear, daher wird durch ihre Ableitung geteilt.",
              tex: `u=${expressionToTex(inner)},\\quad \\mathrm{d}u=${formatNumber(linear.a)}\\,\\mathrm{d}x`
            },
            {
              title: "Stammfunktion",
              text: "Das Standardintegral von sin(u) ist -cos(u).",
              tex: `${expressionToTex(expression)}+C`
            }
          ]
        };
      }
      if (fn === "cos") {
        const expression = `sin(${inner})/${formatNumber(linear.a)}`;
        return {
          expression,
          method: "Lineare Substitution",
          steps: [`cos(${inner}) wird mit u = ${inner} integriert.`],
          detailedSteps: [
            {
              title: "Substitution",
              text: "Die innere Funktion ist linear, daher wird durch ihre Ableitung geteilt.",
              tex: `u=${expressionToTex(inner)},\\quad \\mathrm{d}u=${formatNumber(linear.a)}\\,\\mathrm{d}x`
            },
            {
              title: "Stammfunktion",
              text: "Das Standardintegral von cos(u) ist sin(u).",
              tex: `${expressionToTex(expression)}+C`
            }
          ]
        };
      }
      if (fn === "tan") {
        const expression = `-log(abs(cos(${inner})))/${formatNumber(linear.a)}`;
        return {
          expression,
          method: "Lineare Substitution",
          steps: [`tan(${inner}) wird über -ln|cos(${inner})| integriert.`],
          detailedSteps: trigLogDetails("tan", inner, linear.a, expression)
        };
      }
      if (fn === "cot") {
        const expression = `log(abs(sin(${inner})))/${formatNumber(linear.a)}`;
        return {
          expression,
          method: "Lineare Substitution",
          steps: [`cot(${inner}) wird über ln|sin(${inner})| integriert.`],
          detailedSteps: trigLogDetails("cot", inner, linear.a, expression)
        };
      }
    }
  }

  const trigDerivativePair = integrateTrigDerivativePair(node);
  if (trigDerivativePair) return trigDerivativePair;

  const productStandard = integrateStandardProduct(node, coefficient);
  if (productStandard) return productStandard;

  if (raw.type === "OperatorNode" && raw.op === "^" && raw.args?.length === 2) {
    const base = raw.args[0];
    const exponent = raw.args[1];
    const baseName = (base as unknown as { name?: string }).name;
    const linear = getLinear(exponent);
    if (baseName === "e" && linear && Math.abs(linear.a) > 1e-12) {
      const inner = linearExpression(linear);
      const expression = `exp(${inner})/${formatNumber(linear.a)}`;
      return {
        expression,
        method: "Lineare Substitution",
        steps: [`e^(${inner}) wird als exp(${inner}) gelesen und substituiert.`],
        detailedSteps: substitutionDetails(inner, linear.a, expression)
      };
    }

    const trigPower = integrateTrigSquarePower(base, exponent);
    if (trigPower) return trigPower;
  }

  return null;
}

function integrateProductPattern(node: MathNode): IntegralTerm | null {
  const factors = flattenProduct(node);
  if (factors.length < 2) return null;

  let polynomial = [1];
  let expLinear: { a: number; b: number } | null = null;
  let trigLinear: { fn: "sin" | "cos"; linear: { a: number; b: number } } | null = null;

  for (const factor of factors) {
    const exp = getExpLinear(factor);
    if (exp && !expLinear) {
      expLinear = exp;
      continue;
    }

    const trig = getTrigLinear(factor);
    if (trig && !trigLinear) {
      trigLinear = trig;
      continue;
    }

    const polynomialFactor = getPolynomialCoefficients(factor);
    if (polynomialFactor) {
      polynomial = multiplyPolynomials(polynomial, polynomialFactor);
      if (polynomialDegree(polynomial) > 6) return null;
      continue;
    }

    return null;
  }

  const degree = polynomialDegree(polynomial);

  if (expLinear && degree >= 0 && Math.abs(expLinear.a) > 1e-12) {
    return integratePolynomialTimesExp(polynomial, expLinear);
  }

  const monomialPower = monomialPowerFromPolynomial(polynomial);
  if (trigLinear && monomialPower !== null && monomialPower > 0 && monomialPower <= 4 && Math.abs(trigLinear.linear.a) > 1e-12) {
    return integratePolynomialTimesTrig(monomialPower, trigLinear.fn, trigLinear.linear, polynomial[monomialPower]);
  }

  return null;
}

function integratePolynomialTimesExp(
  polynomial: number[],
  linear: { a: number; b: number }
): IntegralTerm {
  const inner = linearExpression(linear);
  const resultPolynomial: number[] = [];

  polynomial.forEach((coefficient, power) => {
    if (Math.abs(coefficient) < 1e-12) return;
    for (let k = 0; k <= power; k += 1) {
      const exponent = power - k;
      const factor = coefficient * fallingFactorial(power, k) * Math.pow(-1, k) / Math.pow(linear.a, k + 1);
      resultPolynomial[exponent] = (resultPolynomial[exponent] ?? 0) + factor;
    }
  });

  const degree = polynomialDegree(polynomial);
  const integrandPolynomial = polynomialToExpression(polynomial);
  const antiderivativePolynomial = polynomialToExpression(resultPolynomial);
  const expression = `exp(${inner})*(${antiderivativePolynomial})`;
  const repeated = degree > 0 ? "Wiederholte partielle Integration" : "Lineare Substitution";

  if (degree === 0) {
    return {
      expression,
      method: repeated,
      steps: [
        `Erkannt wurde exp(ax+b) mit a = ${formatNumber(linear.a)}.`,
        "Mit der linearen Substitution wird durch die innere Ableitung geteilt."
      ],
      detailedSteps: substitutionDetails(inner, linear.a, expression)
    };
  }

  return {
    expression,
    method: repeated,
    steps: [
      `Erkannt wurde ein Polynom ${degree}. Grades mal eine Exponentialfunktion mit linearer innerer Funktion.`,
      "Für Polynom mal Exponentialfunktion wird partielle Integration wiederholt, bis die Polynompotenz verschwindet.",
      "Die Stammfunktion hat wieder die Form Exponentialfunktion mal Polynom gleichen Grades."
    ],
    detailedSteps: [
      {
        title: "Standardform erkennen",
        text: "Der Integrand besteht aus einem Polynom und einer Exponentialfunktion mit linearer innerer Funktion.",
        tex: `\\int ${expressionToTex(integrandPolynomial)}\\,${expressionToTex(`exp(${inner})`)}\\,\\mathrm{d}x`
      },
      {
        title: "Rekursionsregel",
        text: "Mit partieller Integration wird die Polynompotenz bei jedem Schritt um eins reduziert.",
        tex: "I_n=\\int x^n\\operatorname{exp}(ax+b)\\,\\mathrm{d}x=\\frac{x^n\\operatorname{exp}(ax+b)}{a}-\\frac{n}{a}I_{n-1}"
      },
      {
        title: "Einsetzen der Koeffizienten",
        text: `Für a = ${formatNumber(linear.a)} ergibt sich das Polynom vor der Exponentialfunktion.`,
        tex: `${expressionToTex(expression)}+C`
      },
      {
        title: "Check durch Rückableitung",
        text: "Zur Kontrolle wird die gefundene Stammfunktion gedanklich wieder abgeleitet. Dabei entsteht genau der ursprüngliche Integrand.",
        tex: `\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(${expressionToTex(expression)}\\right)=${expressionToTex(`${integrandPolynomial}*exp(${inner})`)}`
      }
    ]
  };
}

function integratePolynomialTimesTrig(
  power: number,
  fn: "sin" | "cos",
  linear: { a: number; b: number },
  coefficient: number
): IntegralTerm {
  const inner = linearExpression(linear);
  const expression = `${formatNumber(coefficient)}*(${trigRecurrence(power, fn, inner, linear.a)})`;

  return {
    expression,
    method: "Partielle Integration mit Rekursion",
    steps: [
      `Erkannt wurde die Standardform x^${power} ${fn}(ax+b) mit a = ${formatNumber(linear.a)}.`,
      "Die Potenz von x wird durch partielle Integration schrittweise reduziert.",
      "Die Rekursion endet bei den bekannten Integralen von sin(ax+b) und cos(ax+b)."
    ]
  };
}

function trigRecurrence(power: number, fn: "sin" | "cos", inner: string, a: number): string {
  if (power === 0) {
    return fn === "sin" ? `-cos(${inner})/${formatNumber(a)}` : `sin(${inner})/${formatNumber(a)}`;
  }

  const xPower = power === 1 ? "x" : `x^${power}`;
  if (fn === "sin") {
    return `-${xPower}*cos(${inner})/${formatNumber(a)} + ${formatNumber(power / a)}*(${trigRecurrence(power - 1, "cos", inner, a)})`;
  }

  return `${xPower}*sin(${inner})/${formatNumber(a)} - ${formatNumber(power / a)}*(${trigRecurrence(power - 1, "sin", inner, a)})`;
}

function integrateTrigSquarePower(base: MathNode, exponent: MathNode): IntegralTerm | null {
  const power = getConstant(exponent);
  if (power === null || Math.abs(power - 2) > 1e-12) return null;

  const baseRaw = base as unknown as { type?: string; fn?: { name?: string }; args?: MathNode[] };
  if (baseRaw.type !== "FunctionNode" || !baseRaw.args?.[0]) return null;
  const fn = baseRaw.fn?.name;
  const linear = getLinear(baseRaw.args[0]);
  if (!linear || Math.abs(linear.a) < 1e-12) return null;
  const inner = linearExpression(linear);

  if (fn === "sec") {
    const expression = `tan(${inner})/${formatNumber(linear.a)}`;
    return {
      expression,
      method: "Trigonometrisches Standardintegral",
      steps: [`sec(${inner})^2 ist die Ableitung von tan(${inner}) bis auf den Faktor ${formatNumber(linear.a)}.`],
      detailedSteps: trigDerivativeDetails(`\\sec^2`, "tan", inner, linear.a, expression)
    };
  }

  if (fn === "csc") {
    const expression = `-cot(${inner})/${formatNumber(linear.a)}`;
    return {
      expression,
      method: "Trigonometrisches Standardintegral",
      steps: [`csc(${inner})^2 ist bis auf Vorzeichen die Ableitung von cot(${inner}).`],
      detailedSteps: trigDerivativeDetails(`\\csc^2`, "-cot", inner, linear.a, expression)
    };
  }

  return null;
}

function integrateTrigDerivativePair(node: MathNode): IntegralTerm | null {
  const factors = flattenProduct(node);
  const trigFactors: MathNode[] = [];
  let coefficient = 1;

  for (const factor of factors) {
    const constant = getConstant(factor);
    if (constant !== null) {
      coefficient *= constant;
      continue;
    }
    trigFactors.push(factor);
  }

  if (trigFactors.length !== 2) return null;

  const first = getTrigLinearFunction(trigFactors[0]);
  const second = getTrigLinearFunction(trigFactors[1]);
  if (!first || !second) return null;
  if (first.inner !== second.inner || Math.abs(first.linear.a - second.linear.a) > 1e-12) return null;

  const names = [first.fn, second.fn].sort().join("*");
  if (names === "sec*tan") {
    const baseExpression = `sec(${first.inner})/${formatNumber(first.linear.a)}`;
    const expression = Math.abs(coefficient - 1) < 1e-12 ? baseExpression : `${formatNumber(coefficient)}*(${baseExpression})`;
    return {
      expression,
      method: "Trigonometrisches Standardintegral",
      steps: [`sec(${first.inner}) tan(${first.inner}) ist die Ableitung von sec(${first.inner}) bis auf den Faktor ${formatNumber(first.linear.a)}.`],
      detailedSteps: trigDerivativeDetails("\\sec\\,\\tan", "sec", first.inner, first.linear.a, expression)
    };
  }

  if (names === "cot*csc") {
    const baseExpression = `-csc(${first.inner})/${formatNumber(first.linear.a)}`;
    const expression = Math.abs(coefficient - 1) < 1e-12 ? baseExpression : `${formatNumber(coefficient)}*(${baseExpression})`;
    return {
      expression,
      method: "Trigonometrisches Standardintegral",
      steps: [`csc(${first.inner}) cot(${first.inner}) ist bis auf Vorzeichen die Ableitung von csc(${first.inner}).`],
      detailedSteps: trigDerivativeDetails("\\csc\\,\\cot", "-csc", first.inner, first.linear.a, expression)
    };
  }

  return null;
}

function getTrigLinearFunction(node: MathNode): { fn: string; linear: { a: number; b: number }; inner: string } | null {
  const raw = node as unknown as { type?: string; args?: MathNode[]; fn?: { name?: string } };
  if (raw.type !== "FunctionNode" || !raw.args?.[0]) return null;
  const fn = raw.fn?.name ?? "";
  if (!["sin", "cos", "tan", "cot", "sec", "csc"].includes(fn)) return null;
  const linear = getLinear(raw.args[0]);
  if (!linear) return null;
  return { fn, linear, inner: linearExpression(linear) };
}

function trigLogDetails(fn: "tan" | "cot", inner: string, derivativeFactor: number, expression: string): SolutionStep[] {
  const base =
    fn === "tan"
      ? "\\int \\tan(u)\\,\\mathrm{d}u=-\\ln|\\cos(u)|+C"
      : "\\int \\cot(u)\\,\\mathrm{d}u=\\ln|\\sin(u)|+C";
  return [
    {
      title: "Substitution wählen",
      text: "Die innere Funktion ist linear; ihre Ableitung ist konstant.",
      tex: `u=${expressionToTex(inner)},\\qquad \\mathrm{d}u=${formatNumber(derivativeFactor)}\\,\\mathrm{d}x`
    },
    {
      title: "Standardintegral verwenden",
      text: "Der trigonometrische Quotient besitzt eine logarithmische Stammfunktion.",
      tex: base
    },
    {
      title: "Rücksubstitution",
      text: "Nach dem Teilen durch die innere Ableitung wird u wieder ersetzt.",
      tex: `${expressionToTex(expression)}+C`
    }
  ];
}

function trigDerivativeDetails(
  integrandSymbol: string,
  antiderivativeSymbol: string,
  inner: string,
  derivativeFactor: number,
  expression: string
): SolutionStep[] {
  return [
    {
      title: "Standardform erkennen",
      text: "Der Integrand ist eine bekannte Ableitung einer trigonometrischen Funktion mit linearer innerer Funktion.",
      tex: `\\int ${integrandSymbol}\\!\\left(u\\right)\\,\\mathrm{d}u=${antiderivativeSymbol}(u)+C`
    },
    {
      title: "Lineare innere Funktion",
      text: "Die innere Ableitung erzeugt nur einen konstanten Faktor.",
      tex: `u=${expressionToTex(inner)},\\qquad \\mathrm{d}u=${formatNumber(derivativeFactor)}\\,\\mathrm{d}x`
    },
    {
      title: "Stammfunktion",
      text: "Durch die innere Ableitung wird geteilt.",
      tex: `${expressionToTex(expression)}+C`
    }
  ];
}

function flattenProduct(node: MathNode): MathNode[] {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[] };
  if (raw.type === "OperatorNode" && raw.op === "*" && raw.args) {
    return raw.args.flatMap((arg) => flattenProduct(arg));
  }
  return [node];
}

function getExpLinear(node: MathNode): { a: number; b: number } | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[]; fn?: { name?: string }; name?: string };

  if (raw.type === "FunctionNode" && raw.fn?.name === "exp" && raw.args?.[0]) {
    return getLinear(raw.args[0]);
  }

  if (raw.type === "OperatorNode" && raw.op === "^" && raw.args?.length === 2) {
    const base = raw.args[0] as unknown as { type?: string; name?: string };
    if (base.type === "SymbolNode" && base.name === "e") return getLinear(raw.args[1]);
  }

  return null;
}

function getTrigLinear(node: MathNode): { fn: "sin" | "cos"; linear: { a: number; b: number } } | null {
  const raw = node as unknown as { type?: string; args?: MathNode[]; fn?: { name?: string } };
  if (raw.type !== "FunctionNode" || !raw.args?.[0]) return null;
  const fn = raw.fn?.name;
  if (fn !== "sin" && fn !== "cos") return null;
  const linear = getLinear(raw.args[0]);
  return linear ? { fn, linear } : null;
}

function fallingFactorial(n: number, k: number): number {
  let value = 1;
  for (let index = 0; index < k; index += 1) value *= n - index;
  return value;
}

function monomialTerm(coefficient: number, power: number): string {
  const number = formatNumber(coefficient, 8);
  if (power === 0) return number;
  if (Math.abs(coefficient - 1) < 1e-12) return power === 1 ? "x" : `x^${power}`;
  if (Math.abs(coefficient + 1) < 1e-12) return power === 1 ? "-x" : `-x^${power}`;
  if (power === 1) return `${number}*x`;
  return `${number}*x^${power}`;
}

function joinTerms(terms: string[]): string {
  return terms.reduce((text, term, index) => {
    if (index === 0) return term;
    return term.startsWith("-") ? `${text} - ${term.slice(1)}` : `${text} + ${term}`;
  }, "");
}

function substitutionDetails(inner: string, derivativeFactor: number, expression: string): SolutionStep[] {
  return [
    {
      title: "Substitution wählen",
      text: "Die innere Funktion ist linear; deshalb ist ihre Ableitung konstant.",
      tex: `u=${expressionToTex(inner)},\\qquad \\mathrm{d}u=${formatNumber(derivativeFactor)}\\,\\mathrm{d}x`
    },
    {
      title: "Integral umschreiben",
      text: "Beim Rückrechnen wird durch die innere Ableitung geteilt.",
      tex: `\\int \\operatorname{exp}(u)\\,\\frac{\\mathrm{d}u}{${formatNumber(derivativeFactor)}}=\\frac{1}{${formatNumber(derivativeFactor)}}\\operatorname{exp}(u)+C`
    },
    {
      title: "Rücksubstitution",
      text: "Nun wird u wieder durch die ursprüngliche lineare Funktion ersetzt.",
      tex: `${expressionToTex(expression)}+C`
    }
  ];
}

function integrateStandardProduct(node: MathNode, coefficient: number): IntegralTerm | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[] };
  if (raw.type !== "OperatorNode" || raw.op !== "*" || raw.args?.length !== 2) return null;

  const [left, right] = raw.args;
  const leftExpr = nodeToExpression(left);
  const rightExpr = nodeToExpression(right);
  const hasX = leftExpr === "x" || rightExpr === "x";
  const other = leftExpr === "x" ? right : rightExpr === "x" ? left : null;
  if (!hasX || !other) return null;

  const otherRaw = other as unknown as { type?: string; fn?: { name?: string }; args?: MathNode[] };
  if (otherRaw.type === "FunctionNode") {
    const fn = otherRaw.fn?.name;
    const argumentExpr = otherRaw.args?.[0] ? nodeToExpression(otherRaw.args[0]) : "";

    if (fn === "exp" && argumentExpr === "x") {
      return {
        expression: "exp(x)*(x - 1)",
        method: "Partielle Integration",
        steps: ["Standardform integral x exp(x) dx: u = x, dv = exp(x) dx."]
      };
    }
    if (fn === "sin" && argumentExpr === "x") {
      return {
        expression: "-x*cos(x) + sin(x)",
        method: "Partielle Integration",
        steps: ["Standardform integral x sin(x) dx: u = x, dv = sin(x) dx."]
      };
    }
    if (fn === "cos" && argumentExpr === "x") {
      return {
        expression: "x*sin(x) + cos(x)",
        method: "Partielle Integration",
        steps: ["Standardform integral x cos(x) dx: u = x, dv = cos(x) dx."]
      };
    }
    if (fn === "log" && argumentExpr === "x") {
      return {
        expression: "(x^2/2)*log(x) - x^2/4",
        method: "Partielle Integration",
        steps: ["Standardform integral x ln(x) dx: u = ln(x), dv = x dx."]
      };
    }
  }

  const _ = coefficient;
  return null;
}

function integrateLinearOverLinear(numerator: MathNode, denominator: MathNode): IntegralTerm | null {
  const num = getLinear(numerator);
  const den = getLinear(denominator);
  if (!num || !den || Math.abs(den.a) < 1e-12) return null;

  const quotient = num.a / den.a;
  const remainder = num.b - quotient * den.b;
  const denExpr = linearExpression(den);
  const parts = [`${formatNumber(quotient)}*x`];
  if (Math.abs(remainder) > 1e-12) {
    parts.push(`${formatNumber(remainder / den.a)}*log(abs(${denExpr}))`);
  }

  return {
    expression: parts.join(" + "),
    method: "Einfache rationale Funktion",
    steps: [
      "Lineare rationale Funktion wird in Konstante plus Restbruch zerlegt.",
      `(${linearExpression(num)})/(${denExpr}) = ${formatNumber(quotient)} + Rest/(${denExpr}).`
    ]
  };
}

function splitCoefficient(node: MathNode): { coefficient: number; core: MathNode } {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[] };
  if (raw.type === "OperatorNode" && raw.op === "*" && raw.args?.length === 2) {
    const left = getConstant(raw.args[0]);
    const right = getConstant(raw.args[1]);
    if (left !== null) return { coefficient: left, core: raw.args[1] };
    if (right !== null) return { coefficient: right, core: raw.args[0] };
  }

  if (raw.type === "OperatorNode" && raw.op === "-" && raw.args?.length === 1) {
    return { coefficient: -1, core: raw.args[0] };
  }

  return { coefficient: 1, core: node };
}

function getConstant(node: MathNode): number | null {
  const raw = node as unknown as { type?: string; value?: string | number; name?: string; op?: string; args?: MathNode[]; content?: MathNode };
  if (raw.type === "ParenthesisNode" && raw.content) return getConstant(raw.content);
  if (raw.type === "ConstantNode") return Number(raw.value);
  if (raw.type === "SymbolNode" && raw.name === "pi") return Math.PI;
  if (raw.type === "SymbolNode" && raw.name === "e") return Math.E;
  if (raw.type === "OperatorNode" && raw.op === "-" && raw.args?.length === 1) {
    const value = getConstant(raw.args[0]);
    return value === null ? null : -value;
  }
  return null;
}

function getPowerOfX(node: MathNode): number | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[]; name?: string };
  if (raw.type === "SymbolNode" && raw.name === "x") return 1;
  if (raw.type === "OperatorNode" && raw.op === "^" && raw.args?.length === 2) {
    const base = raw.args[0] as unknown as { type?: string; name?: string };
    const exponent = getConstant(raw.args[1]);
    if (base.type === "SymbolNode" && base.name === "x" && exponent !== null) return exponent;
  }
  if (raw.type === "OperatorNode" && raw.op === "/" && raw.args?.length === 2) {
    const numerator = getConstant(raw.args[0]);
    const denominatorPower = getPowerOfX(raw.args[1]);
    if (numerator === 1 && denominatorPower !== null) return -denominatorPower;
  }
  return null;
}

function getPolynomialCoefficients(node: MathNode): number[] | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[]; name?: string; content?: MathNode };
  if (raw.type === "ParenthesisNode" && raw.content) return getPolynomialCoefficients(raw.content);
  const constant = getConstant(node);
  if (constant !== null) return [constant];
  if (raw.type === "SymbolNode" && raw.name === "x") return [0, 1];

  if (raw.type === "OperatorNode" && raw.args) {
    if (raw.op === "^" && raw.args.length === 2) {
      const base = raw.args[0] as unknown as { type?: string; name?: string };
      const exponent = getConstant(raw.args[1]);
      if (base.type === "SymbolNode" && base.name === "x" && exponent !== null && Number.isInteger(exponent) && exponent >= 0 && exponent <= 6) {
        const coefficients = Array.from({ length: exponent + 1 }, () => 0);
        coefficients[exponent] = 1;
        return coefficients;
      }
    }

    if ((raw.op === "+" || raw.op === "-") && raw.args.length === 2) {
      const left = getPolynomialCoefficients(raw.args[0]);
      const right = getPolynomialCoefficients(raw.args[1]);
      if (!left || !right) return null;
      const sign = raw.op === "+" ? 1 : -1;
      return addPolynomials(left, right.map((value) => sign * value));
    }

    if (raw.op === "*" && raw.args.length === 2) {
      const left = getPolynomialCoefficients(raw.args[0]);
      const right = getPolynomialCoefficients(raw.args[1]);
      if (!left || !right) return null;
      const product = multiplyPolynomials(left, right);
      return polynomialDegree(product) <= 6 ? product : null;
    }

    if (raw.op === "-" && raw.args.length === 1) {
      const inner = getPolynomialCoefficients(raw.args[0]);
      return inner ? inner.map((value) => -value) : null;
    }
  }

  return null;
}

function addPolynomials(left: number[], right: number[]): number[] {
  const length = Math.max(left.length, right.length);
  return Array.from({ length }, (_, index) => (left[index] ?? 0) + (right[index] ?? 0));
}

function multiplyPolynomials(left: number[], right: number[]): number[] {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0);
  left.forEach((leftValue, leftPower) => {
    right.forEach((rightValue, rightPower) => {
      result[leftPower + rightPower] += leftValue * rightValue;
    });
  });
  return trimPolynomial(result);
}

function trimPolynomial(polynomial: number[]): number[] {
  const trimmed = polynomial.slice();
  while (trimmed.length > 1 && Math.abs(trimmed[trimmed.length - 1]) < 1e-12) trimmed.pop();
  return trimmed;
}

function polynomialDegree(polynomial: number[]): number {
  for (let index = polynomial.length - 1; index >= 0; index -= 1) {
    if (Math.abs(polynomial[index]) > 1e-12) return index;
  }
  return 0;
}

function monomialPowerFromPolynomial(polynomial: number[]): number | null {
  let power: number | null = null;
  polynomial.forEach((coefficient, index) => {
    if (Math.abs(coefficient) > 1e-12) power = power === null ? index : Number.NaN;
  });
  return power !== null && Number.isFinite(power) ? power : null;
}

function polynomialToExpression(polynomial: number[]): string {
  const terms: string[] = [];
  for (let power = polynomial.length - 1; power >= 0; power -= 1) {
    const coefficient = polynomial[power] ?? 0;
    if (Math.abs(coefficient) > 1e-10) terms.push(monomialTerm(coefficient, power));
  }
  return terms.length ? joinTerms(terms) : "0";
}

function getLinear(node: MathNode): { a: number; b: number } | null {
  const raw = node as unknown as { type?: string; op?: string; args?: MathNode[]; name?: string; content?: MathNode };
  if (raw.type === "ParenthesisNode" && raw.content) return getLinear(raw.content);
  const constant = getConstant(node);
  if (constant !== null) return { a: 0, b: constant };
  if (raw.type === "SymbolNode" && raw.name === "x") return { a: 1, b: 0 };

  if (raw.type === "OperatorNode" && raw.args) {
    if (raw.op === "+" || raw.op === "-") {
      const left = getLinear(raw.args[0]);
      const right = getLinear(raw.args[1]);
      if (!left || !right) return null;
      const sign = raw.op === "+" ? 1 : -1;
      return { a: left.a + sign * right.a, b: left.b + sign * right.b };
    }

    if (raw.op === "*") {
      const leftConstant = getConstant(raw.args[0]);
      const rightConstant = getConstant(raw.args[1]);
      const leftLinear = getLinear(raw.args[0]);
      const rightLinear = getLinear(raw.args[1]);
      if (leftConstant !== null && rightLinear) return { a: leftConstant * rightLinear.a, b: leftConstant * rightLinear.b };
      if (rightConstant !== null && leftLinear) return { a: rightConstant * leftLinear.a, b: rightConstant * leftLinear.b };
    }

    if (raw.op === "-" && raw.args.length === 1) {
      const inner = getLinear(raw.args[0]);
      return inner ? { a: -inner.a, b: -inner.b } : null;
    }
  }

  return null;
}

function linearExpression(linear: { a: number; b: number }): string {
  const a = linear.a;
  const b = linear.b;
  const terms: string[] = [];
  if (Math.abs(a) > 1e-12) {
    if (Math.abs(a - 1) < 1e-12) terms.push("x");
    else if (Math.abs(a + 1) < 1e-12) terms.push("-x");
    else terms.push(`${formatNumber(a)}*x`);
  }
  if (Math.abs(b) > 1e-12) terms.push(`${b >= 0 && terms.length ? "+ " : ""}${formatNumber(b)}`);
  return terms.join(" ") || "0";
}
