import { useMemo, useState } from "react";
import { complexExamples, type RouteId } from "../data/modules";
import { computeComplex, parseComplexInput, toFormsWithNotation, type ComplexOperation } from "../lib/complexNumbers";
import { expressionToTex, formatNumber } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";
import { CalculatorLayout, DetailedSteps, Steps } from "./CalculatorLayout";
import { PlotPanel, type Trace } from "./PlotPanel";
import { MathFormula } from "./MathFormula";

interface Props {
  onNavigate: (route: RouteId) => void;
}

const operationLabels: Record<ComplexOperation, string> = {
  add: "Addition",
  subtract: "Subtraktion",
  multiply: "Multiplikation",
  divide: "Division",
  power: "Potenz"
};

export function ComplexCalculator({ onNavigate }: Props) {
  const notation = useNotation();
  const [a, setA] = useState("2*exp(i*pi/6)");
  const [b, setB] = useState("3*exp(i*pi/3)");
  const [operation, setOperation] = useState<ComplexOperation>("multiply");
  const [power, setPower] = useState(2);
  const [converterInput, setConverterInput] = useState("1 + i");
  const [activeForm, setActiveForm] = useState<"cartesian" | "polar" | "exponential">("exponential");
  const result = useMemo(() => computeComplex(a, b, operation, power), [a, b, operation, power]);
  const converterValue = useMemo(() => parseComplexInput(converterInput), [converterInput]);
  const converterForms = useMemo(
    () => (converterValue ? toFormsWithNotation(converterValue, notation.exponential) : null),
    [converterValue, notation.exponential]
  );
  const resultForms = useMemo(
    () => (result.ok ? toFormsWithNotation(result.result, notation.exponential) : null),
    [notation.exponential, result]
  );
  const activeFormula =
    activeForm === "cartesian"
      ? resultForms?.cartesianTex
      : activeForm === "polar"
        ? resultForms?.polarTex
        : resultForms?.exponentialTex;
  const complexTraces = useMemo<Trace[]>(() => {
    if (!result.ok) return [];
    const traces: Trace[] = [];
    if (operation === "multiply") {
      const phi1 = Math.atan2(result.a.im, result.a.re);
      const phi2 = Math.atan2(result.b.im, result.b.re);
      traces.push(
        angleArcTrace(0.72, 0, phi1, "φ₁", "#09213f"),
        angleArcTrace(1.02, phi1, phi1 + phi2, "φ₂ addiert", "#8b1e3f")
      );
    }
    traces.push(
      unitCircleTrace(),
      { x: [0, result.a.re], y: [0, result.a.im], name: "z₁", color: "#09213f", mode: "lines+markers" },
      { x: [0, result.b.re], y: [0, result.b.im], name: "z₂", color: "#546a7b", mode: "lines+markers" },
      { x: [0, result.result.re], y: [0, result.result.im], name: "Ergebnis", color: "#8b1e3f", mode: "lines+markers", width: 3 }
    );
    return traces;
  }, [operation, result]);

  return (
    <CalculatorLayout
      route="complex"
      title="Komplexe Zahlen"
      eyebrow="Algebra & Gaußsche Ebene"
      chapter="Kapitel 4: Komplexe Zahlen"
      chapterUrl="https://link.springer.com/chapter/10.1007/978-3-662-63139-3_4"
      description="Rechnet in kartesischer, polarer und exponentieller Form und visualisiert die Gaußsche Zahlenebene."
      onNavigate={onNavigate}
      supported={[
        "kartesisch: a + bi, a - bi",
        "exponentiell: r*exp(i*phi), exp(i*phi)",
        "Addition, Subtraktion, Multiplikation, Division",
        "einfache ganzzahlige Potenzen",
        "Ausgabe in kartesischer, Polar- und Exponentialform"
      ]}
      aside={
        <details className="examples" open>
          <summary>Beispielaufgaben</summary>
          <div className="example-grid">
            {complexExamples.map((example) => (
              <button
                type="button"
                key={example.label}
                onClick={() => {
                  setA(example.a);
                  setB(example.b);
                  setOperation(example.operation);
                }}
              >
                <strong>{example.label}</strong>
                <span>
                  <MathFormula tex={expressionToTex(example.a, notation)} /> | <MathFormula tex={expressionToTex(example.b, notation)} />
                </span>
                <small>{example.note}</small>
              </button>
            ))}
          </div>
        </details>
      }
    >
      <div className="input-card">
        <div className="range-grid">
          <label>
            z₁
            <input value={a} onChange={(event) => setA(event.target.value)} />
          </label>
          <label>
            z₂
            <input value={b} onChange={(event) => setB(event.target.value)} disabled={operation === "power"} />
          </label>
        </div>
        <label htmlFor="complex-operation">Operation</label>
        <select id="complex-operation" value={operation} onChange={(event) => setOperation(event.target.value as ComplexOperation)}>
          {Object.entries(operationLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {operation === "power" ? (
          <label>
            Exponent
            <input type="number" min={2} max={8} value={power} onChange={(event) => setPower(Number(event.target.value))} />
          </label>
        ) : null}
      </div>

      {result.ok ? (
        <>
          <section className="result-card">
            <p className="eyebrow">Ergebnis</p>
            <div className="complex-output">
              <div className="form-tabs" role="tablist" aria-label="Darstellung wählen">
                {[
                  ["cartesian", "Kartesisch"],
                  ["polar", "Polar"],
                  ["exponential", notation.exponential === "euler" ? "Euler" : "exp"]
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={activeForm === value}
                    className={activeForm === value ? "is-active" : ""}
                    onClick={() => setActiveForm(value as typeof activeForm)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="complex-headline">
                {activeFormula ? <MathFormula block tex={activeFormula} /> : null}
              </div>
              {resultForms ? (
                <div className="complex-facts">
                  <span>Betrag: {formatNumber(resultForms.modulus)}</span>
                  <span>Argument: {formatNumber(resultForms.argument)} rad</span>
                </div>
              ) : null}
            </div>
          </section>

          <section className="result-card">
            <p className="eyebrow">Formkonverter</p>
            <label>
              Kartesische Eingabe
              <input value={converterInput} onChange={(event) => setConverterInput(event.target.value)} placeholder="z. B. 2 - 3i" />
            </label>
            {converterForms ? (
              <div className="converter-output">
                <MathFormula block tex={`${converterForms.cartesianTex}\\approx ${converterForms.exponentialTex}`} />
                <MathFormula block tex={`${converterForms.cartesianTex}\\approx ${converterForms.polarTex}`} />
                <p>
                  Betrag {formatNumber(converterForms.modulus)}, Argument {formatNumber(converterForms.argument)} rad
                </p>
              </div>
            ) : (
              <p className="warning-text">Bitte verwende eine einfache kartesische Form wie 2 + 3i.</p>
            )}
          </section>

          <section className="result-card">
            <p className="eyebrow">Lösungsweg</p>
            <Steps steps={result.steps} />
            <DetailedSteps steps={result.detailedSteps} />
          </section>

          <section className="result-card result-card--wide">
            <p className="eyebrow">Gaußsche Zahlenebene</p>
            <PlotPanel
              traces={complexTraces}
              markers={[
                { x: result.a.re, y: result.a.im, label: "z₁", color: "#09213f" },
                { x: result.b.re, y: result.b.im, label: "z₂", color: "#546a7b" },
                { x: result.result.re, y: result.result.im, label: "z", color: "#8b1e3f" }
              ]}
              title={operation === "multiply" ? "Multiplikation: Beträge multiplizieren, Winkel addieren" : "Komplexe Zahlenebene"}
              xTitle="Re(z)"
              yTitle="Im(z)"
              equalAspect
              height={440}
              variant="complex"
              showEndLabels={false}
            />
          </section>
        </>
      ) : (
        <section className="message-card message-card--warning">
          <h2>Nicht unterstützt</h2>
          <p>{result.message}</p>
        </section>
      )}
    </CalculatorLayout>
  );
}

function angleArcTrace(radius: number, start: number, end: number, name: string, color: string): Trace {
  const steps = 72;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = start + ((end - start) * index) / steps;
    xs.push(radius * Math.cos(t));
    ys.push(radius * Math.sin(t));
  }
  return { x: xs, y: ys, name, color, mode: "lines", dash: "dot", width: 2 };
}

function unitCircleTrace(): Trace {
  const steps = 160;
  const xs: number[] = [];
  const ys: number[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    xs.push(Math.cos(angle));
    ys.push(Math.sin(angle));
  }
  return { x: xs, y: ys, name: "|z| = 1", color: "#c4cfdd", mode: "lines", dash: "dot", width: 1.4 };
}
