import type { ReactNode } from "react";
import { ArrowLeft, BookOpen, Info } from "lucide-react";
import type { RouteId } from "../data/modules";
import { MathFormula } from "./MathFormula";
import { expressionToTex } from "../lib/mathCore";
import { useNotation } from "../lib/notationContext";

interface CalculatorLayoutProps {
  route: RouteId;
  title: string;
  eyebrow: string;
  chapter: string;
  chapterUrl?: string;
  description: string;
  children: ReactNode;
  aside: ReactNode;
  supported: string[];
  onNavigate: (route: RouteId) => void;
}

export function CalculatorLayout({
  route,
  title,
  eyebrow,
  chapter,
  chapterUrl,
  description,
  children,
  aside,
  supported,
  onNavigate
}: CalculatorLayoutProps) {
  return (
    <main className={`module-page module-page--${route}`}>
      <section className="module-hero section-shell">
        <button className="quiet-link" type="button" onClick={() => onNavigate("home")}>
          <ArrowLeft size={16} />
          Zur Startseite
        </button>
        <p className="eyebrow">{eyebrow}</p>
        <h1 className={route === "plotter" ? "module-heading--plotter" : undefined}>{renderPageTitle(route, title)}</h1>
        <p className="hero-copy">{description}</p>
        {chapterUrl ? (
          <a className="chapter-chip chapter-chip--link" href={chapterUrl} target="_blank" rel="noreferrer">
            <BookOpen size={16} />
            {chapter}
          </a>
        ) : (
          <div className="chapter-chip">
            <BookOpen size={16} />
            {chapter}
          </div>
        )}
      </section>

      <section className="section-shell calculator-grid">
        <div className="calculator-main">{children}</div>
        <aside className="calculator-aside">
          {aside}
          <div className="support-card">
            <div className="support-card__title">
              <Info size={17} />
              Unterstützte Eingaben
            </div>
            <ul>
              {supported.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
}

function renderPageTitle(route: RouteId, title: string) {
  if (route !== "plotter") return title;

  return (
    <>
      <span className="title-line title-line--keep">Funktionsplotter&nbsp;&amp;</span>
      {" "}
      <span className="title-line">Kurvendiskussion</span>
    </>
  );
}

interface ExampleButtonsProps<T extends string> {
  examples: Array<{ label: string; value?: string; note: string } & Record<T, string>>;
  valueKey: T;
  onPick: (example: Array<{ label: string; value?: string; note: string } & Record<T, string>>[number]) => void;
}

export function ExampleButtons<T extends string>({ examples, valueKey, onPick }: ExampleButtonsProps<T>) {
  const notation = useNotation();

  return (
    <details className="examples" open>
      <summary>Beispielaufgaben</summary>
      <div className="example-grid">
        {examples.map((example) => (
          <button type="button" key={`${example.label}-${example[valueKey]}`} onClick={() => onPick(example)}>
            <strong>{example.label}</strong>
            <span className="example-formula">
              <MathFormula tex={expressionToTex(example[valueKey], notation)} />
            </span>
            <small>{example.note}</small>
          </button>
        ))}
      </div>
    </details>
  );
}

export function Steps({ steps }: { steps: string[] }) {
  return (
    <ol className="steps">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

export function DetailedSteps({ steps }: { steps: Array<{ title: string; text: string; tex?: string }> }) {
  if (!steps.length) return null;

  return (
    <details className="solution-details">
      <summary>Ausführlichen Lösungsweg anzeigen</summary>
      <div className="solution-detail-list">
        {steps.map((step) => (
          <article key={`${step.title}-${step.text}`}>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            {step.tex ? <MathFormula block tex={step.tex} /> : null}
          </article>
        ))}
      </div>
    </details>
  );
}

export function FormulaPreview({ label = "Formelvorschau", tex }: { label?: string; tex: string }) {
  return (
    <div className="formula-preview" aria-label={label}>
      <span>{label}</span>
      <MathFormula block tex={tex} />
    </div>
  );
}
