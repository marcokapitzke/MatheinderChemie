import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { integralExamples, type RouteId } from "../data/modules";
import { computeIntegral, computeNumericDefiniteIntegral } from "../lib/integrals";
import { expressionToTex, formatNumber, makeEvaluator, sampleExpression } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";
import { CalculatorLayout, DetailedSteps, ExampleButtons, FormulaPreview, Steps } from "./CalculatorLayout";
import { MathFormula } from "./MathFormula";
import { PlotPanel, type Trace } from "./PlotPanel";

interface Props {
  onNavigate: (route: RouteId) => void;
}

export function IntegralCalculator({ onNavigate }: Props) {
  const notation = useNotation();
  const [input, setInput] = useState("exp(-0.4*x)*x^3");
  const [integralMode, setIntegralMode] = useState<"indefinite" | "definite">("indefinite");
  const [lowerBound, setLowerBound] = useState("0");
  const [upperBound, setUpperBound] = useState("8");
  const result = useMemo(() => computeIntegral(input), [input]);
  const parsedBounds = useMemo(() => {
    const lower = Number(lowerBound.replace(",", "."));
    const upper = Number(upperBound.replace(",", "."));
    return { lower, upper, ok: Number.isFinite(lower) && Number.isFinite(upper) && Math.abs(upper - lower) > 1e-12 };
  }, [lowerBound, upperBound]);
  const definite = useMemo(() => {
    if (!result.ok || integralMode !== "definite") return null;
    const { lower, upper } = parsedBounds;
    if (!parsedBounds.ok) return { ok: false as const };
    const antiderivative = makeEvaluator(result.antiderivativeExpression);
    const lowerValue = antiderivative(lower);
    const upperValue = antiderivative(upper);
    if (lowerValue === null || upperValue === null) return { ok: false as const };
    const from = Math.min(lower, upper);
    const to = Math.max(lower, upper);
    return {
      ok: true as const,
      lower,
      upper,
      value: upperValue - lowerValue,
      area: sampleExpression(result.input, from, to, 220)
    };
  }, [integralMode, parsedBounds, result]);

  const numericDefinite = useMemo(() => {
    if (integralMode !== "definite" || !parsedBounds.ok) return null;
    return computeNumericDefiniteIntegral(input, parsedBounds.lower, parsedBounds.upper);
  }, [input, integralMode, parsedBounds]);

  const plotTraces = useMemo<Trace[]>(() => {
    if (numericDefinite?.ok && (!result.ok || !definite?.ok)) {
      const evaluator = makeEvaluator(numericDefinite.input);
      const lowerY = evaluator(numericDefinite.lower) ?? 0;
      const upperY = evaluator(numericDefinite.upper) ?? 0;
      return [
        {
          x: numericDefinite.area.xs,
          y: numericDefinite.area.ys,
          name: "numerische Fläche",
          color: "#8b1e3f",
          mode: "lines",
          fill: "tozeroy",
          fillColor: "rgba(139, 30, 63, 0.2)",
          width: 1.2
        },
        { x: numericDefinite.window.xs, y: numericDefinite.window.ys, name: "f(x)", color: "#09213f" },
        { x: [numericDefinite.lower, numericDefinite.lower], y: [0, lowerY], name: "untere Grenze", color: "#0f6b5c", dash: "dash", width: 1.6 },
        { x: [numericDefinite.upper, numericDefinite.upper], y: [0, upperY], name: "obere Grenze", color: "#0f6b5c", dash: "dash", width: 1.6 }
      ];
    }
    if (!result.ok) return [];
    if (definite?.ok) {
      const from = Math.min(definite.lower, definite.upper);
      const to = Math.max(definite.lower, definite.upper);
      const padding = Math.max((to - from) * 0.18, 0.75);
      const windowSample = sampleExpression(result.input, from - padding, to + padding, 320);
      const evaluator = makeEvaluator(result.input);
      const lowerY = evaluator(definite.lower) ?? 0;
      const upperY = evaluator(definite.upper) ?? 0;
      return [
        {
          x: definite.area.xs,
          y: definite.area.ys,
          name: "orientierte Fläche",
          color: "#8b1e3f",
          mode: "lines",
          fill: "tozeroy",
          fillColor: "rgba(139, 30, 63, 0.2)",
          width: 1.2
        },
        { x: windowSample.xs, y: windowSample.ys, name: "f(x)", color: "#09213f" },
        { x: [definite.lower, definite.lower], y: [0, lowerY], name: "untere Grenze", color: "#0f6b5c", dash: "dash", width: 1.6 },
        { x: [definite.upper, definite.upper], y: [0, upperY], name: "obere Grenze", color: "#0f6b5c", dash: "dash", width: 1.6 }
      ];
    }
    const traces: Trace[] = [];
    traces.push(
      { x: result.plot.f.xs, y: result.plot.f.ys, name: "f(x)", color: "#09213f" },
      { x: result.plot.antiderivative.xs, y: result.plot.antiderivative.ys, name: "F(x)", color: "#8b1e3f" }
    );
    return traces;
  }, [definite, numericDefinite, result]);

  return (
    <CalculatorLayout
      route="integrals"
      title="Integrationsrechner"
      eyebrow="Integralrechnung"
      chapter="Kapitel 7: Integralrechnung"
      chapterUrl="https://link.springer.com/chapter/10.1007/978-3-662-63139-3_7"
      description="Löst unbestimmte und bestimmte Standardintegrale mit Rechenweg, Flächenvisualisierung und buchnaher Formeldarstellung."
      onNavigate={onNavigate}
      supported={[
        "Potenzregel und Polynome",
        "exp(ax+b), sin(ax+b), cos(ax+b)",
        "p(x) exp(ax+b) bis Grad 6",
        "1/x und 1/(ax+b)",
        "einfache lineare rationale Funktionen",
        "bestimmte Integrale mit Flächenvisualisierung",
        "numerische bestimmte Integrale mit Stabilitätscheck"
      ]}
      aside={
        <ExampleButtons
          examples={integralExamples}
          valueKey="value"
          onPick={(example) => {
            setInput(example.value);
            const numericExample = example as typeof example & { mode?: "definite"; lower?: string; upper?: string };
            if (numericExample.mode === "definite") {
              setIntegralMode("definite");
              if (numericExample.lower) setLowerBound(numericExample.lower);
              if (numericExample.upper) setUpperBound(numericExample.upper);
            }
          }}
        />
      }
    >
      <div className="input-card">
        <label htmlFor="integral-input">Integrand f(x)</label>
        <div className="input-row">
          <input
            id="integral-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="z. B. exp(-0.4*x)*x^3"
          />
          <button type="button" className="icon-button" onClick={() => setInput("exp(-0.4*x)*x^3")} title="Zurücksetzen">
            <RotateCcw size={18} />
          </button>
        </div>
        <FormulaPreview tex={`f(x)=${expressionToTex(input, notation)}`} />
        <div className="mode-toggle" role="radiogroup" aria-label="Integralart">
          <button
            type="button"
            className={integralMode === "indefinite" ? "is-active" : ""}
            onClick={() => setIntegralMode("indefinite")}
          >
            Stammfunktion
          </button>
          <button type="button" className={integralMode === "definite" ? "is-active" : ""} onClick={() => setIntegralMode("definite")}>
            Bestimmtes Integral
          </button>
        </div>
        {integralMode === "definite" ? (
          <div className="range-grid">
            <label>
              Untere Grenze
              <input value={lowerBound} onChange={(event) => setLowerBound(event.target.value)} inputMode="decimal" />
            </label>
            <label>
              Obere Grenze
              <input value={upperBound} onChange={(event) => setUpperBound(event.target.value)} inputMode="decimal" />
            </label>
          </div>
        ) : null}
      </div>

      {result.ok || numericDefinite?.ok ? (
        <>
          <section className="result-card">
            <p className="eyebrow">Ergebnis</p>
            {integralMode === "definite" && definite?.ok ? (
              <MathFormula
                block
                tex={`\\int_{${formatNumber(definite.lower)}}^{${formatNumber(definite.upper)}} ${expressionToTex(input, notation)}\\,\\mathrm{d}x=${formatNumber(definite.value, 8)}`}
              />
            ) : integralMode === "definite" && numericDefinite?.ok ? (
              <>
                <MathFormula
                  block
                  tex={`\\int_{${formatNumber(numericDefinite.lower)}}^{${formatNumber(numericDefinite.upper)}} ${expressionToTex(numericDefinite.input, notation)}\\,\\mathrm{d}x\\approx ${formatNumber(numericDefinite.value, 8)}`}
                />
                <p className="precision-note">
                  Geschätzter numerischer Fehler: {formatNumber(numericDefinite.errorEstimate, 4)}
                </p>
              </>
            ) : (
              <MathFormula
                block
                tex={
                  result.ok
                    ? `\\int ${expressionToTex(result.input, notation)}\\,\\mathrm{d}x=${expressionToTex(result.antiderivativeExpression, notation)}+C`
                    : "\\text{Keine symbolische Stammfunktion verfügbar.}"
                }
              />
            )}
            {integralMode === "definite" && definite && !definite.ok && !numericDefinite?.ok ? (
              <p className="warning-text">Bitte gib zwei verschiedene numerische Grenzen ein.</p>
            ) : null}
            <div className="pill-row">
              <span>{integralMode === "definite" && numericDefinite?.ok && !definite?.ok ? numericDefinite.method : result.ok ? result.method : "Bestimmtes Integral"}</span>
              {integralMode === "definite" ? <span>Fläche wird orientiert dargestellt</span> : null}
            </div>
          </section>

          <section className="result-card">
            <p className="eyebrow">Lösungsweg</p>
            {integralMode === "definite" && numericDefinite?.ok && !definite?.ok ? (
              <>
                <Steps steps={numericDefinite.steps} />
                <DetailedSteps steps={numericDefinite.detailedSteps} />
              </>
            ) : result.ok ? (
              <>
                <Steps steps={result.steps} />
                <DetailedSteps steps={result.detailedSteps} />
              </>
            ) : null}
          </section>

          <section className="result-card result-card--wide">
            <p className="eyebrow">Visualisierung</p>
            <PlotPanel
              traces={plotTraces}
              title={integralMode === "definite" ? "Integrand mit Grenzen und orientierter Fläche" : "Integrand und eine Stammfunktion"}
              height={430}
              variant="integral"
            />
          </section>
        </>
      ) : (
        <section className="message-card message-card--warning">
          <h2>Nicht unterstützt</h2>
          <p>{result.message}</p>
          {result.details ? <small>{result.details}</small> : null}
          {integralMode === "definite" && numericDefinite && !numericDefinite.ok ? (
            <small>{numericDefinite.message}</small>
          ) : null}
        </section>
      )}
    </CalculatorLayout>
  );
}
