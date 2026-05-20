import { expressionToTex, formatNumber, makeEvaluator, makeSequenceEvaluator, math, normalizeExpression } from "./mathCore";

export interface SolutionStep {
  title: string;
  text: string;
  tex?: string;
}

export interface LimitResult {
  ok: true;
  expression: string;
  point: string;
  result: string;
  resultTex: string;
  method: string;
  steps: string[];
  detailedSteps: SolutionStep[];
}

export interface SequenceResult {
  ok: true;
  expression: string;
  values: Array<{ n: number; value: number }>;
  estimate: string;
  steps: string[];
  detailedSteps: SolutionStep[];
}

export interface SeriesResult {
  ok: true;
  expression: string;
  partialSums: Array<{ n: number; value: number }>;
  classification: string;
  steps: string[];
  detailedSteps: SolutionStep[];
}

export interface StandardFailure {
  ok: false;
  message: string;
  details?: string;
}

export function computeLimit(input: string, pointInput: string): LimitResult | StandardFailure {
  try {
    const expression = normalizeExpression(input);
    const point = pointInput.trim().toLowerCase();

    if (["inf", "+inf", "infinity", "∞", "+∞"].includes(point)) {
      const atLarge = [100, 1000, 10000].map((x) => makeEvaluator(expression)(x));
      const stable = stableEstimate(atLarge);
      if (stable !== null) {
        return {
          ok: true,
          expression,
          point: "∞",
          result: `≈ ${formatNumber(stable)}`,
          resultTex: `\\approx ${formatNumber(stable)}`,
          method: "Numerische Grenzwertabschätzung für x -> ∞",
          steps: ["Die Funktion wird bei großen x-Werten ausgewertet.", "Nur stabile Werte werden als Näherung angezeigt."],
          detailedSteps: [
            {
              title: "Grenzübergang lesen",
              text: "Der Grenzwert wird als Verhalten für sehr große positive x-Werte betrachtet.",
              tex: `\\lim_{x\\to\\infty} ${expressionToTex(expression)}`
            },
            {
              title: "Numerische Stützstellen",
              text: "Der Ausdruck wird bei mehreren großen x-Werten ausgewertet.",
              tex: `x\\in\\{100,1000,10000\\}`
            },
            {
              title: "Stabilitätscheck",
              text: "Nur wenn die Werte stabil zusammenliegen, wird eine Näherung ausgegeben.",
              tex: `\\lim_{x\\to\\infty} ${expressionToTex(expression)}\\approx ${formatNumber(stable)}`
            }
          ]
        };
      }
    }

    const pointValue = Number(pointInput.replace(",", "."));
    if (!Number.isFinite(pointValue)) {
      return { ok: false, message: "Bitte verwende einen endlichen Grenzwertpunkt oder ∞." };
    }

    const evaluator = makeEvaluator(expression);
    const direct = evaluator(pointValue);
    if (direct !== null) {
      return {
        ok: true,
        expression,
        point: formatNumber(pointValue),
        result: formatNumber(direct),
        resultTex: formatNumber(direct),
        method: "Direkte Auswertung",
        steps: ["Der Ausdruck ist am Grenzwertpunkt definiert und wird direkt ausgewertet."],
        detailedSteps: [
          {
            title: "Grenzwertpunkt einsetzen",
            text: "Da der Ausdruck an dieser Stelle definiert ist, genügt direkte Auswertung.",
            tex: `\\lim_{x\\to ${formatNumber(pointValue)}} ${expressionToTex(expression)}=${expressionToTex(expression.replace(/\bx\b/g, `(${formatNumber(pointValue)})`))}`
          },
          {
            title: "Ergebnis",
            text: "Der eingesetzte Wert ist bereits der Grenzwert.",
            tex: `\\lim_{x\\to ${formatNumber(pointValue)}} ${expressionToTex(expression)}=${formatNumber(direct)}`
          }
        ]
      };
    }

    const lHopital = tryLHopital(expression, pointValue);
    if (lHopital !== null) {
      return {
        ok: true,
        expression,
        point: formatNumber(pointValue),
        result: formatNumber(lHopital.value),
        resultTex: formatNumber(lHopital.value),
        method: "Einfacher L'Hospital-Standardfall",
        steps: ["Zähler und Nenner gehen gegen 0.", "Zähler und Nenner werden einmal abgeleitet und erneut ausgewertet."],
        detailedSteps: lHopital.detailedSteps
      };
    }

    const samples = [1e-3, 1e-4, 1e-5].map((delta) => evaluator(pointValue + delta));
    const stable = stableEstimate(samples);
    if (stable !== null) {
      return {
        ok: true,
        expression,
        point: formatNumber(pointValue),
        result: `≈ ${formatNumber(stable)}`,
        resultTex: `\\approx ${formatNumber(stable)}`,
        method: "Einseitige numerische Abschätzung",
        steps: ["Direkte Auswertung ist nicht möglich.", "Kleine Abstände rechts vom Grenzwertpunkt liefern eine stabile Näherung."],
        detailedSteps: [
          {
            title: "Direkte Auswertung prüfen",
            text: "Der Ausdruck kann am Grenzwertpunkt nicht direkt ausgewertet werden.",
            tex: `x=${formatNumber(pointValue)}`
          },
          {
            title: "Annäherung von rechts",
            text: "Es werden kleine positive Abstände vom Grenzwertpunkt verwendet.",
            tex: `x=${formatNumber(pointValue)}+h,\\qquad h\\in\\{10^{-3},10^{-4},10^{-5}\\}`
          },
          {
            title: "Stabilitätscheck",
            text: "Eine Näherung wird nur angezeigt, wenn die Werte stabil erscheinen.",
            tex: `\\lim_{x\\to ${formatNumber(pointValue)}} ${expressionToTex(expression)}\\approx ${formatNumber(stable)}`
          }
        ]
      };
    }

    return { ok: false, message: "Keine sichere symbolische Aussage für diesen Grenzwert." };
  } catch (error) {
    return { ok: false, message: "Der Grenzwert konnte nicht gelesen werden.", details: error instanceof Error ? error.message : undefined };
  }
}

export function computeSequence(input: string, count = 40): SequenceResult | StandardFailure {
  try {
    const expression = normalizeExpression(input.replace(/\bx\b/g, "n"));
    const evaluator = makeSequenceEvaluator(expression);
    const values: Array<{ n: number; value: number }> = [];

    for (let n = 1; n <= count; n += 1) {
      const value = evaluator(n);
      if (value !== null && Math.abs(value) < 1e8) values.push({ n, value });
    }

    if (values.length < 4) return { ok: false, message: "Die Folge konnte numerisch nicht stabil ausgewertet werden." };
    const last = values.slice(-6).map((item) => item.value);
    const stable = stableEstimate(last, 1e-3);
    const estimate = stable === null ? "kein stabiler Grenzwert im betrachteten Bereich" : `≈ ${formatNumber(stable)}`;

    return {
      ok: true,
      expression,
      values,
      estimate,
      steps: [
        "Die ersten Folgenglieder werden direkt im Browser berechnet.",
        "Die Grenzwertangabe ist eine numerische Abschätzung aus den letzten berechneten Gliedern."
      ],
      detailedSteps: [
        {
          title: "Folgenterm lesen",
          text: "Der eingegebene Term wird als explizite Folge in n interpretiert.",
          tex: `a_n=${expressionToTex(expression)}`
        },
        {
          title: "Folgenglieder berechnen",
          text: "Die ersten Werte werden numerisch ausgewertet und im Plot dargestellt.",
          tex: `a_1,a_2,\\ldots,a_${values.length}`
        },
        {
          title: "Grenzwert abschätzen",
          text: "Die letzten berechneten Folgenglieder werden auf Stabilität geprüft.",
          tex: `\\lim_{n\\to\\infty}a_n ${estimate.startsWith("≈") ? `\\approx ${estimate.replace("≈ ", "")}` : "\\text{ nicht stabil erkennbar}"}`
        }
      ]
    };
  } catch (error) {
    return { ok: false, message: "Die Folge konnte nicht gelesen werden.", details: error instanceof Error ? error.message : undefined };
  }
}

export function computeSeries(input: string, count = 80): SeriesResult | StandardFailure {
  try {
    const expression = normalizeExpression(input.replace(/\bx\b/g, "n"));
    const evaluator = makeSequenceEvaluator(expression);
    const partialSums: Array<{ n: number; value: number }> = [];
    let sum = 0;

    for (let n = 1; n <= count; n += 1) {
      const value = evaluator(n);
      if (value === null || Math.abs(value) > 1e8) break;
      sum += value;
      partialSums.push({ n, value: sum });
    }

    if (partialSums.length < 6) return { ok: false, message: "Die Reihe konnte numerisch nicht stabil ausgewertet werden." };

    return {
      ok: true,
      expression,
      partialSums,
      classification: classifySeries(expression, evaluator),
      steps: [
        "Partialsummen S_N = a_1 + ... + a_N werden berechnet.",
        "Konvergenzaussagen werden nur für erkannte Standardfälle getroffen."
      ],
      detailedSteps: [
        {
          title: "Reihe lesen",
          text: "Der eingegebene Term wird als Summand a_n einer Reihe interpretiert.",
          tex: `\\sum_{n=1}^{\\infty} ${expressionToTex(expression)}`
        },
        {
          title: "Partialsummen bilden",
          text: "Die Reihe wird über endliche Summen angenähert.",
          tex: `S_N=\\sum_{n=1}^{N}a_n`
        },
        {
          title: "Standardfall prüfen",
          text: "Die Klassifikation wird nur für erkannte Standardreihen oder stabile numerische Muster ausgegeben.",
          tex: `S_${partialSums.length}\\approx ${formatNumber(partialSums[partialSums.length - 1].value)}`
        }
      ]
    };
  } catch (error) {
    return { ok: false, message: "Die Reihe konnte nicht gelesen werden.", details: error instanceof Error ? error.message : undefined };
  }
}

function tryLHopital(expression: string, point: number): { value: number; detailedSteps: SolutionStep[] } | null {
  const raw = math.parse(expression) as unknown as { type?: string; op?: string; args?: unknown[] };
  if (raw.type !== "OperatorNode" || raw.op !== "/" || !raw.args || raw.args.length !== 2) return null;

  try {
    const numerator = raw.args[0] as Parameters<typeof math.derivative>[0];
    const denominator = raw.args[1] as Parameters<typeof math.derivative>[0];
    const n = math.compile(String(numerator)).evaluate({ x: point });
    const d = math.compile(String(denominator)).evaluate({ x: point });
    if (Math.abs(Number(n)) > 1e-7 || Math.abs(Number(d)) > 1e-7) return null;

    const dn = math.derivative(numerator, "x").toString();
    const dd = math.derivative(denominator, "x").toString();
    const nValue = makeEvaluator(dn)(point);
    const dValue = makeEvaluator(dd)(point);
    if (nValue === null || dValue === null || Math.abs(dValue) < 1e-12) return null;
    const value = nValue / dValue;
    return {
      value,
      detailedSteps: [
        {
          title: "Unbestimmte Form erkennen",
          text: "Zähler und Nenner gehen am Grenzwertpunkt beide gegen 0.",
          tex: `\\lim_{x\\to ${formatNumber(point)}} ${expressionToTex(expression)}=\\frac{0}{0}`
        },
        {
          title: "L'Hospital anwenden",
          text: "Für diesen einfachen Standardfall werden Zähler und Nenner einmal getrennt abgeleitet.",
          tex: `\\lim_{x\\to ${formatNumber(point)}}\\frac{g(x)}{h(x)}=\\lim_{x\\to ${formatNumber(point)}}\\frac{g'(x)}{h'(x)}`
        },
        {
          title: "Ableitungen einsetzen",
          text: "Nach dem Ableiten kann der Grenzwert direkt ausgewertet werden.",
          tex: `\\lim_{x\\to ${formatNumber(point)}}\\frac{${expressionToTex(dn)}}{${expressionToTex(dd)}}=${formatNumber(value)}`
        }
      ]
    };
  } catch {
    return null;
  }
}

function classifySeries(expression: string, evaluator: (n: number) => number | null): string {
  const normalized = expression.replace(/\s+/g, "");
  if (normalized === "1/n") return "harmonische Reihe: divergent";
  const pMatch = normalized.match(/^1\/n\^([0-9.]+)$/);
  if (pMatch) {
    const p = Number(pMatch[1]);
    return p > 1 ? `p-Reihe mit p=${formatNumber(p)}: konvergent` : `p-Reihe mit p=${formatNumber(p)}: divergent`;
  }
  if (normalized === "(-1)^(n+1)/n" || normalized === "(-1)^(n-1)/n") {
    return "alternierende harmonische Reihe: konvergent nach Leibniz";
  }

  const terms = [20, 21, 22, 23].map((n) => evaluator(n));
  if (terms.every((value) => value !== null && Math.abs(value) > 1e-12)) {
    const ratios = [terms[1]! / terms[0]!, terms[2]! / terms[1]!, terms[3]! / terms[2]!];
    const average = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
    const stable = ratios.every((value) => Math.abs(value - average) < 1e-3);
    if (stable) return Math.abs(average) < 1 ? `geometrische Reihe mit q≈${formatNumber(average)}: konvergent` : `geometrische Reihe mit q≈${formatNumber(average)}: divergent`;
  }

  return "keine sichere symbolische Klassifikation; Partialsummen als numerische Orientierung";
}

function stableEstimate(values: Array<number | null>, tolerance = 1e-4): number | null {
  const finite = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (finite.length < Math.max(3, values.length - 1)) return null;
  const average = finite.reduce((sum, value) => sum + value, 0) / finite.length;
  const stable = finite.every((value) => Math.abs(value - average) <= tolerance * Math.max(1, Math.abs(average)));
  return stable ? average : null;
}
