import type { MathNode } from "mathjs";
import { expressionToTex, math, nodeToExpression, normalizeExpression, parseExpression, sampleExpression } from "./mathCore";

export interface DerivativeResult {
  ok: true;
  input: string;
  derivative: string;
  derivativeTex: string;
  higherDerivatives: Array<{ order: number; expression: string; tex: string }>;
  rules: string[];
  steps: string[];
  detailedSteps: DerivativeSolutionStep[];
  plot: {
    f: ReturnType<typeof sampleExpression>;
    derivative: ReturnType<typeof sampleExpression>;
  };
}

export interface DerivativeSolutionStep {
  title: string;
  text: string;
  tex?: string;
}

export interface MathFailure {
  ok: false;
  message: string;
  details?: string;
}

export function computeDerivative(input: string, order = 1): DerivativeResult | MathFailure {
  try {
    const normalized = normalizeExpression(input);
    const node = parseExpression(normalized);
    const rules = detectDerivativeRules(node);
    const higherDerivatives: DerivativeResult["higherDerivatives"] = [];
    let current = node;

    for (let index = 1; index <= Math.max(1, order); index += 1) {
      current = math.simplify(math.derivative(current, "x")) as MathNode;
      higherDerivatives.push({
        order: index,
        expression: nodeToExpression(current),
        tex: expressionToTex(current)
      });
    }

    const derivative = higherDerivatives[0].expression;
    const steps = buildDerivativeSteps(input, rules, higherDerivatives);
    const detailedSteps = buildDerivativeDetails(normalized, rules, higherDerivatives);

    return {
      ok: true,
      input: normalized,
      derivative,
      derivativeTex: higherDerivatives[0].tex,
      higherDerivatives,
      rules,
      steps,
      detailedSteps,
      plot: {
        f: sampleExpression(normalized, -6, 6, 401),
        derivative: sampleExpression(derivative, -6, 6, 401)
      }
    };
  } catch (error) {
    return {
      ok: false,
      message: "Diese Eingabe konnte nicht sicher als Funktion f(x) gelesen werden.",
      details: error instanceof Error ? error.message : undefined
    };
  }
}

export function detectDerivativeRules(node: MathNode): string[] {
  const found = new Set<string>();
  const visit = (current: MathNode) => {
    const raw = current as unknown as {
      type?: string;
      op?: string;
      fn?: { name?: string };
      args?: MathNode[];
      content?: MathNode;
    };

    if (raw.type === "OperatorNode") {
      if ((raw.op === "+" || raw.op === "-") && raw.args?.length === 2) found.add("Summenregel");
      if (raw.op === "*") found.add("Produktregel");
      if (raw.op === "/") found.add("Quotientenregel");
      if (raw.op === "^") found.add("Potenzregel");
    }

    if (raw.type === "FunctionNode") {
      const name = raw.fn?.name ?? "";
      if (["sin", "cos", "tan", "cot", "sec", "csc", "exp", "log", "sqrt"].includes(name)) found.add("Ableitung elementarer Funktionen");
      const argument = raw.args?.[0];
      if (argument && argument.toString() !== "x") found.add("Kettenregel");
    }

    const children = raw.args ?? (raw.content ? [raw.content] : []);
    children.forEach(visit);
  };

  visit(node);
  return found.size ? [...found] : ["Grundregel"];
}

function buildDerivativeSteps(
  input: string,
  rules: string[],
  higherDerivatives: Array<{ order: number; expression: string; tex: string }>
): string[] {
  const steps = [
    "Die Funktion wird als f(x) gelesen und in eine klare Rechenform gebracht.",
    `Erkannte Regeln: ${rules.join(", ")}.`
  ];

  if (rules.includes("Produktregel")) {
    steps.push("Produktanteile werden nach (u v)' = u' v + u v' behandelt.");
  }
  if (rules.includes("Quotientenregel")) {
    steps.push("Quotientenanteile werden nach (u/v)' = (u'v - uv')/v^2 behandelt.");
  }
  if (rules.includes("Kettenregel")) {
    steps.push("Verkettete Standardfunktionen werden als äußere Ableitung mal innere Ableitung ausgewertet.");
  }
  if (rules.includes("Potenzregel")) {
    steps.push("Potenzen mit konstanter Hochzahl werden nach x^n -> n x^(n-1) behandelt.");
  }

  higherDerivatives.forEach((item) => {
    steps.push(`${item.order}. Ableitung wurde symbolisch berechnet.`);
  });

  return steps;
}

function buildDerivativeDetails(
  normalized: string,
  rules: string[],
  higherDerivatives: Array<{ order: number; expression: string; tex: string }>
): DerivativeSolutionStep[] {
  const details: DerivativeSolutionStep[] = [
    {
      title: "Funktion festlegen",
      text: "Zuerst wird die Eingabe als Funktion einer reellen Variablen x gelesen.",
      tex: `f(x)=${expressionToTex(normalized)}`
    }
  ];

  if (rules.includes("Summenregel")) {
    details.push({
      title: "Summenregel",
      text: "Summanden werden einzeln abgeleitet.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(g(x)+h(x)\\right)=g'(x)+h'(x)"
    });
  }

  if (rules.includes("Produktregel")) {
    details.push({
      title: "Produktregel",
      text: "Bei einem Produkt wird jeder Faktor einmal abgeleitet und der andere Faktor stehen gelassen.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(u(x)v(x)\\right)=u'(x)v(x)+u(x)v'(x)"
    });
  }

  if (rules.includes("Quotientenregel")) {
    details.push({
      title: "Quotientenregel",
      text: "Bei einem Quotienten wird der Nenner quadriert und der Zähler nach der Standardregel gebildet.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}\\left(\\frac{u(x)}{v(x)}\\right)=\\frac{u'(x)v(x)-u(x)v'(x)}{v(x)^2}"
    });
  }

  if (rules.includes("Kettenregel")) {
    details.push({
      title: "Kettenregel",
      text: "Bei einer verketteten Funktion wird die äußere Ableitung mit der inneren Ableitung multipliziert.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}g(h(x))=g'(h(x))\\,h'(x)"
    });
  }

  if (rules.includes("Potenzregel")) {
    details.push({
      title: "Potenzregel",
      text: "Potenzen mit konstanter Hochzahl werden nach der Potenzregel behandelt.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}x^n=n x^{n-1}"
    });
  }

  if (rules.includes("Ableitung elementarer Funktionen")) {
    details.push({
      title: "Elementare Ableitungen",
      text: "Die bekannten Ableitungen von exp, ln und trigonometrischen Funktionen werden als Grundbausteine verwendet.",
      tex: "\\frac{\\mathrm{d}}{\\mathrm{d}x}\\operatorname{exp}(x)=\\operatorname{exp}(x),\\quad \\frac{\\mathrm{d}}{\\mathrm{d}x}\\ln(x)=\\frac{1}{x}"
    });
  }

  higherDerivatives.forEach((item) => {
    details.push({
      title: `${item.order}. Ableitung`,
      text:
        item.order === 1
          ? "Nach Anwendung der erkannten Regeln ergibt sich die erste Ableitung."
          : "Die vorherige Ableitung wird erneut nach x abgeleitet.",
      tex: `f^{(${item.order})}(x)=${item.tex}`
    });
  });

  details.push({
    title: "Kontrolle",
    text: "Die Ableitung wird zusätzlich im Plot mit der Ausgangsfunktion verglichen, damit Änderungsrate und Funktionsverlauf zusammen sichtbar sind.",
    tex: "f'(x)=\\frac{\\mathrm{d}}{\\mathrm{d}x}f(x)"
  });

  return details;
}
