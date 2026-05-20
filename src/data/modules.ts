import type { ComplexOperation } from "../lib/complexNumbers";

export type RouteId = "home" | "derivatives" | "integrals" | "plotter" | "complex" | "limits";

export interface ModuleCard {
  id: RouteId;
  title: string;
  eyebrow: string;
  description: string;
  chapter: string;
  chapterUrl?: string;
}

export const SPRINGER_BOOK_URL = "https://link.springer.com/book/10.1007/978-3-662-63139-3";
export const SPRINGER_COVER_URL = "https://media.springernature.com/w306/springer-static/cover-hires/book/978-3-662-63139-3";

export const modules: ModuleCard[] = [
  {
    id: "derivatives",
    title: "Ableitungen",
    eyebrow: "Differentialrechnung",
    description: "Standardableitungen mit Regelhinweis, höheren Ableitungen und direktem Vergleichsplot.",
    chapter: "Kapitel 6: Differenzialrechnung",
    chapterUrl: "https://link.springer.com/chapter/10.1007/978-3-662-63139-3_6"
  },
  {
    id: "integrals",
    title: "Integrale",
    eyebrow: "Integralrechnung",
    description: "Unbestimmte und bestimmte Standardintegrale mit Rechenweg und Flächenvisualisierung.",
    chapter: "Kapitel 7: Integralrechnung",
    chapterUrl: "https://link.springer.com/chapter/10.1007/978-3-662-63139-3_7"
  },
  {
    id: "plotter",
    title: "Funktionsplotter & Kurvendiskussion",
    eyebrow: "Numerische Analyse",
    description: "Interaktiver Plot mit Nullstellen, Extrempunkten und Wendepunkten.",
    chapter: "Kapitel 3: Funktionen",
    chapterUrl: "https://link.springer.com/chapter/10.1007/978-3-662-63139-3_3"
  },
  {
    id: "complex",
    title: "Komplexe Zahlen",
    eyebrow: "Algebra & Ebene",
    description: "Rechnen in kartesischer und exponentieller Form mit Gaußscher Zahlenebene.",
    chapter: "Kapitel 4: Komplexe Zahlen",
    chapterUrl: "https://link.springer.com/chapter/10.1007/978-3-662-63139-3_4"
  },
  {
    id: "limits",
    title: "Grenzwerte, Folgen & Reihen",
    eyebrow: "Konvergenz",
    description: "Standardgrenzwerte, Folgen und Reihen mit Formeldarstellung und Visualisierung.",
    chapter: "Kapitel 5: Folgen, Reihen und Grenzwerte",
    chapterUrl: "https://link.springer.com/chapter/10.1007/978-3-662-63139-3_5"
  }
];

export const derivativeExamples = [
  { label: "Polynom", value: "x^3 - 3*x^2 + 2", note: "Potenz- und Summenregel" },
  { label: "Produkt", value: "x*exp(-0.5*x)", note: "typisch für Abklingprozesse" },
  { label: "Quotient", value: "x/(1+x)", note: "Michaelis-Menten-ähnliche Form" },
  { label: "Kette", value: "ln(1+x^2)", note: "Logarithmus mit innerer Funktion" }
];

export const integralExamples = [
  { label: "Potenzregel", value: "3*x^2 - 2*x + 1", note: "Polynomtermweise" },
  { label: "Exponentialzerfall", value: "exp(-0.4*x)", note: "lineare Substitution" },
  { label: "Polynom mal exp", value: "exp(-0.4*x)*x^3", note: "wiederholte partielle Integration" },
  { label: "Exponentialgewichtetes Polynom", value: "3exp(-0.4*x)*x^2", note: "Grad-2-Standardform" },
  { label: "Partielle Integration", value: "x*exp(x)", note: "Standardform" },
  { label: "Logarithmusfall", value: "1/(1+x)", note: "Standard in Sättigungskurven" },
  { label: "Gauß-Fenster", value: "exp(-x^2)", note: "bestimmt numerisch mit Stabilitätscheck", mode: "definite", lower: "0", upper: "1" },
  { label: "Nichtlineare Phase", value: "sin(x^2)/(1+x^2)", note: "bestimmt numerisch im endlichen Intervall", mode: "definite", lower: "0", upper: "3" }
];

export const plotExamples = [
  { label: "Kubisch", value: "x^3 - 3*x", note: "Nullstellen, Extrema, Wendepunkt" },
  { label: "Rational", value: "x/(1+x^2)", note: "Sättigender Verlauf" },
  { label: "Abklingend", value: "x*exp(-x)", note: "Maximum einer transienten Kurve" },
  { label: "Trigonometrisch", value: "sin(x) + 0.3*x", note: "lokale Punkte im Intervall" }
];

export const complexExamples: Array<{ label: string; a: string; b: string; operation: ComplexOperation; note: string }> = [
  { label: "Addition", a: "2 + 3i", b: "1 - 2i", operation: "add", note: "Komponentenweise" },
  { label: "Multiplikation", a: "2*exp(i*pi/6)", b: "3*exp(i*pi/3)", operation: "multiply", note: "Winkeladdition" },
  { label: "Division", a: "3 + 4i", b: "1 - i", operation: "divide", note: "konjugierter Nenner" },
  { label: "Quadrat", a: "1 + i", b: "0", operation: "power", note: "Moivre" }
];

export const limitExamples = [
  { label: "Grenzwert", expression: "sin(x)/x", point: "0", note: "L'Hospital-Standardfall" },
  { label: "Folge", expression: "(1+1/n)^n", point: "sequence", note: "Annäherung an e" },
  { label: "Harmonisch", expression: "1/n", point: "series", note: "divergente Reihe" },
  { label: "Alternierend", expression: "(-1)^(n+1)/n", point: "series", note: "Leibniz-Reihe" }
];
