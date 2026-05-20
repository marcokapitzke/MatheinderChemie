import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { computeDerivative } from "../lib/calculus";
import { expressionToTex } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";
import { derivativeExamples, type RouteId } from "../data/modules";
import { CalculatorLayout, DetailedSteps, ExampleButtons, FormulaPreview, Steps } from "./CalculatorLayout";
import { MathFormula } from "./MathFormula";
import { PlotPanel } from "./PlotPanel";

interface Props {
  onNavigate: (route: RouteId) => void;
}

export function DerivativeCalculator({ onNavigate }: Props) {
  const notation = useNotation();
  const [input, setInput] = useState("x*exp(-0.5*x)");
  const [order, setOrder] = useState(2);
  const result = useMemo(() => computeDerivative(input, order), [input, order]);

  return (
    <CalculatorLayout
      route="derivatives"
      title="Ableitungsrechner"
      eyebrow="Differentialrechnung"
      chapter="Kapitel 6: Differenzialrechnung"
      chapterUrl="https://link.springer.com/chapter/10.1007/978-3-662-63139-3_6"
      description="Berechnet Standardableitungen, höhere Ableitungen und zeigt die verwendeten Regeln mit mathematischen Schritten."
      onNavigate={onNavigate}
      supported={[
        "Polynome und rationale Funktionen",
        "exp(x), e^x, ln(x), log(x)",
        "sin(x), cos(x), tan(x)",
        "einfache Produkte, Quotienten und Verkettungen",
        "höhere Ableitungen bis zur gewählten Ordnung"
      ]}
      aside={
        <ExampleButtons
          examples={derivativeExamples}
          valueKey="value"
          onPick={(example) => setInput(example.value)}
        />
      }
    >
      <div className="input-card">
        <label htmlFor="derivative-input">Funktion f(x)</label>
        <div className="input-row">
          <input
            id="derivative-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="z. B. x*exp(-0.5*x)"
          />
          <button type="button" className="icon-button" onClick={() => setInput("x*exp(-0.5*x)")} title="Zurücksetzen">
            <RotateCcw size={18} />
          </button>
        </div>
        <FormulaPreview tex={`f(x)=${expressionToTex(input, notation)}`} />
        <label htmlFor="derivative-order">Höhere Ableitungen</label>
        <input
          id="derivative-order"
          type="range"
          min={1}
          max={4}
          value={order}
          onChange={(event) => setOrder(Number(event.target.value))}
        />
        <span className="range-label">bis zur {order}. Ableitung</span>
      </div>

      {result.ok ? (
        <>
          <section className="result-card">
            <p className="eyebrow">Ergebnis</p>
            <MathFormula block tex={`f(x)=${expressionToTex(result.input, notation)}`} />
            <MathFormula block tex={`f'(x)=${result.derivativeTex}`} />
            <div className="pill-row">
              {result.rules.map((rule) => (
                <span key={rule}>{rule}</span>
              ))}
            </div>
          </section>

          <section className="result-card">
            <p className="eyebrow">Höhere Ableitungen</p>
            <div className="formula-list">
              {result.higherDerivatives.map((item) => (
                <MathFormula key={item.order} block tex={`f^{(${item.order})}(x)=${item.tex}`} />
              ))}
            </div>
          </section>

          <section className="result-card">
            <p className="eyebrow">Lösungsweg</p>
            <Steps steps={result.steps} />
            <DetailedSteps steps={result.detailedSteps} />
          </section>

          <section className="result-card result-card--wide">
            <p className="eyebrow">Visualisierung</p>
            <PlotPanel
              traces={[
                { x: result.plot.f.xs, y: result.plot.f.ys, name: "f(x)", color: "#09213f" },
                { x: result.plot.derivative.xs, y: result.plot.derivative.ys, name: "f'(x)", color: "#8b1e3f" }
              ]}
              title="Funktion und erste Ableitung"
              height={420}
              variant="analysis"
            />
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
