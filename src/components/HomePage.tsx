import { ArrowRight, BookMarked, BrainCircuit, Cpu, ShieldCheck } from "lucide-react";
import { modules, SPRINGER_BOOK_URL, SPRINGER_COVER_URL, type RouteId } from "../data/modules";
import { WaterOrbitalScene } from "./WaterOrbitalScene";

interface HomePageProps {
  onNavigate: (route: RouteId) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <main>
      <section className="home-hero">
        <div className="section-shell hero-grid">
          <div className="hero-text">
            <p className="eyebrow">Begleitplattform zum Buch</p>
            <h1>Interaktive Mathematik für die (Bio-)Chemie</h1>
            <p className="hero-copy">
              Ein digitales Mathematik-Labor für Standardaufgaben aus dem naturwissenschaftlichen Grundstudium:
              visuell klar, interaktiv und nah an typischen Rechenwegen.
            </p>
            <div className="hero-actions">
              <button type="button" className="button button-primary" onClick={() => onNavigate("derivatives")}>
                Ableitungsrechner öffnen
                <ArrowRight size={17} />
              </button>
              <button type="button" className="button button-secondary" onClick={() => onNavigate("plotter")}>
                Funktionslabor starten
              </button>
            </div>
          </div>

          <WaterOrbitalScene />
        </div>
      </section>

      <section className="section-shell purpose-band">
        <div className="purpose-heading">
          <BookMarked size={24} />
          <div>
            <h2>Der interaktive Rechner zum Buch.</h2>
            <p>Kapitelnahe Rechner, Formeln und Visualisierungen für Mathe in der (Bio-)Chemie I.</p>
          </div>
        </div>
        <a className="book-panel" href={SPRINGER_BOOK_URL} target="_blank" rel="noreferrer">
          <img src={SPRINGER_COVER_URL} alt="Buchcover Mathe in der (Bio-)Chemie I" />
          <span>
            <strong>Springer-Seite öffnen</strong>
            <small>Mathe in der (Bio-)Chemie I: Grundlagen der Analysis</small>
          </span>
        </a>
      </section>

      <section className="section-shell quality-section" aria-labelledby="quality-title">
        <div className="section-heading">
          <p className="eyebrow">Engineering-Qualität</p>
          <h2 id="quality-title">Gebaut wie ein wissenschaftliches Werkzeug.</h2>
        </div>
        <div className="quality-grid">
          <article>
            <ShieldCheck size={22} />
            <strong>4.995 generierte Prüffälle</strong>
            <span>Ableitungen, Integrale, komplexe Zahlen, Kurvendiskussion und Konvergenz werden gegen unabhängige mathematische Invarianten geprüft.</span>
          </article>
          <article>
            <BrainCircuit size={22} />
            <strong>Kontrolle statt blindem Symbolrechnen</strong>
            <span>Stammfunktionen werden per Rückableitung kontrolliert; bestimmte Integrale erhalten zusätzlich einen numerischen Stabilitätscheck.</span>
          </article>
          <article>
            <Cpu size={22} />
            <strong>Browser-only Architektur</strong>
            <span>Keine Server, keine Bezahldienste, kein Backend: React, TypeScript, KaTeX, Plotly und deterministische Mathematik im Browser.</span>
          </article>
        </div>
      </section>

      <section className="section-shell module-section" aria-labelledby="module-title">
        <div className="section-heading">
          <p className="eyebrow">Module</p>
          <h2 id="module-title">Fünf Rechner, ein konsistenter Lernraum.</h2>
        </div>
        <div className="module-grid">
          {modules.map((module, index) => (
            <button
              className={`module-card module-card--${module.id}`}
              type="button"
              key={module.id}
              onClick={() => onNavigate(module.id)}
            >
              <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="module-eyebrow">{module.eyebrow}</span>
              <h3 className={module.id === "plotter" ? "module-title--plotter" : undefined}>{renderModuleTitle(module.id, module.title)}</h3>
              <p>{module.description}</p>
              <small>{module.chapter}</small>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

function renderModuleTitle(id: RouteId, title: string) {
  if (id !== "plotter") return title;

  return (
    <>
      <span className="title-line title-line--keep">Funktionsplotter&nbsp;&amp;</span>
      <span className="title-line">Kurvendiskussion</span>
    </>
  );
}
