import { useMemo, useState } from "react";
import { limitExamples, type RouteId } from "../data/modules";
import { computeLimit, computeSequence, computeSeries } from "../lib/sequences";
import { expressionToTex } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";
import { CalculatorLayout, DetailedSteps, FormulaPreview, Steps } from "./CalculatorLayout";
import { MathFormula } from "./MathFormula";
import { PlotPanel } from "./PlotPanel";

interface Props {
  onNavigate: (route: RouteId) => void;
}

type Mode = "limit" | "sequence" | "series";

export function LimitsSequencesSeries({ onNavigate }: Props) {
  const notation = useNotation();
  const [mode, setMode] = useState<Mode>("limit");
  const [expression, setExpression] = useState("sin(x)/x");
  const [point, setPoint] = useState("0");

  const limitResult = useMemo(() => (mode === "limit" ? computeLimit(expression, point) : null), [expression, mode, point]);
  const sequenceResult = useMemo(() => (mode === "sequence" ? computeSequence(expression) : null), [expression, mode]);
  const seriesResult = useMemo(() => (mode === "series" ? computeSeries(expression) : null), [expression, mode]);

  return (
    <CalculatorLayout
      route="limits"
      title="Grenzwerte, Folgen & Reihen"
      eyebrow="Konvergenz"
      chapter="Kapitel 5: Folgen, Reihen und Grenzwerte"
      chapterUrl="https://link.springer.com/chapter/10.1007/978-3-662-63139-3_5"
      description="Berechnet Standardgrenzwerte, visualisiert Folgen und zeigt Partialsummen für Reihen."
      onNavigate={onNavigate}
      supported={[
        "Grenzwerte an endlichen Punkten und x → ∞",
        "einfache L'Hospital-Fälle vom Typ 0/0",
        "explizite Folgen a_n",
        "Partialsummen für Reihen",
        "geometrische Reihe, harmonische Reihe, p-Reihe, alternierende harmonische Reihe"
      ]}
      aside={
        <details className="examples" open>
          <summary>Beispielaufgaben</summary>
          <div className="example-grid">
            {limitExamples.map((example) => (
              <button
                type="button"
                key={example.label}
                onClick={() => {
                  setExpression(example.expression);
                  if (example.point === "sequence") setMode("sequence");
                  else if (example.point === "series") setMode("series");
                  else {
                    setMode("limit");
                    setPoint(example.point);
                  }
                }}
              >
                <strong>{example.label}</strong>
                <span className="example-formula">
                  <MathFormula
                    tex={
                      example.point === "series"
                        ? `\\sum_{n=1}^{\\infty} ${expressionToTex(example.expression.replace(/\bx\b/g, "n"), notation)}`
                        : example.point === "sequence"
                          ? `a_n=${expressionToTex(example.expression.replace(/\bx\b/g, "n"), notation)}`
                          : `\\lim_{x\\to ${example.point}} ${expressionToTex(example.expression, notation)}`
                    }
                  />
                </span>
                <small>{example.note}</small>
              </button>
            ))}
          </div>
        </details>
      }
    >
      <div className="input-card">
        <div className="segmented" role="tablist" aria-label="Modus">
          <button type="button" className={mode === "limit" ? "is-active" : ""} onClick={() => setMode("limit")}>
            Grenzwert
          </button>
          <button type="button" className={mode === "sequence" ? "is-active" : ""} onClick={() => setMode("sequence")}>
            Folge
          </button>
          <button type="button" className={mode === "series" ? "is-active" : ""} onClick={() => setMode("series")}>
            Reihe
          </button>
        </div>
        <label htmlFor="limit-expression">{mode === "limit" ? "Ausdruck f(x)" : "Term a_n"}</label>
        <input id="limit-expression" value={expression} onChange={(event) => setExpression(event.target.value)} />
        <FormulaPreview
          tex={
            mode === "limit"
              ? `f(x)=${expressionToTex(expression, notation)}`
              : mode === "sequence"
                ? `a_n=${expressionToTex(expression.replace(/\bx\b/g, "n"), notation)}`
                : `\\sum_{n=1}^{\\infty} ${expressionToTex(expression.replace(/\bx\b/g, "n"), notation)}`
          }
        />
        {mode === "limit" ? (
          <label>
            x gegen
            <input value={point} onChange={(event) => setPoint(event.target.value)} placeholder="0 oder ∞" />
          </label>
        ) : null}
      </div>

      {mode === "limit" && limitResult ? (
        limitResult.ok ? (
          <section className="result-card">
            <p className="eyebrow">Grenzwert</p>
            <MathFormula block tex={`\\lim_{x\\to ${limitResult.point}} ${expressionToTex(limitResult.expression, notation)} = ${limitResult.resultTex}`} />
            <div className="pill-row">
              <span>{limitResult.method}</span>
            </div>
            <Steps steps={limitResult.steps} />
            <DetailedSteps steps={limitResult.detailedSteps} />
          </section>
        ) : (
          <Message message={limitResult.message} details={limitResult.details} />
        )
      ) : null}

      {mode === "sequence" && sequenceResult ? (
        sequenceResult.ok ? (
          <>
            <section className="result-card">
              <p className="eyebrow">Folge</p>
              <MathFormula block tex={`a_n=${expressionToTex(sequenceResult.expression, notation)}`} />
              <p>Grenzwertabschätzung: {sequenceResult.estimate}</p>
              <DetailedSteps steps={sequenceResult.detailedSteps} />
            </section>
            <section className="result-card result-card--wide">
              <p className="eyebrow">Numerische Darstellung</p>
              <PlotPanel
                traces={[
                  {
                    x: sequenceResult.values.map((item) => item.n),
                    y: sequenceResult.values.map((item) => item.value),
                    name: "a_n",
                    color: "#09213f",
                    mode: "lines+markers"
                  }
                ]}
                title="Folgenglieder"
                xTitle="n"
                yTitle="a_n"
                height={410}
                variant="sequence"
              />
            </section>
          </>
        ) : (
          <Message message={sequenceResult.message} details={sequenceResult.details} />
        )
      ) : null}

      {mode === "series" && seriesResult ? (
        seriesResult.ok ? (
          <>
            <section className="result-card">
              <p className="eyebrow">Reihe</p>
              <MathFormula block tex={`\\sum_{n=1}^{\\infty} ${expressionToTex(seriesResult.expression, notation)}`} />
              <p>{seriesResult.classification}</p>
              <DetailedSteps steps={seriesResult.detailedSteps} />
            </section>
            <section className="result-card result-card--wide">
              <p className="eyebrow">Partialsummen</p>
              <PlotPanel
                traces={[
                  {
                    x: seriesResult.partialSums.map((item) => item.n),
                    y: seriesResult.partialSums.map((item) => item.value),
                    name: "S_N",
                    color: "#8b1e3f",
                    mode: "lines+markers"
                  }
                ]}
                title="Konvergenzvisualisierung über Partialsummen"
                xTitle="N"
                yTitle="S_N"
                height={410}
                variant="sequence"
              />
            </section>
          </>
        ) : (
          <Message message={seriesResult.message} details={seriesResult.details} />
        )
      ) : null}
    </CalculatorLayout>
  );
}

function Message({ message, details }: { message: string; details?: string }) {
  return (
    <section className="message-card message-card--warning">
      <h2>Nicht unterstützt</h2>
      <p>{message}</p>
      {details ? <small>{details}</small> : null}
    </section>
  );
}
