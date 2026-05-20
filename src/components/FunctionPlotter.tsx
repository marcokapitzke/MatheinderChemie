import { useMemo, useState } from "react";
import { plotExamples, type RouteId } from "../data/modules";
import { analyzeFunction, type PointResult } from "../lib/numericAnalysis";
import { expressionToTex, formatNumber } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";
import { CalculatorLayout, ExampleButtons, FormulaPreview } from "./CalculatorLayout";
import { MathFormula } from "./MathFormula";
import { PlotPanel } from "./PlotPanel";

interface Props {
  onNavigate: (route: RouteId) => void;
}

export function FunctionPlotter({ onNavigate }: Props) {
  const notation = useNotation();
  const [input, setInput] = useState("x^3 - 3*x");
  const [min, setMin] = useState(-4);
  const [max, setMax] = useState(4);
  const result = useMemo(() => analyzeFunction(input, min, max), [input, min, max]);

  return (
    <CalculatorLayout
      route="plotter"
      title="Funktionsplotter & Kurvendiskussion"
      eyebrow="Numerische Analyse"
      chapter="Kapitel 3: Funktionen"
      chapterUrl="https://link.springer.com/chapter/10.1007/978-3-662-63139-3_3"
      description="Plottet Funktionen und markiert Nullstellen, Extrempunkte und Wendepunkte als numerische Näherungen."
      onNavigate={onNavigate}
      supported={[
        "reell auswertbare Funktionen f(x)",
        "einstellbarer Wertebereich",
        "Nullstellen durch Vorzeichenwechsel",
        "Extrema über f'(x) und Wendepunkte über f''(x)",
        "Monotonie- und Krümmungsintervalle als Näherung"
      ]}
      aside={<ExampleButtons examples={plotExamples} valueKey="value" onPick={(example) => setInput(example.value)} />}
    >
      <div className="input-card">
        <label htmlFor="plot-input">Funktion f(x)</label>
        <input id="plot-input" value={input} onChange={(event) => setInput(event.target.value)} />
        <FormulaPreview tex={`f(x)=${expressionToTex(input, notation)}`} />
        <div className="range-grid">
          <label>
            x min
            <input type="number" value={min} onChange={(event) => setMin(Number(event.target.value))} />
          </label>
          <label>
            x max
            <input type="number" value={max} onChange={(event) => setMax(Number(event.target.value))} />
          </label>
        </div>
      </div>

      {result.ok ? (
        <>
          <section className="result-card">
            <p className="eyebrow">Symbolische Ableitungen</p>
            <MathFormula block tex={`f(x)=${expressionToTex(result.expression, notation)}`} />
            <MathFormula block tex={`f'(x)=${expressionToTex(result.derivative, notation)}`} />
            <MathFormula block tex={`f''(x)=${expressionToTex(result.secondDerivative, notation)}`} />
          </section>

          <section className="result-card result-card--wide">
            <p className="eyebrow">Interaktiver Plot</p>
            <PlotPanel
              traces={[
                { x: result.plot.f.xs, y: result.plot.f.ys, name: "f(x)", color: "#09213f" },
                { x: result.plot.derivative.xs, y: result.plot.derivative.ys, name: "f'(x)", color: "#8b1e3f" },
                { x: result.plot.secondDerivative.xs, y: result.plot.secondDerivative.ys, name: "f''(x)", color: "#546a7b" }
              ]}
              markers={[
                ...result.roots.map((point) => ({ x: point.x, y: point.y, label: "N", color: "#8b1e3f" })),
                ...result.extrema.map((point) => ({ x: point.x, y: point.y, label: "E", color: "#0f6b5c" })),
                ...result.inflections.map((point) => ({ x: point.x, y: point.y, label: "W", color: "#b45a3c" }))
              ]}
              title={`Analyse im Intervall [${formatNumber(min)}, ${formatNumber(max)}]`}
              height={460}
              variant="analysis"
            />
          </section>

          <section className="analysis-grid">
            <AnalysisList title="Nullstellen" points={result.roots} />
            <AnalysisList title="Extrempunkte" points={result.extrema} />
            <AnalysisList title="Wendepunkte" points={result.inflections} />
          </section>

          <section className="result-card">
            <p className="eyebrow">Intervalle</p>
            <div className="interval-grid">
              <div>
                <h3>Monotonie</h3>
                {result.monotonicity.map((interval) => (
                  <p key={`${interval.from}-${interval.to}-${interval.label}`}>
                    [{formatNumber(interval.from ?? min)}, {formatNumber(interval.to ?? max)}]: {interval.label}
                  </p>
                ))}
              </div>
              <div>
                <h3>Krümmung</h3>
                {result.curvature.map((interval) => (
                  <p key={`${interval.from}-${interval.to}-${interval.label}`}>
                    [{formatNumber(interval.from ?? min)}, {formatNumber(interval.to ?? max)}]: {interval.label}
                  </p>
                ))}
              </div>
            </div>
            <p className="warning-text">{result.warning}</p>
          </section>
        </>
      ) : (
        <section className="message-card message-card--warning">
          <h2>Nicht unterstützt</h2>
          <p>{result.message}</p>
          {result.details ? <small>{result.details}</small> : null}
        </section>
      )}
    </CalculatorLayout>
  );
}

function AnalysisList({ title, points }: { title: string; points: PointResult[] }) {
  return (
    <article className="result-card">
      <p className="eyebrow">{title}</p>
      {points.length ? (
        <ul className="formula-point-list">
          {points.map((point) => (
            <li key={`${point.kind}-${point.x}-${point.y}`}>
              <MathFormula tex={pointToTex(point)} />
            </li>
          ))}
        </ul>
      ) : (
        <p>Keine Punkte im betrachteten Intervall gefunden.</p>
      )}
    </article>
  );
}

function pointToTex(point: PointResult) {
  return `\\text{${point.kind}:}\\quad x\\approx ${formatNumber(point.x)},\\; f(x)\\approx ${formatNumber(point.y)}`;
}
