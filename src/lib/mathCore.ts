import { all, create } from "mathjs";
import type { MathNode } from "mathjs";

export const math = create(all, {
  number: "number",
  precision: 14
});

export type Evaluator = (x: number) => number | null;
export type ExponentialNotation = "exp" | "euler";

export interface TexOptions {
  exponential?: ExponentialNotation;
}

const supportedFunctions = [
  "sin",
  "cos",
  "tan",
  "cot",
  "sec",
  "csc",
  "asin",
  "acos",
  "atan",
  "sinh",
  "cosh",
  "tanh",
  "exp",
  "log",
  "sqrt",
  "abs"
];

export function normalizeExpression(input: string): string {
  let expression = input
    .trim()
    .replace(/−/g, "-")
    .replace(/–/g, "-")
    .replace(/×/g, "*")
    .replace(/·/g, "*")
    .replace(/÷/g, "/")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/\bln\s*\(/gi, "log(")
    .replace(/\blog10\s*\(/gi, "log10(")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\s+/g, "");

  for (const fn of supportedFunctions) {
    expression = expression.replace(new RegExp(`\\b${fn}\\s*\\(`, "gi"), `${fn}(`);
  }

  for (const fn of supportedFunctions) {
    expression = expression.replace(new RegExp(`(\\d|\\)|x|pi|e)(${fn})\\(`, "gi"), "$1*$2(");
  }

  expression = expression
    .replace(/(\d|\))(?=x\b)/g, "$1*")
    .replace(/(\d|\)|x)(?=pi\b)/g, "$1*")
    .replace(/(\d|\)|x)(?=e\b)/g, "$1*")
    .replace(/(x|pi|e|\))(?=\()/g, "$1*")
    .replace(/(\d)(?=\()/g, "$1*");

  return expression;
}

export function parseExpression(input: string): MathNode {
  const normalized = normalizeExpression(input);
  if (!normalized) throw new Error("Bitte gib einen mathematischen Ausdruck ein.");
  return math.parse(normalized);
}

export function expressionToTex(input: string | MathNode, options: TexOptions = {}): string {
  try {
    const node = typeof input === "string" ? parseExpression(input) : input;
    return nodeToBookTex(node, 0, options);
  } catch {
    return String(input);
  }
}

export function nodeToBookTex(node: MathNode, parentPrecedence = 0, options: TexOptions = {}): string {
  const raw = node as unknown as {
    type?: string;
    op?: string;
    fn?: { name?: string };
    args?: MathNode[];
    content?: MathNode;
    name?: string;
    value?: string | number;
  };

  if (raw.type === "ParenthesisNode" && raw.content) {
    return `\\left(${nodeToBookTex(raw.content, 0, options)}\\right)`;
  }

  if (raw.type === "ConstantNode") return formatNumber(Number(raw.value), 8);

  if (raw.type === "SymbolNode") {
    if (raw.name === "pi") return "\\pi";
    if (raw.name === "e") return "\\mathrm{e}";
    if (raw.name === "i") return "\\mathrm{i}";
    return raw.name ?? "";
  }

  if (raw.type === "FunctionNode") {
    const name = raw.fn?.name ?? "";
    const first = raw.args?.[0];
    const argument = first ? nodeToBookTex(first, 0, options) : "";
    if (name === "exp") {
      if (options.exponential === "euler") return `\\mathrm{e}^{${argument}}`;
      return `\\operatorname{exp}\\!\\left(${argument}\\right)`;
    }
    if (name === "log") return `\\ln\\!\\left(${argument}\\right)`;
    if (name === "log10") return `\\log_{10}\\!\\left(${argument}\\right)`;
    if (name === "sqrt") return `\\sqrt{${argument}}`;
    if (name === "abs") return `\\left|${argument}\\right|`;
    if (["sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos", "atan", "sinh", "cosh", "tanh"].includes(name)) {
      const texName = name === "asin" ? "arcsin" : name === "acos" ? "arccos" : name === "atan" ? "arctan" : name;
      return `\\${texName}\\!\\left(${argument}\\right)`;
    }
    return `\\operatorname{${name}}\\!\\left(${argument}\\right)`;
  }

  if (raw.type === "OperatorNode" && raw.args) {
    const precedence = operatorPrecedence(raw.op ?? "");

    if (raw.op === "-" && raw.args.length === 1) {
      const innerRaw = raw.args[0] as unknown as { type?: string };
      if (innerRaw.type === "ConstantNode" || innerRaw.type === "SymbolNode") {
        return `-${nodeToBookTex(raw.args[0], precedence, options)}`;
      }
      const value = `-${nodeToBookTex(raw.args[0], precedence, options)}`;
      return precedence < parentPrecedence ? `\\left(${value}\\right)` : value;
    }

    if ((raw.op === "+" || raw.op === "-") && raw.args.length === 2) {
      const left = nodeToBookTex(raw.args[0], precedence, options);
      const right = nodeToBookTex(raw.args[1], precedence + 0.1, options);
      const value =
        raw.op === "+" && right.startsWith("-")
          ? `${left} - ${right.slice(1)}`
          : raw.op === "-" && right.startsWith("-")
            ? `${left} + ${right.slice(1)}`
            : `${left} ${raw.op} ${right}`;
      return precedence < parentPrecedence ? `\\left(${value}\\right)` : value;
    }

    if (raw.op === "*" && raw.args.length >= 2) {
      const value = raw.args
        .map((arg) => nodeToBookTex(arg, precedence, options))
        .join("\\,");
      return precedence < parentPrecedence ? `\\left(${value}\\right)` : value;
    }

    if (raw.op === "/" && raw.args.length === 2) {
      return `\\frac{${nodeToBookTex(raw.args[0], 0, options)}}{${nodeToBookTex(raw.args[1], 0, options)}}`;
    }

    if (raw.op === "^" && raw.args.length === 2) {
      const baseRaw = raw.args[0] as unknown as { type?: string; name?: string };
      const exponent = nodeToBookTex(raw.args[1], 0, options);
      if (baseRaw.type === "SymbolNode" && baseRaw.name === "e") {
        const value =
          options.exponential === "euler"
            ? `\\mathrm{e}^{${exponent}}`
            : `\\operatorname{exp}\\!\\left(${exponent}\\right)`;
        return precedence < parentPrecedence ? `\\left(${value}\\right)` : value;
      }
      const base =
        baseRaw.type === "SymbolNode" || baseRaw.type === "ConstantNode"
          ? nodeToBookTex(raw.args[0], precedence, options)
          : `\\left(${nodeToBookTex(raw.args[0], 0, options)}\\right)`;
      const value = `${base}^{${exponent}}`;
      return precedence < parentPrecedence ? `\\left(${value}\\right)` : value;
    }
  }

  return node.toString();
}

function operatorPrecedence(operator: string): number {
  if (operator === "+" || operator === "-") return 1;
  if (operator === "*" || operator === "/") return 2;
  if (operator === "^") return 3;
  return 4;
}

export function nodeToExpression(node: MathNode): string {
  return node.toString({
    parenthesis: "keep",
    implicit: "hide"
  });
}

export function simplifyExpression(expression: string): string {
  try {
    return math.simplify(normalizeExpression(expression)).toString({
      parenthesis: "keep",
      implicit: "hide"
    });
  } catch {
    return expression;
  }
}

export function makeEvaluator(input: string): Evaluator {
  const node = parseExpression(input);
  const code = node.compile();

  return (x: number) => {
    try {
      const value = code.evaluate({ x, pi: Math.PI, e: Math.E });
      return numericValue(value);
    } catch {
      return null;
    }
  };
}

export function makeSequenceEvaluator(input: string): (n: number) => number | null {
  const normalized = normalizeExpression(input.replace(/\bx\b/g, "n"));
  const node = math.parse(normalized);
  const code = node.compile();

  return (n: number) => {
    try {
      return numericValue(code.evaluate({ n, pi: Math.PI, e: Math.E }));
    } catch {
      return null;
    }
  };
}

export function numericValue(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const maybe = value as { re?: number; im?: number; valueOf?: () => unknown };
  if (typeof maybe?.re === "number" && typeof maybe?.im === "number") {
    if (Math.abs(maybe.im) < 1e-10 && Number.isFinite(maybe.re)) return maybe.re;
    return null;
  }

  const primitive = maybe?.valueOf?.();
  if (typeof primitive === "number") return Number.isFinite(primitive) ? primitive : null;

  return null;
}

export function evaluateAt(input: string, x: number): number | null {
  return makeEvaluator(input)(x);
}

export function sampleExpression(input: string, min = -6, max = 6, points = 401) {
  const evaluator = makeEvaluator(input);
  const xs: number[] = [];
  const ys: Array<number | null> = [];
  const step = (max - min) / Math.max(points - 1, 1);
  let previousFinite: number | null = null;

  for (let index = 0; index < points; index += 1) {
    const x = min + index * step;
    const value = evaluator(x);
    const y: number | null =
      value === null || Math.abs(value) > 1e6 || (previousFinite !== null && Math.abs(value - previousFinite) > 1e5)
        ? null
        : value;
    xs.push(x);
    ys.push(y);
    previousFinite = y;
  }

  return { xs, ys };
}

export function formatNumber(value: number, digits = 5): string {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) < 1e-10) return "0";
  if (Math.abs(value) >= 100000 || Math.abs(value) < 0.0001) return value.toExponential(3);
  return Number(value.toFixed(digits)).toString();
}

export function approxEqual(a: number | null, b: number | null, epsilon = 1e-6): boolean {
  if (a === null || b === null) return false;
  return Math.abs(a - b) <= epsilon * Math.max(1, Math.abs(a), Math.abs(b));
}

export function isSupportedRealExpression(input: string): boolean {
  try {
    parseExpression(input);
    return true;
  } catch {
    return false;
  }
}
