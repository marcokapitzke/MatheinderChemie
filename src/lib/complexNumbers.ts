import { formatNumber, math, normalizeExpression, type ExponentialNotation } from "./mathCore";

export interface ComplexValue {
  re: number;
  im: number;
}

export interface ComplexForms {
  cartesian: string;
  polar: string;
  exponential: string;
  cartesianTex: string;
  polarTex: string;
  exponentialTex: string;
  modulus: number;
  argument: number;
}

export type ComplexOperation = "add" | "subtract" | "multiply" | "divide" | "power";

export interface ComplexResult {
  ok: true;
  a: ComplexValue;
  b: ComplexValue;
  result: ComplexValue;
  forms: ComplexForms;
  steps: string[];
  detailedSteps: Array<{ title: string; text: string; tex?: string }>;
}

export interface ComplexFailure {
  ok: false;
  message: string;
}

export function parseComplexInput(input: string): ComplexValue | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const exponential = parseExponential(trimmed);
  if (exponential) return exponential;

  const normalized = trimmed
    .replace(/−/g, "-")
    .replace(/\s+/g, "")
    .replace(/,/g, ".")
    .replace(/\bi\b/g, "i");

  if (normalized === "i") return { re: 0, im: 1 };
  if (normalized === "-i") return { re: 0, im: -1 };

  const withExplicitI = normalized.replace(/(^|[+\-])i/g, "$11i").replace(/\*?i/g, "");
  const match = withExplicitI.match(/^([+\-]?\d*\.?\d+)?([+\-]\d*\.?\d+)?$/);
  if (!match) return null;

  if (!normalized.includes("i")) {
    const real = Number(normalized);
    return Number.isFinite(real) ? { re: real, im: 0 } : null;
  }

  const parts = normalized.replace(/-/g, "+-").split("+").filter(Boolean);
  let re = 0;
  let im = 0;
  for (const part of parts) {
    if (part.includes("i")) {
      const coeff = part.replace("*", "").replace("i", "");
      if (coeff === "" || coeff === "+") im += 1;
      else if (coeff === "-") im -= 1;
      else im += Number(coeff);
    } else {
      re += Number(part);
    }
  }

  return Number.isFinite(re) && Number.isFinite(im) ? { re, im } : null;
}

export function computeComplex(
  leftInput: string,
  rightInput: string,
  operation: ComplexOperation,
  power = 2
): ComplexResult | ComplexFailure {
  const a = parseComplexInput(leftInput);
  const b = parseComplexInput(rightInput);
  if (!a || (!b && operation !== "power")) {
    return { ok: false, message: "Bitte verwende einfache Formen wie 2 + 3i oder 2*exp(i*pi/3)." };
  }

  let result: ComplexValue;
  const steps: string[] = [];
  const detailedSteps: Array<{ title: string; text: string; tex?: string }> = [];

  switch (operation) {
    case "add":
      result = { re: a.re + b!.re, im: a.im + b!.im };
      steps.push("Realteile und Imaginärteile werden getrennt addiert.");
      detailedSteps.push(
        {
          title: "Kartesische Form",
          text: "Addition erfolgt komponentenweise.",
          tex: "(a+b\\,\\mathrm{i})+(c+d\\,\\mathrm{i})=(a+c)+(b+d)\\,\\mathrm{i}"
        },
        {
          title: "Einsetzen",
          text: "Realteil und Imaginärteil werden jeweils addiert.",
          tex: `${complexCartesianTex(a)}+\\left(${complexCartesianTex(b!)}\\right)=${complexCartesianTex(result)}`
        }
      );
      break;
    case "subtract":
      result = { re: a.re - b!.re, im: a.im - b!.im };
      steps.push("Realteile und Imaginärteile werden getrennt subtrahiert.");
      detailedSteps.push(
        {
          title: "Kartesische Form",
          text: "Subtraktion erfolgt komponentenweise.",
          tex: "(a+b\\,\\mathrm{i})-(c+d\\,\\mathrm{i})=(a-c)+(b-d)\\,\\mathrm{i}"
        },
        {
          title: "Einsetzen",
          text: "Realteil und Imaginärteil werden jeweils subtrahiert.",
          tex: `${complexCartesianTex(a)}-\\left(${complexCartesianTex(b!)}\\right)=${complexCartesianTex(result)}`
        }
      );
      break;
    case "multiply":
      result = { re: a.re * b!.re - a.im * b!.im, im: a.re * b!.im + a.im * b!.re };
      steps.push("Multiplikation in Polarform: Beträge multiplizieren, Argumente addieren.");
      detailedSteps.push(...multiplicationDetails(a, b!, result));
      break;
    case "divide": {
      const denom = b!.re ** 2 + b!.im ** 2;
      if (denom === 0) return { ok: false, message: "Division durch 0 ist nicht definiert." };
      result = { re: (a.re * b!.re + a.im * b!.im) / denom, im: (a.im * b!.re - a.re * b!.im) / denom };
      steps.push("Division erfolgt mit dem konjugierten Nenner.");
      detailedSteps.push(
        {
          title: "Konjugierten Nenner verwenden",
          text: "Der Nenner wird mit seiner konjugiert komplexen Zahl multipliziert.",
          tex: "\\frac{z_1}{z_2}=\\frac{z_1\\overline{z_2}}{|z_2|^2}"
        },
        {
          title: "Einsetzen",
          text: "Nach dem Multiplizieren ist der Nenner reell.",
          tex: `\\frac{${complexCartesianTex(a)}}{${complexCartesianTex(b!)}}=${complexCartesianTex(result)}`
        }
      );
      break;
    }
    case "power": {
      const polar = toForms(a);
      const modulus = polar.modulus ** power;
      const argument = polar.argument * power;
      result = { re: modulus * Math.cos(argument), im: modulus * Math.sin(argument) };
      steps.push("Potenz nach Moivre: Betrag potenzieren, Argument mit dem Exponenten multiplizieren.");
      detailedSteps.push(
        {
          title: "Satz von Moivre",
          text: "In Exponentialform werden Betrag und Argument getrennt behandelt.",
          tex: "\\left(r\\operatorname{exp}(\\mathrm{i}\\varphi)\\right)^n=r^n\\operatorname{exp}(\\mathrm{i}n\\varphi)"
        },
        {
          title: "Einsetzen",
          text: "Der Betrag wird potenziert, das Argument mit dem Exponenten multipliziert.",
          tex: `${complexCartesianTex(a)}^{${power}}=${complexCartesianTex(result)}`
        }
      );
      break;
    }
    default:
      result = a;
  }

  return {
    ok: true,
    a,
    b: b ?? { re: 0, im: 0 },
    result,
    forms: toForms(result),
    steps,
    detailedSteps
  };
}

export function toForms(value: ComplexValue): ComplexForms {
  return toFormsWithNotation(value, "exp");
}

export function toFormsWithNotation(value: ComplexValue, notation: ExponentialNotation): ComplexForms {
  const modulus = Math.hypot(value.re, value.im);
  const argument = Math.atan2(value.im, value.re);
  const modulusTex = formatNumber(modulus);
  const argumentTex = formatNumber(argument);
  const exponentialTex =
    notation === "euler"
      ? `${modulusTex}\\,\\mathrm{e}^{\\mathrm{i}\\,${argumentTex}}`
      : `${modulusTex}\\,\\operatorname{exp}\\!\\left(\\mathrm{i}\\,${argumentTex}\\right)`;

  return {
    cartesian: formatComplex(value),
    polar: `${formatNumber(modulus)} · (cos(${formatNumber(argument)}) + i sin(${formatNumber(argument)}))`,
    exponential: `${formatNumber(modulus)} · exp(i ${formatNumber(argument)})`,
    cartesianTex: complexCartesianTex(value),
    polarTex: `${modulusTex}\\left(\\cos(${argumentTex})+\\mathrm{i}\\,\\sin(${argumentTex})\\right)`,
    exponentialTex,
    modulus,
    argument
  };
}

export function formatComplex(value: ComplexValue): string {
  const re = Math.abs(value.re) < 1e-10 ? 0 : value.re;
  const im = Math.abs(value.im) < 1e-10 ? 0 : value.im;
  if (re === 0 && im === 0) return "0";
  if (im === 0) return formatNumber(re);
  if (re === 0) return `${formatImaginaryCoefficient(im)}i`;
  const sign = im >= 0 ? "+" : "-";
  return `${formatNumber(re)} ${sign} ${formatImaginaryCoefficient(Math.abs(im))}i`;
}

function complexCartesianTex(value: ComplexValue): string {
  const re = Math.abs(value.re) < 1e-10 ? 0 : value.re;
  const im = Math.abs(value.im) < 1e-10 ? 0 : value.im;
  if (re === 0 && im === 0) return "0";
  if (im === 0) return formatNumber(re);
  if (re === 0) return imaginaryTermTex(im);
  const sign = im >= 0 ? "+" : "-";
  return `${formatNumber(re)} ${sign} ${imaginaryTermTex(Math.abs(im))}`;
}

function formatImaginaryCoefficient(value: number): string {
  const magnitude = Math.abs(value);
  if (Math.abs(magnitude - 1) < 1e-10) return value < 0 ? "-" : "";
  return formatNumber(value);
}

function imaginaryTermTex(value: number): string {
  const sign = value < 0 ? "-" : "";
  const magnitude = Math.abs(value);
  if (Math.abs(magnitude - 1) < 1e-10) return `${sign}\\mathrm{i}`;
  return `${sign}${formatNumber(magnitude)}\\,\\mathrm{i}`;
}

function multiplicationDetails(a: ComplexValue, b: ComplexValue, result: ComplexValue) {
  const left = toForms(a);
  const right = toForms(b);
  const product = toForms(result);
  return [
    {
      title: "In Exponentialform lesen",
      text: "Jede komplexe Zahl wird über Betrag und Argument beschrieben.",
      tex: `z_1=${left.exponentialTex},\\qquad z_2=${right.exponentialTex}`
    },
    {
      title: "Beträge und Winkel",
      text: "Bei der Multiplikation werden Beträge multipliziert und Argumente addiert.",
      tex: `z_1z_2=r_1r_2\\operatorname{exp}\\!\\left(\\mathrm{i}(\\varphi_1+\\varphi_2)\\right)`
    },
    {
      title: "Einsetzen",
      text: "Das Ergebnis wird anschließend wieder in der gewünschten Darstellung ausgegeben.",
      tex: `${formatNumber(left.modulus)}\\cdot ${formatNumber(right.modulus)}\\operatorname{exp}\\!\\left(\\mathrm{i}(${formatNumber(left.argument)}+${formatNumber(right.argument)})\\right)=${product.exponentialTex}=${complexCartesianTex(result)}`
    }
  ];
}

function parseExponential(input: string): ComplexValue | null {
  const normalized = input.replace(/\s+/g, "").replace(/π/g, "pi").replace(/,/g, ".");
  const match = normalized.match(/^(?:(.+?)\*)?exp\(i\*?(.+)\)$/i);
  if (!match) return null;

  try {
    const radiusExpr = match[1] ? normalizeExpression(match[1]) : "1";
    const phiExpr = normalizeExpression(match[2]);
    const radius = Number(math.evaluate(radiusExpr, { pi: Math.PI, e: Math.E }));
    const phi = Number(math.evaluate(phiExpr, { pi: Math.PI, e: Math.E }));
    if (!Number.isFinite(radius) || !Number.isFinite(phi)) return null;
    return { re: radius * Math.cos(phi), im: radius * Math.sin(phi) };
  } catch {
    return null;
  }
}
